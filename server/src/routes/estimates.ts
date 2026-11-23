import type { ServerResponse } from "node:http";
import { z } from "zod";
import type { Database } from "../db/client";
import { getDatabase } from "../db/client";
import type { EstimateStatus } from "../entities/Estimate";
import type { RequestWithAuth } from "../middleware/auth";
import { EstimateService } from "../services/EstimateService";
import { IdempotencyService } from "../services/IdempotencyService";
import { HttpError } from "../utils/problemDetails";

const estimateItemSchema = z.object({
  description: z.string().trim().min(1, "Item description is required."),
  quantity: z.number().int().positive("Quantity must be a positive integer."),
  unitPriceCents: z
    .number()
    .int()
    .nonnegative("Unit price must be non-negative integer cents."),
});

const createEstimateSchema = z.object({
  clientId: z.string().min(1, "Client ID is required."),
  estimateNumber: z.string().trim().optional(),
  issueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Issue date must be YYYY-MM-DD."),
  validUntil: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Valid until date must be YYYY-MM-DD."),
  currency: z.string().trim().min(3).max(3).optional(),
  items: z
    .array(estimateItemSchema)
    .min(1, "At least one line item is required."),
  taxCents: z.number().int().nonnegative().optional(),
  taxRateBps: z.number().int().nonnegative().optional(),
  notes: z.string().trim().optional(),
  idempotencyKey: z.string().trim().optional(),
});

const convertToInvoiceSchema = z.object({
  idempotencyKey: z.string().trim().optional(),
});

export function createEstimateRoutes(db?: Database) {
  const database = db ?? getDatabase();
  const estimateService = new EstimateService(database);
  const idempotencyService = new IdempotencyService(database);

  return {
    handleListEstimates: (req: RequestWithAuth, res: ServerResponse): void => {
      if (!req.businessContext) {
        throw new HttpError(
          400,
          "Business Context Required",
          "Tenant context missing.",
        );
      }

      const status = req.query?.status as EstimateStatus | undefined;
      const clientId = req.query?.clientId;
      const limit = req.query?.limit
        ? parseInt(req.query.limit, 10)
        : undefined;
      const offset = req.query?.offset
        ? parseInt(req.query.offset, 10)
        : undefined;

      const estimates = estimateService.getEstimates(
        req.businessContext.businessId,
        {
          status,
          clientId,
          limit,
          offset,
        },
      );

      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(estimates, null, 2));
    },

    handleGetEstimate: (req: RequestWithAuth, res: ServerResponse): void => {
      if (!req.businessContext) {
        throw new HttpError(
          400,
          "Business Context Required",
          "Tenant context missing.",
        );
      }

      const estimateId = req.params?.id;
      if (!estimateId) {
        throw new HttpError(
          400,
          "Estimate ID Missing",
          "Estimate ID is required.",
        );
      }

      const estimate = estimateService.getEstimateById(
        req.businessContext.businessId,
        estimateId,
      );

      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(estimate, null, 2));
    },

    handleCreateEstimate: (req: RequestWithAuth, res: ServerResponse): void => {
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
          "Only business owners are authorized to create estimates.",
        );
      }

      const parsed = createEstimateSchema.parse(req.body);
      const ip =
        (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress;

      const estimate = estimateService.createEstimate(
        req.businessContext.businessId,
        req.user.id,
        parsed,
        ip,
      );

      res.statusCode = 201;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(estimate, null, 2));
    },

    handleConvertToInvoice: async (
      req: RequestWithAuth,
      res: ServerResponse,
    ): Promise<void> => {
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
          "Only business owners are authorized to convert estimates to invoices.",
        );
      }

      const estimateId = req.params?.id;
      if (!estimateId) {
        throw new HttpError(
          400,
          "Estimate ID Missing",
          "Estimate ID is required.",
        );
      }

      const parsed = req.body ? convertToInvoiceSchema.parse(req.body) : {};
      const headerKey = req.headers["idempotency-key"] as string | undefined;
      const effectiveKey = headerKey || parsed.idempotencyKey;
      const ip =
        (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress;

      const result = await idempotencyService.runWithIdempotency({
        businessId: req.businessContext.businessId,
        userId: req.user.id,
        endpoint: `/api/v1/estimates/${estimateId}/convert`,
        key: effectiveKey,
        payload: parsed,
        execute: async () => {
          const invoice = estimateService.convertToInvoice(
            req.businessContext!.businessId,
            req.user!.id,
            estimateId,
            effectiveKey,
            ip,
          );
          return { statusCode: 200, data: invoice };
        },
      });

      res.statusCode = result.statusCode;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(result.data, null, 2));
    },
  };
}
