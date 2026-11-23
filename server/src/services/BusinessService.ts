import { type Database, getDatabase } from "../db/client";
import type { BusinessEntity, BusinessProfile } from "../entities/Business";
import { toBusinessProfile } from "../entities/Business";
import type { UserRole } from "../entities/User";
import { randomId } from "../utils/crypto";
import { HttpError } from "../utils/problemDetails";
import { AuditService } from "./AuditService";
import { LedgerService } from "./LedgerService";

export class BusinessService {
  private db: Database;
  private auditService: AuditService;
  private ledgerService: LedgerService;

  constructor(db?: Database, auditService?: AuditService) {
    this.db = db ?? getDatabase();
    this.auditService = auditService ?? new AuditService(this.db);
    this.ledgerService = new LedgerService(this.db);
  }

  createBusiness(
    userId: string,
    input: { businessName: string; businessType: string; currency?: string },
    ipAddress?: string,
  ): { business: BusinessProfile; role: UserRole } {
    const businessId = randomId("biz");
    const membershipId = randomId("mem");
    const currency = input.currency?.trim().toUpperCase() || "USD";

    this.db.transaction(() => {
      this.db
        .prepare(`
        INSERT INTO businesses (id, name, business_type, currency, status)
        VALUES (?, ?, ?, ?, 'active')
      `)
        .run(
          businessId,
          input.businessName.trim(),
          input.businessType.trim(),
          currency,
        );

      this.db
        .prepare(`
        INSERT INTO memberships (id, user_id, business_id, role, status, permissions)
        VALUES (?, ?, ?, 'owner', 'active', ?)
      `)
        .run(membershipId, userId, businessId, JSON.stringify(["all"]));
    });

    this.ledgerService.ensureDefaultAccounts(businessId);

    this.auditService.logEvent({
      userId,
      businessId,
      action: "business.create",
      resource: "businesses",
      resourceId: businessId,
      ipAddress,
      metadata: { name: input.businessName, currency },
    });

    const created = this.db
      .prepare("SELECT * FROM businesses WHERE id = ?")
      .get(businessId) as unknown as BusinessEntity;

    return {
      business: toBusinessProfile(created),
      role: "owner",
    };
  }

  getBusinessById(businessId: string): BusinessProfile {
    const business = this.db
      .prepare("SELECT * FROM businesses WHERE id = ?")
      .get(businessId) as unknown as BusinessEntity | undefined;
    if (!business) {
      throw new HttpError(
        404,
        "Business Not Found",
        "The specified business does not exist.",
      );
    }
    return toBusinessProfile(business);
  }

  updateBusiness(
    businessId: string,
    userId: string,
    input: Partial<{ name: string; businessType: string; currency: string }>,
    ipAddress?: string,
  ): BusinessProfile {
    const current = this.db
      .prepare("SELECT * FROM businesses WHERE id = ?")
      .get(businessId) as unknown as BusinessEntity | undefined;
    if (!current) {
      throw new HttpError(
        404,
        "Business Not Found",
        "The specified business does not exist.",
      );
    }

    const name = input.name?.trim() ?? current.name;
    const businessType = input.businessType?.trim() ?? current.business_type;
    const currency = input.currency?.trim().toUpperCase() ?? current.currency;

    this.db
      .prepare(`
      UPDATE businesses
      SET name = ?, business_type = ?, currency = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `)
      .run(name, businessType, currency, businessId);

    this.auditService.logEvent({
      userId,
      businessId,
      action: "business.update",
      resource: "businesses",
      resourceId: businessId,
      ipAddress,
      metadata: input,
    });

    const updated = this.db
      .prepare("SELECT * FROM businesses WHERE id = ?")
      .get(businessId) as unknown as BusinessEntity;
    return toBusinessProfile(updated);
  }

  getUserBusinesses(
    userId: string,
  ): { business: BusinessProfile; role: UserRole }[] {
    const rows = this.db
      .prepare(`
      SELECT b.*, m.role
      FROM businesses b
      JOIN memberships m ON m.business_id = b.id
      WHERE m.user_id = ? AND m.status = 'active' AND b.status = 'active'
      ORDER BY b.created_at ASC
    `)
      .all(userId) as unknown as (BusinessEntity & { role: UserRole })[];

    return rows.map((r) => ({
      business: toBusinessProfile(r),
      role: r.role,
    }));
  }
}
