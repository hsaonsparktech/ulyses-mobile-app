import type { ServerResponse } from "node:http";
import { z } from "zod";
import type { Database } from "../db/client";
import { getDatabase } from "../db/client";
import type { RequestWithAuth } from "../middleware/auth";
import { AuthService } from "../services/AuthService";
import { TeamService } from "../services/TeamService";
import { HttpError } from "../utils/problemDetails";

// Validation Schemas matching frontend contracts
const registerBodySchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters."),
  email: z.string().email("Enter a valid work email address."),
  password: z.string().min(8, "Password must be at least 8 characters long."),
  termsAccepted: z
    .boolean()
    .refine(
      (val) => val === true,
      "You must agree to the Terms and Privacy Policy.",
    ),
});

const verifyEmailBodySchema = z.object({
  email: z.string().email("Enter a valid email address."),
  code: z.string().trim().length(6, "Verification code must be 6 digits."),
});

const signInBodySchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});

const refreshBodySchema = z.object({
  refreshToken: z.string().min(10, "Refresh token is required."),
});

const forgotPasswordBodySchema = z.object({
  email: z.string().email("Enter a valid email address."),
});

const inviteCodeBodySchema = z.object({
  code: z
    .string()
    .trim()
    .min(4, "Invitation code must be at least 4 characters."),
});

export function createAuthRoutes(db?: Database) {
  const database = db ?? getDatabase();
  const authService = new AuthService(database);
  const teamService = new TeamService(database);

  return {
    handleRegister: (req: RequestWithAuth, res: ServerResponse): void => {
      const parsed = registerBodySchema.parse(req.body);
      const ip =
        (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress;

      const result = authService.register({
        fullName: parsed.fullName,
        email: parsed.email,
        password: parsed.password,
        termsAccepted: parsed.termsAccepted,
        ipAddress: ip,
      });

      res.statusCode = 201;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(result, null, 2));
    },

    handleVerifyEmail: (req: RequestWithAuth, res: ServerResponse): void => {
      const parsed = verifyEmailBodySchema.parse(req.body);
      const ip =
        (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress;

      const result = authService.verifyEmail({
        email: parsed.email,
        code: parsed.code,
        ipAddress: ip,
      });

      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(result, null, 2));
    },

    handleSignIn: (req: RequestWithAuth, res: ServerResponse): void => {
      const parsed = signInBodySchema.parse(req.body);
      const ip =
        (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress;
      const userAgent = req.headers["user-agent"];

      const result = authService.signIn({
        email: parsed.email,
        password: parsed.password,
        userAgent,
        ipAddress: ip,
      });

      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(result, null, 2));
    },

    handleRefresh: (req: RequestWithAuth, res: ServerResponse): void => {
      const parsed = refreshBodySchema.parse(req.body);
      const tokens = authService.refresh(parsed.refreshToken);

      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(tokens, null, 2));
    },

    handleForgotPassword: (req: RequestWithAuth, res: ServerResponse): void => {
      const parsed = forgotPasswordBodySchema.parse(req.body);
      const ip =
        (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress;

      const result = authService.forgotPassword({
        email: parsed.email,
        ipAddress: ip,
      });

      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(result, null, 2));
    },

    handleVerifyInvite: (req: RequestWithAuth, res: ServerResponse): void => {
      const parsed = inviteCodeBodySchema.parse(req.body);
      const result = teamService.verifyInviteCode(parsed.code);

      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(result, null, 2));
    },

    handleAcceptInvite: (req: RequestWithAuth, res: ServerResponse): void => {
      if (!req.user) {
        throw new HttpError(
          401,
          "Authentication Required",
          "Sign in before accepting an invitation.",
        );
      }

      const parsed = inviteCodeBodySchema.parse(req.body);
      const ip =
        (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress;
      const result = teamService.acceptInvite(parsed.code, req.user.id, ip);

      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(result, null, 2));
    },

    handleSignOut: (req: RequestWithAuth, res: ServerResponse): void => {
      if (!req.user) {
        throw new HttpError(
          401,
          "Authentication Required",
          "No active session.",
        );
      }

      const ip =
        (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress;
      authService.signOut(req.user.id, undefined, ip);

      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify(
          { success: true, message: "Signed out successfully." },
          null,
          2,
        ),
      );
    },

    handleGetMe: (req: RequestWithAuth, res: ServerResponse): void => {
      if (!req.user) {
        throw new HttpError(
          401,
          "Authentication Required",
          "No active session.",
        );
      }

      const result = authService.getMe(req.user.id);
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(result, null, 2));
    },
  };
}
