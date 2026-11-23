import type { ServerResponse } from "node:http";
import { z } from "zod";
import type { Database } from "../db/client";
import { getDatabase } from "../db/client";
import type { ExpenseStatus } from "../entities/Expense";
import type { RequestWithAuth } from "../middleware/auth";
import { ExpenseService } from "../services/ExpenseService";
import { IdempotencyService } from "../services/IdempotencyService";
import { HttpError } from "../utils/problemDetails";

const createExpenseSchema = z.object({
  category: z.string().trim().min(1, "Category is required."),
  merchant: z.string().trim().min(1, "Merchant is required."),
  amountCents: z
    .number()
    .int()
    .positive("Amount must be a positive integer in cents."),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD."),
  currency: z.string().trim().min(3).max(3).optional(),
  receiptUrl: z.string().trim().optional(),
  idempotencyKey: z.string().trim().optional(),
});

const rejectExpenseSchema = z.object({
  reason: z.string().trim().optional(),
});

export function createExpenseRoutes(db?: Database) {
  const database = db ?? getDatabase();
  const expenseService = new ExpenseService(database);
  const idempotencyService = new IdempotencyService(database);

  return {
    handleListExpenses: (req: RequestWithAuth, res: ServerResponse): void => {
      if (!req.businessContext || !req.user) {
        throw new HttpError(
          400,
          "Business Context Required",
          "Tenant context missing.",
        );
      }

      const status = req.query?.status as ExpenseStatus | undefined;
      const limit = req.query?.limit
        ? parseInt(req.query.limit, 10)
        : undefined;
      const offset = req.query?.offset
        ? parseInt(req.query.offset, 10)
        : undefined;

      const expenses = expenseService.getExpenses(
        req.businessContext.businessId,
        req.user.id,
        req.businessContext.role,
        { status, limit, offset },
      );

      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(expenses, null, 2));
    },

    handleGetExpense: (req: RequestWithAuth, res: ServerResponse): void => {
      if (!req.businessContext || !req.user) {
        throw new HttpError(
          400,
          "Business Context Required",
          "Tenant context missing.",
        );
      }

      const expenseId = req.params?.id;
      if (!expenseId) {
        throw new HttpError(
          400,
          "Expense ID Missing",
          "Expense ID is required.",
        );
      }

      const expense = expenseService.getExpenseById(
        req.businessContext.businessId,
        req.user.id,
        req.businessContext.role,
        expenseId,
      );

      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(expense, null, 2));
    },

    handleCreateExpense: async (
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

      const parsed = createExpenseSchema.parse(req.body);
      const headerKey = req.headers["idempotency-key"] as string | undefined;
      const effectiveKey = headerKey || parsed.idempotencyKey;
      const ip =
        (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress;

      const result = await idempotencyService.runWithIdempotency({
        businessId: req.businessContext.businessId,
        userId: req.user.id,
        endpoint: "/api/v1/expenses",
        key: effectiveKey,
        payload: parsed,
        execute: async () => {
          const expense = expenseService.createExpense(
            req.businessContext!.businessId,
            req.user!.id,
            { ...parsed, idempotencyKey: effectiveKey },
            ip,
          );
          return { statusCode: 201, data: expense };
        },
      });

      res.statusCode = result.statusCode;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(result.data, null, 2));
    },

    handleApproveExpense: (req: RequestWithAuth, res: ServerResponse): void => {
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
          "Only business owners are authorized to approve expenses.",
        );
      }

      const expenseId = req.params?.id;
      if (!expenseId) {
        throw new HttpError(
          400,
          "Expense ID Missing",
          "Expense ID is required.",
        );
      }

      const ip =
        (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress;
      const approved = expenseService.approveExpense(
        req.businessContext.businessId,
        req.user.id,
        req.businessContext.role,
        expenseId,
        ip,
      );

      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(approved, null, 2));
    },

    handleRejectExpense: (req: RequestWithAuth, res: ServerResponse): void => {
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
          "Only business owners are authorized to reject expenses.",
        );
      }

      const expenseId = req.params?.id;
      if (!expenseId) {
        throw new HttpError(
          400,
          "Expense ID Missing",
          "Expense ID is required.",
        );
      }

      const parsed = req.body ? rejectExpenseSchema.parse(req.body) : {};
      const ip =
        (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress;

      const rejected = expenseService.rejectExpense(
        req.businessContext.businessId,
        req.user.id,
        req.businessContext.role,
        expenseId,
        parsed.reason,
        ip,
      );

      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(rejected, null, 2));
    },
  };
}
