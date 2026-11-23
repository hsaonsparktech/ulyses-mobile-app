import type { ServerResponse } from "node:http";
import { z } from "zod";
import type { Database } from "../db/client";
import { getDatabase } from "../db/client";
import type { RequestWithAuth } from "../middleware/auth";
import { TeamService } from "../services/TeamService";
import { HttpError } from "../utils/problemDetails";

const inviteMemberSchema = z.object({
  role: z.enum(["employee", "accountant"]),
  email: z.string().email("Enter a valid email address.").optional(),
});

export function createTeamRoutes(db?: Database) {
  const database = db ?? getDatabase();
  const teamService = new TeamService(database);

  return {
    handleListMembers: (req: RequestWithAuth, res: ServerResponse): void => {
      if (!req.businessContext) {
        throw new HttpError(
          400,
          "Business Context Required",
          "Tenant context missing.",
        );
      }

      // Owners and Accountants can list members; Employees cannot
      if (req.businessContext.role === "employee") {
        throw new HttpError(
          403,
          "Access Denied",
          "Employees are not authorized to view full team roster.",
        );
      }

      const members = teamService.getMembers(req.businessContext.businessId);

      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(members, null, 2));
    },

    handleInviteMember: (req: RequestWithAuth, res: ServerResponse): void => {
      if (!req.businessContext || !req.user) {
        throw new HttpError(
          400,
          "Business Context Required",
          "Tenant context missing.",
        );
      }

      if (req.businessContext.role !== "owner") {
        throw new HttpError(
          403,
          "Access Denied",
          "Only business owners can invite team members.",
        );
      }

      const parsed = inviteMemberSchema.parse(req.body);
      const ip =
        (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress;

      const result = teamService.createInvite(
        req.businessContext.businessId,
        req.user.id,
        parsed,
        ip,
      );

      res.statusCode = 201;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(result, null, 2));
    },

    handleRevokeMember: (req: RequestWithAuth, res: ServerResponse): void => {
      if (!req.businessContext || !req.user) {
        throw new HttpError(
          400,
          "Business Context Required",
          "Tenant context missing.",
        );
      }

      if (req.businessContext.role !== "owner") {
        throw new HttpError(
          403,
          "Access Denied",
          "Only business owners can revoke team memberships.",
        );
      }

      const targetUserId = req.params?.id;
      if (!targetUserId) {
        throw new HttpError(
          400,
          "Target User Missing",
          "Member user ID parameter is required.",
        );
      }

      const ip =
        (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress;
      const result = teamService.revokeMember(
        req.businessContext.businessId,
        targetUserId,
        req.user.id,
        ip,
      );

      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(result, null, 2));
    },
  };
}
