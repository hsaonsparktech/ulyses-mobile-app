import type { ServerResponse } from "node:http";
import type { Database } from "../db/client";
import { getDatabase } from "../db/client";
import type { UserRole } from "../entities/User";
import { HttpError } from "../utils/problemDetails";
import type { RequestWithAuth } from "./auth";

export function createTenancyMiddleware(db?: Database) {
  const database = db ?? getDatabase();

  return (
    req: RequestWithAuth,
    _res: ServerResponse,
    next: () => void,
  ): void => {
    if (!req.user) {
      throw new HttpError(
        401,
        "Authentication Required",
        "Session authentication must precede tenant validation.",
      );
    }

    // Resolve target businessId from X-Business-Id header or user token's bound businessId
    const headerBusinessId = req.headers["x-business-id"];
    const businessId =
      (typeof headerBusinessId === "string" ? headerBusinessId : undefined) ??
      req.user.businessId;

    if (!businessId) {
      throw new HttpError(
        400,
        "Business Context Required",
        "An X-Business-Id header or active business binding is required for this operation.",
      );
    }

    // Verify active membership in the target business
    const membership = database
      .prepare(`
      SELECT m.role, m.status, m.permissions, b.status as business_status
      FROM memberships m
      JOIN businesses b ON b.id = m.business_id
      WHERE m.user_id = ? AND m.business_id = ?
    `)
      .get(req.user.id, businessId) as
      | {
          role: UserRole;
          status: string;
          permissions: string;
          business_status: string;
        }
      | undefined;

    if (!membership) {
      throw new HttpError(
        403,
        "Forbidden Tenant Access",
        "You do not belong to the requested business or your tenant access is unauthorized.",
      );
    }

    if (membership.status !== "active") {
      throw new HttpError(
        403,
        "Membership Inactive",
        `Your membership in this business is currently ${membership.status}.`,
      );
    }

    if (membership.business_status !== "active") {
      throw new HttpError(
        403,
        "Business Inactive",
        `The requested business account is currently ${membership.business_status}.`,
      );
    }

    let permissions: string[] = [];
    try {
      permissions = JSON.parse(membership.permissions);
    } catch {
      permissions = [];
    }

    req.businessContext = {
      businessId,
      role: membership.role,
      permissions,
    };

    next();
  };
}
