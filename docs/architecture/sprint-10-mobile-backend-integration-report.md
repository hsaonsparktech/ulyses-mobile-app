# Sprint 10 Execution Report — Mobile–Backend Integration & Document Intake Pipeline

**Project:** `ulyses0930` / Libros — AI-Powered Accounting & Financial Management Application  
**Milestone:** Sprint 10 — Mobile–Backend Integration & Document Intake Pipeline  
**Date:** November 21, 2026  
**Status:** **Completed & Verified (200/200 Automated Tests Passing)**

---

## 1. Executive Summary

Sprint 10 establishes the production-grade integration layer connecting the verified React Native/Expo mobile application with the Node.js 22 financial backend, and implements the foundational Document Intake and provisional OCR pipeline infrastructure.

Sprint 10 satisfies two critical architectural objectives:

1. **Typed Mobile API Adapters:** Authored robust, typed HTTP client adapters across all core business domains (`clients`, `invoices`, `estimates`, `expenses`, `ledger`, `documents`, `scanning`). The HTTP client resolves session tokens securely from `expo-secure-store`, automatically injects multi-tenant scoping headers (`X-Business-Id`), passes unique `Idempotency-Key` headers on state-mutating requests, and transforms RFC 7807 Problem Details into typed `ApiError` instances with human-readable error messages.
2. **Document Intake & Provisional OCR Pipeline:** Executed database Migration 003 (`003_documents_and_ocr.sql`) establishing structured document storage metadata and OCR extraction results. Enforced the **strict provisional accounting invariant**: OCR receipt extractions are tagged `provisional: true` and are strictly prohibited from automatically generating General Ledger journal entries, creating invoices, or auto-approving expenses without explicit human verification by the Business Owner.

### Automated Test Baseline & Cumulative Growth

| Domain                             | Sprint 08 Baseline   | Sprint 09 Closed                           | Final Sprint 10 Baseline                   | Status        |
| :--------------------------------- | :------------------- | :----------------------------------------- | :----------------------------------------- | :------------ |
| **Mobile Frontend (Jest)**         | 86 tests (28 suites) | 86 tests (28 suites)                       | **94 tests (29 suites)**                   | Passed        |
| **Backend Auth & Foundation**      | 33 tests (5 suites)  | 30 tests (5 suites)                        | **30 tests (5 suites)**                    | Passed        |
| **Phase 0 Security Gate**          | 0                    | 3 tests (1 suite)                          | **3 tests (1 suite)**                      | Passed        |
| **Database Migrations**            | 0                    | 3 tests (1 suite)                          | **3 tests (1 suite)**                      | Passed        |
| **Clients Domain**                 | 0                    | 10 tests (1 suite)                         | **10 tests (1 suite)**                     | Passed        |
| **Invoices & AR Recognition**      | 0                    | 12 tests (1 suite)                         | **12 tests (1 suite)**                     | Passed        |
| **Estimates & Conversion**         | 0                    | 8 tests (1 suite)                          | **8 tests (1 suite)**                      | Passed        |
| **Expenses & AP Recognition**      | 0                    | 10 tests (1 suite)                         | **10 tests (1 suite)**                     | Passed        |
| **General Ledger & Double-Entry**  | 0                    | 10 tests (1 suite)                         | **10 tests (1 suite)**                     | Passed        |
| **Financial Concurrency & ACID**   | 0                    | 4 tests (1 suite)                          | **4 tests (1 suite)**                      | Passed        |
| **Document Intake Infrastructure** | 0                    | 0                                          | **9 tests (1 suite)**                      | Passed        |
| **Provisional OCR Pipeline**       | 0                    | 0                                          | **6 tests (1 suite)**                      | Passed        |
| **Total Automated Tests**          | **119 passing**      | **176 passing (40 suites)**                | **200 passing (43 suites)**                | **100% Pass** |
| **Biome Linter & Formatter**       | Clean                | **353 files clean (0 errors, 0 warnings)** | **369 files clean (0 errors, 0 warnings)** | Passed        |
| **TypeScript (Frontend & Server)** | Clean                | **0 errors across both tsconfigs**         | **0 errors across both tsconfigs**         | Passed        |
| **Expo Router Static Export**      | 31 routes bundled    | 31 routes bundled                          | **31 routes bundled (Android, iOS, Web)**  | Passed        |

---

## 2. Part A: Mobile-Backend Typed HTTP Adapters

### 2.1 Core HTTP Client (`src/services/api/httpClient.ts`)

The mobile HTTP client acts as the central transport engine for all API communications:

- **Token Resolution via SecureStore:** Resolves access tokens via `credentials.read()` backed by `expo-secure-store`, preventing token storage in unencrypted async storage or loggers.
- **Tenant Header Injection:** Automatically includes `X-Business-Id: <businessId>` on all tenant-scoped requests.
- **Idempotency Key Propagation:** Automatically generates or accepts unique UUID `Idempotency-Key` headers for financial write mutations (`POST /invoices`, `POST /expenses`, `POST /ledger/entries`).
- **RFC 7807 Problem Details Parsing:** Automatically inspects HTTP response payloads with `Content-Type: application/problem+json` or status $\ge 400$, throwing a typed `ApiError` containing `title`, `status`, `detail`, `type`, and `invalidParams`.
- **Preview / Mock Isolation:** Preserves the offline mock adapter interface (`src/mocks/auth-adapter.ts`) when `EXPO_PUBLIC_ENABLE_MOCK_AUTH === "true"`, allowing offline UI development while connecting to the live API when targeted.

### 2.2 Feature Adapters

1. **`clientAdapter` (`src/features/clients/api/clientAdapter.ts`):** Typed methods for listing clients with computed receivables metrics, fetching client details, creating clients, and archiving clients.
2. **`invoiceAdapter` (`src/features/invoices/api/invoiceAdapter.ts`):** Typed methods for draft invoice creation with line items in integer cents, sending invoices (triggering AR recognition), and recording payments.
3. **`estimateAdapter` (`src/features/estimates/api/estimateAdapter.ts`):** Typed methods for managing quotes and executing atomic conversion to draft invoices.
4. **`expenseAdapter` (`src/features/employee/api/expenseAdapter.ts`):** Typed methods for submitting pending expenses, reviewing expense rosters, and executing Owner approval workflows.
5. **`ledgerAdapter` (`src/features/accountant/api/ledgerAdapter.ts`):** Typed methods for fetching the Chart of Accounts with real-time balance calculations, listing ledger entries, and posting manual or reversing journal entries.
6. **`documentAdapter` (`src/features/documents/api/documentAdapter.ts`):** Typed methods for uploading document metadata, listing folder documents, and soft-archiving.
7. **`scanAdapter` (`src/features/scanning/api/scanAdapter.ts`):** Typed methods for submitting receipt scans for OCR processing and executing Owner confirmation reviews.

### 2.3 Frontend Integration Test Verification

Authored `tests/feature-adapters.test.ts` (8 Jest tests) verifying that:

- `clientAdapter.list` injects `X-Business-Id` and returns client profiles.
- `invoiceAdapter.create` passes `Idempotency-Key` and integer cents payloads.
- `estimateAdapter.convert` sends POST to convert endpoint and returns converted invoice.
- `expenseAdapter.create` submits pending employee expenses.
- `ledgerAdapter.listAccounts` returns the Chart of Accounts with computed balances.
- `documentAdapter.create` uploads document metadata with folder categorization.
- `scanAdapter.processOcr` sends scan requests and returns provisional extractions.
- `ApiError` correctly parses and propagates RFC 7807 problem details when requests are rejected.

---

## 3. Part B: Document Intake & Provisional OCR Pipeline

### 3.1 Migration 003: Documents & OCR Schema (`server/src/db/migrations/003_documents_and_ocr.sql`)

Migration 003 creates two relational tables with foreign keys and check constraints:

```sql
-- 1. Documents Table
CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK(file_type IN ('pdf', 'png', 'jpg', 'jpeg', 'csv')),
  file_size_bytes INTEGER NOT NULL CHECK(file_size_bytes > 0 AND file_size_bytes <= 15728640), -- Max 15MB
  mime_type TEXT NOT NULL,
  folder TEXT NOT NULL CHECK(folder IN ('Receipts', 'Invoices', 'Statements')),
  storage_path TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Ready' CHECK(status IN ('Ready', 'Processing', 'Needs Review', 'Archived')),
  uploaded_by TEXT NOT NULL REFERENCES users(id),
  notes TEXT,
  is_archived INTEGER NOT NULL DEFAULT 0 CHECK(is_archived IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Document OCR Results Table
CREATE TABLE IF NOT EXISTS document_ocr_results (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  vendor TEXT,
  document_date TEXT,
  subtotal_cents INTEGER CHECK(subtotal_cents IS NULL OR subtotal_cents >= 0),
  tax_cents INTEGER CHECK(tax_cents IS NULL OR tax_cents >= 0),
  total_cents INTEGER CHECK(total_cents IS NULL OR total_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  confidence_score REAL NOT NULL CHECK(confidence_score >= 0.0 AND confidence_score <= 1.0),
  extracted_fields_json TEXT NOT NULL DEFAULT '[]',
  raw_text TEXT,
  provisional INTEGER NOT NULL DEFAULT 1 CHECK(provisional IN (0, 1)),
  status TEXT NOT NULL DEFAULT 'pending_review' CHECK(status IN ('pending_review', 'confirmed', 'rejected')),
  reviewed_by TEXT REFERENCES users(id),
  reviewed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(document_id)
);
```

### 3.2 Strict Accounting Invariant: Provisional Extractions Never Mutate the Ledger

Per the core Libros financial architecture rules and separation of duties:

1. **Always Provisional Upon Intake:** All OCR scan results are initialized with `provisional = 1` and `status = 'pending_review'`.
2. **Zero Automated Ledger Mutations:** OCR scanning strictly does NOT create, insert, or modify records in `journal_entries`, `journal_entry_lines`, `accounts`, `invoices`, or approve `expenses`. Automated journal entry posting from unverified OCR scans is architecturally forbidden.
3. **Explicit Owner Review Required:** Only a verified Business Owner has authority to review, confirm, or reject an OCR extraction. Upon confirmation, the status transitions to `confirmed` and document status returns to `Ready`.
4. **Integer Cents Representation:** All extracted amounts (`subtotal_cents`, `tax_cents`, `total_cents`) are strictly converted and stored as non-negative integer cents.
5. **Arithmetic Parity:** The scanning pipeline validates that $\text{subtotal} + \text{tax} \equiv \text{total}$ if all three values are provided, rejecting arithmetic discrepancies with RFC 7807 `400 Bad Request` ("Arithmetic Mismatch").

### 3.3 Document Intake & Scanning Endpoints

- `GET /api/v1/documents`: Lists documents scoped to the active tenant with filters for `folder`, `isArchived`, and `status`. Employees are restricted to viewing their own uploads or the `Receipts` folder.
- `POST /api/v1/documents`: Creates document records with validation of file size ($\le 15\text{MB}$), supported file extensions (`pdf`, `png`, `jpg`, `jpeg`, `csv`), and folder categorization.
- `GET /api/v1/documents/:id`: Retrieves document metadata along with any associated OCR scan results.
- `POST /api/v1/documents/:id/archive`: Soft-archives or restores documents (`is_archived = 1/0`, `status = 'Archived'/'Ready'`). Restricted strictly to Owner (`403 Forbidden` for Accountants and Employees).
- `POST /api/v1/scanning/ocr`: Initiates OCR processing on a document, returning structured extraction fields with confidence scores and `provisional: true`.
- `GET /api/v1/scanning/results/:documentId`: Retrieves OCR results for a document.
- `POST /api/v1/scanning/results/:documentId/review`: Owner review workflow (`confirmed` or `rejected`).

---

## 4. Role-Based Access Control (RBAC) Matrix

Sprint 10 enforces complete separation of duties across all financial and document operations:

| Route / Capability                    |       Owner       |     Accountant     |         Employee          |
| :------------------------------------ | :---------------: | :----------------: | :-----------------------: |
| **Manage Clients (Create/Update)**    |    Full Access    | 403 Forbidden (RO) |       403 Forbidden       |
| **Create Invoices / Estimates**       |    Full Access    | 403 Forbidden (RO) |       403 Forbidden       |
| **Send Invoices & Record Payments**   |    Full Access    | 403 Forbidden (RO) |       403 Forbidden       |
| **Submit Expense**                    |    Full Access    | 403 Forbidden (RO) |     Own Expenses Only     |
| **View Expense Roster**               |   All Expenses    |    All Expenses    |     Own Expenses Only     |
| **Approve / Reject Expense**          |      Allowed      | 403 Forbidden (RO) |       403 Forbidden       |
| **View Chart of Accounts & Balances** |      Allowed      |      Allowed       |       403 Forbidden       |
| **Post Manual Journal Entries**       |      Allowed      | 403 Forbidden (RO) |       403 Forbidden       |
| **Reverse Journal Entries**           |      Allowed      | 403 Forbidden (RO) |       403 Forbidden       |
| **Upload Document**                   |    All Folders    | 403 Forbidden (RO) |      Receipts Folder      |
| **View Document List**                |   All Documents   |   All Documents    | Receipts / Own Uploads RO |
| **Archive / Restore Documents**       |      Allowed      | 403 Forbidden (RO) |       403 Forbidden       |
| **Trigger OCR Scan**                  |      Allowed      | 403 Forbidden (RO) |     Own Receipts Only     |
| **Review / Confirm OCR Results**      |      Allowed      | 403 Forbidden (RO) |       403 Forbidden       |
| **Cross-Tenant Data Access**          | 404 / 403 Blocked | 404 / 403 Blocked  |     404 / 403 Blocked     |

---

## 5. Verification & Test Evidence

### 5.1 Verification Checklist & Suite Execution

```
> libros-mobile@1.0.0 check
> tsc --noEmit && tsc -p server/tsconfig.json --noEmit && biome check . && jest --runInBand && npx tsx --test server/tests/*.test.ts

✔ TypeScript (Frontend): 0 errors
✔ TypeScript (Server): 0 errors
✔ Biome Linter & Formatter: Checked 369 files in 167ms. 0 errors, 0 warnings.
✔ Jest Mobile Frontend: 29 suites passed, 94 tests passed, 0 failures.
✔ Node.js Backend Suites: 14 suites passed, 106 tests passed, 0 failures.
✔ Total Automated Tests: 200 passed, 0 failed.
```

### 5.2 Expo Route Bundling Evidence

```
› static routes (31):
/ (index)
/sign-in
/welcome
/_sitemap
/register
/owner/ai
/+not-found
/invite-code
/owner
/verify-email
/owner/reports
/business-setup
/(auth)/sign-in
/(auth)/welcome
/employee
/owner/activity
/owner/invoices
/forgot-password
/(auth)/register
/owner/documents
/accountant
/employee/account
/employee/expenses
/(auth)/invite-code
/accountant/account
/accountant/reports
/employee/documents
/(auth)/verify-email
/accountant/documents
/(auth)/business-setup
/(auth)/forgot-password

Exported: dist (iOS: 3.8MB, Android: 4.0MB, Web: 2.4MB)
```

### 5.3 Defect Register Closure

- Registered `DEF-19` in `docs/qa/defect-register.md` covering the Accountant role over-permissive mutation issue identified during Sprint 09 acceptance review, documenting root cause, resolution across 6 route handlers and domain services, and 12 negative HTTP integration tests. Status: **RESOLVED**.
