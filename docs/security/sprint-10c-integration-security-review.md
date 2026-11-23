# Sprint 10C — Integration Security & Safeguards Review

**Project:** `ulyses0930` / Libros — AI-Powered Accounting & Financial Management Application  
**Milestone:** Sprint 10C — Real Backend Android E2E, Integration Hardening & Acceptance  
**Date:** November 22, 2026  
**Status:** **PASSED / ACCEPTED**

---

## 1. Security Architecture & Threat Model

The Libros system operates in a multi-tenant business environment with distinct user personas: Owner, Employee, and External Accountant. The backend security architecture implements defensive depth across authentication, authorization, multi-tenant data isolation, rate limiting, and filesystem storage.

---

## 2. Security Controls & Verification Evidence

### 2.1 Fail-Closed Production Configuration & Secret Gating

- **Startup Gate:** In `server/src/config/env.ts`, when `NODE_ENV === "production"`, the server enforces strict secret entropy.
- **Verification (`server/tests/security-gate.test.ts`):**
  - Supplying the default development secret (`libros-dev-super-secret-jwt-key...`) in production aborts startup with a fatal error.
  - Secrets shorter than 32 characters or lacking adequate entropy are rejected.
  - A cryptographically secure 256-bit secret is required for production boot.

### 2.2 Token Lifecycle & Session Revocation

- **Access Tokens:** Signed with HMAC-SHA256 (`HS256`) with a strict 15-minute lifespan (`exp: 900s`).
- **Refresh Tokens:** High-entropy random hex tokens stored hashed in SQLite (`refresh_tokens` table) with a 30-day expiry.
- **Refresh Rotation:** Each call to `POST /api/v1/auth/refresh` immediately marks the existing refresh token as `revoked_at = CURRENT_TIMESTAMP` and issues a new pair. Replay of an old refresh token is detected and blocked.
- **Immediate Sign-Out Revocation:** Calling `POST /api/v1/auth/sign-out` immediately marks the active session as `revoked_at = CURRENT_TIMESTAMP` in the SQLite `sessions` table. Subsequent calls with that session token are immediately rejected (`401 Unauthorized`).

### 2.3 Sliding-Window Rate Limiting

- **Implementation:** In-memory sliding window rate limiter (`server/src/middleware/rateLimit.ts`).
- **Thresholds:**
  - Sensitive auth endpoints (`/sign-in`, `/register`, `/verify-email`): 10 requests per minute per IP.
  - Financial mutation endpoints: 30 requests per minute per IP.
- **Problem Details Response:** When exceeded, the server returns HTTP `429 Too Many Requests` formatted as RFC 7807 problem details (`"Rate limit exceeded. Please wait before making more requests."`).

### 2.4 Multi-Tenant Boundary Isolation

- **Enforcement Mechanism:** `tenancyMiddleware` (`server/src/middleware/tenancy.ts`).
- **Rules:**
  1. All business-scoped routes require the `X-Business-Id` header.
  2. The authenticated user must possess an active record in `business_memberships` for that specific `business_id`.
  3. Every SQL query includes `WHERE business_id = ?` to prevent cross-tenant record leakage.
- **Penetration Testing:** Cross-tenant access attempts were tested across all endpoints (Clients, Invoices, Estimates, Expenses, Documents, Ledger). In 100% of cases, requests were rejected with `403 Forbidden` or `404 Not Found`.

### 2.5 Strict Role-Based Access Control (RBAC)

Financial mutation capabilities are strictly restricted to authorized roles:

| Endpoint & Operation             | Owner | Employee | Accountant | Enforcement Behavior                          |
| :------------------------------- | :---: | :------: | :--------: | :-------------------------------------------- |
| Create / Edit / Delete Client    |   ✓   |    ✗     |     ✗      | `403 Forbidden` (`INSUFFICIENT_PERMISSIONS`)  |
| Create / Send Invoice            |   ✓   |    ✗     |     ✗      | `403 Forbidden` (`INSUFFICIENT_PERMISSIONS`)  |
| Record Invoice Payment           |   ✓   |    ✗     |     ✗      | `403 Forbidden` (`INSUFFICIENT_PERMISSIONS`)  |
| Convert Estimate to Invoice      |   ✓   |    ✗     |     ✗      | `403 Forbidden` (`INSUFFICIENT_PERMISSIONS`)  |
| Submit Expense Draft             |   ✓   |    ✓     |     ✗      | `403 Forbidden` (`INSUFFICIENT_PERMISSIONS`)  |
| Approve / Reject Expense         |   ✓   |    ✗     |     ✗      | `403 Forbidden` (`INSUFFICIENT_PERMISSIONS`)  |
| Trigger OCR Scan / Review Scan   |   ✓   |    ✗     |     ✗      | `403 Forbidden` (`INSUFFICIENT_PERMISSIONS`)  |
| View Trial Balance / P&L Reports |   ✓   |    ✗     |     ✓      | Read-only allowed; all mutations return `403` |

### 2.6 Client Decision Safeguards (`D01`–`D12`)

- **`D01`–`D03` (No Live Card Charging):** No external payment gateways are invoked; payment recording is ledger-only.
- **`D04`–`D06` (No Fabricated Data / Fake Customer PII):** All tests use synthetic test fixtures with `.invalid` or `@example.com` domains.
- **`D07`–`D09` (Provisional OCR / AI Policies):** OCR extraction responses carry `provisional: true`; scans never touch the general ledger without Owner review.
- **`D10`–`D12` (Platform Admin Console Gate):** System admin consoles and cross-tenant billing administration remain unexposed, preserving client privacy.
