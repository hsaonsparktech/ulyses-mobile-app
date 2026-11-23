# ADR 001: Selection of Node.js 22 & Embedded SQLite for Local/Provisional Backend Foundation

## Status

**Provisional / Development Baseline** (Production PostgreSQL HA Migration Path Defined)

## Context

During Sprint 08 and Sprint 09, Libros implemented a zero-dependency backend service running on Node.js 22 with native `node:sqlite` (`DatabaseSync`), strict TypeScript, and `zod` validation. This architectural choice provided zero dependency bloat, guaranteed 100% lockfile integrity for the Expo React Native mobile project, and enabled millisecond-fast test cycles with zero external daemon prerequisites (Docker, PostgreSQL server).

However, as Libros advances toward multi-tenant accounting and enterprise deployment, the database stack must be formally evaluated against production accounting and scalability criteria.

## Evaluation & Operational Dimensions

### 1. Expected Deployment Topology

- **Current / Development Topology:** Single-instance Node.js process with embedded SQLite database running in Write-Ahead Logging (`WAL`) mode located at `./data/libros.db`.
- **Target Production Topology:** Horizontally scalable Node.js API instances behind a load balancer (AWS ALB / Cloudflare), connected to a managed, multi-AZ relational database cluster (AWS Aurora PostgreSQL or GCP Cloud SQL PostgreSQL) with read replicas and automated failover.

### 2. Concurrent Users & Database Writes

- **SQLite Single-Writer Limit:** SQLite enforces database-level write serialization. While WAL mode enables concurrent readers (`readers do not block writers, writers do not block readers`), only one write transaction can execute at any instant.
- **Suitability Threshold:** Suitable for single-tenant local edge appliances, development, CI test pipelines, and small business deployments with low write concurrency (< 100 writes/second).
- **Production Enterprise Requirement:** Multi-tenant SaaS accounting where hundreds of tenants simultaneously submit expenses, generate invoices, and post journal entries requires row-level locking provided by PostgreSQL (MVCC).

### 3. Transaction Guarantees & ACID Compliance

- SQLite in WAL mode provides full ACID guarantees (`BEGIN IMMEDIATE`, `COMMIT`, `ROLLBACK`) with serializable transaction isolation.
- Both SQLite and PostgreSQL guarantee atomic multi-row ledger posting, ensuring that debit/credit balancing invariants are never partially committed.

### 4. Backup & Disaster Recovery

- **SQLite:** Requires `sqlite3_backup` API or filesystem snapshotting during quiet periods or VACUUM INTO commands. Prone to corruption if backed up via naive file copy while active writes occur.
- **PostgreSQL:** Point-In-Time Recovery (PITR), Continuous Archiving via WAL shipping, automated daily logical dumps (`pg_dump`), and zero-downtime physical snapshots.

### 5. Storage Encryption Requirements

- Financial data under SOC 2, PCI-DSS, and GDPR mandates encryption at rest:
  - **SQLite:** Requires OS-level full disk encryption (BitLocker, LUKS) or SQLite Encryption Extension (SEE/SQLCipher).
  - **PostgreSQL:** Supported natively via KMS/envelope encryption (AWS KMS, GCP Cloud KMS) and column-level encryption (`pgcrypto`).

### 6. Migration Strategy & Compatibility

- All SQL schemas authored in `server/src/db/migrations/` adhere strictly to standard ANSI SQL:
  - Table definitions (`CREATE TABLE`, `CHECK`, `FOREIGN KEY ... ON DELETE CASCADE/SET NULL`)
  - B-tree indexing (`CREATE INDEX`)
  - Monetary values stored strictly as 64-bit integer cents (`INTEGER` / `BIGINT`)
- **Migration Path:** The schema and repository queries are designed for 100% plug-and-play migration to PostgreSQL. A dialect adapter or Knex/Drizzle database provider will swap the low-level connection pool without altering domain models or services.

### 7. Multi-Instance & Scaling Limitations

- Embedded SQLite cannot be shared across multiple horizontal container instances without distributed networked filesystems (which introduce network latency and lock hazards).
- Horizontal autoscaling in Kubernetes or ECS requires a dedicated external database service.

## Decision & Actionable Gate

1. **Designate Current Stack as Provisional:**
   - Formal production architecture approval for embedded SQLite is **NOT** granted for enterprise SaaS multi-tenant hosting.
   - The current Node.js 22 + `node:sqlite` implementation is designated as the **Authoritative Development & Single-Node Baseline**.
2. **Proceed Without Production Assumptions:**
   - Implement all Sprint 09 core financial logic, double-entry ledger invariants, tenant isolation, and validation using ANSI SQL.
   - Strictly prohibit any SQLite-proprietary SQL syntax or workarounds that would break PostgreSQL compatibility.
   - Ensure all monetary amounts are stored as integer cents (`INTEGER`).
3. **Future Production Migration Milestone:**
   - When multi-instance container orchestration is provisioned, execute the database provider swap to PostgreSQL using the identical migration schema and entity contracts.
