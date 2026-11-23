import type { ServerResponse } from "node:http";
import { z } from "zod";
import type { Database } from "../db/client";
import { getDatabase } from "../db/client";
import type { RequestWithAuth } from "../middleware/auth";
import { ScanningService } from "../services/ScanningService";
import { HttpError } from "../utils/problemDetails";

const extractedFieldSchema = z.object({
  label: z.string().trim().min(1),
  value: z.string().trim(),
  confidence: z.number().min(0).max(1),
});

const processOcrSchema = z.object({
  documentId: z.string().trim().min(1, "Document ID is required."),
  vendor: z.string().trim().optional(),
  documentDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD.")
    .optional(),
  subtotalCents: z.number().int().nonnegative().optional(),
  taxCents: z.number().int().nonnegative().optional(),
  totalCents: z.number().int().nonnegative().optional(),
  currency: z.string().trim().min(3).max(3).optional(),
  rawText: z.string().optional(),
  confidenceScore: z.number().min(0).max(1).optional(),
  extractedFields: z.array(extractedFieldSchema).optional(),
});

const reviewOcrSchema = z.object({
  action: z.enum(["confirmed", "rejected"]),
});

export function createScanningRoutes(db?: Database) {
  const database = db ?? getDatabase();
  const scanningService = new ScanningService(database);

  return {
    handleProcessOcr: (req: RequestWithAuth, res: ServerResponse): void => {
      if (!req.businessContext || !req.user) {
        throw new HttpError(
          400,
          "Business Context Required",
          "Tenant context missing.",
        );
      }

      // RBAC: Accountant is read-only
      if (req.businessContext.role === "accountant") {
        throw new HttpError(
          403,
          "Forbidden",
          "Accountants have read-only access and cannot trigger OCR scans.",
        );
      }

      const parsed = processOcrSchema.parse(req.body);

      const result = scanningService.processOcrScan(
        req.businessContext.businessId,
        req.user.id,
        req.businessContext.role,
        parsed,
      );

      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(result, null, 2));
    },

    handleGetOcrResult: (req: RequestWithAuth, res: ServerResponse): void => {
      if (!req.businessContext || !req.user) {
        throw new HttpError(
          400,
          "Business Context Required",
          "Tenant context missing.",
        );
      }

      const documentId = req.params?.id;
      if (!documentId) {
        throw new HttpError(400, "Bad Request", "Document ID is required.");
      }

      const result = scanningService.getOcrResult(
        req.businessContext.businessId,
        documentId,
      );

      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(result, null, 2));
    },

    handleReviewOcrResult: (
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

      // RBAC: Only Owner can review/confirm OCR extractions
      if (req.businessContext.role !== "owner") {
        throw new HttpError(
          403,
          "Forbidden",
          "Only the business owner has permission to review or confirm OCR results.",
        );
      }

      const documentId = req.params?.id;
      if (!documentId) {
        throw new HttpError(400, "Bad Request", "Document ID is required.");
      }

      const parsed = reviewOcrSchema.parse(req.body);

      const result = scanningService.reviewOcrResult(
        req.businessContext.businessId,
        documentId,
        req.user.id,
        req.businessContext.role,
        parsed.action,
      );

      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(result, null, 2));
    },
  };
}
