import type { Database } from "../db/client";
import { getDatabase } from "../db/client";
import type {
  AccountEntity,
  AccountProfile,
  AccountType,
} from "../entities/Account";
import { toAccountProfile } from "../entities/Account";
import type {
  JournalEntryEntity,
  JournalEntryLineEntity,
  JournalEntryProfile,
} from "../entities/JournalEntry";
import { randomId } from "../utils/crypto";
import { HttpError } from "../utils/problemDetails";
import { AuditService } from "./AuditService";

export interface CreateJournalLineInput {
  accountId: string;
  debitCents: number;
  creditCents: number;
  description?: string;
}

export interface CreateJournalEntryInput {
  entryDate: string;
  description: string;
  lines: CreateJournalLineInput[];
}

const DEFAULT_ACCOUNTS: Array<{
  code: string;
  name: string;
  type: AccountType;
}> = [
  { code: "1000", name: "Operating Bank Account", type: "asset" },
  { code: "1100", name: "Accounts Receivable", type: "asset" },
  { code: "2000", name: "Accounts Payable", type: "liability" },
  { code: "2100", name: "Sales Tax Payable", type: "liability" },
  { code: "3000", name: "Owner's Equity", type: "equity" },
  { code: "3100", name: "Retained Earnings", type: "equity" },
  { code: "4000", name: "Service Revenue", type: "revenue" },
  { code: "4100", name: "Product Sales", type: "revenue" },
  { code: "5000", name: "General Operating Expenses", type: "expense" },
  { code: "5100", name: "Advertising & Marketing", type: "expense" },
  { code: "5200", name: "Software & Subscriptions", type: "expense" },
  { code: "5300", name: "Travel & Entertainment", type: "expense" },
];

export class LedgerService {
  private db: Database;
  private auditService: AuditService;

  constructor(db?: Database) {
    this.db = db ?? getDatabase();
    this.auditService = new AuditService(this.db);
  }

  ensureDefaultAccounts(businessId: string): void {
    const existing = this.db
      .prepare("SELECT COUNT(*) as cnt FROM accounts WHERE business_id = ?")
      .get(businessId) as { cnt: number } | undefined;

    if (existing && existing.cnt > 0) return;

    this.db.transaction(() => {
      const stmt = this.db.prepare(`
        INSERT OR IGNORE INTO accounts (id, business_id, code, name, type, currency, status)
        VALUES (?, ?, ?, ?, ?, 'USD', 'active')
      `);

      for (const acc of DEFAULT_ACCOUNTS) {
        stmt.run(randomId("acc"), businessId, acc.code, acc.name, acc.type);
      }
    });
  }

  getAccounts(businessId: string): AccountProfile[] {
    this.ensureDefaultAccounts(businessId);

    const accounts = this.db
      .prepare(
        "SELECT * FROM accounts WHERE business_id = ? AND status = 'active' ORDER BY code ASC",
      )
      .all(businessId) as unknown as AccountEntity[];

    const balances = this.getAccountBalances(businessId);
    const balanceMap = new Map<string, number>(
      balances.map((b) => [b.id, b.balanceCents]),
    );

    return accounts.map((acc) =>
      toAccountProfile(acc, balanceMap.get(acc.id) ?? 0),
    );
  }

  getAccountByCode(businessId: string, code: string): AccountEntity {
    this.ensureDefaultAccounts(businessId);
    const account = this.db
      .prepare("SELECT * FROM accounts WHERE business_id = ? AND code = ?")
      .get(businessId, code) as unknown as AccountEntity | undefined;

    if (!account) {
      throw new HttpError(
        404,
        "Account Not Found",
        `Account code ${code} not found for this business.`,
      );
    }
    return account;
  }

  getAccountBalances(
    businessId: string,
  ): Array<{ id: string; code: string; name: string; balanceCents: number }> {
    const accounts = this.db
      .prepare(
        "SELECT id, code, name, type FROM accounts WHERE business_id = ?",
      )
      .all(businessId) as unknown as Array<{
      id: string;
      code: string;
      name: string;
      type: AccountType;
    }>;

    // Sum debits and credits from posted journal entries only
    const totals = this.db
      .prepare(`
      SELECT 
        l.account_id,
        COALESCE(SUM(l.debit_cents), 0) as total_debit,
        COALESCE(SUM(l.credit_cents), 0) as total_credit
      FROM journal_entry_lines l
      JOIN journal_entries e ON e.id = l.journal_entry_id
      WHERE e.business_id = ? AND e.status = 'posted'
      GROUP BY l.account_id
    `)
      .all(businessId) as unknown as Array<{
      account_id: string;
      total_debit: number;
      total_credit: number;
    }>;

    const totalsMap = new Map<
      string,
      { total_debit: number; total_credit: number }
    >();
    for (const t of totals) {
      totalsMap.set(t.account_id, t);
    }

    return accounts.map((acc) => {
      const t = totalsMap.get(acc.id) ?? { total_debit: 0, total_credit: 0 };
      let balanceCents = 0;
      if (acc.type === "asset" || acc.type === "expense") {
        balanceCents = t.total_debit - t.total_credit;
      } else {
        balanceCents = t.total_credit - t.total_debit;
      }
      return {
        id: acc.id,
        code: acc.code,
        name: acc.name,
        balanceCents,
      };
    });
  }

  createAndPostJournalEntry(
    businessId: string,
    userId: string,
    input: CreateJournalEntryInput,
    ipAddress?: string,
  ): JournalEntryProfile {
    this.ensureDefaultAccounts(businessId);

    // 1. Validation invariants
    if (!input.lines || input.lines.length < 2) {
      throw new HttpError(
        400,
        "Invalid Journal Entry",
        "A journal entry must contain at least two balanced lines.",
      );
    }

    let totalDebit = 0;
    let totalCredit = 0;

    for (const line of input.lines) {
      if (!Number.isInteger(line.debitCents) || line.debitCents < 0) {
        throw new HttpError(
          400,
          "Invalid Debit Amount",
          "Debit must be a non-negative integer in minor units (cents).",
        );
      }
      if (!Number.isInteger(line.creditCents) || line.creditCents < 0) {
        throw new HttpError(
          400,
          "Invalid Credit Amount",
          "Credit must be a non-negative integer in minor units (cents).",
        );
      }
      if (
        (line.debitCents > 0 && line.creditCents > 0) ||
        (line.debitCents === 0 && line.creditCents === 0)
      ) {
        throw new HttpError(
          400,
          "Invalid Line Amount",
          "Each line must have either a positive debit OR a positive credit, not both or zero.",
        );
      }

      totalDebit += line.debitCents;
      totalCredit += line.creditCents;

      // Validate account tenant isolation at service layer
      const account = this.db
        .prepare(
          "SELECT id, business_id FROM accounts WHERE id = ? AND business_id = ?",
        )
        .get(line.accountId, businessId) as
        | { id: string; business_id: string }
        | undefined;

      if (!account) {
        throw new HttpError(
          403,
          "Forbidden Account Reference",
          `Account ${line.accountId} does not exist or does not belong to this business.`,
        );
      }
    }

    // Accounting invariant: Double-entry debits must equal credits
    if (totalDebit !== totalCredit) {
      throw new HttpError(
        400,
        "Unbalanced Journal Entry",
        `Total debits (${totalDebit}) must strictly equal total credits (${totalCredit}).`,
      );
    }

    const entryId = randomId("je");

    return this.db.transaction(() => {
      // Determine next entry_number for this business
      const maxRow = this.db
        .prepare(
          "SELECT COALESCE(MAX(entry_number), 0) + 1 as next_num FROM journal_entries WHERE business_id = ?",
        )
        .get(businessId) as { next_num: number };

      const entryNumber = maxRow.next_num;
      const now = new Date().toISOString();

      this.db
        .prepare(`
        INSERT INTO journal_entries (id, business_id, entry_number, entry_date, description, status, created_by, posted_at, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 'posted', ?, ?, ?, ?)
      `)
        .run(
          entryId,
          businessId,
          entryNumber,
          input.entryDate,
          input.description.trim(),
          userId,
          now,
          now,
          now,
        );

      const insertLine = this.db.prepare(`
        INSERT INTO journal_entry_lines (id, journal_entry_id, account_id, debit_cents, credit_cents, description)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      for (const line of input.lines) {
        insertLine.run(
          randomId("jel"),
          entryId,
          line.accountId,
          line.debitCents,
          line.creditCents,
          line.description?.trim() ?? null,
        );
      }

      this.auditService.logEvent({
        userId,
        businessId,
        action: "ledger.journal_entry_posted",
        resource: "journal_entries",
        resourceId: entryId,
        ipAddress,
        metadata: {
          entryNumber,
          totalDebit,
          totalCredit,
          description: input.description,
        },
      });

      return this.getJournalEntryById(businessId, entryId);
    });
  }

  getJournalEntries(
    businessId: string,
    filters: { status?: string; limit?: number; offset?: number } = {},
  ): JournalEntryProfile[] {
    let sql = "SELECT * FROM journal_entries WHERE business_id = ?";
    const params: unknown[] = [businessId];

    if (filters.status) {
      sql += " AND status = ?";
      params.push(filters.status);
    }

    sql += " ORDER BY entry_number DESC LIMIT ? OFFSET ?";
    params.push(filters.limit ?? 50, filters.offset ?? 0);

    const rows = this.db
      .prepare(sql)
      .all(...params) as unknown as JournalEntryEntity[];

    return rows.map((r) => this.hydrateJournalEntry(r));
  }

  getJournalEntryById(
    businessId: string,
    entryId: string,
  ): JournalEntryProfile {
    const entry = this.db
      .prepare("SELECT * FROM journal_entries WHERE id = ? AND business_id = ?")
      .get(entryId, businessId) as unknown as JournalEntryEntity | undefined;

    if (!entry) {
      throw new HttpError(
        404,
        "Journal Entry Not Found",
        `Journal entry ${entryId} does not exist in this business.`,
      );
    }

    return this.hydrateJournalEntry(entry);
  }

  reverseJournalEntry(
    businessId: string,
    userId: string,
    entryId: string,
    reason: string,
    ipAddress?: string,
  ): {
    originalEntry: JournalEntryProfile;
    reversalEntry: JournalEntryProfile;
  } {
    const original = this.getJournalEntryById(businessId, entryId);

    if (original.status !== "posted") {
      throw new HttpError(
        400,
        "Invalid Reversal",
        `Cannot reverse an entry with status '${original.status}'. Only posted entries can be reversed.`,
      );
    }

    if (original.reversedById) {
      throw new HttpError(
        400,
        "Already Reversed",
        `Journal entry ${original.entryNumber} has already been reversed by entry ${original.reversedById}.`,
      );
    }

    // Invert debits and credits for reversing entry
    const reversalLines: CreateJournalLineInput[] = original.lines.map((l) => ({
      accountId: l.accountId,
      debitCents: l.creditCents, // Swap debit and credit
      creditCents: l.debitCents,
      description:
        `Reversal of JE #${original.entryNumber}: ${l.description || ""}`.trim(),
    }));

    return this.db.transaction(() => {
      const reversal = this.createAndPostJournalEntry(
        businessId,
        userId,
        {
          entryDate: new Date().toISOString().split("T")[0] ?? "1970-01-01",
          description: `Reversal of JE #${original.entryNumber} (${reason.trim()})`,
          lines: reversalLines,
        },
        ipAddress,
      );

      // Link reversal entry to original entry
      this.db
        .prepare(`
        UPDATE journal_entries
        SET reversed_by_id = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND business_id = ?
      `)
        .run(reversal.id, original.id, businessId);

      this.auditService.logEvent({
        userId,
        businessId,
        action: "ledger.journal_entry_reversed",
        resource: "journal_entries",
        resourceId: original.id,
        ipAddress,
        metadata: {
          originalEntryNumber: original.entryNumber,
          reversalEntryId: reversal.id,
          reversalEntryNumber: reversal.entryNumber,
          reason,
        },
      });

      const updatedOriginal = this.getJournalEntryById(businessId, original.id);
      return {
        originalEntry: updatedOriginal,
        reversalEntry: reversal,
      };
    });
  }

  private hydrateJournalEntry(entry: JournalEntryEntity): JournalEntryProfile {
    const lines = this.db
      .prepare(`
      SELECT l.*, a.code as account_code, a.name as account_name
      FROM journal_entry_lines l
      JOIN accounts a ON a.id = l.account_id
      WHERE l.journal_entry_id = ?
      ORDER BY l.debit_cents DESC, l.credit_cents DESC
    `)
      .all(entry.id) as unknown as Array<
      JournalEntryLineEntity & {
        account_code: string;
        account_name: string;
      }
    >;

    let totalDebitCents = 0;
    let totalCreditCents = 0;

    const mappedLines = lines.map((l) => {
      totalDebitCents += l.debit_cents;
      totalCreditCents += l.credit_cents;
      return {
        id: l.id,
        accountId: l.account_id,
        accountCode: l.account_code,
        accountName: l.account_name,
        debitCents: l.debit_cents,
        creditCents: l.credit_cents,
        description: l.description,
      };
    });

    return {
      id: entry.id,
      businessId: entry.business_id,
      entryNumber: entry.entry_number,
      entryDate: entry.entry_date,
      description: entry.description,
      status: entry.status,
      createdBy: entry.created_by,
      postedAt: entry.posted_at,
      reversedById: entry.reversed_by_id,
      lines: mappedLines,
      totalDebitCents,
      totalCreditCents,
    };
  }
}
