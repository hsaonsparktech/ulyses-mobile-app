import type { ServerResponse } from "node:http";
import { z } from "zod";
import type { Database } from "../db/client";
import { getDatabase } from "../db/client";
import type { RequestWithAuth } from "../middleware/auth";
import { LedgerService } from "../services/LedgerService";
import { HttpError } from "../utils/problemDetails";

const journalLineSchema = z.object({
  accountId: z.string().min(1, "Account ID is required."),
  debitCents: z
    .number()
    .int()
    .nonnegative("Debit must be non-negative integer cents."),
  creditCents: z
    .number()
    .int()
    .nonnegative("Credit must be non-negative integer cents."),
  description: z.string().trim().optional(),
});

const createJournalEntrySchema = z.object({
  entryDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Entry date must be YYYY-MM-DD."),
  description: z
    .string()
    .trim()
    .min(2, "Description must be at least 2 characters."),
  lines: z
    .array(journalLineSchema)
    .min(2, "Journal entry must have at least 2 lines."),
});

const reverseEntrySchema = z.object({
  reason: z.string().trim().min(2, "Reversal reason is required."),
});

export function createLedgerRoutes(db?: Database) {
  const database = db ?? getDatabase();
  const ledgerService = new LedgerService(database);

  return {
    handleListAccounts: (req: RequestWithAuth, res: ServerResponse): void => {
      if (!req.businessContext) {
        throw new HttpError(
          400,
          "Business Context Required",
          "Tenant context missing.",
        );
      }

      if (req.businessContext.role === "employee") {
        throw new HttpError(
          403,
          "Access Denied",
          "Employees are not authorized to view the chart of accounts.",
        );
      }

      const accounts = ledgerService.getAccounts(
        req.businessContext.businessId,
      );

      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(accounts, null, 2));
    },

    handleListEntries: (req: RequestWithAuth, res: ServerResponse): void => {
      if (!req.businessContext) {
        throw new HttpError(
          400,
          "Business Context Required",
          "Tenant context missing.",
        );
      }

      if (req.businessContext.role === "employee") {
        throw new HttpError(
          403,
          "Access Denied",
          "Employees are not authorized to view general ledger entries.",
        );
      }

      const status = req.query?.status;
      const limit = req.query?.limit
        ? parseInt(req.query.limit, 10)
        : undefined;
      const offset = req.query?.offset
        ? parseInt(req.query.offset, 10)
        : undefined;

      const entries = ledgerService.getJournalEntries(
        req.businessContext.businessId,
        {
          status,
          limit,
          offset,
        },
      );

      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(entries, null, 2));
    },

    handleCreateEntry: (req: RequestWithAuth, res: ServerResponse): void => {
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
          "Only business owners are authorized to post to the general ledger.",
        );
      }

      const parsed = createJournalEntrySchema.parse(req.body);
      const ip =
        (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress;

      const entry = ledgerService.createAndPostJournalEntry(
        req.businessContext.businessId,
        req.user.id,
        parsed,
        ip,
      );

      res.statusCode = 201;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(entry, null, 2));
    },

    handleReverseEntry: (req: RequestWithAuth, res: ServerResponse): void => {
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
          "Only business owners are authorized to reverse journal entries.",
        );
      }

      const entryId = req.params?.id;
      if (!entryId) {
        throw new HttpError(
          400,
          "Entry ID Missing",
          "Journal entry ID is required.",
        );
      }

      const parsed = reverseEntrySchema.parse(req.body);
      const ip =
        (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress;

      const result = ledgerService.reverseJournalEntry(
        req.businessContext.businessId,
        req.user.id,
        entryId,
        parsed.reason,
        ip,
      );

      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(result, null, 2));
    },
  };
}
