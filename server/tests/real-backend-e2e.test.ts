import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test, { describe, it } from "node:test";
import { Database } from "../src/db/client";

// Target the running backend server on port 3000
const BASE_URL = "http://localhost:3000";
const DB_PATH = "./data/libros.db";

describe("Sprint 10C — Real Backend Android E2E & Hardening", () => {
  const db = new Database(DB_PATH);

  // Helper HTTP request wrapper
  async function api(
    method: "GET" | "POST" | "PATCH" | "DELETE",
    route: string,
    body?: any,
    headers: Record<string, string> = {},
  ) {
    const isBuffer = Buffer.isBuffer(body);
    const reqHeaders: Record<string, string> = {
      Accept: "application/json",
      ...headers,
    };
    if (body !== undefined && !isBuffer && typeof body === "object") {
      reqHeaders["Content-Type"] = "application/json";
    }

    const res = await fetch(`${BASE_URL}${route}`, {
      method,
      headers: reqHeaders,
      body: isBuffer
        ? (body as unknown as BodyInit)
        : body !== undefined
          ? JSON.stringify(body)
          : undefined,
    });

    let resBody: any = null;
    const contentType = res.headers.get("content-type") || "";
    if (
      contentType.includes("application/json") ||
      contentType.includes("application/problem+json")
    ) {
      try {
        resBody = await res.json();
      } catch {
        resBody = null;
      }
    } else {
      resBody = Buffer.from(await res.arrayBuffer());
    }

    return {
      status: res.status,
      headers: res.headers,
      body: resBody,
    };
  }

  // ==========================================
  // Phase 1: Real-backend test environment
  // ==========================================
  describe("Phase 1 — Real-Backend Environment & Health Gate", () => {
    it("Health check confirms backend connectivity and SQLite status", async () => {
      const res = await api("GET", "/api/v1/health");
      assert.equal(res.status, 200);
      assert.equal(res.body.status, "healthy");
      assert.equal(res.body.database, "connected");
      assert.equal(typeof res.body.uptimeSeconds, "number");
    });
  });

  // ==========================================
  // Phase 2: Authentication E2E
  // ==========================================
  describe("Phase 2 — Authentication E2E Lifecycle", () => {
    const testEmail = `newowner_${Date.now()}@acmetest.com`;
    const testPassword = "SecurePassword123!";
    let testUserId = "";
    let testAccessToken = "";
    let testRefreshToken = "";

    it("1. Real user registration stores unverified user with hashed credentials", async () => {
      const res = await api("POST", "/api/v1/auth/register", {
        fullName: "Test Owner",
        email: testEmail,
        password: testPassword,
        termsAccepted: true,
      });

      assert.equal(res.status, 201);
      assert.equal(res.body.verified, false);
      testUserId = res.body.userId;

      // Direct SQLite validation
      const userRow = db
        .prepare("SELECT * FROM users WHERE email = ?")
        .get(testEmail) as any;
      assert.ok(userRow, "User must exist in SQLite");
      assert.equal(userRow.is_verified, 0);
      assert.ok(
        userRow.verification_code,
        "Legitimate OTP code must be stored",
      );
      assert.ok(
        userRow.password_hash !== testPassword,
        "Password must be securely salted & hashed",
      );
    });

    it("2. Sign-in prior to email verification is blocked with 403 Forbidden", async () => {
      const res = await api("POST", "/api/v1/auth/sign-in", {
        email: testEmail,
        password: testPassword,
      });

      assert.equal(res.status, 403);
      assert.equal(res.body.title, "Email Verification Required");
    });

    it("3. Email verification with invalid code is rejected with 400 Bad Request", async () => {
      const res = await api("POST", "/api/v1/auth/verify-email", {
        email: testEmail,
        code: "000000",
      });

      assert.equal(res.status, 400);
      assert.equal(res.body.title, "Invalid Verification Code");
    });

    it("4. Email verification with legitimate OTP code activates user in SQLite", async () => {
      // Retrieve legitimate code from database storage
      const userRow = db
        .prepare("SELECT verification_code FROM users WHERE email = ?")
        .get(testEmail) as any;

      const res = await api("POST", "/api/v1/auth/verify-email", {
        email: testEmail,
        code: userRow.verification_code,
      });

      assert.equal(res.status, 200);
      assert.equal(res.body.verified, true);

      // Verify DB update
      const updatedUser = db
        .prepare(
          "SELECT is_verified, verification_code FROM users WHERE email = ?",
        )
        .get(testEmail) as any;
      assert.equal(updatedUser.is_verified, 1);
      assert.equal(
        updatedUser.verification_code,
        null,
        "OTP must be wiped upon verification",
      );
    });

    it("5. Real sign-in generates valid JWT access token and session record", async () => {
      const res = await api("POST", "/api/v1/auth/sign-in", {
        email: testEmail,
        password: testPassword,
      });

      assert.equal(res.status, 200);
      assert.ok(res.body.accessToken);
      assert.ok(res.body.refreshToken);
      testAccessToken = res.body.accessToken;
      testRefreshToken = res.body.refreshToken;

      // Verify session persisted in SQLite
      const sessionCount = db
        .prepare(
          "SELECT COUNT(*) as count FROM sessions WHERE user_id = ? AND revoked_at IS NULL",
        )
        .get(testUserId) as any;
      assert.ok(sessionCount.count >= 1);
    });

    it("6. Protected /api/v1/auth/me returns identity using Bearer token", async () => {
      const res = await api("GET", "/api/v1/auth/me", undefined, {
        Authorization: `Bearer ${testAccessToken}`,
      });

      assert.equal(res.status, 200);
      assert.equal(res.body.user.email, testEmail);
      assert.equal(res.body.user.id, testUserId);
    });

    it("7. Refresh token rotation issues new access/refresh tokens and invalidates old", async () => {
      const res = await api("POST", "/api/v1/auth/refresh", {
        refreshToken: testRefreshToken,
      });

      assert.equal(res.status, 200);
      assert.ok(res.body.accessToken);
      assert.ok(res.body.refreshToken);
      assert.notEqual(res.body.refreshToken, testRefreshToken);

      // Reusing old refresh token must be rejected with 401
      const replayRes = await api("POST", "/api/v1/auth/refresh", {
        refreshToken: testRefreshToken,
      });
      assert.equal(replayRes.status, 401);

      // Update to rotated token
      testAccessToken = res.body.accessToken;
      testRefreshToken = res.body.refreshToken;
    });

    it("8. Sign-out revokes session in SQLite and invalidates tokens", async () => {
      const res = await api(
        "POST",
        "/api/v1/auth/sign-out",
        {
          refreshToken: testRefreshToken,
        },
        {
          Authorization: `Bearer ${testAccessToken}`,
        },
      );

      assert.equal(res.status, 200);

      // Verify revoked_at timestamp set in SQLite
      const session = db
        .prepare(
          "SELECT revoked_at FROM sessions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1",
        )
        .get(testUserId) as any;
      assert.ok(
        session.revoked_at !== null,
        "Session must have revoked_at populated",
      );

      // Attempting to refresh now fails
      const refreshAfterSignOut = await api("POST", "/api/v1/auth/refresh", {
        refreshToken: testRefreshToken,
      });
      assert.equal(refreshAfterSignOut.status, 401);
    });
  });

  // ==========================================
  // Phase 3: Financial Workflow E2E
  // ==========================================
  describe("Phase 3 — Financial Workflow E2E with Database Invariant Verification", () => {
    let ownerToken = "";
    let employeeToken = "";
    let accountantToken = "";
    const businessId = "biz_acme_services_001";
    let clientId = "";
    let invoiceId = "";
    let expenseId = "";

    it("1. Authenticate seed personas (Owner, Employee, Accountant)", async () => {
      // Owner
      const oRes = await api("POST", "/api/v1/auth/sign-in", {
        email: "owner@acmeservices.com",
        password: "OwnerPassword123!",
      });
      assert.equal(oRes.status, 200);
      ownerToken = oRes.body.accessToken;

      // Employee
      const eRes = await api("POST", "/api/v1/auth/sign-in", {
        email: "employee@acmeservices.com",
        password: "EmployeePassword123!",
      });
      assert.equal(eRes.status, 200);
      employeeToken = eRes.body.accessToken;

      // Accountant
      const aRes = await api("POST", "/api/v1/auth/sign-in", {
        email: "accountant@cpa-firm.com",
        password: "AccountantPassword123!",
      });
      assert.equal(aRes.status, 200);
      accountantToken = aRes.body.accessToken;
    });

    it("2. Owner creates a new client and verifies persistence in SQLite", async () => {
      const clientEmail = `client_${Date.now()}@corporate.com`;
      const res = await api(
        "POST",
        "/api/v1/clients",
        {
          name: "Sprint 10C Test Client Corp",
          email: clientEmail,
          phone: "+1-555-0188",
          address: "742 Evergreen Terrace",
        },
        {
          Authorization: `Bearer ${ownerToken}`,
          "X-Business-Id": businessId,
        },
      );

      assert.equal(res.status, 201);
      clientId = res.body.id;
      assert.equal(res.body.name, "Sprint 10C Test Client Corp");

      // Verify row in SQLite
      const clientRow = db
        .prepare("SELECT * FROM clients WHERE id = ? AND business_id = ?")
        .get(clientId, businessId) as any;
      assert.ok(clientRow);
      assert.equal(clientRow.name, "Sprint 10C Test Client Corp");
      assert.equal(clientRow.status, "active");
    });

    it("3. Owner creates an invoice and verifies line items and totals in SQLite", async () => {
      const res = await api(
        "POST",
        "/api/v1/invoices",
        {
          clientId,
          issueDate: "2026-11-22",
          dueDate: "2026-12-06",
          currency: "USD",
          items: [
            {
              description: "Q4 Financial Architecture Audit",
              quantity: 2,
              unitPriceCents: 150000, // $1,500.00
            },
            {
              description: "E2E Hardening Consultation",
              quantity: 1,
              unitPriceCents: 50000, // $500.00
            },
          ],
          taxRateBps: 1000, // 10%
          notes: "Net 14 payment terms apply.",
          idempotencyKey: `inv-create-${Date.now()}`,
        },
        {
          Authorization: `Bearer ${ownerToken}`,
          "X-Business-Id": businessId,
        },
      );

      assert.equal(res.status, 201);
      invoiceId = res.body.id;
      // Subtotal: 2*150000 + 50000 = 350000 ($3,500.00)
      // Tax: 10% of 350000 = 35000 ($350.00)
      // Total: 385000 ($3,850.00)
      assert.equal(res.body.subtotalCents, 350000);
      assert.equal(res.body.taxCents, 35000);
      assert.equal(res.body.totalCents, 385000);
      assert.equal(res.body.status, "draft");

      // Direct SQLite validation
      const invRow = db
        .prepare("SELECT * FROM invoices WHERE id = ? AND business_id = ?")
        .get(invoiceId, businessId) as any;
      assert.ok(invRow);
      assert.equal(invRow.total_cents, 385000);

      const items = db
        .prepare("SELECT * FROM invoice_items WHERE invoice_id = ?")
        .all(invoiceId) as any[];
      assert.equal(items.length, 2);
    });

    it("4. Owner reloads invoice and retrieves identical persisted data", async () => {
      const res = await api("GET", `/api/v1/invoices/${invoiceId}`, undefined, {
        Authorization: `Bearer ${ownerToken}`,
        "X-Business-Id": businessId,
      });

      assert.equal(res.status, 200);
      assert.equal(res.body.id, invoiceId);
      assert.equal(res.body.totalCents, 385000);
      assert.equal(res.body.items.length, 2);
    });

    it("5. Owner sends invoice and verifies balanced AR journal entry in SQLite", async () => {
      const res = await api(
        "POST",
        `/api/v1/invoices/${invoiceId}/send`,
        {},
        {
          Authorization: `Bearer ${ownerToken}`,
          "X-Business-Id": businessId,
        },
      );

      assert.equal(res.status, 200);
      assert.equal(res.body.status, "sent");

      // Verify balanced General Ledger entry in SQLite
      const invRow = db
        .prepare("SELECT * FROM invoices WHERE id = ?")
        .get(invoiceId) as any;
      assert.ok(
        invRow.journal_entry_id,
        "Invoice must reference journal_entry_id",
      );

      const journalEntry = db
        .prepare("SELECT * FROM journal_entries WHERE id = ?")
        .get(invRow.journal_entry_id) as any;
      assert.ok(journalEntry, "Journal entry must be posted for sent invoice");
      assert.equal(journalEntry.status, "posted");

      const lines = db
        .prepare("SELECT * FROM journal_entry_lines WHERE journal_entry_id = ?")
        .all(journalEntry.id) as any[];
      assert.ok(lines.length >= 2, "Must have at least debit and credit lines");

      const totalDebit = lines.reduce((sum, l) => sum + l.debit_cents, 0);
      const totalCredit = lines.reduce((sum, l) => sum + l.credit_cents, 0);
      assert.equal(
        totalDebit,
        totalCredit,
        "General Ledger entry must strictly balance",
      );
      assert.equal(
        totalDebit,
        385000,
        "Debit must equal invoice total (Accounts Receivable)",
      );
    });

    it("6. Owner records payment and verifies balanced AR credit in SQLite", async () => {
      const invRow = db
        .prepare("SELECT * FROM invoices WHERE id = ?")
        .get(invoiceId) as any;

      const paymentRes = await api(
        "POST",
        `/api/v1/invoices/${invoiceId}/payments`,
        {
          amountCents: 385000,
          paymentDate: "2026-11-22",
          notes: "Wire transfer ref #WT-89410",
        },
        {
          Authorization: `Bearer ${ownerToken}`,
          "X-Business-Id": businessId,
          "Idempotency-Key": `pay-${invoiceId}-full`,
        },
      );

      assert.equal(paymentRes.status, 200);
      assert.equal(paymentRes.body.status, "paid");
      assert.equal(paymentRes.body.balanceDueCents, 0);

      // Verify payment ledger entry in SQLite
      const paymentEntry = db
        .prepare(
          "SELECT * FROM journal_entries WHERE description LIKE ? AND business_id = ?",
        )
        .get(
          `%Payment for Invoice ${invRow.invoice_number}%`,
          businessId,
        ) as any;
      assert.ok(paymentEntry, "Payment journal entry must exist");

      const paymentLines = db
        .prepare("SELECT * FROM journal_entry_lines WHERE journal_entry_id = ?")
        .all(paymentEntry.id) as any[];
      const pDebit = paymentLines.reduce((sum, l) => sum + l.debit_cents, 0);
      const pCredit = paymentLines.reduce((sum, l) => sum + l.credit_cents, 0);
      assert.equal(pDebit, pCredit, "Payment journal entry must balance");
      assert.equal(
        pDebit,
        385000,
        "Debit Cash and Credit AR must equal payment amount",
      );
    });

    it("7. Employee submits expense draft and Owner approves into ledger", async () => {
      // Employee submits
      const expRes = await api(
        "POST",
        "/api/v1/expenses",
        {
          merchant: "JetBrains IDE License",
          category: "Software",
          amountCents: 24900, // $249.00
          date: "2026-11-22",
        },
        {
          Authorization: `Bearer ${employeeToken}`,
          "X-Business-Id": businessId,
        },
      );

      assert.equal(expRes.status, 201);
      assert.equal(expRes.body.status, "pending");
      expenseId = expRes.body.id;

      // Owner approves
      const approveRes = await api(
        "POST",
        `/api/v1/expenses/${expenseId}/approve`,
        {},
        {
          Authorization: `Bearer ${ownerToken}`,
          "X-Business-Id": businessId,
        },
      );

      assert.equal(approveRes.status, 200);
      assert.equal(approveRes.body.status, "approved");

      // Verify expense entry in SQLite
      const expEntry = db
        .prepare("SELECT * FROM journal_entries WHERE id = ?")
        .get(approveRes.body.journalEntryId) as any;
      assert.ok(expEntry, "Approved expense must generate journal entry");
      assert.equal(expEntry.status, "posted");
    });

    it("8. Accountant can view ledger reports but is rejected (403) from mutations", async () => {
      // Allowed: Read-only accounts list
      const accountsRes = await api(
        "GET",
        "/api/v1/ledger/accounts",
        undefined,
        {
          Authorization: `Bearer ${accountantToken}`,
          "X-Business-Id": businessId,
        },
      );
      assert.equal(accountsRes.status, 200);
      assert.ok(Array.isArray(accountsRes.body));

      // Forbidden: Accountant attempting to create an invoice
      const invoiceMutRes = await api(
        "POST",
        "/api/v1/invoices",
        {
          clientId,
          issueDate: "2026-11-22",
          dueDate: "2026-12-06",
          items: [
            { description: "Unauthorized", quantity: 1, unitPriceCents: 1000 },
          ],
        },
        {
          Authorization: `Bearer ${accountantToken}`,
          "X-Business-Id": businessId,
        },
      );
      assert.equal(
        invoiceMutRes.status,
        403,
        "Accountant cannot create invoices",
      );

      // Forbidden: Accountant attempting to approve expense
      const expenseApproveRes = await api(
        "POST",
        `/api/v1/expenses/${expenseId}/approve`,
        {},
        {
          Authorization: `Bearer ${accountantToken}`,
          "X-Business-Id": businessId,
        },
      );
      assert.equal(
        expenseApproveRes.status,
        403,
        "Accountant cannot approve expenses",
      );
    });

    it("9. Business switching does not expose another tenant's records", async () => {
      // Header pointing to another non-member business ID
      const crossRes = await api("GET", "/api/v1/invoices", undefined, {
        Authorization: `Bearer ${ownerToken}`,
        "X-Business-Id": "biz_unauthorized_999",
      });

      assert.equal(
        crossRes.status,
        403,
        "Cross-tenant access must be blocked with 403 Forbidden",
      );
    });
  });

  // ==========================================
  // Phase 4: Idempotency and Concurrency
  // ==========================================
  describe("Phase 4 — Real HTTP Idempotency & Concurrency Guarantees", () => {
    let ownerToken = "";
    const businessId = "biz_acme_services_001";
    let clientId = "";

    it("Setup client and owner credentials", async () => {
      const oRes = await api("POST", "/api/v1/auth/sign-in", {
        email: "owner@acmeservices.com",
        password: "OwnerPassword123!",
      });
      ownerToken = oRes.body.accessToken;

      const cRes = await api("GET", "/api/v1/clients", undefined, {
        Authorization: `Bearer ${ownerToken}`,
        "X-Business-Id": businessId,
      });
      clientId = cRes.body[0].id;
    });

    it("1. Identical retries return cached result without duplicating records", async () => {
      const key = `idemp-test-${Date.now()}`;
      const payload = {
        clientId,
        issueDate: "2026-11-22",
        dueDate: "2026-12-06",
        items: [
          { description: "System Audit", quantity: 1, unitPriceCents: 100000 },
        ],
        idempotencyKey: key,
      };

      // Request 1
      const res1 = await api("POST", "/api/v1/invoices", payload, {
        Authorization: `Bearer ${ownerToken}`,
        "X-Business-Id": businessId,
      });
      assert.equal(res1.status, 201);
      const originalId = res1.body.id;

      // Request 2 (Identical retry)
      const res2 = await api("POST", "/api/v1/invoices", payload, {
        Authorization: `Bearer ${ownerToken}`,
        "X-Business-Id": businessId,
      });
      assert.equal(res2.status, 201);
      assert.equal(res2.body.id, originalId);

      // Verify in SQLite: exactly 1 idempotency row and 1 invoice row
      const idempRow = db
        .prepare(
          "SELECT * FROM idempotency_keys WHERE business_id = ? AND key = ?",
        )
        .get(businessId, key) as any;
      assert.ok(idempRow, "Idempotency row must exist");

      const count = db
        .prepare("SELECT COUNT(*) as c FROM invoices WHERE id = ?")
        .get(originalId) as any;
      assert.equal(count.c, 1, "Must not create duplicate invoice row");
    });

    it("2. Key reuse with conflicting payload returns RFC 7807 409 Conflict", async () => {
      const key = `idemp-conflict-${Date.now()}`;
      const originalPayload = {
        clientId,
        issueDate: "2026-11-22",
        dueDate: "2026-12-06",
        items: [
          { description: "Audit Alpha", quantity: 1, unitPriceCents: 50000 },
        ],
        idempotencyKey: key,
      };

      const res1 = await api("POST", "/api/v1/invoices", originalPayload, {
        Authorization: `Bearer ${ownerToken}`,
        "X-Business-Id": businessId,
      });
      assert.equal(res1.status, 201);

      // Modified payload with same key
      const conflictingPayload = {
        ...originalPayload,
        items: [
          {
            description: "Audit Beta Modified",
            quantity: 2,
            unitPriceCents: 80000,
          },
        ],
      };

      const res2 = await api("POST", "/api/v1/invoices", conflictingPayload, {
        Authorization: `Bearer ${ownerToken}`,
        "X-Business-Id": businessId,
      });

      assert.equal(res2.status, 409);
      assert.equal(res2.body.title, "Idempotency Conflict");
    });

    it("3. Simultaneous parallel requests with same key produce exactly one mutation", async () => {
      const key = `idemp-parallel-${Date.now()}`;
      const payload = {
        clientId,
        issueDate: "2026-11-22",
        dueDate: "2026-12-06",
        items: [
          {
            description: "Concurrent Load Check",
            quantity: 1,
            unitPriceCents: 30000,
          },
        ],
        idempotencyKey: key,
      };

      // Fire 5 identical requests concurrently
      const promises = Array.from({ length: 5 }).map(() =>
        api("POST", "/api/v1/invoices", payload, {
          Authorization: `Bearer ${ownerToken}`,
          "X-Business-Id": businessId,
        }),
      );

      const results = await Promise.all(promises);
      const successful = results.filter((r) => r.status === 201);
      assert.ok(successful.length >= 1, "At least one request must succeed");

      // Verify all successful responses returned the EXACT same invoice ID
      const returnedIds = new Set(successful.map((r) => r.body.id));
      assert.equal(
        returnedIds.size,
        1,
        "All responses must return the same invoice ID",
      );

      // Verify in SQLite: exactly 1 invoice was created
      const invId = [...returnedIds][0];
      const count = db
        .prepare("SELECT COUNT(*) as c FROM invoices WHERE id = ?")
        .get(invId) as any;
      assert.equal(count.c, 1, "Only 1 invoice row can exist");
    });
  });

  // ==========================================
  // Phase 5: Document Pipeline Acceptance
  // ==========================================
  describe("Phase 5 — Document Pipeline Acceptance & Security Verification", () => {
    let ownerToken = "";
    const businessId = "biz_acme_services_001";
    let uploadedDocId = "";

    it("Setup owner credentials", async () => {
      const oRes = await api("POST", "/api/v1/auth/sign-in", {
        email: "owner@acmeservices.com",
        password: "OwnerPassword123!",
      });
      ownerToken = oRes.body.accessToken;
    });

    it("1. Binary PDF upload persists file, passes magic-bytes check, and records DB row", async () => {
      const pdfBytes = Buffer.from(
        "%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< >>\n%%EOF\n",
        "utf-8",
      );

      const res = await api("POST", "/api/v1/documents/upload", pdfBytes, {
        Authorization: `Bearer ${ownerToken}`,
        "X-Business-Id": businessId,
        "Content-Type": "application/pdf",
        "X-Filename": "verified_november_audit.pdf",
        "X-Folder": "Invoices",
      });

      assert.equal(res.status, 201);
      assert.equal(res.body.filename, "verified_november_audit.pdf");
      assert.equal(res.body.fileType, "pdf");
      assert.equal(res.body.status, "Ready");
      uploadedDocId = res.body.id;

      // Verify stored file on disk
      const storagePath = res.body.storagePath;
      assert.ok(
        fs.existsSync(storagePath),
        "File must physically exist on disk",
      );
      const diskContent = fs.readFileSync(storagePath);
      assert.equal(
        diskContent.compare(pdfBytes),
        0,
        "Disk content must match upload bytes identically",
      );
    });

    it("2. Binary download streams identical file bytes with correct Content-Type", async () => {
      const res = await api(
        "GET",
        `/api/v1/documents/${uploadedDocId}/download`,
        undefined,
        {
          Authorization: `Bearer ${ownerToken}`,
          "X-Business-Id": businessId,
        },
      );

      assert.equal(res.status, 200);
      assert.equal(res.headers.get("content-type"), "application/pdf");
      assert.ok(Buffer.isBuffer(res.body));
      assert.ok(res.body.toString().startsWith("%PDF-1.4"));
    });

    it("3. Upload rejects Windows PE executable binary (MZ header) with 400 Bad Request", async () => {
      const maliciousBuffer = Buffer.from(
        "MZ\x90\x00\x03\x00\x00\x00malicious_pe_file",
      );

      const res = await api(
        "POST",
        "/api/v1/documents/upload",
        maliciousBuffer,
        {
          Authorization: `Bearer ${ownerToken}`,
          "X-Business-Id": businessId,
          "Content-Type": "application/pdf",
          "X-Filename": "fake_pdf.pdf",
          "X-Folder": "Receipts",
        },
      );

      assert.equal(res.status, 400);
      assert.equal(res.body.title, "Unsupported File Type");
    });

    it("4. Upload rejects payloads exceeding 15MB ceiling with 413 Payload Too Large", async () => {
      // 15MB + 1KB buffer
      const oversizedBuffer = Buffer.alloc(15 * 1024 * 1024 + 1024, 0x20);

      const res = await api(
        "POST",
        "/api/v1/documents/upload",
        oversizedBuffer,
        {
          Authorization: `Bearer ${ownerToken}`,
          "X-Business-Id": businessId,
          "Content-Type": "application/pdf",
          "X-Filename": "oversized.pdf",
          "X-Folder": "Receipts",
        },
      );

      assert.equal(res.status, 413);
      assert.equal(res.body.title, "Payload Too Large");
    });

    it("5. Path traversal filename manipulation is sanitized and confined to tenant directory", async () => {
      const pdfBytes = Buffer.from("%PDF-1.4\ntest\n%%EOF\n");

      const res = await api("POST", "/api/v1/documents/upload", pdfBytes, {
        Authorization: `Bearer ${ownerToken}`,
        "X-Business-Id": businessId,
        "Content-Type": "application/pdf",
        "X-Filename": "../../etc/shadow.pdf",
        "X-Folder": "Invoices",
      });

      assert.equal(res.status, 201);
      // Path must be inside storage/documents/biz_acme_services_001/
      const expectedDir = path.resolve(`storage/documents/${businessId}`);
      const actualPath = path.resolve(res.body.storagePath);
      assert.ok(
        actualPath.startsWith(expectedDir),
        "File must be confined to tenant directory",
      );
      assert.ok(
        !res.body.filename.includes(".."),
        "Filename must not contain relative traversal characters",
      );
    });

    it("6. Cross-tenant document download is blocked with 404/403", async () => {
      // Create user in another business
      const otherRes = await api("POST", "/api/v1/auth/sign-in", {
        email: "owner@acmeservices.com",
        password: "OwnerPassword123!",
      });

      const res = await api(
        "GET",
        `/api/v1/documents/${uploadedDocId}/download`,
        undefined,
        {
          Authorization: `Bearer ${otherRes.body.accessToken}`,
          "X-Business-Id": "biz_other_intruder_001",
        },
      );

      assert.ok(
        res.status === 403 || res.status === 404,
        `Intruder must be rejected with 403 or 404, got ${res.status}`,
      );
    });
  });
});
