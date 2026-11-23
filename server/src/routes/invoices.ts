import type { ServerResponse } from "node:http";
import { z } from "zod";
import type { Database } from "../db/client";
import { getDatabase } from "../db/client";
import type { InvoiceStatus } from "../entities/Invoice";
import type { RequestWithAuth } from "../middleware/auth";
import { IdempotencyService } from "../services/IdempotencyService";
import { InvoiceService } from "../services/InvoiceService";
import { HttpError } from "../utils/problemDetails";

const invoiceItemSchema = z.object({
  description: z.string().trim().min(1, "Item description is required."),
  quantity: z.number().int().positive("Quantity must be a positive integer."),
  unitPriceCents: z
    .number()
    .int()
    .nonnegative("Unit price must be non-negative integer cents."),
});

const createInvoiceSchema = z.object({
  clientId: z.string().min(1, "Client ID is required."),
  invoiceNumber: z.string().trim().optional(),
  issueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Issue date must be YYYY-MM-DD."),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Due date must be YYYY-MM-DD."),
  currency: z.string().trim().min(3).max(3).optional(),
  items: z
    .array(invoiceItemSchema)
    .min(1, "At least one line item is required."),
  taxCents: z.number().int().nonnegative().optional(),
  taxRateBps: z.number().int().nonnegative().optional(),
  notes: z.string().trim().optional(),
  idempotencyKey: z.string().trim().optional(),
});

const recordPaymentSchema = z.object({
  amountCents: z
    .number()
    .int()
    .positive("Payment amount must be positive integer cents."),
  paymentDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  notes: z.string().trim().optional(),
  idempotencyKey: z.string().trim().optional(),
});

export function createInvoiceRoutes(db?: Database) {
  const database = db ?? getDatabase();
  const invoiceService = new InvoiceService(database);
  const idempotencyService = new IdempotencyService(database);

  return {
    handleListInvoices: (req: RequestWithAuth, res: ServerResponse): void => {
      if (!req.businessContext) {
        throw new HttpError(
          400,
          "Business Context Required",
          "Tenant context missing.",
        );
      }

      const status = req.query?.status as InvoiceStatus | undefined;
      const clientId = req.query?.clientId;
      const limit = req.query?.limit
        ? parseInt(req.query.limit, 10)
        : undefined;
      const offset = req.query?.offset
        ? parseInt(req.query.offset, 10)
        : undefined;

      const invoices = invoiceService.getInvoices(
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
      res.end(JSON.stringify(invoices, null, 2));
    },

    handleGetInvoice: (req: RequestWithAuth, res: ServerResponse): void => {
      if (!req.businessContext) {
        throw new HttpError(
          400,
          "Business Context Required",
          "Tenant context missing.",
        );
      }

      const invoiceId = req.params?.id;
      if (!invoiceId) {
        throw new HttpError(
          400,
          "Invoice ID Missing",
          "Invoice ID is required.",
        );
      }

      const invoice = invoiceService.getInvoiceById(
        req.businessContext.businessId,
        invoiceId,
      );

      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(invoice, null, 2));
    },

    handleCreateInvoice: async (
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
          "Only business owners are authorized to create invoices.",
        );
      }

      const parsed = createInvoiceSchema.parse(req.body);
      const headerKey = req.headers["idempotency-key"] as string | undefined;
      const effectiveKey = headerKey || parsed.idempotencyKey;
      const ip =
        (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress;

      const result = await idempotencyService.runWithIdempotency({
        businessId: req.businessContext.businessId,
        userId: req.user.id,
        endpoint: "/api/v1/invoices",
        key: effectiveKey,
        payload: parsed,
        execute: async () => {
          const invoice = invoiceService.createInvoice(
            req.businessContext!.businessId,
            req.user!.id,
            { ...parsed, idempotencyKey: effectiveKey },
            ip,
          );
          return { statusCode: 201, data: invoice };
        },
      });

      res.statusCode = result.statusCode;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(result.data, null, 2));
    },

    handleSendInvoice: (req: RequestWithAuth, res: ServerResponse): void => {
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
          "Only business owners are authorized to send invoices.",
        );
      }

      const invoiceId = req.params?.id;
      if (!invoiceId) {
        throw new HttpError(
          400,
          "Invoice ID Missing",
          "Invoice ID is required.",
        );
      }

      const ip =
        (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress;
      const sent = invoiceService.sendInvoice(
        req.businessContext.businessId,
        req.user.id,
        invoiceId,
        ip,
      );

      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(sent, null, 2));
    },

    handleRecordPayment: async (
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
          "Only business owners are authorized to record payments.",
        );
      }

      const invoiceId = req.params?.id;
      if (!invoiceId) {
        throw new HttpError(
          400,
          "Invoice ID Missing",
          "Invoice ID is required.",
        );
      }

      const parsed = recordPaymentSchema.parse(req.body);
      const headerKey = req.headers["idempotency-key"] as string | undefined;
      const effectiveKey = headerKey || parsed.idempotencyKey;
      const ip =
        (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress;

      const result = await idempotencyService.runWithIdempotency({
        businessId: req.businessContext.businessId,
        userId: req.user.id,
        endpoint: `/api/v1/invoices/${invoiceId}/payments`,
        key: effectiveKey,
        payload: parsed,
        execute: async () => {
          const updated = invoiceService.recordPayment(
            req.businessContext!.businessId,
            req.user!.id,
            invoiceId,
            parsed,
            ip,
          );
          return { statusCode: 200, data: updated };
        },
      });

      res.statusCode = result.statusCode;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(result.data, null, 2));
    },
  };
}
