import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { seedDatabase } from "../src/db/seed";
import { createTestApp, type TestContext } from "./helpers/testClient";

describe("Financial Concurrency, ACID Rollback & Data Integrity", () => {
  let ctx: TestContext;
  let ownerToken = "";
  const businessId = "biz_acme_services_001";
  let otherBusinessId = "";
  let otherToken = "";
  let otherAccountId = "";

  before(async () => {
    ctx = await createTestApp();
    seedDatabase(ctx.db);

    const ownerLogin = await ctx.post("/api/v1/auth/sign-in", {
      email: "owner@acmeservices.com",
      password: "OwnerPassword123!",
    });
    ownerToken = ownerLogin.body.accessToken;

    // Create a second tenant
    const reg2 = await ctx.post("/api/v1/auth/register", {
      email: "concurrency.tenant@corp.com",
      password: "Password123!",
      fullName: "Concurrency Tenant Owner",
      termsAccepted: true,
    });
    await ctx.post("/api/v1/auth/verify-email", {
      email: "concurrency.tenant@corp.com",
      code: reg2.body.previewCode,
    });
    const login2 = await ctx.post("/api/v1/auth/sign-in", {
      email: "concurrency.tenant@corp.com",
      password: "Password123!",
    });
    otherToken = login2.body.accessToken;

    const biz2 = await ctx.post(
      "/api/v1/businesses",
      { businessName: "Concurrency Second Corp", businessType: "Finance" },
      { authorization: `Bearer ${otherToken}` },
    );
    otherBusinessId = biz2.body.business.id;

    const accRes = await ctx.get("/api/v1/ledger/accounts", {
      authorization: `Bearer ${otherToken}`,
      "x-business-id": otherBusinessId,
    });
    otherAccountId = accRes.body[0].id;
  });

  after(async () => {
    await ctx.close();
  });

  it("Transaction Atomicity: Failed journal entry creation completely rolls back without orphaned rows", async () => {
    const entryCountBefore = ctx.db
      .prepare(
        "SELECT COUNT(*) as cnt FROM journal_entries WHERE business_id = ?",
      )
      .get(businessId) as { cnt: number };
    const lineCountBefore = ctx.db
      .prepare("SELECT COUNT(*) as cnt FROM journal_entry_lines")
      .get() as { cnt: number };

    // Attempt to post an unbalanced entry (should fail at validation and never insert)
    const res = await ctx.post(
      "/api/v1/ledger/entries",
      {
        entryDate: "2026-11-01",
        description: "Atomic failure test",
        lines: [
          { accountId: "acc_1000", debitCents: 50000, creditCents: 0 },
          { accountId: "acc_3000", debitCents: 0, creditCents: 49999 }, // Unbalanced by 1 cent!
        ],
      },
      {
        authorization: `Bearer ${ownerToken}`,
        "x-business-id": businessId,
      },
    );

    assert.equal(res.status, 400);

    const entryCountAfter = ctx.db
      .prepare(
        "SELECT COUNT(*) as cnt FROM journal_entries WHERE business_id = ?",
      )
      .get(businessId) as { cnt: number };
    const lineCountAfter = ctx.db
      .prepare("SELECT COUNT(*) as cnt FROM journal_entry_lines")
      .get() as { cnt: number };

    assert.equal(
      entryCountAfter.cnt,
      entryCountBefore.cnt,
      "No journal entry should be created",
    );
    assert.equal(
      lineCountAfter.cnt,
      lineCountBefore.cnt,
      "No journal entry lines should be created",
    );
  });

  it("Cross-Tenant Account Injection: Cannot use account from another business in journal entries", async () => {
    const res = await ctx.post(
      "/api/v1/ledger/entries",
      {
        entryDate: "2026-11-01",
        description: "Cross-tenant account injection attempt",
        lines: [
          { accountId: "acc_1000", debitCents: 50000, creditCents: 0 },
          { accountId: otherAccountId, debitCents: 0, creditCents: 50000 }, // From other tenant!
        ],
      },
      {
        authorization: `Bearer ${ownerToken}`,
        "x-business-id": businessId,
      },
    );

    assert.equal(res.status, 403);
    assert.equal(res.body.title, "Forbidden Account Reference");
  });

  it("Idempotency: Parallel requests with the same idempotency key return the identical invoice", async () => {
    const payload = {
      clientId: "cli_acme_client_001",
      issueDate: "2026-11-10",
      dueDate: "2026-11-24",
      idempotencyKey: "parallel-concurrent-idemp-key-777",
      items: [
        {
          description: "Concurrency Load Audit",
          quantity: 1,
          unitPriceCents: 85000,
        },
      ],
    };

    // Fire 5 concurrent requests with identical idempotencyKey
    const results = await Promise.all([
      ctx.post("/api/v1/invoices", payload, {
        authorization: `Bearer ${ownerToken}`,
        "x-business-id": businessId,
      }),
      ctx.post("/api/v1/invoices", payload, {
        authorization: `Bearer ${ownerToken}`,
        "x-business-id": businessId,
      }),
      ctx.post("/api/v1/invoices", payload, {
        authorization: `Bearer ${ownerToken}`,
        "x-business-id": businessId,
      }),
      ctx.post("/api/v1/invoices", payload, {
        authorization: `Bearer ${ownerToken}`,
        "x-business-id": businessId,
      }),
      ctx.post("/api/v1/invoices", payload, {
        authorization: `Bearer ${ownerToken}`,
        "x-business-id": businessId,
      }),
    ]);

    // All must succeed (201) and return the EXACT same invoice ID
    for (const res of results) {
      assert.equal(res.status, 201);
    }

    const firstInvoiceId = results[0].body.id;
    for (const res of results) {
      assert.equal(res.body.id, firstInvoiceId);
    }

    // Verify only 1 invoice exists in DB for this idempotency key
    const dbRows = ctx.db
      .prepare(
        "SELECT COUNT(*) as cnt FROM invoices WHERE business_id = ? AND idempotency_key = ?",
      )
      .get(businessId, payload.idempotencyKey) as { cnt: number };

    assert.equal(dbRows.cnt, 1);
  });

  it("Foreign Key Enforcement: SQLite pragma enforces referential integrity on financial tables", () => {
    assert.throws(
      () => {
        ctx.db
          .prepare(`
          INSERT INTO invoice_items (id, invoice_id, description, quantity, unit_price_cents, total_cents)
          VALUES ('invalid_item', 'non_existent_invoice_id', 'Orphan item', 1, 100, 100)
        `)
          .run();
      },
      /FOREIGN KEY constraint failed/i,
      "Direct DB insert with invalid foreign key must be blocked",
    );
  });
});
