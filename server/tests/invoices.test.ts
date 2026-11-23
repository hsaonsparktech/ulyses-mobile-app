import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { seedDatabase } from "../src/db/seed";
import { createTestApp, type TestContext } from "./helpers/testClient";

describe("Invoices API & Ledger Integration", () => {
  let ctx: TestContext;
  let ownerToken = "";
  let accountantToken = "";
  let employeeToken = "";
  const businessId = "biz_acme_services_001";
  const clientId = "cli_acme_client_001";
  let invoiceId = "";

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

  it("Owner can create a draft invoice with line items in integer cents", async () => {
    const res = await ctx.post(
      "/api/v1/invoices",
      {
        clientId,
        issueDate: "2026-11-01",
        dueDate: "2026-11-15",
        taxRateBps: 1000, // 10%
        notes: "Consulting services for November",
        idempotencyKey: "test-invoice-idemp-001",
        items: [
          {
            description: "System Architecture Review",
            quantity: 10,
            unitPriceCents: 15000, // $150.00
          },
          {
            description: "Security Hardening",
            quantity: 5,
            unitPriceCents: 20000, // $200.00
          },
        ],
      },
      {
        authorization: `Bearer ${ownerToken}`,
        "x-business-id": businessId,
      },
    );

    assert.equal(res.status, 201);
    invoiceId = res.body.id;
    assert.equal(res.body.status, "draft");
    assert.equal(res.body.clientId, clientId);
    // Subtotal: 10*15000 (150000) + 5*20000 (100000) = 250000 ($2,500.00)
    assert.equal(res.body.subtotalCents, 250000);
    // Tax: 10% of 250000 = 25000 ($250.00)
    assert.equal(res.body.taxCents, 25000);
    // Total: 275000 ($2,750.00)
    assert.equal(res.body.totalCents, 275000);
    assert.equal(res.body.amountPaidCents, 0);
    assert.equal(res.body.items.length, 2);
  });

  it("Idempotent invoice creation returns existing invoice without duplicate insert", async () => {
    const res = await ctx.post(
      "/api/v1/invoices",
      {
        clientId,
        issueDate: "2026-11-01",
        dueDate: "2026-11-15",
        taxRateBps: 1000,
        notes: "Consulting services for November",
        idempotencyKey: "test-invoice-idemp-001",
        items: [
          {
            description: "System Architecture Review",
            quantity: 10,
            unitPriceCents: 15000,
          },
          {
            description: "Security Hardening",
            quantity: 5,
            unitPriceCents: 20000,
          },
        ],
      },
      {
        authorization: `Bearer ${ownerToken}`,
        "x-business-id": businessId,
      },
    );

    assert.equal(res.status, 201);
    assert.equal(res.body.id, invoiceId);
    assert.equal(res.body.totalCents, 275000);
  });

  it("Cannot create invoice for non-existent client", async () => {
    const res = await ctx.post(
      "/api/v1/invoices",
      {
        clientId: "client_nonexistent_999",
        issueDate: "2026-11-01",
        dueDate: "2026-11-15",
        items: [{ description: "Work", quantity: 1, unitPriceCents: 5000 }],
      },
      {
        authorization: `Bearer ${ownerToken}`,
        "x-business-id": businessId,
      },
    );

    assert.equal(res.status, 404);
  });

  it("Employee cannot create an invoice (403 Forbidden)", async () => {
    const res = await ctx.post(
      "/api/v1/invoices",
      {
        clientId,
        issueDate: "2026-11-01",
        dueDate: "2026-11-15",
        items: [{ description: "Work", quantity: 1, unitPriceCents: 5000 }],
      },
      {
        authorization: `Bearer ${employeeToken}`,
        "x-business-id": businessId,
      },
    );

    assert.equal(res.status, 403);
  });

  it("Accountant cannot create an invoice (403 Forbidden)", async () => {
    const res = await ctx.post(
      "/api/v1/invoices",
      {
        clientId,
        issueDate: "2026-11-01",
        dueDate: "2026-11-15",
        items: [{ description: "Work", quantity: 1, unitPriceCents: 5000 }],
      },
      {
        authorization: `Bearer ${accountantToken}`,
        "x-business-id": businessId,
      },
    );

    assert.equal(res.status, 403);
    assert.equal(res.body.title, "Access Denied");
  });

  it("Accountant cannot send an invoice (403 Forbidden)", async () => {
    const res = await ctx.post(
      `/api/v1/invoices/${invoiceId}/send`,
      {},
      {
        authorization: `Bearer ${accountantToken}`,
        "x-business-id": businessId,
      },
    );

    assert.equal(res.status, 403);
    assert.equal(res.body.title, "Access Denied");
  });

  it("Sending an invoice posts a balanced journal entry to the General Ledger", async () => {
    const res = await ctx.post(
      `/api/v1/invoices/${invoiceId}/send`,
      {},
      {
        authorization: `Bearer ${ownerToken}`,
        "x-business-id": businessId,
      },
    );

    assert.equal(res.status, 200);
    assert.equal(res.body.status, "sent");

    // Verify journal entry in the General Ledger
    const ledgerRes = await ctx.get("/api/v1/ledger/entries", {
      authorization: `Bearer ${ownerToken}`,
      "x-business-id": businessId,
    });

    assert.equal(ledgerRes.status, 200);
    const invoiceEntry = ledgerRes.body.find((e: any) =>
      e.description.includes(res.body.invoiceNumber),
    );
    assert.ok(invoiceEntry, "Ledger entry for sent invoice must exist");

    // Accounts Receivable debit = 275000, Revenue/Sales credit = 250000, Tax credit = 25000
    const arLine = invoiceEntry.lines.find(
      (l: any) => l.accountCode === "1100",
    );
    const revLine = invoiceEntry.lines.find(
      (l: any) => l.accountCode === "4000",
    );
    const taxLine = invoiceEntry.lines.find(
      (l: any) => l.accountCode === "2100",
    );
    assert.ok(arLine && revLine && taxLine);
    assert.equal(arLine.debitCents, 275000);
    assert.equal(arLine.creditCents, 0);
    assert.equal(revLine.creditCents, 250000);
    assert.equal(revLine.debitCents, 0);
    assert.equal(taxLine.creditCents, 25000);
    assert.equal(taxLine.debitCents, 0);
  });

  it("Accountant cannot record payments on an invoice (403 Forbidden)", async () => {
    const res = await ctx.post(
      `/api/v1/invoices/${invoiceId}/payments`,
      {
        amountCents: 100000,
        paymentDate: "2026-11-05",
      },
      {
        authorization: `Bearer ${accountantToken}`,
        "x-business-id": businessId,
      },
    );

    assert.equal(res.status, 403);
    assert.equal(res.body.title, "Access Denied");
  });

  it("Recording a partial payment updates invoice and posts AR credit to ledger", async () => {
    const res = await ctx.post(
      `/api/v1/invoices/${invoiceId}/payments`,
      {
        amountCents: 100000, // $1,000.00
        paymentDate: "2026-11-05",
        paymentMethod: "BANK_TRANSFER",
        reference: "TXN-WIRE-9921",
        notes: "First installment",
      },
      {
        authorization: `Bearer ${ownerToken}`,
        "x-business-id": businessId,
      },
    );

    assert.equal(res.status, 200);
    assert.equal(res.body.status, "partially_paid");
    assert.equal(res.body.amountPaidCents, 100000);

    // Verify cash received in ledger
    const ledgerRes = await ctx.get("/api/v1/ledger/entries", {
      authorization: `Bearer ${ownerToken}`,
      "x-business-id": businessId,
    });

    const paymentEntry = ledgerRes.body.find((e: any) =>
      e.description.includes("Payment for Invoice"),
    );
    assert.ok(paymentEntry);
    const cashLine = paymentEntry.lines.find(
      (l: any) => l.accountCode === "1000",
    );
    const arLine = paymentEntry.lines.find(
      (l: any) => l.accountCode === "1100",
    );
    assert.equal(cashLine.debitCents, 100000);
    assert.equal(arLine.creditCents, 100000);
  });

  it("Overpayment is rejected with 400 Bad Request", async () => {
    // Remaining balance is 275000 - 100000 = 175000
    // Attempting to pay 200000 must fail
    const res = await ctx.post(
      `/api/v1/invoices/${invoiceId}/payments`,
      {
        amountCents: 200000,
        paymentDate: "2026-11-06",
        paymentMethod: "CHECK",
      },
      {
        authorization: `Bearer ${ownerToken}`,
        "x-business-id": businessId,
      },
    );

    assert.equal(res.status, 400);
  });

  it("Paying remaining balance transitions invoice to PAID", async () => {
    const res = await ctx.post(
      `/api/v1/invoices/${invoiceId}/payments`,
      {
        amountCents: 175000,
        paymentDate: "2026-11-10",
        paymentMethod: "BANK_TRANSFER",
      },
      {
        authorization: `Bearer ${ownerToken}`,
        "x-business-id": businessId,
      },
    );

    assert.equal(res.status, 200);
    assert.equal(res.body.status, "paid");
    assert.equal(res.body.amountPaidCents, 275000);
  });

  it("Cross-tenant intrusion: User from another business cannot access this invoice", async () => {
    // Register and verify a second tenant
    const reg2 = await ctx.post("/api/v1/auth/register", {
      email: "tenant2.owner@other.com",
      password: "Password123!",
      fullName: "Other Owner",
      termsAccepted: true,
    });
    await ctx.post("/api/v1/auth/verify-email", {
      email: "tenant2.owner@other.com",
      code: reg2.body.previewCode,
    });
    const login2 = await ctx.post("/api/v1/auth/sign-in", {
      email: "tenant2.owner@other.com",
      password: "Password123!",
    });
    const user2Token = login2.body.accessToken;

    const biz2 = await ctx.post(
      "/api/v1/businesses",
      { businessName: "Other Corp", businessType: "Logistics" },
      { authorization: `Bearer ${user2Token}` },
    );
    const biz2Id = biz2.body.business.id;

    const res = await ctx.get(`/api/v1/invoices/${invoiceId}`, {
      authorization: `Bearer ${user2Token}`,
      "x-business-id": biz2Id,
    });

    assert.equal(res.status, 404);
    assert.equal(res.body.title, "Invoice Not Found");
  });
});
