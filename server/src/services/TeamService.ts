import { type Database, getDatabase } from "../db/client";
import type {
  InviteCodeEntity,
  InviteVerificationResult,
} from "../entities/InviteCode";
import type {
  MembershipEntity,
  MembershipProfile,
} from "../entities/Membership";
import { toMembershipProfile } from "../entities/Membership";
import type { UserRole } from "../entities/User";
import { randomId, randomToken } from "../utils/crypto";
import { HttpError } from "../utils/problemDetails";
import { AuditService } from "./AuditService";

export class TeamService {
  private db: Database;
  private auditService: AuditService;

  constructor(db?: Database, auditService?: AuditService) {
    this.db = db ?? getDatabase();
    this.auditService = auditService ?? new AuditService(this.db);
  }

  getMembers(
    businessId: string,
  ): (MembershipProfile & { email: string; fullName: string })[] {
    const rows = this.db
      .prepare(`
      SELECT m.*, u.email, u.full_name
      FROM memberships m
      JOIN users u ON u.id = m.user_id
      WHERE m.business_id = ? AND m.status = 'active'
      ORDER BY m.created_at ASC
    `)
      .all(businessId) as unknown as (MembershipEntity & {
      email: string;
      full_name: string;
    })[];

    return rows.map((r) => ({
      ...toMembershipProfile(r),
      email: r.email,
      fullName: r.full_name,
    }));
  }

  createInvite(
    businessId: string,
    createdByUserId: string,
    input: { role: "employee" | "accountant"; email?: string },
    ipAddress?: string,
  ): {
    inviteCode: string;
    role: UserRole;
    businessId: string;
    expiresAt: string;
  } {
    const id = randomId("inv");
    // Human-readable code e.g. ACC-382910 or EMP-829104
    const prefix = input.role === "accountant" ? "ACC" : "EMP";
    const code = `${prefix}-${randomToken(4).toUpperCase()}`;
    const expiresAt = new Date(
      Date.now() + 14 * 24 * 60 * 60 * 1000,
    ).toISOString(); // 14 days

    this.db
      .prepare(`
      INSERT INTO invite_codes (id, business_id, code, role, email, created_by, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
      .run(
        id,
        businessId,
        code,
        input.role,
        input.email?.trim().toLowerCase() ?? null,
        createdByUserId,
        expiresAt,
      );

    this.auditService.logEvent({
      userId: createdByUserId,
      businessId,
      action: "team.invite_created",
      resource: "invite_codes",
      resourceId: id,
      ipAddress,
      metadata: { code, role: input.role, email: input.email },
    });

    return {
      inviteCode: code,
      role: input.role,
      businessId,
      expiresAt,
    };
  }

  verifyInviteCode(code: string): InviteVerificationResult {
    const invite = this.db
      .prepare(`
      SELECT i.*, b.name as business_name, u.full_name as inviter_name
      FROM invite_codes i
      JOIN businesses b ON b.id = i.business_id
      JOIN users u ON u.id = i.created_by
      WHERE i.code = ?
    `)
      .get(code.trim().toUpperCase()) as
      | (InviteCodeEntity & { business_name: string; inviter_name: string })
      | undefined;

    if (!invite) {
      throw new HttpError(
        404,
        "Invalid Invitation Code",
        "The invitation code provided was not found or is invalid.",
      );
    }

    if (invite.used_at) {
      throw new HttpError(
        410,
        "Invitation Already Redeemed",
        "This invitation code has already been redeemed.",
      );
    }

    if (new Date(invite.expires_at).getTime() < Date.now()) {
      throw new HttpError(
        410,
        "Invitation Code Expired",
        "This invitation code has expired. Please contact the business owner.",
      );
    }

    return {
      valid: true,
      code: invite.code,
      businessId: invite.business_id,
      businessName: invite.business_name,
      role: invite.role,
      inviterName: invite.inviter_name,
    };
  }

  acceptInvite(
    code: string,
    userId: string,
    ipAddress?: string,
  ): { accepted: boolean; businessId: string; role: UserRole } {
    const verified = this.verifyInviteCode(code);

    // Check if user already has membership in this business
    const existingMembership = this.db
      .prepare(`
      SELECT id, role, status FROM memberships WHERE user_id = ? AND business_id = ?
    `)
      .get(userId, verified.businessId) as
      | { id: string; role: UserRole; status: string }
      | undefined;

    if (existingMembership && existingMembership.status === "active") {
      throw new HttpError(
        409,
        "Already a Member",
        "You already belong to this business.",
      );
    }

    const membershipId = existingMembership?.id ?? randomId("mem");

    this.db.transaction(() => {
      // Mark invite used
      this.db
        .prepare(`
        UPDATE invite_codes
        SET used_at = CURRENT_TIMESTAMP, used_by = ?
        WHERE code = ?
      `)
        .run(userId, code.trim().toUpperCase());

      // Insert or reactivate membership
      const permissions =
        verified.role === "accountant"
          ? JSON.stringify(["reports.read", "documents.read", "audit.read"])
          : JSON.stringify([
              "expenses.draft",
              "documents.upload",
              "documents.view_own",
            ]);

      this.db
        .prepare(`
        INSERT INTO memberships (id, user_id, business_id, role, status, permissions)
        VALUES (?, ?, ?, ?, 'active', ?)
        ON CONFLICT(user_id, business_id) DO UPDATE SET
          role = excluded.role,
          status = 'active',
          permissions = excluded.permissions,
          updated_at = CURRENT_TIMESTAMP
      `)
        .run(
          membershipId,
          userId,
          verified.businessId,
          verified.role,
          permissions,
        );
    });

    this.auditService.logEvent({
      userId,
      businessId: verified.businessId,
      action: "team.invite_accepted",
      resource: "memberships",
      resourceId: membershipId,
      ipAddress,
      metadata: { role: verified.role, code },
    });

    return {
      accepted: true,
      businessId: verified.businessId,
      role: verified.role,
    };
  }

  revokeMember(
    businessId: string,
    targetUserId: string,
    actorUserId: string,
    ipAddress?: string,
  ): { revoked: boolean } {
    // Cannot revoke oneself
    if (targetUserId === actorUserId) {
      throw new HttpError(
        400,
        "Cannot Revoke Self",
        "Business owners cannot revoke their own active membership.",
      );
    }

    const membership = this.db
      .prepare(`
      SELECT id, role FROM memberships WHERE business_id = ? AND user_id = ? AND status = 'active'
    `)
      .get(businessId, targetUserId) as
      | { id: string; role: UserRole }
      | undefined;

    if (!membership) {
      throw new HttpError(
        404,
        "Member Not Found",
        "The user is not an active member of this business.",
      );
    }

    this.db
      .prepare(`
      UPDATE memberships
      SET status = 'revoked', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `)
      .run(membership.id);

    this.auditService.logEvent({
      userId: actorUserId,
      businessId,
      action: "team.member_revoked",
      resource: "memberships",
      resourceId: membership.id,
      ipAddress,
      metadata: { targetUserId, role: membership.role },
    });

    return { revoked: true };
  }
}
