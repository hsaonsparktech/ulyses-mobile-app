import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { seedDatabase } from "../src/db/seed";
import { createTestApp, type TestContext } from "./helpers/testClient";

describe("Expenses API & Role-Based Approval Workflow", () => {
  let ctx: TestContext;
  let ownerToken = "";
  let accountantToken = "";
  let employeeToken = "";
  const businessId = "biz_acme_services_001";
  let empExpenseId = "";
  let ownerExpenseId = "";

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

  it("Employee can submit an expense in integer cents", async () => {
    const res = await ctx.post(
      "/api/v1/expenses",
      {
        category: "Travel & Meals",
        merchant: "Delta Airlines",
        amountCents: 14250, // $142.50
        date: "2026-11-03",
        currency: "USD",
        receiptUrl: "https://receipts.libros.io/rec_delta_9912.pdf",
        idempotencyKey: "test-emp-expense-001",
      },
      {
        authorization: `Bearer ${employeeToken}`,
        "x-business-id": businessId,
      },
    );

    assert.equal(res.status, 201);
    empExpenseId = res.body.id;
    assert.equal(res.body.merchant, "Delta Airlines");
    assert.equal(res.body.amountCents, 14250);
    assert.equal(res.body.status, "pending");
    assert.equal(res.body.currency, "USD");
    assert.ok(res.body.createdBy);
  });

  it("Owner can submit an expense", async () => {
    const res = await ctx.post(
      "/api/v1/expenses",
      {
        category: "Software",
        merchant: "Amazon Web Services",
        amountCents: 50000, // $500.00
        date: "2026-11-04",
      },
      {
        authorization: `Bearer ${ownerToken}`,
        "x-business-id": businessId,
      },
    );

    assert.equal(res.status, 201);
    ownerExpenseId = res.body.id;
    assert.equal(res.body.merchant, "Amazon Web Services");
    assert.equal(res.body.status, "pending");
  });

  it("Employee role scoping: Employee can ONLY view their own expenses", async () => {
    const res = await ctx.get("/api/v1/expenses", {
      authorization: `Bearer ${employeeToken}`,
      "x-business-id": businessId,
    });

    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body));
    // Must find their own expense
    const empExpense = res.body.find((e: any) => e.id === empExpenseId);
    assert.ok(empExpense);
    // Must NOT see owner's expense
    const ownerExpense = res.body.find((e: any) => e.id === ownerExpenseId);
    assert.equal(ownerExpense, undefined);
  });

  it("Owner and Accountant can view all submitted expenses across the business", async () => {
    const res = await ctx.get("/api/v1/expenses", {
      authorization: `Bearer ${accountantToken}`,
      "x-business-id": businessId,
    });

    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body));
    const empExpense = res.body.find((e: any) => e.id === empExpenseId);
    const ownerExpense = res.body.find((e: any) => e.id === ownerExpenseId);
    assert.ok(empExpense, "Accountant must see employee expense");
    assert.ok(ownerExpense, "Accountant must see owner expense");
  });

  it("Employee cannot approve an expense (403 Forbidden)", async () => {
    const res = await ctx.post(
      `/api/v1/expenses/${empExpenseId}/approve`,
      {},
      {
        authorization: `Bearer ${employeeToken}`,
        "x-business-id": businessId,
      },
    );

    assert.equal(res.status, 403);
  });

  it("Accountant cannot approve an expense (403 Forbidden)", async () => {
    const res = await ctx.post(
      `/api/v1/expenses/${empExpenseId}/approve`,
      {},
      {
        authorization: `Bearer ${accountantToken}`,
        "x-business-id": businessId,
      },
    );

    assert.equal(res.status, 403);
    assert.equal(res.body.title, "Access Denied");
  });

  it("Accountant cannot reject an expense (403 Forbidden)", async () => {
    const res = await ctx.post(
      `/api/v1/expenses/${empExpenseId}/reject`,
      { reason: "Accountant audit question" },
      {
        authorization: `Bearer ${accountantToken}`,
        "x-business-id": businessId,
      },
    );

    assert.equal(res.status, 403);
    assert.equal(res.body.title, "Access Denied");
  });

  it("Owner can approve employee expense and post to General Ledger", async () => {
    const res = await ctx.post(
      `/api/v1/expenses/${empExpenseId}/approve`,
      {},
      {
        authorization: `Bearer ${ownerToken}`,
        "x-business-id": businessId,
      },
    );

    assert.equal(res.status, 200);
    assert.equal(res.body.status, "approved");
    assert.ok(res.body.journalEntryId);

    // Verify journal entry in the General Ledger (auditable by Accountant)
    const ledgerRes = await ctx.get("/api/v1/ledger/entries", {
      authorization: `Bearer ${accountantToken}`,
      "x-business-id": businessId,
    });

    assert.equal(ledgerRes.status, 200);
    const expenseEntry = ledgerRes.body.find(
      (e: any) => e.id === res.body.journalEntryId,
    );
    assert.ok(expenseEntry, "Ledger entry must exist for approved expense");

    // General Operating Expenses (5000) debit = 14250, Accounts Payable (2000) credit = 14250
    const expLine = expenseEntry.lines.find(
      (l: any) => l.accountCode === "5000",
    );
    const apLine = expenseEntry.lines.find(
      (l: any) => l.accountCode === "2000",
    );
    assert.ok(expLine && apLine);
    assert.equal(expLine.debitCents, 14250);
    assert.equal(expLine.creditCents, 0);
    assert.equal(apLine.creditCents, 14250);
    assert.equal(apLine.debitCents, 0);
  });

  it("Owner can reject an expense with a reason", async () => {
    const res = await ctx.post(
      `/api/v1/expenses/${ownerExpenseId}/reject`,
      { reason: "Duplicate subscription charge" },
      {
        authorization: `Bearer ${ownerToken}`,
        "x-business-id": businessId,
      },
    );

    assert.equal(res.status, 200);
    assert.equal(res.body.status, "rejected");
  });

  it("Cross-tenant intrusion: User from another business cannot access or approve this expense", async () => {
    const reg2 = await ctx.post("/api/v1/auth/register", {
      email: "expense.intruder@corp.com",
      password: "Password123!",
      fullName: "Expense Intruder",
      termsAccepted: true,
    });
    await ctx.post("/api/v1/auth/verify-email", {
      email: "expense.intruder@corp.com",
      code: reg2.body.previewCode,
    });
    const login2 = await ctx.post("/api/v1/auth/sign-in", {
      email: "expense.intruder@corp.com",
      password: "Password123!",
    });
    const user2Token = login2.body.accessToken;

    const biz2 = await ctx.post(
      "/api/v1/businesses",
      { businessName: "Other Expense Corp", businessType: "Retail" },
      { authorization: `Bearer ${user2Token}` },
    );
    const biz2Id = biz2.body.business.id;

    const res = await ctx.get(`/api/v1/expenses/${empExpenseId}`, {
      authorization: `Bearer ${user2Token}`,
      "x-business-id": biz2Id,
    });
    assert.equal(res.status, 404);

    const approveRes = await ctx.post(
      `/api/v1/expenses/${empExpenseId}/approve`,
      {},
      {
        authorization: `Bearer ${user2Token}`,
        "x-business-id": biz2Id,
      },
    );
    assert.equal(approveRes.status, 404);
  });
});
