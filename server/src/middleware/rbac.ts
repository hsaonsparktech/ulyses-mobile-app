import type { ServerResponse } from "node:http";
import type { UserRole } from "../entities/User";
import { HttpError } from "../utils/problemDetails";
import type { RequestWithAuth } from "./auth";

export function requireRoles(...allowedRoles: UserRole[]) {
  return (
    req: RequestWithAuth,
    _res: ServerResponse,
    next: () => void,
  ): void => {
    // Prefer businessContext role if tenancy middleware ran; fallback to user token role
    const activeRole = req.businessContext?.role ?? req.user?.role;

    if (!activeRole) {
      throw new HttpError(
        401,
        "Role Context Missing",
        "No authenticated role could be determined.",
      );
    }

    if (!allowedRoles.includes(activeRole)) {
      throw new HttpError(
        403,
        "Insufficient Permissions",
        `The current role '${activeRole}' is not authorized. Required: [${allowedRoles.join(", ")}].`,
      );
    }

    next();
  };
}

export function requirePermissions(...requiredPermissions: string[]) {
  return (
    req: RequestWithAuth,
    _res: ServerResponse,
    next: () => void,
  ): void => {
    const permissions = req.businessContext?.permissions ?? [];

    if (permissions.includes("all")) {
      next();
      return;
    }

    const missing = requiredPermissions.filter((p) => !permissions.includes(p));
    if (missing.length > 0) {
      throw new HttpError(
        403,
        "Missing Required Permissions",
        `Your membership lacks the required permission(s): [${missing.join(", ")}].`,
      );
    }

    next();
  };
}
