import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { seedDatabase } from "../src/db/seed";
import { createTestApp, type TestContext } from "./helpers/testClient";

describe("Documents API & Storage Intake Infrastructure", () => {
  let ctx: TestContext;
  let ownerToken = "";
  let accountantToken = "";
  let employeeToken = "";
  let secondBizToken = "";
  const businessId = "biz_acme_services_001";
  let secondBusinessId = "";
  let sampleDocId = "";

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

    // Second business owner for isolation tests
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
  });

  after(async () => {
    await ctx.close();
  });

  it("Owner can upload a document with valid metadata and size", async () => {
    const res = await ctx.post(
      "/api/v1/documents",
      {
        filename: "quarterly_statement_q3.pdf",
        fileSizeBytes: 245000, // ~245KB
        mimeType: "application/pdf",
        folder: "Statements",
        notes: "Bank statement for reconciliation",
      },
      {
        authorization: `Bearer ${ownerToken}`,
        "x-business-id": businessId,
      },
    );

    assert.equal(res.status, 201);
    assert.equal(res.body.filename, "quarterly_statement_q3.pdf");
    assert.equal(res.body.fileType, "pdf");
    assert.equal(res.body.folder, "Statements");
    assert.equal(res.body.status, "Ready");
    assert.equal(res.body.isArchived, false);
    sampleDocId = res.body.id;
  });

  it("Rejects document upload exceeding 15MB limit with 413 Payload Too Large", async () => {
    const res = await ctx.post(
      "/api/v1/documents",
      {
        filename: "giant_scan.pdf",
        fileSizeBytes: 16 * 1024 * 1024, // 16MB
        mimeType: "application/pdf",
        folder: "Receipts",
      },
      {
        authorization: `Bearer ${ownerToken}`,
        "x-business-id": businessId,
      },
    );

    assert.equal(res.status, 413);
    assert.equal(res.body.title, "Payload Too Large");
  });

  it("Rejects document with unsupported file extension", async () => {
    const res = await ctx.post(
      "/api/v1/documents",
      {
        filename: "malicious_script.exe",
        fileSizeBytes: 1024,
        mimeType: "application/x-msdownload",
        folder: "Receipts",
      },
      {
        authorization: `Bearer ${ownerToken}`,
        "x-business-id": businessId,
      },
    );

    assert.equal(res.status, 400);
    assert.match(res.body.detail, /not supported/);
  });

  it("Employee can upload receipt documents to Receipts folder", async () => {
    const res = await ctx.post(
      "/api/v1/documents",
      {
        filename: "fuel_receipt_1104.jpg",
        fileSizeBytes: 128000,
        mimeType: "image/jpeg",
        folder: "Receipts",
      },
      {
        authorization: `Bearer ${employeeToken}`,
        "x-business-id": businessId,
      },
    );

    assert.equal(res.status, 201);
    assert.equal(res.body.folder, "Receipts");
    assert.equal(res.body.fileType, "jpg");
  });

  it("Employee CANNOT upload to Statements or Invoices folder (403 Forbidden)", async () => {
    const res = await ctx.post(
      "/api/v1/documents",
      {
        filename: "vendor_statement.pdf",
        fileSizeBytes: 150000,
        mimeType: "application/pdf",
        folder: "Statements",
      },
      {
        authorization: `Bearer ${employeeToken}`,
        "x-business-id": businessId,
      },
    );

    assert.equal(res.status, 403);
    assert.equal(res.body.title, "Forbidden");
  });

  it("Accountant CANNOT upload documents (403 Forbidden - Read-Only Auditor)", async () => {
    const res = await ctx.post(
      "/api/v1/documents",
      {
        filename: "audit_workpaper.pdf",
        fileSizeBytes: 300000,
        mimeType: "application/pdf",
        folder: "Statements",
      },
      {
        authorization: `Bearer ${accountantToken}`,
        "x-business-id": businessId,
      },
    );

    assert.equal(res.status, 403);
    assert.equal(res.body.title, "Forbidden");
  });

  it("Accountant CAN list and view all business documents", async () => {
    const res = await ctx.get("/api/v1/documents", {
      authorization: `Bearer ${accountantToken}`,
      "x-business-id": businessId,
    });

    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body));
    assert.ok(res.body.length >= 2);
  });

  it("Owner can archive and unarchive documents", async () => {
    // Archive
    const archiveRes = await ctx.post(
      `/api/v1/documents/${sampleDocId}/archive`,
      { isArchived: true },
      {
        authorization: `Bearer ${ownerToken}`,
        "x-business-id": businessId,
      },
    );
    assert.equal(archiveRes.status, 200);
    assert.equal(archiveRes.body.isArchived, true);
    assert.equal(archiveRes.body.status, "Archived");

    // Unarchive
    const unarchiveRes = await ctx.post(
      `/api/v1/documents/${sampleDocId}/archive`,
      { isArchived: false },
      {
        authorization: `Bearer ${ownerToken}`,
        "x-business-id": businessId,
      },
    );
    assert.equal(unarchiveRes.status, 200);
    assert.equal(unarchiveRes.body.isArchived, false);
    assert.equal(unarchiveRes.body.status, "Ready");
  });

  it("Accountant and Employee CANNOT archive documents (403 Forbidden)", async () => {
    const accRes = await ctx.post(
      `/api/v1/documents/${sampleDocId}/archive`,
      { isArchived: true },
      {
        authorization: `Bearer ${accountantToken}`,
        "x-business-id": businessId,
      },
    );
    assert.equal(accRes.status, 403);

    const empRes = await ctx.post(
      `/api/v1/documents/${sampleDocId}/archive`,
      { isArchived: true },
      {
        authorization: `Bearer ${employeeToken}`,
        "x-business-id": businessId,
      },
    );
    assert.equal(empRes.status, 403);
  });

  it("Cross-tenant isolation: Tenant B cannot access Tenant A's documents", async () => {
    const res = await ctx.get(`/api/v1/documents/${sampleDocId}`, {
      authorization: `Bearer ${secondBizToken}`,
      "x-business-id": secondBusinessId,
    });

    assert.equal(res.status, 404);
  });

  it("Owner can upload binary PDF document and download it with integrity", async () => {
    const pdfContent = Buffer.from(
      "%PDF-1.4\n1 0 obj\n<< /Title (Q3 Report) >>\nendobj\ntrailer\n<< >>\n%%EOF\n",
    );

    const uploadRes = await ctx.post("/api/v1/documents/upload", pdfContent, {
      authorization: `Bearer ${ownerToken}`,
      "x-business-id": businessId,
      "x-file-name": "q3_verified_report.pdf",
      "x-folder": "Statements",
      "content-type": "application/pdf",
    });

    assert.equal(uploadRes.status, 201);
    assert.equal(uploadRes.body.filename, "q3_verified_report.pdf");
    assert.equal(uploadRes.body.fileType, "pdf");
    assert.equal(uploadRes.body.folder, "Statements");
    const uploadedDocId = uploadRes.body.id;

    // Download document
    const downloadRes = await ctx.get(
      `/api/v1/documents/${uploadedDocId}/download`,
      {
        authorization: `Bearer ${ownerToken}`,
        "x-business-id": businessId,
      },
    );

    assert.equal(downloadRes.status, 200);
    assert.equal(downloadRes.headers.get("content-type"), "application/pdf");
    assert.ok(
      downloadRes.headers
        .get("content-disposition")
        ?.includes("q3_verified_report.pdf"),
    );
  });

  it("Upload rejects binary payload with executable PE signature (MZ header)", async () => {
    // Construct fake PDF starting with MZ header
    const maliciousBuffer = Buffer.from(
      "MZ\x90\x00\x03\x00\x00\x00fake_binary_payload",
    );

    const uploadRes = await ctx.post(
      "/api/v1/documents/upload",
      maliciousBuffer,
      {
        authorization: `Bearer ${ownerToken}`,
        "x-business-id": businessId,
        "x-file-name": "trojan_statement.pdf",
        "x-folder": "Statements",
      },
    );

    assert.equal(uploadRes.status, 400);
  });

  it("Upload rejects binary payload exceeding 15MB limit with 413 Payload Too Large", async () => {
    // 15MB + 1KB buffer
    const oversizedBuffer = Buffer.alloc(15 * 1024 * 1024 + 1024);
    oversizedBuffer.write("%PDF-1.4\n");

    const uploadRes = await ctx.post(
      "/api/v1/documents/upload",
      oversizedBuffer,
      {
        authorization: `Bearer ${ownerToken}`,
        "x-business-id": businessId,
        "x-file-name": "too_big.pdf",
        "x-folder": "Statements",
        "content-type": "application/pdf",
      },
    );

    assert.equal(uploadRes.status, 413);
    assert.equal(uploadRes.body.title, "Payload Too Large");
  });

  it("Cross-tenant download: Tenant B cannot download Tenant A's document", async () => {
    const res = await ctx.get(`/api/v1/documents/${sampleDocId}/download`, {
      authorization: `Bearer ${secondBizToken}`,
      "x-business-id": secondBusinessId,
    });

    assert.equal(res.status, 404);
  });
});
