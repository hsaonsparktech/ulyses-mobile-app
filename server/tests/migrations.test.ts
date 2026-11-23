import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { Database } from "../src/db/client";
import { MigrationRunner, runMigrations } from "../src/db/migrate";

describe("Database Migrations and Schema Foundation", () => {
  it("applies initial migration and establishes all core tables and indexes", () => {
    const db = new Database(":memory:");
    const runner = new MigrationRunner(db);

    const initialResult = runner.applyPending();
    assert.equal(initialResult.applied.length, 4);
    assert.equal(initialResult.total, 4);

    // Verify tables exist
    const tables = db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name ASC",
      )
      .all()
      .map((r: Record<string, unknown>) => r.name as string);

    assert.ok(tables.includes("schema_migrations"));
    assert.ok(tables.includes("users"));
    assert.ok(tables.includes("businesses"));
    assert.ok(tables.includes("memberships"));
    assert.ok(tables.includes("sessions"));
    assert.ok(tables.includes("invite_codes"));
    assert.ok(tables.includes("audit_logs"));
    // Financial entities
    assert.ok(tables.includes("accounts"));
    assert.ok(tables.includes("journal_entries"));
    assert.ok(tables.includes("journal_entry_lines"));
    assert.ok(tables.includes("clients"));
    assert.ok(tables.includes("invoices"));
    assert.ok(tables.includes("invoice_items"));
    assert.ok(tables.includes("estimates"));
    assert.ok(tables.includes("estimate_items"));
    assert.ok(tables.includes("expenses"));
    // Document and OCR entities
    assert.ok(tables.includes("documents"));
    assert.ok(tables.includes("document_ocr_results"));
    // Idempotency entity
    assert.ok(tables.includes("idempotency_keys"));

    // Verify unique and foreign key indexes
    const indexes = db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'index'")
      .all()
      .map((r: Record<string, unknown>) => r.name as string);

    assert.ok(indexes.includes("idx_users_email"));
    assert.ok(indexes.includes("idx_memberships_user"));
    assert.ok(indexes.includes("idx_memberships_business"));
    assert.ok(indexes.includes("idx_sessions_user"));
    assert.ok(indexes.includes("idx_sessions_refresh"));
    assert.ok(indexes.includes("idx_invite_codes_code"));
    assert.ok(indexes.includes("idx_audit_logs_business"));
    assert.ok(indexes.includes("idx_accounts_business"));
    assert.ok(indexes.includes("idx_journal_entries_business"));
    assert.ok(indexes.includes("idx_invoices_business"));
    assert.ok(indexes.includes("idx_clients_business"));
    assert.ok(indexes.includes("idx_expenses_business"));
    assert.ok(indexes.includes("idx_documents_business"));
    assert.ok(indexes.includes("idx_ocr_results_document"));
    assert.ok(indexes.includes("idx_idempotency_lookup"));

    db.close();
  });

  it("migration execution is completely idempotent on second run", () => {
    const db = new Database(":memory:");
    const runner = new MigrationRunner(db);

    runner.applyPending();
    const secondResult = runner.applyPending();

    assert.equal(secondResult.applied.length, 0);
    assert.equal(secondResult.total, 4);

    db.close();
  });

  it("foreign key constraints prevent orphan records", () => {
    const db = new Database(":memory:");
    runMigrations(db);

    // Attempting to insert a membership with a non-existent business_id must throw FK constraint error
    assert.throws(() => {
      db.prepare(`
          INSERT INTO memberships (id, user_id, business_id, role, status)
          VALUES ('mem_1', 'usr_fake', 'biz_fake', 'owner', 'active')
        `).run();
    }, /FOREIGN KEY constraint failed/);

    db.close();
  });
});
