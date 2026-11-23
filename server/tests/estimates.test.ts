import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { seedDatabase } from "../src/db/seed";
import { createTestApp, type TestContext } from "./helpers/testClient";

describe("Estimates API & Conversion Safety", () => {
  let ctx: TestContext;
  let ownerToken = "";
  let accountantToken = "";
  let employeeToken = "";
  const businessId = "biz_acme_services_001";
  const clientId = "cli_acme_client_001";
  let estimateId = "";
  let convertedInvoiceId = "";

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

  it("Owner can create a draft estimate with line items in integer cents", async () => {
    const res = await ctx.post(
      "/api/v1/estimates",
      {
        clientId,
        issueDate: "2026-11-01",
        validUntil: "2026-11-30",
        taxRateBps: 825, // 8.25%
        notes: "Estimate for Q4 Infrastructure Upgrade",
        items: [
          {
            description: "Cloud Migration Architecture",
            quantity: 20,
            unitPriceCents: 18000, // $180.00
          },
          {
            description: "Database Replication Setup",
            quantity: 10,
            unitPriceCents: 22000, // $220.00
          },
        ],
      },
      {
        authorization: `Bearer ${ownerToken}`,
        "x-business-id": businessId,
      },
    );

    assert.equal(res.status, 201);
    estimateId = res.body.id;
    assert.equal(res.body.status, "draft");
    assert.equal(res.body.clientId, clientId);
    // Subtotal: 20*18000 (360000) + 10*22000 (220000) = 580000 ($5,800.00)
    assert.equal(res.body.subtotalCents, 580000);
    // Tax: 8.25% of 580000 = 47850 ($478.50)
    assert.equal(res.body.taxCents, 47850);
    // Total: 627850 ($6,278.50)
    assert.equal(res.body.totalCents, 627850);
    assert.equal(res.body.items.length, 2);
  });

  it("Employee cannot create an estimate (403 Forbidden)", async () => {
    const res = await ctx.post(
      "/api/v1/estimates",
      {
        clientId,
        issueDate: "2026-11-01",
        validUntil: "2026-11-30",
        items: [{ description: "Work", quantity: 1, unitPriceCents: 5000 }],
      },
      {
        authorization: `Bearer ${employeeToken}`,
        "x-business-id": businessId,
      },
    );

    assert.equal(res.status, 403);
  });

  it("Accountant cannot create an estimate (403 Forbidden)", async () => {
    const res = await ctx.post(
      "/api/v1/estimates",
      {
        clientId,
        issueDate: "2026-11-01",
        validUntil: "2026-11-30",
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

  it("Accountant cannot convert an estimate (403 Forbidden)", async () => {
    const res = await ctx.post(
      `/api/v1/estimates/${estimateId}/convert`,
      {},
      {
        authorization: `Bearer ${accountantToken}`,
        "x-business-id": businessId,
      },
    );

    assert.equal(res.status, 403);
    assert.equal(res.body.title, "Access Denied");
  });

  it("Owner and Accountant can list estimates for the tenant", async () => {
    const accRes = await ctx.get("/api/v1/estimates", {
      authorization: `Bearer ${accountantToken}`,
      "x-business-id": businessId,
    });
    assert.equal(accRes.status, 200);

    const res = await ctx.get("/api/v1/estimates", {
      authorization: `Bearer ${ownerToken}`,
      "x-business-id": businessId,
    });

    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body));
    const est = res.body.find((e: any) => e.id === estimateId);
    assert.ok(est);
    assert.equal(est.totalCents, 627850);
  });

  it("Owner can convert estimate into a draft invoice", async () => {
    const res = await ctx.post(
      `/api/v1/estimates/${estimateId}/convert`,
      {},
      {
        authorization: `Bearer ${ownerToken}`,
        "x-business-id": businessId,
      },
    );

    assert.equal(res.status, 200);
    assert.ok(res.body.id);
    convertedInvoiceId = res.body.id;
    assert.equal(res.body.status, "draft");
    assert.equal(res.body.clientId, clientId);
    assert.equal(res.body.totalCents, 627850);
    assert.equal(res.body.subtotalCents, 580000);
    assert.equal(res.body.taxCents, 47850);
    assert.equal(res.body.items.length, 2);

    // Verify estimate status transitioned to converted
    const estRes = await ctx.get(`/api/v1/estimates/${estimateId}`, {
      authorization: `Bearer ${ownerToken}`,
      "x-business-id": businessId,
    });
    assert.equal(estRes.status, 200);
    assert.equal(estRes.body.status, "converted");
    assert.equal(estRes.body.convertedInvoiceId, convertedInvoiceId);
  });

  it("Double-conversion safety: Converting again returns the existing invoice without duplicate", async () => {
    const res = await ctx.post(
      `/api/v1/estimates/${estimateId}/convert`,
      {},
      {
        authorization: `Bearer ${ownerToken}`,
        "x-business-id": businessId,
      },
    );

    assert.equal(res.status, 200);
    assert.equal(res.body.id, convertedInvoiceId);

    // Verify only 1 invoice exists for this conversion
    const listInvoices = await ctx.get("/api/v1/invoices", {
      authorization: `Bearer ${ownerToken}`,
      "x-business-id": businessId,
    });
    const matches = listInvoices.body.filter(
      (inv: any) => inv.id === convertedInvoiceId,
    );
    assert.equal(matches.length, 1);
  });

  it("Cross-tenant intrusion: User from another business cannot access or convert this estimate", async () => {
    const reg2 = await ctx.post("/api/v1/auth/register", {
      email: "intruder.estimate@corp.com",
      password: "Password123!",
      fullName: "Estimate Intruder",
      termsAccepted: true,
    });
    await ctx.post("/api/v1/auth/verify-email", {
      email: "intruder.estimate@corp.com",
      code: reg2.body.previewCode,
    });
    const login2 = await ctx.post("/api/v1/auth/sign-in", {
      email: "intruder.estimate@corp.com",
      password: "Password123!",
    });
    const user2Token = login2.body.accessToken;

    const biz2 = await ctx.post(
      "/api/v1/businesses",
      { businessName: "Other Estimate Corp", businessType: "Architecture" },
      { authorization: `Bearer ${user2Token}` },
    );
    const biz2Id = biz2.body.business.id;

    // Try to get estimate
    const resGet = await ctx.get(`/api/v1/estimates/${estimateId}`, {
      authorization: `Bearer ${user2Token}`,
      "x-business-id": biz2Id,
    });
    assert.equal(resGet.status, 404);

    // Try to convert estimate
    const resConvert = await ctx.post(
      `/api/v1/estimates/${estimateId}/convert`,
      {},
      {
        authorization: `Bearer ${user2Token}`,
        "x-business-id": biz2Id,
      },
    );
    assert.equal(resConvert.status, 404);
  });
});
