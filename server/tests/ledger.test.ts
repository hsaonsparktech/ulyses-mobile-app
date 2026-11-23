import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { seedDatabase } from "../src/db/seed";
import { createTestApp, type TestContext } from "./helpers/testClient";

describe("General Ledger & Double-Entry Accounting Invariants", () => {
  let ctx: TestContext;
  let ownerToken = "";
  let accountantToken = "";
  let employeeToken = "";
  const businessId = "biz_acme_services_001";
  let bankAccountId = "";
  let equityAccountId = "";
  let postedEntryId = "";

  before(async () => {
    ctx = await createTestApp();
    seedDatabase(ctx.db);

    const ownerLogin = await ctx.post("/api/v1/auth/sign-in", {
      email: "owner@acmeservices.com",
      password: "OwnerPassword123!",
    });
    ownerToken = ownerLogin.body.accessToken;

    const accLogin = await ctx.post("/api/v1/auth/sign-in", {
      email: "accountant@cpa-firm.com",
      password: "AccountantPassword123!",
    });
    accountantToken = accLogin.body.accessToken;

    const empLogin = await ctx.post("/api/v1/auth/sign-in", {
      email: "employee@acmeservices.com",
      password: "EmployeePassword123!",
    });
    employeeToken = empLogin.body.accessToken;
  });

  after(async () => {
    await ctx.close();
  });

  it("Owner and Accountant can list default Chart of Accounts with calculated balances", async () => {
    const ownerRes = await ctx.get("/api/v1/ledger/accounts", {
      authorization: `Bearer ${ownerToken}`,
      "x-business-id": businessId,
    });
    assert.equal(ownerRes.status, 200);

    const res = await ctx.get("/api/v1/ledger/accounts", {
      authorization: `Bearer ${accountantToken}`,
      "x-business-id": businessId,
    });

    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body));
    assert.ok(
      res.body.length >= 7,
      "Expected at least 7 default seeded accounts",
    );

    const bankAcc = res.body.find((a: any) => a.code === "1000");
    const equityAcc = res.body.find((a: any) => a.code === "3000");

    assert.ok(bankAcc, "Operating Bank Account (1000) must exist");
    assert.ok(equityAcc, "Owner's Equity Account (3000) must exist");
    assert.equal(bankAcc.type, "asset");
    assert.equal(equityAcc.type, "equity");

    bankAccountId = bankAcc.id;
    equityAccountId = equityAcc.id;
  });

  it("Employee cannot access Chart of Accounts (403 Forbidden)", async () => {
    const res = await ctx.get("/api/v1/ledger/accounts", {
      authorization: `Bearer ${employeeToken}`,
      "x-business-id": businessId,
    });

    assert.equal(res.status, 403);
  });

  it("Employee cannot post journal entries (403 Forbidden)", async () => {
    const res = await ctx.post(
      "/api/v1/ledger/entries",
      {
        entryDate: "2026-11-01",
        description: "Unauthorized capital contribution",
        lines: [
          { accountId: bankAccountId, debitCents: 100000, creditCents: 0 },
          { accountId: equityAccountId, debitCents: 0, creditCents: 100000 },
        ],
      },
      {
        authorization: `Bearer ${employeeToken}`,
        "x-business-id": businessId,
      },
    );

    assert.equal(res.status, 403);
  });

  it("Unbalanced journal entry is rejected with 400 Bad Request", async () => {
    // Attempting to post debit 1,000,000 cents ($10,000) vs credit 500,000 cents ($5,000)
    const res = await ctx.post(
      "/api/v1/ledger/entries",
      {
        entryDate: "2026-11-01",
        description: "Unbalanced capital contribution attempt",
        lines: [
          { accountId: bankAccountId, debitCents: 1000000, creditCents: 0 },
          { accountId: equityAccountId, debitCents: 0, creditCents: 500000 },
        ],
      },
      {
        authorization: `Bearer ${ownerToken}`,
        "x-business-id": businessId,
      },
    );

    assert.equal(res.status, 400);
    assert.equal(res.body.title, "Unbalanced Journal Entry");
  });

  it("Journal entry with fewer than 2 lines is rejected with 400 Bad Request", async () => {
    const res = await ctx.post(
      "/api/v1/ledger/entries",
      {
        entryDate: "2026-11-01",
        description: "Single-sided entry attempt",
        lines: [
          { accountId: bankAccountId, debitCents: 1000000, creditCents: 0 },
        ],
      },
      {
        authorization: `Bearer ${ownerToken}`,
        "x-business-id": businessId,
      },
    );

    assert.equal(res.status, 400);
  });

  it("Accountant cannot post manual journal entries (403 Forbidden)", async () => {
    const res = await ctx.post(
      "/api/v1/ledger/entries",
      {
        entryDate: "2026-11-01",
        description: "Accountant manual entry attempt",
        lines: [
          { accountId: bankAccountId, debitCents: 100000, creditCents: 0 },
          { accountId: equityAccountId, debitCents: 0, creditCents: 100000 },
        ],
      },
      {
        authorization: `Bearer ${accountantToken}`,
        "x-business-id": businessId,
      },
    );

    assert.equal(res.status, 403);
    assert.equal(res.body.title, "Access Denied");
  });

  it("Owner can post a strictly balanced journal entry", async () => {
    // $10,000.00 capital contribution: Debit Cash (1000) $10,000, Credit Equity (3000) $10,000
    const res = await ctx.post(
      "/api/v1/ledger/entries",
      {
        entryDate: "2026-11-01",
        description: "Owner Initial Capital Contribution",
        lines: [
          {
            accountId: bankAccountId,
            debitCents: 1000000,
            creditCents: 0,
            description: "Cash injected to bank",
          },
          {
            accountId: equityAccountId,
            debitCents: 0,
            creditCents: 1000000,
            description: "Owner initial capital",
          },
        ],
      },
      {
        authorization: `Bearer ${ownerToken}`,
        "x-business-id": businessId,
      },
    );

    assert.equal(res.status, 201);
    assert.equal(res.body.status, "posted");
    assert.equal(res.body.entryNumber, 1);
    assert.equal(res.body.lines.length, 2);
    postedEntryId = res.body.id;

    // Verify account balance updates (auditable by Accountant)
    const accountsRes = await ctx.get("/api/v1/ledger/accounts", {
      authorization: `Bearer ${accountantToken}`,
      "x-business-id": businessId,
    });
    const bank = accountsRes.body.find((a: any) => a.id === bankAccountId);
    const equity = accountsRes.body.find((a: any) => a.id === equityAccountId);

    // Normal balance for asset (1000) is debit - credit: +1000000
    assert.equal(bank.balanceCents, 1000000);
    // Normal balance for equity (3000) is credit - debit: +1000000
    assert.equal(equity.balanceCents, 1000000);
  });

  it("Accountant cannot reverse journal entries (403 Forbidden)", async () => {
    const res = await ctx.post(
      `/api/v1/ledger/entries/${postedEntryId}/reverse`,
      { reason: "Accountant attempted reversal" },
      {
        authorization: `Bearer ${accountantToken}`,
        "x-business-id": businessId,
      },
    );

    assert.equal(res.status, 403);
    assert.equal(res.body.title, "Access Denied");
  });

  it("Reversal workflow: Reversing entry posts compensating inverted lines and resets balances", async () => {
    const res = await ctx.post(
      `/api/v1/ledger/entries/${postedEntryId}/reverse`,
      { reason: "Capital contributed to separate personal entity by mistake" },
      {
        authorization: `Bearer ${ownerToken}`,
        "x-business-id": businessId,
      },
    );

    assert.equal(res.status, 200);
    assert.equal(res.body.reversalEntry.status, "posted");
    assert.equal(res.body.originalEntry.status, "posted");
    assert.equal(
      res.body.originalEntry.reversedById,
      res.body.reversalEntry.id,
    );
    assert.ok(res.body.reversalEntry.description.includes("Reversal of JE #1"));

    // Verify reversal entry lines are inverted:
    // Cash credit = 1000000, Equity debit = 1000000
    const cashLine = res.body.reversalEntry.lines.find(
      (l: any) => l.accountId === bankAccountId,
    );
    const equityLine = res.body.reversalEntry.lines.find(
      (l: any) => l.accountId === equityAccountId,
    );
    assert.equal(cashLine.creditCents, 1000000);
    assert.equal(cashLine.debitCents, 0);
    assert.equal(equityLine.debitCents, 1000000);
    assert.equal(equityLine.creditCents, 0);

    // Verify account balances returned to 0
    const accountsRes = await ctx.get("/api/v1/ledger/accounts", {
      authorization: `Bearer ${accountantToken}`,
      "x-business-id": businessId,
    });
    const bank = accountsRes.body.find((a: any) => a.id === bankAccountId);
    const equity = accountsRes.body.find((a: any) => a.id === equityAccountId);
    assert.equal(bank.balanceCents, 0);
    assert.equal(equity.balanceCents, 0);
  });

  it("Cross-tenant intrusion: User from another business cannot access ledger entries", async () => {
    const reg2 = await ctx.post("/api/v1/auth/register", {
      email: "ledger.intruder@corp.com",
      password: "Password123!",
      fullName: "Ledger Intruder",
      termsAccepted: true,
    });
    await ctx.post("/api/v1/auth/verify-email", {
      email: "ledger.intruder@corp.com",
      code: reg2.body.previewCode,
    });
    const login2 = await ctx.post("/api/v1/auth/sign-in", {
      email: "ledger.intruder@corp.com",
      password: "Password123!",
    });
    const user2Token = login2.body.accessToken;

    const biz2 = await ctx.post(
      "/api/v1/businesses",
      { businessName: "Other Ledger Corp", businessType: "Fintech" },
      { authorization: `Bearer ${user2Token}` },
    );
    const biz2Id = biz2.body.business.id;

    // Tenant 2 attempts to reverse Tenant 1's journal entry
    const resReverse = await ctx.post(
      `/api/v1/ledger/entries/${postedEntryId}/reverse`,
      { reason: "Malicious reversal attempt" },
      {
        authorization: `Bearer ${user2Token}`,
        "x-business-id": biz2Id,
      },
    );
    assert.equal(resReverse.status, 404);
  });
});
