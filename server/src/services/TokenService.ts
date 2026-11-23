import { serverEnv } from "../config/env";
import { type Database, getDatabase } from "../db/client";
import type { UserRole } from "../entities/User";
import {
  type JwtPayload,
  randomId,
  randomToken,
  sha256,
  signJwt,
  verifyJwt,
} from "../utils/crypto";
import { HttpError } from "../utils/problemDetails";

export interface IssueTokensParams {
  userId: string;
  role: UserRole;
  businessId?: string;
  email: string;
  fullName: string;
  userAgent?: string;
  ipAddress?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export class TokenService {
  private db: Database;
  private secret: string;
  private jwtExpiresIn: number;
  private refreshExpiresIn: number;

  constructor(
    db?: Database,
    secret = serverEnv.JWT_SECRET,
    jwtExpiresIn = serverEnv.JWT_EXPIRES_IN_SECONDS,
    refreshExpiresIn = serverEnv.REFRESH_TOKEN_EXPIRES_IN_SECONDS,
  ) {
    this.db = db ?? getDatabase();
    this.secret = secret;
    this.jwtExpiresIn = jwtExpiresIn;
    this.refreshExpiresIn = refreshExpiresIn;
  }

  issueTokens(params: IssueTokensParams): AuthTokens {
    const now = Math.floor(Date.now() / 1000);
    const exp = now + this.jwtExpiresIn;

    const accessToken = signJwt(
      {
        sub: params.userId,
        role: params.role,
        businessId: params.businessId,
        email: params.email,
        fullName: params.fullName,
        exp,
      },
      this.secret,
    );

    const rawRefreshToken = randomToken(32);
    const refreshTokenHash = sha256(rawRefreshToken);
    const sessionId = randomId("ses");
    const refreshExpiresAt = new Date(
      Date.now() + this.refreshExpiresIn * 1000,
    ).toISOString();

    this.db
      .prepare(`
      INSERT INTO sessions (id, user_id, business_id, refresh_token_hash, user_agent, ip_address, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
      .run(
        sessionId,
        params.userId,
        params.businessId ?? null,
        refreshTokenHash,
        params.userAgent ?? null,
        params.ipAddress ?? null,
        refreshExpiresAt,
      );

    return {
      accessToken,
      refreshToken: `${sessionId}.${rawRefreshToken}`,
      expiresIn: this.jwtExpiresIn,
    };
  }

  verifyAccessToken(token: string): JwtPayload {
    return verifyJwt(token, this.secret);
  }

  rotateRefreshToken(compositeToken: string): {
    userId: string;
    businessId?: string;
    tokens: AuthTokens;
  } {
    const parts = compositeToken.split(".");
    if (parts.length !== 2) {
      throw new HttpError(
        401,
        "Invalid Refresh Token",
        "Invalid refresh token format.",
      );
    }

    const [sessionId, rawToken] = parts;
    if (!sessionId || !rawToken) {
      throw new HttpError(
        401,
        "Invalid Refresh Token",
        "Malformed refresh token segments.",
      );
    }

    const tokenHash = sha256(rawToken);

    const session = this.db
      .prepare(`
      SELECT s.*, u.email, u.full_name, m.role, m.status as membership_status
      FROM sessions s
      JOIN users u ON u.id = s.user_id
      LEFT JOIN memberships m ON m.user_id = s.user_id AND m.business_id = s.business_id
      WHERE s.id = ? AND s.refresh_token_hash = ?
    `)
      .get(sessionId, tokenHash) as Record<string, unknown> | undefined;

    if (!session) {
      throw new HttpError(
        401,
        "Invalid Session",
        "Session not found or invalid refresh token.",
      );
    }

    if (session.revoked_at) {
      throw new HttpError(401, "Session Revoked", "Session has been revoked.");
    }

    const expiresAt = new Date(String(session.expires_at)).getTime();
    if (Date.now() > expiresAt) {
      throw new HttpError(401, "Session Expired", "Refresh token expired.");
    }

    // Revoke previous session on rotation
    this.db
      .prepare(`
      UPDATE sessions SET revoked_at = CURRENT_TIMESTAMP WHERE id = ?
    `)
      .run(sessionId);

    const userId = String(session.user_id);
    const businessId = session.business_id
      ? String(session.business_id)
      : undefined;
    const role = (session.role as UserRole) ?? "owner";
    const email = String(session.email);
    const fullName = String(session.full_name);

    const tokens = this.issueTokens({
      userId,
      role,
      businessId,
      email,
      fullName,
    });

    return {
      userId,
      businessId,
      tokens,
    };
  }

  revokeSession(sessionId: string): void {
    this.db
      .prepare(`
      UPDATE sessions SET revoked_at = CURRENT_TIMESTAMP WHERE id = ?
    `)
      .run(sessionId);
  }

  revokeAllUserSessions(userId: string): void {
    this.db
      .prepare(`
      UPDATE sessions SET revoked_at = CURRENT_TIMESTAMP WHERE user_id = ?
    `)
      .run(userId);
  }
}
