import type { ServerResponse } from "node:http";
import { z } from "zod";
import type { Database } from "../db/client";
import { getDatabase } from "../db/client";
import type { RequestWithAuth } from "../middleware/auth";
import { BusinessService } from "../services/BusinessService";
import { HttpError } from "../utils/problemDetails";

const createBusinessSchema = z.object({
  businessName: z
    .string()
    .trim()
    .min(2, "Business name must be at least 2 characters."),
  businessType: z
    .string()
    .trim()
    .min(1, "Please select or enter a business type."),
  currency: z.string().trim().min(3).max(3).optional(),
});

const updateBusinessSchema = z.object({
  name: z.string().trim().min(2).optional(),
  businessType: z.string().trim().min(1).optional(),
  currency: z.string().trim().min(3).max(3).optional(),
});

export function createBusinessRoutes(db?: Database) {
  const database = db ?? getDatabase();
  const businessService = new BusinessService(database);

  return {
    handleCreateBusiness: (req: RequestWithAuth, res: ServerResponse): void => {
      if (!req.user) {
        throw new HttpError(
          401,
          "Authentication Required",
          "Sign in before creating a business.",
        );
      }

      const parsed = createBusinessSchema.parse(req.body);
      const ip =
        (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress;

      const result = businessService.createBusiness(req.user.id, parsed, ip);

      res.statusCode = 201;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(result, null, 2));
    },

    handleGetCurrentBusiness: (
      req: RequestWithAuth,
      res: ServerResponse,
    ): void => {
      if (!req.businessContext) {
        throw new HttpError(
          400,
          "Business Context Required",
          "Tenant context missing.",
        );
      }

      const business = businessService.getBusinessById(
        req.businessContext.businessId,
      );

      const response = {
        ...business,
        role: req.businessContext.role,
        permissions: req.businessContext.permissions,
      };

      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(response, null, 2));
    },

    handleUpdateCurrentBusiness: (
      req: RequestWithAuth,
      res: ServerResponse,
    ): void => {
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
          "Only business owners can update business settings.",
        );
      }

      const parsed = updateBusinessSchema.parse(req.body);
      const ip =
        (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress;

      const updated = businessService.updateBusiness(
        req.businessContext.businessId,
        req.user.id,
        parsed,
        ip,
      );

      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(updated, null, 2));
    },

    handleGetMyBusinesses: (
      req: RequestWithAuth,
      res: ServerResponse,
    ): void => {
      if (!req.user) {
        throw new HttpError(
          401,
          "Authentication Required",
          "Sign in before listing businesses.",
        );
      }

      const businesses = businessService.getUserBusinesses(req.user.id);

      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(businesses, null, 2));
    },
  };
}
