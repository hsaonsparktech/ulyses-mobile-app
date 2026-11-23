# Sprint 10C — Financial Accounting Integrity & Double-Entry Ledger Verification

**Project:** `ulyses0930` / Libros — AI-Powered Accounting & Financial Management Application  
**Milestone:** Sprint 10C — Real Backend Android E2E, Integration Hardening & Acceptance  
**Date:** November 22, 2026  
**Status:** **PASSED / VERIFIED**

---

## 1. Overview & Double-Entry Accounting Invariants

Under the Libros engineering standards and Client Decisions `D01`–`D12`, the backend ledger is authoritative. Financial numbers are stored strictly as integer cents (`INTEGER`), preventing IEEE 754 floating-point inaccuracies. Every journal entry committed to the general ledger must strictly satisfy the double-entry equation:

$$\sum \text{Debit Cents} = \sum \text{Credit Cents}$$

Sprint 10C verified this invariant against live SQLite tables in `./data/libros.db` through real HTTP API executions.

---

## 2. Real Financial Workflow Executions

### 2.1 Owner Invoice Creation & Persistence

- **Endpoint:** `POST /api/v1/invoices`
- **Request Payload:**
  - Client ID: `cli_acme_client_001` (Acme Consulting Client)
  - Issue Date: `2026-11-22`
  - Due Date: `2026-12-22`
  - Line Items:
    1. Financial Audit & Compliance: `10` hours @ `$250.00` (`25000` cents) = `$2,500.00` (`250000` cents)
    2. Tax Preparation Package: `1` item @ `$1,000.00` (`100000` cents) = `$1,000.00` (`100000` cents)
  - Subtotal: `$3,500.00` (`350000` cents)
  - Tax (10%): `$350.00` (`35000` cents)
  - Total: `$3,850.00` (`385000` cents)
- **Database Verification:**
  - `SELECT * FROM invoices WHERE id = ?` confirmed `subtotal_cents = 350000`, `tax_cents = 35000`, `total_cents = 385000`, `balance_due_cents = 385000`, `status = 'draft'`.
  - `SELECT COUNT(*) FROM invoice_line_items WHERE invoice_id = ?` returned `2`.

### 2.2 Invoice Sending & General Ledger Posting

- **Endpoint:** `POST /api/v1/invoices/:id/send`
- **Action:** Changes invoice status from `draft` to `sent` and posts an Accounts Receivable entry to the General Ledger.
- **Ledger Verification (`journal_entries` & `journal_entry_lines`):**
  - Invoice references `journal_entry_id` (foreign key constraint).
  - Debits:
    - Account `1200` (Accounts Receivable): `Debit = 385000` cents ($3,850.00).
  - Credits:
    - Account `4000` (Revenue): `Credit = 350000` cents ($3,500.00).
    - Account `2200` (Sales Tax Payable): `Credit = 35000` cents ($350.00).
  - Balance Verification:
    $$\text{Total Debits} = 385000 \quad \text{Total Credits} = 350000 + 35000 = 385000$$
    $$\text{Debit} - \text{Credit} = 0 \quad (\text{Strictly Balanced})$$

### 2.3 Payment Recording & AR Relief

- **Endpoint:** `POST /api/v1/invoices/:id/payments`
- **Request Payload:**
  - Payment Amount: `$3,850.00` (`385000` cents)
  - Payment Method: `Bank Transfer`
  - Reference: `WIRE-20261122-01`
- **Response Verification:**
  - `status: "paid"`, `amountPaidCents: 385000`, `balanceDueCents: 0`.
- **Ledger Verification:**
  - Debits:
    - Account `1000` (Operating Cash Account): `Debit = 385000` cents ($3,850.00).
  - Credits:
    - Account `1200` (Accounts Receivable): `Credit = 385000` cents ($3,850.00).
  - Balance Verification:
    $$\text{Debit Cash} (385000) = \text{Credit AR} (385000)$$
    Accounts Receivable is completely relieved.

### 2.4 Employee Expense Submission & Owner Ledger Posting (Accrual vs. Cash Reconciliation)

- **Employee Submission:**
  - Employee `employee@acmeservices.com` calls `POST /api/v1/expenses`.
  - Category: `Software`, Amount: `$249.00` (`24900` cents).
  - Status in SQLite: `pending`. No ledger posting is allowed at draft/submission time.
- **Owner Approval (Accrual Recognition):**
  - Owner `owner@acmeservices.com` calls `POST /api/v1/expenses/:id/approve`.
  - Status transitions to `approved`.
  - Triggers General Ledger entry (Accrued Liability Recognition):
    - Account `5000` (General Operating Expenses): `Debit = 24900` cents ($249.00).
    - Account `2000` (Accounts Payable): `Credit = 24900` cents ($249.00).
  - Strict balance verified: `Debit (24900) = Credit (24900)`.
- **Payment / Reimbursement Settlement (Cash Relief Event):**
  - Distinct subsequent settlement event:
    - Account `2000` (Accounts Payable): `Debit = 24900` cents ($249.00).
    - Account `1000` (Operating Cash): `Credit = 24900` cents ($249.00).
  - Reconciled against `server/src/services/ExpenseService.ts` lines 206–236: Approval posts the accrued liability to Accounts Payable (`2000`) and Operating Expenses (`5000`); cash relief is a separate reimbursement execution. Accounts Payable is credited upon approval, ensuring rigorous double-entry balance and accrual GAAP compliance.

### 2.5 Role-Based Authorization & Tenant Boundary Enforcement

1. **Accountant Role Protection:**
   - External CPA (`accountant@cpa-firm.com`) requests `GET /api/v1/ledger/accounts` -> `200 OK` (trial balance read access).
   - External CPA attempts `POST /api/v1/invoices` -> `403 Forbidden` (`INSUFFICIENT_PERMISSIONS`).
   - External CPA attempts `POST /api/v1/expenses/:id/approve` -> `403 Forbidden` (`INSUFFICIENT_PERMISSIONS`).
2. **Cross-Tenant Intrusion Protection:**
   - User authenticated under Tenant B requests `GET /api/v1/invoices/:id` belonging to Tenant A -> `403 Forbidden` (`TENANT_MISMATCH`).
   - Prevents unauthorized financial data leakage across business entities.

---

## 3. Idempotency & Concurrency Stress Testing

Under high-latency mobile conditions (e.g. cellular handoffs), duplicate requests can cause duplicate billing or ledger entries if not properly protected.

### 3.1 Identical Request Replay

- When a client sends a retry with the exact same `Idempotency-Key` and matching body within the 24-hour retention window:
  - The server returns the cached response with header `Idempotency-Replay: true`.
  - Zero duplicate rows are inserted into `invoices` or `journal_entries`.

### 3.2 Payload Mismatch Detection

- When an `Idempotency-Key` is reused with a different request payload:
  - The server rejects the request with HTTP `409 Conflict` (RFC 7807 problem details: `"Idempotency Key Conflict: Request payload does not match original request"`).

### 3.3 High Concurrency Race Condition Test

- 5 simultaneous parallel requests were dispatched using `Promise.all` with the identical `Idempotency-Key`:
  - Exactly 1 request executed the transactional insert.
  - The remaining 4 concurrent requests resolved to the identical invoice response without error.
  - Direct database query confirmed exactly 1 invoice was created in SQLite.
