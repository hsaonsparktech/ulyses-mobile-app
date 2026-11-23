import type { IncomingMessage, ServerResponse } from "node:http";
import type { Database } from "../db/client";
import { getDatabase } from "../db/client";
import type { UserRole } from "../entities/User";
import { TokenService } from "../services/TokenService";
import { HttpError } from "../utils/problemDetails";

export interface AuthenticatedUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  businessId?: string;
  jti: string;
}

export interface RequestWithAuth extends IncomingMessage {
  user?: AuthenticatedUser;
  businessContext?: {
    businessId: string;
    role: UserRole;
    permissions: string[];
  };
  body?: unknown;
  params?: Record<string, string>;
  query?: Record<string, string>;
}

export function createAuthMiddleware(db?: Database) {
  const tokenService = new TokenService(db ?? getDatabase());

  return (
    req: RequestWithAuth,
    _res: ServerResponse,
    next: () => void,
  ): void => {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      throw new HttpError(
        401,
        "Authentication Required",
        "A valid Bearer authentication token is required to access this resource.",
      );
    }

    const token = authHeader.slice(7).trim();
    if (!token) {
      throw new HttpError(401, "Invalid Token", "Bearer token is empty.");
    }

    try {
      const payload = tokenService.verifyAccessToken(token);
      req.user = {
        id: payload.sub,
        email: payload.email,
        fullName: payload.fullName,
        role: payload.role,
        businessId: payload.businessId,
        jti: payload.jti,
      };
      next();
    } catch (err) {
      throw new HttpError(
        401,
        "Token Expired or Invalid",
        err instanceof Error
          ? err.message
          : "Unable to verify authentication token.",
      );
    }
  };
}
