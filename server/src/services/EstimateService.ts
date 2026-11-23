import type { Database } from "../db/client";
import { getDatabase } from "../db/client";
import type {
  EstimateEntity,
  EstimateItemEntity,
  EstimateProfile,
  EstimateStatus,
} from "../entities/Estimate";
import { toEstimateProfile } from "../entities/Estimate";
import type { InvoiceProfile } from "../entities/Invoice";
import { randomId } from "../utils/crypto";
import { HttpError } from "../utils/problemDetails";
import { AuditService } from "./AuditService";
import { InvoiceService } from "./InvoiceService";

export interface CreateEstimateItemInput {
  description: string;
  quantity: number;
  unitPriceCents: number;
}

export interface CreateEstimateInput {
  clientId: string;
  estimateNumber?: string;
  issueDate: string;
  validUntil: string;
  currency?: string;
  items: CreateEstimateItemInput[];
  taxCents?: number;
  taxRateBps?: number;
  notes?: string;
  idempotencyKey?: string;
}

export class EstimateService {
  private db: Database;
  private auditService: AuditService;
  private invoiceService: InvoiceService;

  constructor(db?: Database) {
    this.db = db ?? getDatabase();
    this.auditService = new AuditService(this.db);
    this.invoiceService = new InvoiceService(this.db);
  }

  getEstimates(
    businessId: string,
    filters: {
      status?: EstimateStatus;
      clientId?: string;
      limit?: number;
      offset?: number;
    } = {},
  ): EstimateProfile[] {
    let sql = `
      SELECT e.*, c.name as client_name
      FROM estimates e
      JOIN clients c ON c.id = e.client_id
      WHERE e.business_id = ?
    `;
    const params: unknown[] = [businessId];

    if (filters.status) {
      sql += " AND e.status = ?";
      params.push(filters.status);
    }
    if (filters.clientId) {
      sql += " AND e.client_id = ?";
      params.push(filters.clientId);
    }

    sql += " ORDER BY e.created_at DESC LIMIT ? OFFSET ?";
    params.push(filters.limit ?? 50, filters.offset ?? 0);

    const rows = this.db.prepare(sql).all(...params) as unknown as Array<
      EstimateEntity & { client_name: string }
    >;

    return rows.map((est) => {
      const items = this.db
        .prepare("SELECT * FROM estimate_items WHERE estimate_id = ?")
        .all(est.id) as unknown as EstimateItemEntity[];
      return toEstimateProfile(est, items, est.client_name);
    });
  }

  getEstimateById(businessId: string, estimateId: string): EstimateProfile {
    const est = this.db
      .prepare(`
      SELECT e.*, c.name as client_name
      FROM estimates e
      JOIN clients c ON c.id = e.client_id
      WHERE e.id = ? AND e.business_id = ?
    `)
      .get(estimateId, businessId) as unknown as
      | (EstimateEntity & { client_name: string })
      | undefined;

    if (!est) {
      throw new HttpError(
        404,
        "Estimate Not Found",
        `Estimate with ID ${estimateId} not found in this business.`,
      );
    }

    const items = this.db
      .prepare("SELECT * FROM estimate_items WHERE estimate_id = ?")
      .all(estimateId) as unknown as EstimateItemEntity[];

    return toEstimateProfile(est, items, est.client_name);
  }

  createEstimate(
    businessId: string,
    userId: string,
    input: CreateEstimateInput,
    ipAddress?: string,
  ): EstimateProfile {
    // 1. Idempotency Check
    if (input.idempotencyKey) {
      const existing = this.db
        .prepare(
          "SELECT id FROM estimates WHERE business_id = ? AND idempotency_key = ?",
        )
        .get(businessId, input.idempotencyKey) as { id: string } | undefined;

      if (existing) {
        return this.getEstimateById(businessId, existing.id);
      }
    }

    // 2. Validate client belongs to this tenant
    const client = this.db
      .prepare("SELECT id, name FROM clients WHERE id = ? AND business_id = ?")
      .get(input.clientId, businessId) as
      | { id: string; name: string }
      | undefined;

    if (!client) {
      throw new HttpError(
        403,
        "Forbidden Client Reference",
        `Client ${input.clientId} does not exist or does not belong to this business.`,
      );
    }

    // 3. Validate items
    if (!input.items || input.items.length === 0) {
      throw new HttpError(
        400,
        "Estimate Items Required",
        "An estimate must contain at least one line item.",
      );
    }

    let subtotalCents = 0;
    const computedItems: Array<{
      description: string;
      quantity: number;
      unitPriceCents: number;
      totalCents: number;
    }> = [];

    for (const item of input.items) {
      if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
        throw new HttpError(
          400,
          "Invalid Quantity",
          "Line item quantity must be a positive integer.",
        );
      }
      if (!Number.isInteger(item.unitPriceCents) || item.unitPriceCents < 0) {
        throw new HttpError(
          400,
          "Invalid Unit Price",
          "Line item unit price must be a non-negative integer in cents.",
        );
      }

      const totalCents = item.quantity * item.unitPriceCents;
      subtotalCents += totalCents;

      computedItems.push({
        description: item.description.trim(),
        quantity: item.quantity,
        unitPriceCents: item.unitPriceCents,
        totalCents,
      });
    }

    const taxCents =
      input.taxCents ??
      (input.taxRateBps !== undefined
        ? Math.round((subtotalCents * input.taxRateBps) / 10000)
        : 0);
    if (!Number.isInteger(taxCents) || taxCents < 0) {
      throw new HttpError(
        400,
        "Invalid Tax Amount",
        "Tax must be a non-negative integer in cents.",
      );
    }

    const totalCents = subtotalCents + taxCents;

    // 4. Generate estimate number
    let estimateNumber = input.estimateNumber?.trim();
    if (!estimateNumber) {
      const countRow = this.db
        .prepare("SELECT COUNT(*) as cnt FROM estimates WHERE business_id = ?")
        .get(businessId) as { cnt: number };
      const nextNum = (countRow.cnt + 1).toString().padStart(4, "0");
      estimateNumber = `EST-${nextNum}`;
    }

    const estimateId = randomId("est");
    const currency = input.currency?.trim().toUpperCase() || "USD";

    return this.db.transaction(() => {
      this.db
        .prepare(`
        INSERT INTO estimates (
          id, business_id, client_id, estimate_number, issue_date, valid_until,
          status, currency, subtotal_cents, tax_cents, total_cents, notes, idempotency_key
        )
        VALUES (?, ?, ?, ?, ?, ?, 'draft', ?, ?, ?, ?, ?, ?)
      `)
        .run(
          estimateId,
          businessId,
          client.id,
          estimateNumber,
          input.issueDate,
          input.validUntil,
          currency,
          subtotalCents,
          taxCents,
          totalCents,
          input.notes?.trim() ?? null,
          input.idempotencyKey ?? null,
        );

      const insertItem = this.db.prepare(`
        INSERT INTO estimate_items (id, estimate_id, description, quantity, unit_price_cents, total_cents)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      for (const item of computedItems) {
        insertItem.run(
          randomId("esi"),
          estimateId,
          item.description,
          item.quantity,
          item.unitPriceCents,
          item.totalCents,
        );
      }

      this.auditService.logEvent({
        userId,
        businessId,
        action: "estimate.created",
        resource: "estimates",
        resourceId: estimateId,
        ipAddress,
        metadata: { estimateNumber, totalCents },
      });

      return this.getEstimateById(businessId, estimateId);
    });
  }

  convertToInvoice(
    businessId: string,
    userId: string,
    estimateId: string,
    idempotencyKey?: string,
    ipAddress?: string,
  ): InvoiceProfile {
    const estimate = this.getEstimateById(businessId, estimateId);

    // Idempotency: If already converted, return existing invoice to avoid duplicate creation
    if (estimate.status === "converted" && estimate.convertedInvoiceId) {
      return this.invoiceService.getInvoiceById(
        businessId,
        estimate.convertedInvoiceId,
      );
    }

    return this.db.transaction(() => {
      const todayStr = new Date().toISOString().split("T")[0] ?? "1970-01-01";
      const dueStr =
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0] ?? "1970-01-01";

      // Create invoice with matching details
      const invoice = this.invoiceService.createInvoice(
        businessId,
        userId,
        {
          clientId: estimate.clientId,
          issueDate: todayStr,
          dueDate: dueStr,
          currency: estimate.currency,
          items: estimate.items.map((i) => ({
            description: i.description,
            quantity: i.quantity,
            unitPriceCents: i.unitPriceCents,
          })),
          taxCents: estimate.taxCents,
          notes: `Converted from Estimate ${estimate.estimateNumber}${estimate.notes ? `. ${estimate.notes}` : ""}`,
          idempotencyKey,
        },
        ipAddress,
      );

      // Mark estimate converted and link invoice
      this.db
        .prepare(`
        UPDATE estimates
        SET status = 'converted', converted_invoice_id = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND business_id = ?
      `)
        .run(invoice.id, estimate.id, businessId);

      this.auditService.logEvent({
        userId,
        businessId,
        action: "estimate.converted_to_invoice",
        resource: "estimates",
        resourceId: estimate.id,
        ipAddress,
        metadata: {
          estimateNumber: estimate.estimateNumber,
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
        },
      });

      return invoice;
    });
  }
}
