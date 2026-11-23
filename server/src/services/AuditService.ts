import { logger } from "../config/logger";
import { type Database, getDatabase } from "../db/client";
import { randomId } from "../utils/crypto";

export interface LogAuditEventParams {
  businessId?: string | null;
  userId?: string | null;
  action: string;
  resource: string;
  resourceId?: string | null;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
}

export class AuditService {
  private db: Database;

  constructor(db?: Database) {
    this.db = db ?? getDatabase();
  }

  logEvent(params: LogAuditEventParams): string {
    const id = randomId("aud");
    const metadataStr = params.metadata
      ? JSON.stringify(params.metadata)
      : null;

    try {
      this.db
        .prepare(`
        INSERT INTO audit_logs (id, business_id, user_id, action, resource, resource_id, metadata, ip_address)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `)
        .run(
          id,
          params.businessId ?? null,
          params.userId ?? null,
          params.action,
          params.resource,
          params.resourceId ?? null,
          metadataStr,
          params.ipAddress ?? null,
        );

      logger.debug(
        `Audit log created: ${params.action} on ${params.resource}`,
        {
          auditId: id,
          userId: params.userId,
          businessId: params.businessId,
        },
      );

      return id;
    } catch (err) {
      logger.error("Failed to write audit log", { error: String(err), params });
      return id;
    }
  }

  getRecentLogs(businessId: string, limit = 50): unknown[] {
    return this.db
      .prepare(`
      SELECT * FROM audit_logs
      WHERE business_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `)
      .all(businessId, limit);
  }
}
