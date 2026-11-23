# Mobile API Integration Matrix — Libros (Sprint 10C)

**Project:** `ulyses0930` / Libros — AI-Powered Accounting & Financial Management Application  
**Milestone:** Sprint 10C — Real Backend Android E2E, Integration Hardening & Acceptance  
**Date:** November 22, 2026  
**Status:** **Authoritative Audit Matrix — Real-Backend Verified**

---

## 1. Classification Definitions

Each feature and flow across the mobile client and backend is classified into one of the following integration tiers:

1. **Fixture only:** Feature relies solely on hardcoded static fixtures or in-memory mock data with no network adapter.
2. **Adapter implemented:** A typed HTTP adapter has been authored with request/response types and error handling, but is not yet wired to UI components.
3. **Wired to UI:** The UI screen and associated store trigger and consume the typed API adapter, supporting asynchronous loading, error, and empty states.
4. **HTTP integration tested:** Automated backend integration tests prove the endpoint functions, validates inputs, enforces tenancy and RBAC, and handles edge cases.
5. **Mobile E2E verified:** The flow is verified end-to-end within the mobile application runtime (Maestro / automated runner) against the running server.
6. **Production blocked:** The capability is deliberately gated or forbidden under client decisions `D01`–`D12` (e.g. live Stripe payment charging, real AI inference providers without signoff, Platform Admin console).

---

## 2. Feature-by-Feature Integration Matrix

| Feature / Screen                                       | Current Data Source               | API Adapter       | Backend Endpoint & Method                  |     Current Status      | Integration Notes & Safeguards                                              |
| :----------------------------------------------------- | :-------------------------------- | :---------------- | :----------------------------------------- | :---------------------: | :-------------------------------------------------------------------------- |
| **User Sign-In** (`SignInScreen.tsx`)                  | `SessionProvider` + `authAdapter` | `createHttpAuth`  | `POST /api/v1/auth/sign-in`                | **Mobile E2E verified** | Real HS256 JWT generation with `expo-secure-store` session token storage.   |
| **User Registration** (`RegisterScreen.tsx`)           | Transient React Hook Form         | `authAdapter`     | `POST /api/v1/auth/register`               | **Mobile E2E verified** | Dispatches to API in live mode; generates unverified user record in SQLite. |
| **Email Verification** (`VerifyEmailScreen.tsx`)       | Transient React Hook Form         | `authAdapter`     | `POST /api/v1/auth/verify-email`           | **Mobile E2E verified** | Validates 6-digit OTP; preview bypass blocked in production builds.         |
| **Password Reset** (`ForgotPasswordScreen.tsx`)        | Transient React Hook Form         | `authAdapter`     | `POST /api/v1/auth/forgot-password`        | **Mobile E2E verified** | Sends rate-limited reset notice; preserves Figma success card.              |
| **Business Setup** (`BusinessSetupScreen.tsx`)         | `useBusinessStore`                | `businessAdapter` | `POST /api/v1/businesses`                  | **Mobile E2E verified** | Creates business tenant record and assigns Owner membership.                |
| **Session Restore** (`SessionProvider.tsx`)            | `expo-secure-store`               | `createHttpAuth`  | `GET /api/v1/auth/me`                      | **Mobile E2E verified** | Resolves token on cold start; purges credentials on 401.                    |
| **Sign Out** (`SessionProvider.tsx`)                   | `SessionProvider`                 | `createHttpAuth`  | `POST /api/v1/auth/sign-out`               | **Mobile E2E verified** | Revokes session instantly in SQLite `sessions` table.                       |
| **Business Switcher** (`BusinessSwitcherModal.tsx`)    | `useBusinessStore`                | `businessAdapter` | `GET /api/v1/businesses`                   | **Mobile E2E verified** | Triggers `resetRemoteState()`, clearing all cached queries upon switch.     |
| **Clients List & Metrics** (`ClientsModal.tsx`)        | `useClientStore`                  | `clientAdapter`   | `GET /api/v1/clients`                      | **Mobile E2E verified** | Scoped strictly to active `X-Business-Id`. Shows AR metrics.                |
| **Create Client** (`AddClientModal.tsx`)               | `useClientStore`                  | `clientAdapter`   | `POST /api/v1/clients`                     | **Mobile E2E verified** | Owner only (`403 Forbidden` for Accountant/Employee).                       |
| **Invoices List & KPIs** (`InvoicesScreen.tsx`)        | `useInvoiceStore`                 | `invoiceAdapter`  | `GET /api/v1/invoices`                     | **Mobile E2E verified** | Lists invoices, filters by status, calculates unpaid/paid totals.           |
| **Create Invoice** (`CreateInvoiceModal.tsx`)          | `useInvoiceStore`                 | `invoiceAdapter`  | `POST /api/v1/invoices`                    | **Mobile E2E verified** | Enforces integer cents and `Idempotency-Key`. Owner only.                   |
| **Send Invoice (AR)** (`SendInvoiceModal.tsx`)         | `useInvoiceStore`                 | `invoiceAdapter`  | `POST /api/v1/invoices/:id/send`           | **Mobile E2E verified** | Automatically recognizes AR & Revenue in the General Ledger.                |
| **Record Payment** (`InvoiceDetailModal.tsx`)          | `useInvoiceStore`                 | `invoiceAdapter`  | `POST /api/v1/invoices/:id/payments`       | **Mobile E2E verified** | Relieves AR and debits cash; validates against overpayments.                |
| **Estimates List** (`EstimatesModal.tsx`)              | `useEstimateStore`                | `estimateAdapter` | `GET /api/v1/estimates`                    | **Mobile E2E verified** | Quotes directory scoped to active tenant.                                   |
| **Convert Estimate** (`EstimatesModal.tsx`)            | `useEstimateStore`                | `estimateAdapter` | `POST /api/v1/estimates/:id/convert`       | **Mobile E2E verified** | Atomic conversion to draft invoice; idempotent repeat conversion.           |
| **Employee Expenses** (`EmployeeExpensesScreen.tsx`)   | `useEmployeeStore`                | `expenseAdapter`  | `GET /api/v1/expenses`                     | **Mobile E2E verified** | Employee view restricted strictly to own submitted expenses.                |
| **Submit Expense** (`EmployeeExpensesScreen.tsx`)      | `useEmployeeStore`                | `expenseAdapter`  | `POST /api/v1/expenses`                    | **Mobile E2E verified** | Submits pending operating expense with integer cents amount.                |
| **Approve Expense** (`OwnerDashboardScreen.tsx`)       | `useEmployeeStore`                | `expenseAdapter`  | `POST /api/v1/expenses/:id/approve`        | **Mobile E2E verified** | Owner only. Posts Operating Expense and AP to ledger.                       |
| **Accountant Reports** (`AccountantReportsScreen.tsx`) | `useAccountantStore`              | `ledgerAdapter`   | `GET /api/v1/ledger/accounts`              | **Mobile E2E verified** | Read-only P&L overview and trial balance balances.                          |
| **Document Directory** (`DocumentsScreen.tsx`)         | `useDocumentStore`                | `documentAdapter` | `GET /api/v1/documents`                    | **Mobile E2E verified** | Scoped by tenant and folder (`Receipts`, `Invoices`, `Statements`).         |
| **Document Upload** (`DocumentsScreen.tsx`)            | `useDocumentStore`                | `documentAdapter` | `POST /api/v1/documents/upload`            | **Mobile E2E verified** | Supports binary upload up to 15MB with magic-bytes validation.              |
| **Smart Scanning (OCR)** (`ScanningFlow.tsx`)          | `useScanStore`                    | `scanAdapter`     | `POST /api/v1/scanning/ocr`                | **Mobile E2E verified** | Provisional extraction only (`provisional: true`). No ledger posting.       |
| **Review OCR Results** (`ScanReviewModal.tsx`)         | `useScanStore`                    | `scanAdapter`     | `POST /api/v1/scanning/results/:id/review` | **Mobile E2E verified** | Owner confirmation moves document to Ready.                                 |
| **Live Payment Gateway**                               | None                              | None              | N/A                                        | **Production blocked**  | Live card charging strictly prohibited under client decision `D01`.         |
| **Platform Admin Console**                             | None                              | None              | N/A                                        | **Production blocked**  | Master admin tenant inspection prohibited under client decision `D10`.      |
