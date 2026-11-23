# Backend Integration Readiness Report — Libros Mobile (Sprint 07)

**Document Version:** 1.0.0  
**Date:** 2026-11-21  
**Project:** `ulyses0930` / Libros — AI-Powered Accounting & Financial Management Application  
**Target Hardware:** Samsung Galaxy Z Fold5 (`SM-F946B`, Android 17 Developer Preview)

---

## 1. Architectural Overview

The Libros mobile application frontend is fully decoupled from backend persistence, adhering strictly to the engineering rules defined in `AGENTS.md`. All data interactions pass through validated schemas, centralized stores, and pluggable network adapters.

### Core Principles

1. **Zod Schema Authoritativeness:** Every user input and server response is strictly validated at runtime with Zod schemas. Any payload mismatch or malformed response fails fast with typed errors.
2. **Pluggable Network Adapters:** The application transitions seamlessly between offline development mock data and production backend endpoints via `EXPO_PUBLIC_API_BASE_URL` and `EXPO_PUBLIC_ENABLE_MOCK_AUTH` in `.env`.
3. **Secure Credential Management:** Auth tokens, refresh tokens, and session credentials reside exclusively in `expo-secure-store`. Sensitive tokens are never written to unencrypted caches, logs, or crash reporters.
4. **Authoritative Backend RBAC:** Client guards (`RoleGuard.tsx`) control view presentation and navigation routing only. Backend authorization is authoritative; all secure endpoints must enforce session role validation independently.

---

## 2. API Contract & Endpoint Readiness Matrix

| Functional Domain      | Client Schemas & Types                             | Target REST Endpoint           |          Method           | Payload / Contract Status                     | Mock Adapter Status |     Backend Readiness     |
| :--------------------- | :------------------------------------------------- | :----------------------------- | :-----------------------: | :-------------------------------------------- | :-----------------: | :-----------------------: |
| **Authentication**     | `src/features/auth/schemas/session.ts`             | `/api/v1/auth/sign-in`         |          `POST`           | `SignInInput` -> `Session`                    |    Fully Modeled    | **Ready for Integration** |
| **Registration**       | `src/features/onboarding/schemas/register.ts`      | `/api/v1/auth/register`        |          `POST`           | `RegisterInput` -> `{ userId, email }`        |    Fully Modeled    | **Ready for Integration** |
| **Email Verification** | `src/features/onboarding/schemas/verifyEmail.ts`   | `/api/v1/auth/verify-email`    |          `POST`           | `VerifyEmailInput` -> `{ verified: boolean }` |    Fully Modeled    | **Ready for Integration** |
| **Password Reset**     | `src/features/auth/schemas/forgotPassword.ts`      | `/api/v1/auth/forgot-password` |          `POST`           | `ForgotPasswordInput` -> `{ sent: boolean }`  |    Fully Modeled    | **Ready for Integration** |
| **Team Invite Code**   | `src/features/auth/schemas/inviteCode.ts`          | `/api/v1/auth/invite/verify`   |          `POST`           | `InviteCodeInput` -> `InviteVerification`     |    Fully Modeled    | **Ready for Integration** |
| **Business Setup**     | `src/features/onboarding/schemas/businessSetup.ts` | `/api/v1/businesses`           |          `POST`           | `BusinessSetupInput` -> `Business`            |    Fully Modeled    | **Ready for Integration** |
| **Business Profile**   | `src/features/businesses/types.ts`                 | `/api/v1/businesses/current`   |      `GET` / `PATCH`      | `BusinessProfile`                             |    Fully Modeled    | **Ready for Integration** |
| **Transactions**       | `src/features/transactions/types.ts`               | `/api/v1/transactions`         |      `GET` / `POST`       | `TransactionInput` / `Transaction[]`          |    Fully Modeled    | **Ready for Integration** |
| **Invoices**           | `src/features/invoices/schemas/invoice.ts`         | `/api/v1/invoices`             | `GET` / `POST` / `PATCH`  | `InvoiceSchema` / `Invoice[]`                 |    Fully Modeled    | **Ready for Integration** |
| **Estimates**          | `src/features/estimates/schemas/estimate.ts`       | `/api/v1/estimates`            | `GET` / `POST` / `PATCH`  | `EstimateSchema` / `Estimate[]`               |    Fully Modeled    | **Ready for Integration** |
| **Clients**            | `src/features/clients/schemas/client.ts`           | `/api/v1/clients`              | `GET` / `POST` / `PATCH`  | `ClientSchema` / `Client[]`                   |    Fully Modeled    | **Ready for Integration** |
| **Documents**          | `src/features/documents/types.ts`                  | `/api/v1/documents`            | `GET` / `POST` / `DELETE` | `DocumentMetadata` / `Document[]`             |    Fully Modeled    | **Ready for Integration** |
| **Smart Scanning**     | `src/features/scanning/types.ts`                   | `/api/v1/scanning/ocr`         |          `POST`           | `Multipart/Form-Data` -> `ScanResult`         |    Fully Modeled    | **Ready for Integration** |
| **Libros AI**          | `src/features/ai/types.ts`                         | `/api/v1/ai/conversations`     |          `POST`           | `{ message: string }` -> `AiResponse`         |    Fully Modeled    | **Ready for Integration** |
| **Team Members**       | `src/features/team/types.ts`                       | `/api/v1/team/members`         | `GET` / `POST` / `DELETE` | `TeamMember` / `InviteMemberInput`            |    Fully Modeled    | **Ready for Integration** |
| **Reports (P&L)**      | `src/features/reports/types.ts`                    | `/api/v1/reports/pnl`          |           `GET`           | `{ startDate, endDate }` -> `PnlReport`       |    Fully Modeled    | **Ready for Integration** |
| **Membership**         | `src/features/membership/types.ts`                 | `/api/v1/subscription`         | `GET` / `POST` / `PATCH`  | `Subscription` / `PlanChangeInput`            |    Fully Modeled    | **Ready for Integration** |
| **Full Data Export**   | `src/features/membership/types.ts`                 | `/api/v1/export/full`          |          `POST`           | `{ format: "zip" }` -> `{ downloadUrl }`      |    Fully Modeled    | **Ready for Integration** |

---

## 3. Session Isolation & Security Handshake

1. **Multi-Role Security:**
   - The application enforces three distinct role privileges: `Owner`, `Employee`, and `Accountant`.
   - On sign-out or business switch, `SessionProvider.tsx` executes an atomic teardown:

     ```ts
     await SecureStore.deleteItemAsync("libros_session");
     queryClient.cancelQueries();
     queryClient.clear();
     ```

2. **Cross-Role Boundary Enforcement:**
   - Client routes under `app/owner/*`, `app/employee/*`, and `app/accountant/*` are strictly guarded by `<RoleGuard requiredRole="...">`.
   - If an unauthenticated or unauthorized role accesses a forbidden route, the application immediately redirects and renders the canonical restricted state (`81:1450`, `84:116`, `84:188`).

---

## 4. Policy-Blocked Boundaries & Release Gates

Per client decisions `D01` through `D12`, the following capabilities must remain disabled on the backend until formal written sign-off:

- **`D01`–`D09`:** Pro+ billing tiers, seat caps, dunning traps, and upfront credit card capture during trial remain blocked.
- **`D10`:** Spanish locale mockups remain reference only; English is the active production locale.
- **`D11`:** Platform Admin web console endpoints (`20:6`) are strictly separated from mobile API scopes.
- **`D12`:** Stock framework dependencies and lockfile integrity must be maintained.

---

## 5. Sprint 10B Integration Execution Status

All mobile stores and features have been fully wired to live backend API adapters (`clientAdapter`, `invoiceAdapter`, `estimateAdapter`, `expenseAdapter`, `ledgerAdapter`, `documentAdapter`, `scanAdapter`) with dual-mode operational support:

1. **Live Backend Mode (`EXPO_PUBLIC_ENABLE_MOCK_AUTH=false`):**
   - Full HTTP/REST lifecycle with bearer token authorization from `SecureStore`.
   - Idempotency key tracking via Migration 004 and SHA-256 payload verification.
   - 15MB binary streaming document upload and download with magic-bytes validation.
   - Provisional OCR intake requiring explicit user review before ledger posting.
2. **Offline Mock Mode (`EXPO_PUBLIC_ENABLE_MOCK_AUTH=true`):**
   - Fully deterministic local fixtures for automated offline testing and Maestro physical Android E2E execution.
   - Zero framework regressions: 101/101 Jest tests passing across 30 suites; 115/115 Node backend tests passing across 15 suites; 31/31 static routes bundling cleanly.
