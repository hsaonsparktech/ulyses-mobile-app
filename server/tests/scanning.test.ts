import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { seedDatabase } from "../src/db/seed";
import { createTestApp, type TestContext } from "./helpers/testClient";

describe("Scanning & OCR Pipeline — Provisional Intake & Ledger Isolation", () => {
  let ctx: TestContext;
  let ownerToken = "";
  let accountantToken = "";
  let employeeToken = "";
  let secondBizToken = "";
  const businessId = "biz_acme_services_001";
  let secondBusinessId = "";
  let receiptDocId = "";

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

    const reg2 = await ctx.post("/api/v1/auth/register", {
      email: "tenant2.owner@beta.com",
      password: "Password123!",
      fullName: "Beta Owner",
      termsAccepted: true,
    });
    await ctx.post("/api/v1/auth/verify-email", {
      email: "tenant2.owner@beta.com",
      code: reg2.body.previewCode,
    });
    const login2 = await ctx.post("/api/v1/auth/sign-in", {
      email: "tenant2.owner@beta.com",
      password: "Password123!",
    });
    secondBizToken = login2.body.accessToken;

    const biz2 = await ctx.post(
      "/api/v1/businesses",
      {
        businessName: "Beta Corp",
        businessType: "Consulting",
        currency: "USD",
      },
      { authorization: `Bearer ${secondBizToken}` },
    );
    secondBusinessId = biz2.body.business.id;

    // Upload a receipt document to run scans against
    const uploadRes = await ctx.post(
      "/api/v1/documents",
      {
        filename: "hardware_store_receipt.png",
        fileSizeBytes: 185000,
        mimeType: "image/png",
        folder: "Receipts",
      },
      {
        authorization: `Bearer ${ownerToken}`,
        "x-business-id": businessId,
      },
    );
    receiptDocId = uploadRes.body.id;
  });

  after(async () => {
    await ctx.close();
  });

  it("Processes OCR scan returning provisional extraction without affecting the ledger", async () => {
    // Record initial ledger count
    const initialEntries = ctx.db
      .prepare(
        "SELECT COUNT(*) as count FROM journal_entries WHERE business_id = ?",
      )
      .get(businessId) as { count: number };
    const initialExpenses = ctx.db
      .prepare("SELECT COUNT(*) as count FROM expenses WHERE business_id = ?")
      .get(businessId) as { count: number };

    const res = await ctx.post(
      "/api/v1/scanning/ocr",
      {
        documentId: receiptDocId,
        vendor: "Home Depot Store #421",
        documentDate: "2026-11-12",
        subtotalCents: 4500, // $45.00
        taxCents: 360, // $3.60
        totalCents: 4860, // $48.60
        currency: "USD",
        confidenceScore: 0.94,
      },
      {
        authorization: `Bearer ${ownerToken}`,
        "x-business-id": businessId,
      },
    );

    assert.equal(res.status, 200);
    assert.equal(res.body.documentId, receiptDocId);
    assert.equal(res.body.vendor, "Home Depot Store #421");
    assert.equal(res.body.totalCents, 4860);
    assert.equal(res.body.confidenceScore, 0.94);
    assert.equal(res.body.status, "pending_review");

    // CRITICAL INVARIANT: Provisional extraction flag must ALWAYS be true
    assert.equal(res.body.provisional, true);

    // CRITICAL INVARIANT: The General Ledger and Expenses are NEVER auto-mutated by OCR
    const postEntries = ctx.db
      .prepare(
        "SELECT COUNT(*) as count FROM journal_entries WHERE business_id = ?",
      )
      .get(businessId) as { count: number };
    const postExpenses = ctx.db
      .prepare("SELECT COUNT(*) as count FROM expenses WHERE business_id = ?")
      .get(businessId) as { count: number };

    assert.equal(postEntries.count, initialEntries.count);
    assert.equal(postExpenses.count, initialExpenses.count);

    // Document status updated to Needs Review
    const docCheck = await ctx.get(`/api/v1/documents/${receiptDocId}`, {
      authorization: `Bearer ${ownerToken}`,
      "x-business-id": businessId,
    });
    assert.equal(docCheck.body.status, "Needs Review");
    assert.ok(docCheck.body.ocrResult);
    assert.equal(docCheck.body.ocrResult.totalCents, 4860);
  });

  it("Rejects OCR scan with arithmetic mismatch (subtotal + tax != total)", async () => {
    const res = await ctx.post(
      "/api/v1/scanning/ocr",
      {
        documentId: receiptDocId,
        subtotalCents: 5000,
        taxCents: 500,
        totalCents: 6000, // Error: 5000 + 500 != 6000
      },
      {
        authorization: `Bearer ${ownerToken}`,
        "x-business-id": businessId,
      },
    );

    assert.equal(res.status, 400);
    assert.equal(res.body.title, "Arithmetic Mismatch");
  });

  it("Accountant CANNOT trigger OCR scan (403 Forbidden)", async () => {
    const res = await ctx.post(
      "/api/v1/scanning/ocr",
      {
        documentId: receiptDocId,
      },
      {
        authorization: `Bearer ${accountantToken}`,
        "x-business-id": businessId,
      },
    );

    assert.equal(res.status, 403);
    assert.equal(res.body.title, "Forbidden");
  });

  it("Owner can confirm an OCR scan result after review", async () => {
    const res = await ctx.post(
      `/api/v1/scanning/results/${receiptDocId}/review`,
      { action: "confirmed" },
      {
        authorization: `Bearer ${ownerToken}`,
        "x-business-id": businessId,
      },
    );

    assert.equal(res.status, 200);
    assert.equal(res.body.status, "confirmed");

    // Document status becomes Ready
    const docCheck = await ctx.get(`/api/v1/documents/${receiptDocId}`, {
      authorization: `Bearer ${ownerToken}`,
      "x-business-id": businessId,
    });
    assert.equal(docCheck.body.status, "Ready");
  });

  it("Employee CANNOT review or confirm OCR results (403 Forbidden)", async () => {
    const res = await ctx.post(
      `/api/v1/scanning/results/${receiptDocId}/review`,
      { action: "confirmed" },
      {
        authorization: `Bearer ${employeeToken}`,
        "x-business-id": businessId,
      },
    );

    assert.equal(res.status, 403);
  });

  it("Cross-tenant isolation: Tenant B cannot access Tenant A's OCR results", async () => {
    const res = await ctx.get(`/api/v1/scanning/results/${receiptDocId}`, {
      authorization: `Bearer ${secondBizToken}`,
      "x-business-id": secondBusinessId,
    });

    assert.equal(res.status, 404);
  });
});
