import type { Database } from "../db/client";
import { getDatabase } from "../db/client";
import type {
  ExpenseEntity,
  ExpenseProfile,
  ExpenseStatus,
} from "../entities/Expense";
import { toExpenseProfile } from "../entities/Expense";
import type { UserRole } from "../entities/User";
import { randomId } from "../utils/crypto";
import { HttpError } from "../utils/problemDetails";
import { AuditService } from "./AuditService";
import { LedgerService } from "./LedgerService";

export interface CreateExpenseInput {
  category: string;
  merchant: string;
  amountCents: number;
  date: string;
  currency?: string;
  receiptUrl?: string;
  idempotencyKey?: string;
}

export class ExpenseService {
  private db: Database;
  private auditService: AuditService;
  private ledgerService: LedgerService;

  constructor(db?: Database) {
    this.db = db ?? getDatabase();
    this.auditService = new AuditService(this.db);
    this.ledgerService = new LedgerService(this.db);
  }

  getExpenses(
    businessId: string,
    userId: string,
    role: UserRole,
    filters: { status?: ExpenseStatus; limit?: number; offset?: number } = {},
  ): ExpenseProfile[] {
    let sql = `
      SELECT e.*, u.full_name as creator_name
      FROM expenses e
      JOIN users u ON u.id = e.created_by
      WHERE e.business_id = ?
    `;
    const params: unknown[] = [businessId];

    // RBAC invariant: Employees may only view their own expenses
    if (role === "employee") {
      sql += " AND e.created_by = ?";
      params.push(userId);
    }

    if (filters.status) {
      sql += " AND e.status = ?";
      params.push(filters.status);
    }

    sql += " ORDER BY e.date DESC, e.created_at DESC LIMIT ? OFFSET ?";
    params.push(filters.limit ?? 50, filters.offset ?? 0);

    const rows = this.db.prepare(sql).all(...params) as unknown as Array<
      ExpenseEntity & { creator_name: string }
    >;

    return rows.map((exp) => toExpenseProfile(exp, exp.creator_name));
  }

  getExpenseById(
    businessId: string,
    userId: string,
    role: UserRole,
    expenseId: string,
  ): ExpenseProfile {
    const exp = this.db
      .prepare(`
      SELECT e.*, u.full_name as creator_name
      FROM expenses e
      JOIN users u ON u.id = e.created_by
      WHERE e.id = ? AND e.business_id = ?
    `)
      .get(expenseId, businessId) as unknown as
      | (ExpenseEntity & { creator_name: string })
      | undefined;

    if (!exp) {
      throw new HttpError(
        404,
        "Expense Not Found",
        `Expense with ID ${expenseId} was not found in this business.`,
      );
    }

    // Role boundary: Employee can only view own expense
    if (role === "employee" && exp.created_by !== userId) {
      throw new HttpError(
        403,
        "Access Denied",
        "Employees cannot view expenses submitted by other team members.",
      );
    }

    return toExpenseProfile(exp, exp.creator_name);
  }

  createExpense(
    businessId: string,
    userId: string,
    input: CreateExpenseInput,
    ipAddress?: string,
  ): ExpenseProfile {
    // Idempotency check
    if (input.idempotencyKey) {
      const existing = this.db
        .prepare(
          "SELECT id FROM expenses WHERE business_id = ? AND idempotency_key = ?",
        )
        .get(businessId, input.idempotencyKey) as { id: string } | undefined;

      if (existing) {
        return this.getExpenseById(businessId, userId, "owner", existing.id);
      }
    }

    if (!Number.isInteger(input.amountCents) || input.amountCents <= 0) {
      throw new HttpError(
        400,
        "Invalid Expense Amount",
        "Amount must be a positive integer in minor units (cents).",
      );
    }

    const expenseId = randomId("exp");
    const currency = input.currency?.trim().toUpperCase() || "USD";

    this.db
      .prepare(`
      INSERT INTO expenses (
        id, business_id, category, merchant, amount_cents, currency, date,
        receipt_url, status, created_by, idempotency_key
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
    `)
      .run(
        expenseId,
        businessId,
        input.category.trim(),
        input.merchant.trim(),
        input.amountCents,
        currency,
        input.date,
        input.receiptUrl?.trim() ?? null,
        userId,
        input.idempotencyKey ?? null,
      );

    this.auditService.logEvent({
      userId,
      businessId,
      action: "expense.created",
      resource: "expenses",
      resourceId: expenseId,
      ipAddress,
      metadata: {
        category: input.category,
        merchant: input.merchant,
        amountCents: input.amountCents,
      },
    });

    return this.getExpenseById(businessId, userId, "owner", expenseId);
  }

  approveExpense(
    businessId: string,
    reviewerId: string,
    reviewerRole: UserRole,
    expenseId: string,
    ipAddress?: string,
  ): ExpenseProfile {
    if (reviewerRole !== "owner") {
      throw new HttpError(
        403,
        "Access Denied",
        "Only business owners are authorized to approve expenses.",
      );
    }

    const expense = this.getExpenseById(
      businessId,
      reviewerId,
      reviewerRole,
      expenseId,
    );

    if (expense.status !== "pending") {
      throw new HttpError(
        400,
        "Invalid Status Transition",
        `Only pending expenses can be approved. Current status is '${expense.status}'.`,
      );
    }

    return this.db.transaction(() => {
      // Post to General Ledger for expense recognition
      // Debit: General Operating Expenses (5000)
      // Credit: Accounts Payable (2000)
      const expenseAccount = this.ledgerService.getAccountByCode(
        businessId,
        "5000",
      );
      const apAccount = this.ledgerService.getAccountByCode(businessId, "2000");

      const journalEntry = this.ledgerService.createAndPostJournalEntry(
        businessId,
        reviewerId,
        {
          entryDate: expense.date,
          description: `Expense: ${expense.merchant} (${expense.category})`,
          lines: [
            {
              accountId: expenseAccount.id,
              debitCents: expense.amountCents,
              creditCents: 0,
              description: `${expense.category} expense at ${expense.merchant}`,
            },
            {
              accountId: apAccount.id,
              debitCents: 0,
              creditCents: expense.amountCents,
              description: `AP payable for ${expense.merchant}`,
            },
          ],
        },
        ipAddress,
      );

      this.db
        .prepare(`
        UPDATE expenses
        SET status = 'approved', approved_by = ?, journal_entry_id = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND business_id = ?
      `)
        .run(reviewerId, journalEntry.id, expense.id, businessId);

      this.auditService.logEvent({
        userId: reviewerId,
        businessId,
        action: "expense.approved",
        resource: "expenses",
        resourceId: expense.id,
        ipAddress,
        metadata: {
          amountCents: expense.amountCents,
          journalEntryId: journalEntry.id,
        },
      });

      return this.getExpenseById(
        businessId,
        reviewerId,
        reviewerRole,
        expense.id,
      );
    });
  }

  rejectExpense(
    businessId: string,
    reviewerId: string,
    reviewerRole: UserRole,
    expenseId: string,
    reason?: string,
    ipAddress?: string,
  ): ExpenseProfile {
    if (reviewerRole !== "owner") {
      throw new HttpError(
        403,
        "Access Denied",
        "Only business owners are authorized to reject expenses.",
      );
    }

    const expense = this.getExpenseById(
      businessId,
      reviewerId,
      reviewerRole,
      expenseId,
    );

    if (expense.status !== "pending") {
      throw new HttpError(
        400,
        "Invalid Status Transition",
        `Only pending expenses can be rejected. Current status is '${expense.status}'.`,
      );
    }

    this.db
      .prepare(`
      UPDATE expenses
      SET status = 'rejected', approved_by = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND business_id = ?
    `)
      .run(reviewerId, expense.id, businessId);

    this.auditService.logEvent({
      userId: reviewerId,
      businessId,
      action: "expense.rejected",
      resource: "expenses",
      resourceId: expense.id,
      ipAddress,
      metadata: { reason },
    });

    return this.getExpenseById(
      businessId,
      reviewerId,
      reviewerRole,
      expense.id,
    );
  }
}
