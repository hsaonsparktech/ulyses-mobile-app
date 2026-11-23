import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { seedDatabase } from "../src/db/seed";
import { createTestApp, type TestContext } from "./helpers/testClient";

describe("Financial Mutation Idempotency & Conflict Guard", () => {
  let ctx: TestContext;
  let ownerToken = "";
  let employeeToken = "";
  let secondBizToken = "";
  const businessId = "biz_acme_services_001";
  let clientId = "";
  let testInvoiceId = "";

  before(async () => {
    ctx = await createTestApp();
    seedDatabase(ctx.db);

    const ownerLogin = await ctx.post("/api/v1/auth/sign-in", {
      email: "owner@acmeservices.com",
      password: "OwnerPassword123!",
    });
    ownerToken = ownerLogin.body.accessToken;

    const empLogin = await ctx.post("/api/v1/auth/sign-in", {
      email: "employee@acmeservices.com",
      password: "EmployeePassword123!",
    });
    employeeToken = empLogin.body.accessToken;

    // Create client to invoice
    const clientRes = await ctx.post(
      "/api/v1/clients",
      {
        name: "Omni Consumer Products",
        email: "billing@ocp.corp",
      },
      {
        authorization: `Bearer ${ownerToken}`,
        "x-business-id": businessId,
      },
    );
    clientId = clientRes.body.id;

    // Create second tenant for cross-tenant idempotency test
    const reg2 = await ctx.post("/api/v1/auth/register", {
      email: "tenant2.idemp@beta.com",
      password: "Password123!",
      fullName: "Beta Idemp",
      termsAccepted: true,
    });
    await ctx.post("/api/v1/auth/verify-email", {
      email: "tenant2.idemp@beta.com",
      code: reg2.body.previewCode,
    });
    const login2 = await ctx.post("/api/v1/auth/sign-in", {
      email: "tenant2.idemp@beta.com",
      password: "Password123!",
    });
    secondBizToken = login2.body.accessToken;
    await ctx.post(
      "/api/v1/businesses",
      {
        businessName: "Beta Idemp Corp",
        businessType: "Consulting",
        currency: "USD",
      },
      { authorization: `Bearer ${secondBizToken}` },
    );
  });

  after(async () => {
    await ctx.close();
  });

  it("First request with Idempotency-Key creates the invoice and stores key", async () => {
    const key = "idemp-inv-first-001";
    const res = await ctx.post(
      "/api/v1/invoices",
      {
        clientId,
        issueDate: "2026-11-01",
        dueDate: "2026-11-15",
        currency: "USD",
        items: [
          {
            description: "System Architecture Review",
            quantity: 1,
            unitPriceCents: 50000,
          },
        ],
        idempotencyKey: key,
      },
      {
        authorization: `Bearer ${ownerToken}`,
        "x-business-id": businessId,
        "idempotency-key": key,
      },
    );

    assert.equal(res.status, 201);
    assert.equal(res.body.totalCents, 50000);
    testInvoiceId = res.body.id;

    // Check DB has exactly 1 idempotency record
    const record = ctx.db
      .prepare(
        "SELECT * FROM idempotency_keys WHERE business_id = ? AND key = ?",
      )
      .get(businessId, key) as
      | { status_code: number; response_body: string }
      | undefined;

    assert.ok(record);
    assert.equal(record.status_code, 201);
  });

  it("Client retry with identical payload returns the exact same invoice without creating a duplicate", async () => {
    const key = "idemp-inv-first-001";

    const initialCount = ctx.db
      .prepare("SELECT COUNT(*) as count FROM invoices WHERE business_id = ?")
      .get(businessId) as { count: number };

    const res = await ctx.post(
      "/api/v1/invoices",
      {
        clientId,
        issueDate: "2026-11-01",
        dueDate: "2026-11-15",
        currency: "USD",
        items: [
          {
            description: "System Architecture Review",
            quantity: 1,
            unitPriceCents: 50000,
          },
        ],
        idempotencyKey: key,
      },
      {
        authorization: `Bearer ${ownerToken}`,
        "x-business-id": businessId,
        "idempotency-key": key,
      },
    );

    assert.equal(res.status, 201);
    assert.equal(res.body.id, testInvoiceId);
    assert.equal(res.body.totalCents, 50000);

    const postCount = ctx.db
      .prepare("SELECT COUNT(*) as count FROM invoices WHERE business_id = ?")
      .get(businessId) as { count: number };

    assert.equal(postCount.count, initialCount.count);
  });

  it("Reusing an Idempotency-Key with a conflicting payload is rejected with 409 Conflict", async () => {
    const key = "idemp-inv-first-001";

    const res = await ctx.post(
      "/api/v1/invoices",
      {
        clientId,
        issueDate: "2026-11-01",
        dueDate: "2026-11-20", // Modified date!
        currency: "USD",
        items: [
          {
            description: "Different service",
            quantity: 2,
            unitPriceCents: 75000,
          }, // Modified amount!
        ],
        idempotencyKey: key,
      },
      {
        authorization: `Bearer ${ownerToken}`,
        "x-business-id": businessId,
        "idempotency-key": key,
      },
    );

    assert.equal(res.status, 409);
    assert.equal(res.body.title, "Idempotency Conflict");
    assert.match(
      res.body.detail,
      /previously used with a different request payload/,
    );
  });

  it("Enforces idempotency on payment recording", async () => {
    // Send invoice first to recognize AR
    await ctx.post(
      `/api/v1/invoices/${testInvoiceId}/send`,
      {},
      {
        authorization: `Bearer ${ownerToken}`,
        "x-business-id": businessId,
      },
    );

    const payKey = "idemp-pay-test-001";

    // First payment
    const pay1 = await ctx.post(
      `/api/v1/invoices/${testInvoiceId}/payments`,
      {
        amountCents: 15000,
        notes: "Deposit payment",
        idempotencyKey: payKey,
      },
      {
        authorization: `Bearer ${ownerToken}`,
        "x-business-id": businessId,
        "idempotency-key": payKey,
      },
    );

    assert.equal(pay1.status, 200);
    assert.equal(pay1.body.amountPaidCents, 15000);

    // Second payment retry with same key
    const pay2 = await ctx.post(
      `/api/v1/invoices/${testInvoiceId}/payments`,
      {
        amountCents: 15000,
        notes: "Deposit payment",
        idempotencyKey: payKey,
      },
      {
        authorization: `Bearer ${ownerToken}`,
        "x-business-id": businessId,
        "idempotency-key": payKey,
      },
    );

    assert.equal(pay2.status, 200);
    assert.equal(pay2.body.amountPaidCents, 15000); // Does NOT double-charge to 30000!

    // Conflicting payment with different amount
    const payConflict = await ctx.post(
      `/api/v1/invoices/${testInvoiceId}/payments`,
      {
        amountCents: 20000,
        notes: "Different deposit",
        idempotencyKey: payKey,
      },
      {
        authorization: `Bearer ${ownerToken}`,
        "x-business-id": businessId,
        "idempotency-key": payKey,
      },
    );

    assert.equal(payConflict.status, 409);
  });

  it("Employee expense creation is idempotent and prevents duplicate expense submissions", async () => {
    const expKey = "idemp-exp-emp-001";

    const initialExpCount = ctx.db
      .prepare("SELECT COUNT(*) as count FROM expenses WHERE business_id = ?")
      .get(businessId) as { count: number };

    const exp1 = await ctx.post(
      "/api/v1/expenses",
      {
        category: "Software",
        merchant: "GitHub Enterprise",
        amountCents: 2100,
        date: "2026-11-15",
        idempotencyKey: expKey,
      },
      {
        authorization: `Bearer ${employeeToken}`,
        "x-business-id": businessId,
        "idempotency-key": expKey,
      },
    );

    assert.equal(exp1.status, 201);
    const expenseId = exp1.body.id;

    // Retry with identical key and payload
    const exp2 = await ctx.post(
      "/api/v1/expenses",
      {
        category: "Software",
        merchant: "GitHub Enterprise",
        amountCents: 2100,
        date: "2026-11-15",
        idempotencyKey: expKey,
      },
      {
        authorization: `Bearer ${employeeToken}`,
        "x-business-id": businessId,
        "idempotency-key": expKey,
      },
    );

    assert.equal(exp2.status, 201);
    assert.equal(exp2.body.id, expenseId);

    const postExpCount = ctx.db
      .prepare("SELECT COUNT(*) as count FROM expenses WHERE business_id = ?")
      .get(businessId) as { count: number };

    assert.equal(postExpCount.count, initialExpCount.count + 1);
  });
});
