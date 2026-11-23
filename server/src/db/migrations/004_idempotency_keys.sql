-- Migration 004: Distributed Idempotency Key Store
-- Guarantees atomic once-and-only-once execution for financial state mutations.
-- Caches results for identical requests; rejects conflicting payloads with 409 Conflict.

CREATE TABLE IF NOT EXISTS idempotency_keys (
  key TEXT NOT NULL,
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id),
  endpoint TEXT NOT NULL,
  request_hash TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  response_body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (business_id, key)
);

CREATE INDEX IF NOT EXISTS idx_idempotency_lookup ON idempotency_keys(business_id, key);
