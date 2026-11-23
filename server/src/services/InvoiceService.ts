import type { Database } from "../db/client";
import { getDatabase } from "../db/client";
import type {
  InvoiceEntity,
  InvoiceItemEntity,
  InvoiceProfile,
  InvoiceStatus,
} from "../entities/Invoice";
import { toInvoiceProfile } from "../entities/Invoice";
import { randomId } from "../utils/crypto";
import { HttpError } from "../utils/problemDetails";
import { AuditService } from "./AuditService";
import { LedgerService } from "./LedgerService";

export interface CreateInvoiceItemInput {
  description: string;
  quantity: number;
  unitPriceCents: number;
}

export interface CreateInvoiceInput {
  clientId: string;
  invoiceNumber?: string;
  issueDate: string;
  dueDate: string;
  currency?: string;
  items: CreateInvoiceItemInput[];
  taxCents?: number;
  taxRateBps?: number;
  notes?: string;
  idempotencyKey?: string;
}

export interface RecordPaymentInput {
  amountCents: number;
  paymentDate?: string;
  notes?: string;
}

export class InvoiceService {
  private db: Database;
  private auditService: AuditService;
  private ledgerService: LedgerService;

  constructor(db?: Database) {
    this.db = db ?? getDatabase();
    this.auditService = new AuditService(this.db);
    this.ledgerService = new LedgerService(this.db);
  }

  getInvoices(
    businessId: string,
    filters: {
      status?: InvoiceStatus;
      clientId?: string;
      limit?: number;
      offset?: number;
    } = {},
  ): InvoiceProfile[] {
    let sql = `
      SELECT i.*, c.name as client_name
      FROM invoices i
      JOIN clients c ON c.id = i.client_id
      WHERE i.business_id = ?
    `;
    const params: unknown[] = [businessId];

    if (filters.status) {
      sql += " AND i.status = ?";
      params.push(filters.status);
    }
    if (filters.clientId) {
      sql += " AND i.client_id = ?";
      params.push(filters.clientId);
    }

    sql += " ORDER BY i.created_at DESC LIMIT ? OFFSET ?";
    params.push(filters.limit ?? 50, filters.offset ?? 0);

    const rows = this.db.prepare(sql).all(...params) as unknown as Array<
      InvoiceEntity & { client_name: string }
    >;

    return rows.map((inv) => {
      const items = this.db
        .prepare("SELECT * FROM invoice_items WHERE invoice_id = ?")
        .all(inv.id) as unknown as InvoiceItemEntity[];
      return toInvoiceProfile(inv, items, inv.client_name);
    });
  }

  getInvoiceById(businessId: string, invoiceId: string): InvoiceProfile {
    const inv = this.db
      .prepare(`
      SELECT i.*, c.name as client_name
      FROM invoices i
      JOIN clients c ON c.id = i.client_id
      WHERE i.id = ? AND i.business_id = ?
    `)
      .get(invoiceId, businessId) as unknown as
      | (InvoiceEntity & { client_name: string })
      | undefined;

    if (!inv) {
      throw new HttpError(
        404,
        "Invoice Not Found",
        `Invoice with ID ${invoiceId} not found in this business.`,
      );
    }

    const items = this.db
      .prepare("SELECT * FROM invoice_items WHERE invoice_id = ?")
      .all(invoiceId) as unknown as InvoiceItemEntity[];

    return toInvoiceProfile(inv, items, inv.client_name);
  }

  createInvoice(
    businessId: string,
    userId: string,
    input: CreateInvoiceInput,
    ipAddress?: string,
  ): InvoiceProfile {
    // 1. Idempotency Check
    if (input.idempotencyKey) {
      const existing = this.db
        .prepare(
          "SELECT id FROM invoices WHERE business_id = ? AND idempotency_key = ?",
        )
        .get(businessId, input.idempotencyKey) as { id: string } | undefined;

      if (existing) {
        return this.getInvoiceById(businessId, existing.id);
      }
    }

    // 2. Validate client belongs to this tenant
    const client = this.db
      .prepare("SELECT id, name FROM clients WHERE id = ? AND business_id = ?")
      .get(input.clientId, businessId) as
      | { id: string; name: string }
      | undefined;

    if (!client) {
      const existsElsewhere = this.db
        .prepare("SELECT id FROM clients WHERE id = ?")
        .get(input.clientId);
      if (existsElsewhere) {
        throw new HttpError(
          403,
          "Forbidden Client Reference",
          `Client ${input.clientId} does not belong to this business.`,
        );
      }
      throw new HttpError(
        404,
        "Client Not Found",
        `Client ${input.clientId} does not exist.`,
      );
    }

    // 3. Validate line items
    if (!input.items || input.items.length === 0) {
      throw new HttpError(
        400,
        "Invoice Items Required",
        "An invoice must contain at least one line item.",
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

    // 4. Determine invoice number
    let invoiceNumber = input.invoiceNumber?.trim();
    if (!invoiceNumber) {
      const countRow = this.db
        .prepare("SELECT COUNT(*) as cnt FROM invoices WHERE business_id = ?")
        .get(businessId) as { cnt: number };
      const nextNum = (countRow.cnt + 1).toString().padStart(4, "0");
      invoiceNumber = `INV-${nextNum}`;
    }

    const invoiceId = randomId("inv");
    const currency = input.currency?.trim().toUpperCase() || "USD";

    return this.db.transaction(() => {
      this.db
        .prepare(`
        INSERT INTO invoices (
          id, business_id, client_id, invoice_number, issue_date, due_date,
          status, currency, subtotal_cents, tax_cents, total_cents, amount_paid_cents,
          notes, idempotency_key
        )
        VALUES (?, ?, ?, ?, ?, ?, 'draft', ?, ?, ?, ?, 0, ?, ?)
      `)
        .run(
          invoiceId,
          businessId,
          client.id,
          invoiceNumber,
          input.issueDate,
          input.dueDate,
          currency,
          subtotalCents,
          taxCents,
          totalCents,
          input.notes?.trim() ?? null,
          input.idempotencyKey ?? null,
        );

      const insertItem = this.db.prepare(`
        INSERT INTO invoice_items (id, invoice_id, description, quantity, unit_price_cents, total_cents)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      for (const item of computedItems) {
        insertItem.run(
          randomId("ini"),
          invoiceId,
          item.description,
          item.quantity,
          item.unitPriceCents,
          item.totalCents,
        );
      }

      this.auditService.logEvent({
        userId,
        businessId,
        action: "invoice.created",
        resource: "invoices",
        resourceId: invoiceId,
        ipAddress,
        metadata: {
          invoiceNumber,
          clientId: client.id,
          totalCents,
        },
      });

      return this.getInvoiceById(businessId, invoiceId);
    });
  }

  sendInvoice(
    businessId: string,
    userId: string,
    invoiceId: string,
    ipAddress?: string,
  ): InvoiceProfile {
    const invoice = this.getInvoiceById(businessId, invoiceId);

    if (invoice.status !== "draft") {
      throw new HttpError(
        400,
        "Invalid Status Transition",
        `Only draft invoices can be sent. Current status is '${invoice.status}'.`,
      );
    }

    return this.db.transaction(() => {
      // 1. Post General Ledger entry for Accounts Receivable recognition
      // Debit: Accounts Receivable (1100) -> totalCents
      // Credit: Service Revenue (4000) -> subtotalCents
      // Credit: Sales Tax Payable (2100) -> taxCents (if > 0)
      const arAccount = this.ledgerService.getAccountByCode(businessId, "1100");
      const revAccount = this.ledgerService.getAccountByCode(
        businessId,
        "4000",
      );

      const lines = [
        {
          accountId: arAccount.id,
          debitCents: invoice.totalCents,
          creditCents: 0,
          description: `AR for Invoice ${invoice.invoiceNumber}`,
        },
        {
          accountId: revAccount.id,
          debitCents: 0,
          creditCents: invoice.subtotalCents,
          description: `Revenue for Invoice ${invoice.invoiceNumber}`,
        },
      ];

      if (invoice.taxCents > 0) {
        const taxAccount = this.ledgerService.getAccountByCode(
          businessId,
          "2100",
        );
        lines.push({
          accountId: taxAccount.id,
          debitCents: 0,
          creditCents: invoice.taxCents,
          description: `Sales Tax for Invoice ${invoice.invoiceNumber}`,
        });
      }

      const journalEntry = this.ledgerService.createAndPostJournalEntry(
        businessId,
        userId,
        {
          entryDate: invoice.issueDate,
          description: `Invoice ${invoice.invoiceNumber} recognition`,
          lines,
        },
        ipAddress,
      );

      // 2. Transition invoice status to 'sent'
      this.db
        .prepare(`
        UPDATE invoices
        SET status = 'sent', journal_entry_id = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND business_id = ?
      `)
        .run(journalEntry.id, invoice.id, businessId);

      this.auditService.logEvent({
        userId,
        businessId,
        action: "invoice.sent",
        resource: "invoices",
        resourceId: invoice.id,
        ipAddress,
        metadata: {
          invoiceNumber: invoice.invoiceNumber,
          journalEntryId: journalEntry.id,
        },
      });

      return this.getInvoiceById(businessId, invoice.id);
    });
  }

  recordPayment(
    businessId: string,
    userId: string,
    invoiceId: string,
    input: RecordPaymentInput,
    ipAddress?: string,
  ): InvoiceProfile {
    const invoice = this.getInvoiceById(businessId, invoiceId);

    if (
      invoice.status !== "sent" &&
      invoice.status !== "partially_paid" &&
      invoice.status !== "overdue"
    ) {
      throw new HttpError(
        400,
        "Invalid Payment Target",
        `Payments can only be recorded on sent, partially paid, or overdue invoices. Current status is '${invoice.status}'.`,
      );
    }

    if (!Number.isInteger(input.amountCents) || input.amountCents <= 0) {
      throw new HttpError(
        400,
        "Invalid Payment Amount",
        "Payment amount must be a positive integer in cents.",
      );
    }

    const remainingBalance = invoice.totalCents - invoice.amountPaidCents;
    if (input.amountCents > remainingBalance) {
      throw new HttpError(
        400,
        "Overpayment Rejected",
        `Payment amount (${input.amountCents}) exceeds remaining balance due (${remainingBalance}).`,
      );
    }

    const newAmountPaid = invoice.amountPaidCents + input.amountCents;
    const newStatus: InvoiceStatus =
      newAmountPaid >= invoice.totalCents ? "paid" : "partially_paid";

    return this.db.transaction(() => {
      // 1. Post General Ledger entry for Cash Collection
      // Debit: Operating Bank Account (1000)
      // Credit: Accounts Receivable (1100)
      const bankAccount = this.ledgerService.getAccountByCode(
        businessId,
        "1000",
      );
      const arAccount = this.ledgerService.getAccountByCode(businessId, "1100");

      const paymentDate =
        input.paymentDate ??
        new Date().toISOString().split("T")[0] ??
        "1970-01-01";

      const paymentJournalEntry = this.ledgerService.createAndPostJournalEntry(
        businessId,
        userId,
        {
          entryDate: paymentDate,
          description: `Payment for Invoice ${invoice.invoiceNumber}${input.notes ? ` (${input.notes})` : ""}`,
          lines: [
            {
              accountId: bankAccount.id,
              debitCents: input.amountCents,
              creditCents: 0,
              description: `Payment received for Invoice ${invoice.invoiceNumber}`,
            },
            {
              accountId: arAccount.id,
              debitCents: 0,
              creditCents: input.amountCents,
              description: `AR reduction for Invoice ${invoice.invoiceNumber}`,
            },
          ],
        },
        ipAddress,
      );

      // 2. Update invoice amount_paid and status
      this.db
        .prepare(`
        UPDATE invoices
        SET amount_paid_cents = ?, status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND business_id = ?
      `)
        .run(newAmountPaid, newStatus, invoice.id, businessId);

      this.auditService.logEvent({
        userId,
        businessId,
        action: "invoice.payment_recorded",
        resource: "invoices",
        resourceId: invoice.id,
        ipAddress,
        metadata: {
          invoiceNumber: invoice.invoiceNumber,
          amountPaidCents: input.amountCents,
          newStatus,
          journalEntryId: paymentJournalEntry.id,
        },
      });

      return this.getInvoiceById(businessId, invoice.id);
    });
  }
}
