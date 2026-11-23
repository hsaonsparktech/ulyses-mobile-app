import type { Database } from "../db/client";
import { getDatabase } from "../db/client";
import type { ClientEntity, ClientProfile } from "../entities/Client";
import { toClientProfile } from "../entities/Client";
import { randomId } from "../utils/crypto";
import { HttpError } from "../utils/problemDetails";
import { AuditService } from "./AuditService";

export interface CreateClientInput {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  address?: string;
}

export interface UpdateClientInput {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  address?: string;
  status?: "active" | "archived";
}

export class ClientService {
  private db: Database;
  private auditService: AuditService;

  constructor(db?: Database) {
    this.db = db ?? getDatabase();
    this.auditService = new AuditService(this.db);
  }

  getClients(
    businessId: string,
    filters: {
      search?: string;
      status?: "active" | "archived";
      limit?: number;
      offset?: number;
    } = {},
  ): ClientProfile[] {
    let sql = "SELECT * FROM clients WHERE business_id = ?";
    const params: unknown[] = [businessId];

    if (filters.status) {
      sql += " AND status = ?";
      params.push(filters.status);
    }

    if (filters.search) {
      sql += " AND (name LIKE ? OR email LIKE ? OR company LIKE ?)";
      const pattern = `%${filters.search.trim()}%`;
      params.push(pattern, pattern, pattern);
    }

    sql += " ORDER BY name ASC LIMIT ? OFFSET ?";
    params.push(filters.limit ?? 50, filters.offset ?? 0);

    const rows = this.db
      .prepare(sql)
      .all(...params) as unknown as ClientEntity[];

    return rows.map((client) => {
      const metrics = this.getClientMetrics(businessId, client.id);
      return toClientProfile(client, metrics);
    });
  }

  getClientById(businessId: string, clientId: string): ClientProfile {
    const client = this.db
      .prepare("SELECT * FROM clients WHERE id = ? AND business_id = ?")
      .get(clientId, businessId) as unknown as ClientEntity | undefined;

    if (!client) {
      throw new HttpError(
        404,
        "Client Not Found",
        `Client with ID ${clientId} was not found in this business.`,
      );
    }

    const metrics = this.getClientMetrics(businessId, clientId);
    return toClientProfile(client, metrics);
  }

  createClient(
    businessId: string,
    userId: string,
    input: CreateClientInput,
    ipAddress?: string,
  ): ClientProfile {
    // Validate duplicate check by email if email provided
    if (input.email) {
      const normEmail = input.email.trim().toLowerCase();
      const existing = this.db
        .prepare(
          "SELECT id FROM clients WHERE business_id = ? AND LOWER(email) = ? AND status = 'active'",
        )
        .get(businessId, normEmail) as { id: string } | undefined;

      if (existing) {
        throw new HttpError(
          409,
          "Client Email Conflict",
          `An active client with email '${normEmail}' already exists for this business.`,
        );
      }
    }

    const clientId = randomId("cli");

    this.db
      .prepare(`
      INSERT INTO clients (id, business_id, name, email, phone, company, address, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'active')
    `)
      .run(
        clientId,
        businessId,
        input.name.trim(),
        input.email?.trim().toLowerCase() ?? null,
        input.phone?.trim() ?? null,
        input.company?.trim() ?? null,
        input.address?.trim() ?? null,
      );

    this.auditService.logEvent({
      userId,
      businessId,
      action: "client.created",
      resource: "clients",
      resourceId: clientId,
      ipAddress,
      metadata: { name: input.name, company: input.company },
    });

    return this.getClientById(businessId, clientId);
  }

  updateClient(
    businessId: string,
    userId: string,
    clientId: string,
    input: UpdateClientInput,
    ipAddress?: string,
  ): ClientProfile {
    const existing = this.getClientById(businessId, clientId);

    const name = input.name !== undefined ? input.name.trim() : existing.name;
    const email =
      input.email !== undefined
        ? input.email.trim().toLowerCase() || null
        : existing.email;
    const phone =
      input.phone !== undefined ? input.phone.trim() || null : existing.phone;
    const company =
      input.company !== undefined
        ? input.company.trim() || null
        : existing.company;
    const address =
      input.address !== undefined
        ? input.address.trim() || null
        : existing.address;
    const status = input.status !== undefined ? input.status : existing.status;

    // Check email uniqueness on update
    if (email && email !== existing.email) {
      const conflict = this.db
        .prepare(
          "SELECT id FROM clients WHERE business_id = ? AND LOWER(email) = ? AND id != ? AND status = 'active'",
        )
        .get(businessId, email, clientId) as { id: string } | undefined;

      if (conflict) {
        throw new HttpError(
          409,
          "Client Email Conflict",
          `Another client with email '${email}' already exists.`,
        );
      }
    }

    this.db
      .prepare(`
      UPDATE clients
      SET name = ?, email = ?, phone = ?, company = ?, address = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND business_id = ?
    `)
      .run(name, email, phone, company, address, status, clientId, businessId);

    this.auditService.logEvent({
      userId,
      businessId,
      action: "client.updated",
      resource: "clients",
      resourceId: clientId,
      ipAddress,
      metadata: { updatedFields: Object.keys(input) },
    });

    return this.getClientById(businessId, clientId);
  }

  archiveClient(
    businessId: string,
    userId: string,
    clientId: string,
    ipAddress?: string,
  ): void {
    this.getClientById(businessId, clientId); // Ensures existence and tenancy

    this.db
      .prepare(`
      UPDATE clients SET status = 'archived', updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND business_id = ?
    `)
      .run(clientId, businessId);

    this.auditService.logEvent({
      userId,
      businessId,
      action: "client.archived",
      resource: "clients",
      resourceId: clientId,
      ipAddress,
    });
  }

  private getClientMetrics(
    businessId: string,
    clientId: string,
  ): { totalInvoicedCents: number; outstandingBalanceCents: number } {
    const row = this.db
      .prepare(`
      SELECT 
        COALESCE(SUM(total_cents), 0) as total_invoiced,
        COALESCE(SUM(total_cents - amount_paid_cents), 0) as balance_due
      FROM invoices
      WHERE business_id = ? AND client_id = ? AND status != 'cancelled'
    `)
      .get(businessId, clientId) as
      | {
          total_invoiced: number;
          balance_due: number;
        }
      | undefined;

    return {
      totalInvoicedCents: row?.total_invoiced ?? 0,
      outstandingBalanceCents: Math.max(0, row?.balance_due ?? 0),
    };
  }
}
