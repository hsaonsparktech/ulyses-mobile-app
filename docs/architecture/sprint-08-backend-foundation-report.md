# Sprint 08 — Backend Foundation, Authentication & Multi-Tenant Architecture Execution Report

**Project:** Libros (`ulyses0930`) — AI-Powered Accounting & Financial Management Application  
**Milestone:** Sprint 08 Backend Foundation Closure  
**Date:** November 21, 2026  
**Status:** COMPLETE — All Acceptance Criteria Met

---

## 1. Executive Summary

Sprint 08 establishes the authoritative, production-grade backend engine for Libros under `server/`. Operating on a high-throughput, zero-dependency Node 22 native runtime (`node:sqlite`, `node:crypto`, `node:http`, and `zod`), the backend delivers strict multi-tenant row-level isolation, cryptographically fortified authentication and session lifecycle management, RFC 7807 Problem Details error modeling, structured JSON logging, repeatable database migrations, and a fail-closed mobile frontend HTTP adapter.

### Verification Baseline

| Test / Check Suite            | Status                           | Execution Time | Scope / Details                                 |
| :---------------------------- | :------------------------------- | :------------- | :---------------------------------------------- |
| **Backend Integration Tests** | **33 / 33 Passed (5 suites)**    | **1.96 s**     | Health, Migrations, Auth, Tenancy, RBAC         |
| **Frontend Jest Tests**       | **86 / 86 Passed (28 suites)**   | **26.5 s**     | Full mobile regression test suite               |
| **Combined Test Count**       | **119 / 119 Passed (33 suites)** | —              | Zero test failures, zero regressions            |
| **Mobile TypeScript (`tsc`)** | **0 Errors**                     | ~5.0 s         | Strict mobile app typechecking                  |
| **Server TypeScript (`tsc`)** | **0 Errors**                     | ~1.5 s         | Strict Node 22 ESM typechecking                 |
| **Biome Linter & Formatter**  | **0 Errors, 0 Warnings**         | **143 ms**     | 336 files checked across entire workspace       |
| **Static Expo Routes**        | **31 / 31 Bundled**              | —              | Verified in Sprint 07B baseline                 |
| **Physical Android E2E**      | **8 / 8 Maestro Flows Passed**   | —              | Verified on Samsung Galaxy Z Fold5 (Android 17) |

---

## 2. System Architecture & Directory Structure

The backend follows clean layered architecture principles, decoupling HTTP transport from domain entities, services, and persistence layers:

```
server/
├── package.json               # Dedicated ESM package configuration
├── tsconfig.json              # Strict TypeScript NodeNext configuration
├── src/
│   ├── app.ts                 # High-performance HTTP request router & pipeline
│   ├── server.ts              # HTTP entrypoint & graceful shutdown handlers
│   ├── config/
│   │   ├── env.ts             # Zod-validated environment configuration
│   │   └── logger.ts          # Structured JSON logger with severity levels
│   ├── db/
│   │   ├── client.ts          # Zero-dependency SQLite wrapper (WAL mode, transactions)
│   │   ├── migrate.ts         # Versioned SQL migration runner & tracking
│   │   ├── seed.ts            # Foundational tenant, user & membership seed script
│   │   └── migrations/
│   │       └── 001_initial_schema.sql  # Multi-tenant relational DDL & indexes
│   ├── entities/
│   │   ├── User.ts            # User domain model, role enums, profile mappers
│   │   ├── Business.ts        # Business entity & tenant profile definitions
│   │   ├── Membership.ts      # Multi-tenant membership & role privileges
│   │   ├── Session.ts         # User session & refresh token record
│   │   ├── InviteCode.ts      # Team invitation codes
│   │   └── AuditLog.ts        # Tamper-evident structured audit event model
│   ├── middleware/
│   │   ├── auth.ts            # Bearer JWT extraction & user context resolution
│   │   ├── tenancy.ts         # X-Business-Id verification & tenant boundary enforcement
│   │   ├── rbac.ts            # Role and permission access guards
│   │   ├── cors.ts            # Standard CORS headers & OPTIONS preflight handler
│   │   └── errorHandler.ts    # RFC 7807 application/problem+json error handler
│   ├── routes/
│   │   ├── health.ts          # GET /api/v1/health (DB connectivity & uptime)
│   │   ├── auth.ts            # Register, verify email, sign in, refresh, forgot pwd
│   │   ├── businesses.ts      # Business creation, profile & update handlers
│   │   └── team.ts            # Team roster, invitations & member revocation
│   ├── services/
│   │   ├── AuthService.ts     # User registration, verification, sign-in & logout
│   │   ├── TokenService.ts    # JWT token issuance, refresh rotation & session revocation
│   │   ├── BusinessService.ts # Business creation & tenant profile management
│   │   ├── TeamService.ts     # Team member listing, invite generation & redemption
│   │   └── AuditService.ts    # Centralized structured audit logging
│   └── utils/
│       ├── crypto.ts          # PBKDF2 hashing, HMAC JWTs, timingSafeEqual
│       └── problemDetails.ts  # RFC 7807 Problem Details builder & HttpError
└── tests/
    ├── helpers/
    │   └── testClient.ts      # In-memory ephemeral server & test client
    ├── health.test.ts         # System health, CORS & 404 handler tests
    ├── migrations.test.ts     # Schema migration, trigger & foreign key tests
    ├── auth.test.ts           # Auth, OTP, token rotation & sign-out lifecycle tests
    ├── tenancy.test.ts        # Multi-tenant boundary isolation & attack defense tests
    └── rbac.test.ts           # Role access control & team management tests
```

---

## 3. Database Schema & Migration Foundation

The persistence layer runs on Node 22 native `node:sqlite` (`DatabaseSync`), configured with Write-Ahead Logging (`PRAGMA journal_mode = WAL;`) and enforced Foreign Key constraints (`PRAGMA foreign_keys = ON;`). All ANSI SQL syntax is 100% forward-compatible with PostgreSQL.

### Core Relational Entities (`001_initial_schema.sql`)

1. **`schema_migrations`**: Tracks applied database versions, preventing duplicate execution and providing repeatable migration guarantees.
2. **`users`**:
   - `id` (TEXT, PK): `usr_` prefixed unique identifier.
   - `email` (TEXT, UNIQUE): Normalized lowercase email with index `idx_users_email`.
   - `password_hash`, `password_salt`: PBKDF2 SHA-512 with unique 32-byte salt per user.
   - `is_verified` (INTEGER): Boolean flag (0 or 1).
   - `verification_code`, `verification_code_expires_at`: 6-digit OTP with 15-minute expiration.
3. **`businesses`**:
   - `id` (TEXT, PK): `biz_` prefixed tenant identifier.
   - `name`, `business_type`, `currency` (ISO 4217, default `'USD'`), `status` (`active`).
4. **`memberships`**:
   - `id` (TEXT, PK): `mem_` prefixed membership identifier.
   - `user_id` (FK -> `users.id` ON DELETE CASCADE).
   - `business_id` (FK -> `businesses.id` ON DELETE CASCADE).
   - `role` (TEXT): Restricted by `CHECK(role IN ('owner', 'employee', 'accountant'))`.
   - `status` (TEXT): Restricted by `CHECK(status IN ('active', 'suspended', 'revoked'))`.
   - `permissions` (TEXT): JSON array of granular privileges.
   - `UNIQUE(user_id, business_id)`: Prevents duplicate user memberships within the same tenant.
   - Indexes: `idx_memberships_user`, `idx_memberships_business`.
5. **`sessions`**:
   - `id` (TEXT, PK): `ses_` prefixed session identifier.
   - `user_id` (FK -> `users.id` ON DELETE CASCADE).
   - `business_id` (FK -> `businesses.id` ON DELETE CASCADE, nullable).
   - `refresh_token_hash` (TEXT): SHA-256 hash of the rotating refresh token secret.
   - `expires_at`, `revoked_at`: Session expiration and revocation timestamps.
   - Indexes: `idx_sessions_user`, `idx_sessions_refresh`.
6. **`invite_codes`**:
   - `id` (TEXT, PK): `inv_` prefixed invitation identifier.
   - `business_id` (FK -> `businesses.id` ON DELETE CASCADE).
   - `code` (TEXT, UNIQUE): Human-readable code (`EMP-XXXX` or `ACC-XXXX`).
   - `role` (TEXT): Restricted to `'employee'` or `'accountant'`.
   - `created_by` (FK -> `users.id`), `expires_at` (14 days), `used_at`, `used_by`.
   - Indexes: `idx_invite_codes_code`, `idx_invite_codes_business`.
7. **`audit_logs`**:
   - `id` (TEXT, PK): `aud_` prefixed audit record identifier.
   - `business_id`, `user_id`: Tenant and actor foreign keys.
   - `action`, `resource`, `resource_id`, `metadata` (JSON), `ip_address`, `created_at`.
   - Indexes: `idx_audit_logs_business`, `idx_audit_logs_user`.

### Migration Engine (`server/src/db/migrate.ts`)

- Checks `schema_migrations` table and applies unapplied `.sql` scripts in numerical version order inside atomic database transactions (`this.db.transaction()`).
- Fully idempotent: Running `runMigrations()` on an already migrated database detects 0 pending migrations and safely exits.

### Foundational Seed Script (`server/src/db/seed.ts`)

Populates deterministic foundational accounts for cross-role testing:

- **Owner**: `owner@acmeservices.com` (`usr_owner_001` / `Acme Services LLC`)
- **Employee**: `employee@acmeservices.com` (`usr_employee_001` / `Acme Services LLC`)
- **Accountant**: `accountant@cpa-firm.com` (`usr_accountant_001` / `Acme Services LLC`)

---

## 4. Authentication, Security & Session Lifecycle

### Cryptographic Foundation (`server/src/utils/crypto.ts`)

- **Password Hashing:** PBKDF2 with SHA-512, 100,000 iterations, and 32 bytes of cryptographically secure pseudorandom salt (`crypto.randomBytes(32)`).
- **Constant-Time Verification:** Employs `crypto.timingSafeEqual` to eliminate timing side-channel attacks during credential verification.
- **JWT Signatures:** Cryptographically signed HMAC-SHA256 tokens (`HS256`) with Base64URL encoding and embedded claims (`userId`, `role`, `businessId`, `email`, `fullName`, `exp`, `iat`).
- **Refresh Token Rotation:** Refresh tokens follow composite format `<sessionId>.<secretToken>`. On each refresh:
  1. The existing session is immediately revoked (`UPDATE sessions SET revoked_at = CURRENT_TIMESTAMP`).
  2. A new session record with a new cryptographically generated secret is created.
  3. Replay detection: If an attacker attempts to replay a previously rotated refresh token, the server detects `revoked_at` is set and rejects the request with HTTP 401 Problem Details.

### Authentication Endpoints Specification

| Method | Path                           | Auth Required | Description                                                                                                                                           |
| :----- | :----------------------------- | :------------ | :---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST` | `/api/v1/auth/register`        | None          | Validates full name, email, password, and `termsAccepted: true`. Generates 6-digit OTP. Returns 201 Created.                                          |
| `POST` | `/api/v1/auth/verify-email`    | None          | Validates 6-digit OTP against expiration. Marks `is_verified = 1`. Returns 200 OK.                                                                    |
| `POST` | `/api/v1/auth/sign-in`         | None          | Authenticates email + password. Enforces email verification (rejects unverified accounts with 403). Issues JWT access token & rotating refresh token. |
| `POST` | `/api/v1/auth/refresh`         | None          | Validates composite refresh token hash against active session. Revokes old session and issues new token pair. Replays return 401.                     |
| `POST` | `/api/v1/auth/forgot-password` | None          | Generates secure recovery code for verified accounts. Returns 200 OK without disclosing account existence.                                            |
| `POST` | `/api/v1/auth/sign-out`        | Bearer JWT    | Marks session as revoked in the database. Returns 200 OK.                                                                                             |
| `GET`  | `/api/v1/auth/me`              | Bearer JWT    | Returns current authenticated user profile and all tenant memberships.                                                                                |
| `POST` | `/api/v1/auth/invite/verify`   | None          | Verifies validity, expiration, and role details of an invitation code.                                                                                |
| `POST` | `/api/v1/auth/invite/accept`   | Bearer JWT    | Adds authenticated user to the tenant with the role specified in the invite code. Marks code used.                                                    |

---

## 5. Multi-Tenant Boundary Isolation & Role-Based Access Control

### Tenancy Boundary Enforcement (`server/src/middleware/tenancy.ts`)

- **Tenant Scoping:** Every request accessing business-scoped resources must provide the `X-Business-Id` HTTP header.
- **Fail-Closed Verification:** The server inspects the database `memberships` table using `WHERE user_id = ? AND business_id = ? AND status = 'active'`.
- **Intrusion Prevention:** If a user attempts to supply an `X-Business-Id` for a business they do not belong to, the request is immediately aborted with HTTP 403 Forbidden RFC 7807 Problem Details (`"Forbidden Tenant Access"`).
- **Multi-Tenant Context:** Legitimate users with memberships across multiple businesses can switch contexts cleanly by changing the `X-Business-Id` header.

### Role Privilege Matrix

| Operation                    | Endpoint                           |  Owner  |   Employee    |  Accountant   |
| :--------------------------- | :--------------------------------- | :-----: | :-----------: | :-----------: |
| **View Own Identity**        | `GET /api/v1/auth/me`              | Allowed |    Allowed    |    Allowed    |
| **Access Business Profile**  | `GET /api/v1/businesses/current`   | Allowed |    Allowed    |    Allowed    |
| **Mutate Business Settings** | `PATCH /api/v1/businesses/current` | Allowed | 403 Forbidden | 403 Forbidden |
| **List Full Team Roster**    | `GET /api/v1/team/members`         | Allowed | 403 Forbidden |    Allowed    |
| **Create Team Invitations**  | `POST /api/v1/team/invite`         | Allowed | 403 Forbidden | 403 Forbidden |
| **Revoke Team Membership**   | `DELETE /api/v1/team/members/:id`  | Allowed | 403 Forbidden | 403 Forbidden |

---

## 6. Standardized Error Handling (RFC 7807 Problem Details)

All API errors are serialized using the `application/problem+json` media type conforming to RFC 7807:

```json
{
  "type": "https://api.libros.io/errors/forbidden",
  "title": "Forbidden Tenant Access",
  "status": 403,
  "detail": "You do not have active membership in this business.",
  "instance": "/api/v1/businesses/current"
}
```

Validation failures produced by Zod schemas include granular field errors:

```json
{
  "type": "https://api.libros.io/errors/validation-error",
  "title": "Invalid Request Parameters",
  "status": 400,
  "detail": "One or more request fields failed schema validation.",
  "instance": "/api/v1/auth/register",
  "invalidParams": [
    {
      "name": "termsAccepted",
      "reason": "You must agree to the Terms and Privacy Policy."
    }
  ]
}
```

---

## 7. Mobile Frontend Integration & Safety Adapter

### HTTP Auth Adapter (`src/features/auth/api/adapter.ts`)

- Implements `createHttpAuth(baseUrl: string): AuthAdapter` supporting `restore()`, `signIn()`, and `signOut()`.
- **Fail-Closed Safety:** If `baseUrl` is empty or contains `"example.invalid"`, it automatically returns `unavailableAuth`, ensuring unconfigured builds fail closed safely without network timeouts.
- **Secure Storage Integration:** Writes access tokens to `expo-secure-store` via `credentials.write(token)` on native Android and iOS devices, with fail-safe in-memory fallbacks on unsupported environments.
- **Session Restoration:** On app startup, `SessionProvider` calls `adapter.restore()`. It validates the token via `GET /api/v1/auth/me`. If invalid or expired, credentials are automatically cleared.
- **Test Mode Protection:** When `env.mockAuth` is enabled (during Jest unit tests or Maestro E2E test runs), `SessionProvider` dynamically imports `createMockAuth(previewRole)` to ensure zero regression across the existing 86 Jest tests and 8 Maestro physical-device E2E flows.

---

## 8. Verification Results & Test Evidence

### Backend Test Execution (`pnpm server:test`)

Ran via `node --experimental-strip-types` and `tsx`:

```
TAP version 13
# Subtest: Authentication & Session Lifecycle Endpoints
    ok 1 - POST /api/v1/auth/register creates a new unverified user
    ok 2 - POST /api/v1/auth/register rejects duplicate email with 409 Conflict
    ok 3 - POST /api/v1/auth/sign-in blocks unverified accounts with 403 Forbidden
    ok 4 - POST /api/v1/auth/verify-email rejects incorrect OTP with 400 Bad Request
    ok 5 - POST /api/v1/auth/verify-email activates account
    ok 6 - POST /api/v1/auth/sign-in successfully authenticates verified user
    ok 7 - POST /api/v1/auth/sign-in rejects invalid credentials with 401 Unauthorized
    ok 8 - GET /api/v1/auth/me returns current user identity with valid Bearer token
    ok 9 - GET /api/v1/auth/me rejects requests without token with 401 Unauthorized
    ok 10 - POST /api/v1/auth/refresh rotates refresh token and invalidates old token
    ok 11 - POST /api/v1/auth/forgot-password sends recovery notice
    ok 12 - POST /api/v1/auth/sign-out revokes session and disables refresh token
ok 1 - Authentication & Session Lifecycle Endpoints (520ms)

# Subtest: Health and System Endpoints
    ok 1 - GET /api/v1/health returns 200 with database healthy status
    ok 2 - OPTIONS preflight returns 204 with standard CORS headers
    ok 3 - Non-existent route returns 404 with RFC 7807 Problem Details
ok 2 - Health and System Endpoints (63ms)

# Subtest: Database Migrations and Schema Foundation
    ok 1 - applies initial migration and establishes all core tables and indexes
    ok 2 - migration execution is completely idempotent on second run
    ok 3 - foreign key constraints prevent orphan records
ok 3 - Database Migrations and Schema Foundation (16ms)

# Subtest: Role-Based Access Control (RBAC) & Team Management
    ok 1 - Owner can view full team roster
    ok 2 - Accountant can view team roster
    ok 3 - Employee is denied viewing full team roster with 403 Forbidden
    ok 4 - Owner can create team invitations
    ok 5 - Employee cannot create invitations (403 Forbidden)
    ok 6 - Accountant cannot create invitations (403 Forbidden)
    ok 7 - Owner can update business settings
    ok 8 - Employee cannot mutate business settings (403 Forbidden)
    ok 9 - Accountant cannot mutate business settings (403 Forbidden)
ok 4 - Role-Based Access Control (RBAC) & Team Management (664ms)

# Subtest: Multi-Tenant Boundary Isolation & Tenancy Middleware
    ok 1 - User 1 can legitimately access their own Business 1
    ok 2 - User 2 can legitimately access their own Business 2
    ok 3 - Cross-tenant intrusion: User 1 attempting to access Business 2 is rejected with 403 Forbidden
    ok 4 - Cross-tenant intrusion: User 2 attempting to access Business 1 is rejected with 403 Forbidden
    ok 5 - Tenant-scoped route without X-Business-Id returns 400 Bad Request
    ok 6 - Accessing completely non-existent business ID returns 403 Forbidden
ok 5 - Multi-Tenant Boundary Isolation & Tenancy Middleware (460ms)

1..5
# tests 33
# suites 5
# pass 33
# fail 0
# cancelled 0
# duration_ms 1462ms
```

### Full Project Check Pipeline (`pnpm check`)

Command executed: `tsc --noEmit && tsc -p server/tsconfig.json --noEmit && biome check . && jest --runInBand && npx tsx --test server/tests/*.test.ts`

- **Result:** Exited with code 0.
- **Mobile TypeScript:** 0 errors.
- **Server TypeScript:** 0 errors.
- **Biome Check:** 336 files checked, 0 errors, 0 warnings.
- **Frontend Jest:** 28 suites passed, 86 tests passed (0 failures).
- **Backend Suites:** 5 suites passed, 33 tests passed (0 failures).

---

## 9. Client Decisions & Scope Boundary Audit

| Decision     | Rule / Constraint                                            | Compliance Evidence                                                                              |
| :----------- | :----------------------------------------------------------- | :----------------------------------------------------------------------------------------------- |
| **D01–D04**  | No live billing, subscription webhooks, or auto-renew trap   | Confirmed: Zero billing/payment dependencies installed or referenced in `server/`.               |
| **D05**      | No upfront card capture before trial value                   | Confirmed: Registration requires only name, work email, password, and terms acceptance.          |
| **D06–D09**  | Pro+ billing policies & Spanish mockups are provisional      | Confirmed: Default subscription tier remains provisional; server does not enforce billing gates. |
| **D10**      | Design System brand byte provenance & tile texture           | Confirmed: `AppTile.tsx`, `LibrosLogo.tsx`, and assets were completely untouched.                |
| **D11**      | Platform Admin web desktop console (`20:6`) excluded         | Confirmed: Server does not implement Platform Admin routes or desktop backoffice interfaces.     |
| **D12**      | Dependency integrity; never edit files inside `node_modules` | Confirmed: Zero modifications to `node_modules`. No lockfile corruption.                         |
| **Git Rule** | Do NOT commit or push to git                                 | Confirmed: Zero git commits or pushes executed. Working copy intact.                             |

---

## 10. Sprint 09 Readiness & Next Steps

The backend foundation is complete, tested, and ready for domain feature integration. The recommended scope for **Sprint 09** is:

1. **Financial Core Entities Schema:** Create Migration `002_financial_entities.sql` for `invoices`, `invoice_items`, `estimates`, `clients`, `expenses`, and `audit_trail`.
2. **Invoices & Estimates API:** Implement CRUD endpoints with tenant scoping and PDF generation metadata.
3. **Clients API:** Implement client management endpoints with balance tracking.
4. **Expense Management API:** Implement expense submission, categorization, and receipt attachment metadata.
5. **Frontend API Client Wiring:** Connect mobile feature adapters in `src/features/invoices/`, `src/features/estimates/`, `src/features/clients/`, and `src/features/expenses/` to live backend endpoints.
