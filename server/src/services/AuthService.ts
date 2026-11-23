import { serverEnv } from "../config/env";
import { type Database, getDatabase } from "../db/client";
import type { UserEntity, UserProfile, UserRole } from "../entities/User";
import { toUserProfile } from "../entities/User";
import {
  hashPassword,
  randomDigitCode,
  randomId,
  verifyPassword,
} from "../utils/crypto";
import { HttpError } from "../utils/problemDetails";
import { AuditService } from "./AuditService";
import { type AuthTokens, TokenService } from "./TokenService";

export interface RegisterResult {
  userId: string;
  email: string;
  verified: boolean;
  message: string;
  previewCode?: string; // Exposed in non-production for testing
}

export interface SignInResult {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  session: {
    userId: string;
    role: UserRole;
    businessId?: string;
  };
  user: UserProfile;
}

export class AuthService {
  private db: Database;
  private tokenService: TokenService;
  private auditService: AuditService;

  constructor(
    db?: Database,
    tokenService?: TokenService,
    auditService?: AuditService,
  ) {
    this.db = db ?? getDatabase();
    this.tokenService = tokenService ?? new TokenService(this.db);
    this.auditService = auditService ?? new AuditService(this.db);
  }

  register(input: {
    fullName: string;
    email: string;
    password: string;
    termsAccepted: boolean;
    ipAddress?: string;
  }): RegisterResult {
    const emailNorm = input.email.trim().toLowerCase();

    // Check duplicate email
    const existing = this.db
      .prepare("SELECT id FROM users WHERE email = ?")
      .get(emailNorm);
    if (existing) {
      throw new HttpError(
        409,
        "Email Already Registered",
        "An account with this email address already exists. Please sign in instead.",
      );
    }

    const userId = randomId("usr");
    const { hash, salt } = hashPassword(input.password);
    const verificationCode = randomDigitCode(6);
    // Expires in 15 minutes
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    this.db
      .prepare(`
      INSERT INTO users (id, email, password_hash, password_salt, full_name, is_verified, verification_code, verification_code_expires_at)
      VALUES (?, ?, ?, ?, ?, 0, ?, ?)
    `)
      .run(
        userId,
        emailNorm,
        hash,
        salt,
        input.fullName.trim(),
        verificationCode,
        expiresAt,
      );

    this.auditService.logEvent({
      userId,
      action: "user.register",
      resource: "users",
      resourceId: userId,
      ipAddress: input.ipAddress,
      metadata: { email: emailNorm },
    });

    return {
      userId,
      email: emailNorm,
      verified: false,
      message: "Verification code sent to email.",
      previewCode:
        serverEnv.NODE_ENV !== "production" ? verificationCode : undefined,
    };
  }

  verifyEmail(input: { email: string; code: string; ipAddress?: string }): {
    verified: boolean;
    message: string;
    userId: string;
  } {
    const emailNorm = input.email.trim().toLowerCase();
    const user = this.db
      .prepare("SELECT * FROM users WHERE email = ?")
      .get(emailNorm) as unknown as UserEntity | undefined;

    if (!user) {
      throw new HttpError(
        404,
        "User Not Found",
        "No account found matching this email address.",
      );
    }

    if (user.is_verified) {
      return {
        verified: true,
        message: "Email is already verified.",
        userId: user.id,
      };
    }

    if (
      !user.verification_code ||
      user.verification_code !== input.code.trim()
    ) {
      throw new HttpError(
        400,
        "Invalid Verification Code",
        "The 6-digit verification code entered is incorrect.",
      );
    }

    if (
      user.verification_code_expires_at &&
      new Date(user.verification_code_expires_at).getTime() < Date.now()
    ) {
      throw new HttpError(
        400,
        "Verification Code Expired",
        "The verification code has expired. Please request a new code.",
      );
    }

    this.db
      .prepare(`
      UPDATE users
      SET is_verified = 1, verification_code = NULL, verification_code_expires_at = NULL, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `)
      .run(user.id);

    this.auditService.logEvent({
      userId: user.id,
      action: "user.verify_email",
      resource: "users",
      resourceId: user.id,
      ipAddress: input.ipAddress,
    });

    return {
      verified: true,
      message: "Email successfully verified.",
      userId: user.id,
    };
  }

  signIn(input: {
    email: string;
    password: string;
    userAgent?: string;
    ipAddress?: string;
  }): SignInResult {
    const emailNorm = input.email.trim().toLowerCase();
    const user = this.db
      .prepare("SELECT * FROM users WHERE email = ?")
      .get(emailNorm) as unknown as UserEntity | undefined;

    if (!user) {
      throw new HttpError(
        401,
        "Invalid Credentials",
        "Incorrect email or password.",
      );
    }

    const isValid = verifyPassword(
      input.password,
      user.password_hash,
      user.password_salt,
    );
    if (!isValid) {
      this.auditService.logEvent({
        userId: user.id,
        action: "auth.failed_login",
        resource: "users",
        resourceId: user.id,
        ipAddress: input.ipAddress,
      });
      throw new HttpError(
        401,
        "Invalid Credentials",
        "Incorrect email or password.",
      );
    }

    if (!user.is_verified) {
      throw new HttpError(
        403,
        "Email Verification Required",
        "Please verify your email address before signing in.",
      );
    }

    // Resolve primary active membership
    const membership = this.db
      .prepare(`
      SELECT m.business_id, m.role, b.status as business_status
      FROM memberships m
      JOIN businesses b ON b.id = m.business_id
      WHERE m.user_id = ? AND m.status = 'active'
      ORDER BY m.created_at ASC
      LIMIT 1
    `)
      .get(user.id) as
      | { business_id: string; role: UserRole; business_status: string }
      | undefined;

    const businessId = membership?.business_id;
    const role: UserRole = membership?.role ?? "owner";

    const tokens = this.tokenService.issueTokens({
      userId: user.id,
      role,
      businessId,
      email: user.email,
      fullName: user.full_name,
      userAgent: input.userAgent,
      ipAddress: input.ipAddress,
    });

    this.auditService.logEvent({
      userId: user.id,
      businessId,
      action: "auth.sign_in",
      resource: "sessions",
      ipAddress: input.ipAddress,
      metadata: { role, businessId },
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
      session: {
        userId: user.id,
        role,
        businessId,
      },
      user: toUserProfile(user),
    };
  }

  refresh(refreshToken: string): AuthTokens {
    return this.tokenService.rotateRefreshToken(refreshToken).tokens;
  }

  forgotPassword(input: { email: string; ipAddress?: string }): {
    sent: boolean;
    message: string;
  } {
    const emailNorm = input.email.trim().toLowerCase();
    const user = this.db
      .prepare("SELECT id FROM users WHERE email = ?")
      .get(emailNorm) as { id: string } | undefined;

    if (user) {
      this.auditService.logEvent({
        userId: user.id,
        action: "auth.forgot_password_request",
        resource: "users",
        resourceId: user.id,
        ipAddress: input.ipAddress,
      });
    }

    // Always return success message to avoid email enumeration
    return {
      sent: true,
      message:
        "If an account exists for this email, password reset instructions have been sent.",
    };
  }

  signOut(userId: string, sessionId?: string, ipAddress?: string): void {
    if (sessionId) {
      this.tokenService.revokeSession(sessionId);
    } else {
      this.tokenService.revokeAllUserSessions(userId);
    }

    this.auditService.logEvent({
      userId,
      action: "auth.sign_out",
      resource: "sessions",
      ipAddress,
    });
  }

  getMe(userId: string): { user: UserProfile; memberships: unknown[] } {
    const user = this.db
      .prepare("SELECT * FROM users WHERE id = ?")
      .get(userId) as unknown as UserEntity | undefined;
    if (!user) {
      throw new HttpError(404, "User Not Found", "User account not found.");
    }

    const memberships = this.db
      .prepare(`
      SELECT m.id, m.business_id, m.role, m.status, m.permissions, b.name as business_name, b.currency
      FROM memberships m
      JOIN businesses b ON b.id = m.business_id
      WHERE m.user_id = ? AND m.status = 'active'
    `)
      .all(userId);

    return {
      user: toUserProfile(user),
      memberships,
    };
  }
}
