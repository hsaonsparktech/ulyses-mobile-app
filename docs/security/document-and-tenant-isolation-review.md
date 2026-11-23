# Security & Tenant Isolation Architecture Review — Libros

**Document Version:** 1.0.0  
**Date:** November 22, 2026  
**Classification:** Security Assessment & Architectural Review  
**Milestone:** Sprint 10B Acceptance

---

## 1. Executive Summary

This security review analyzes the multi-tenant isolation, document storage pipeline, and financial authorization model implemented in Libros.

The evaluation confirms that:

1. **Multi-tenant boundaries are strictly isolated** at both the database level and the filesystem storage layer.
2. **File upload attacks are comprehensively mitigated** through decoupled streaming, magic-bytes content verification, executable file header rejection, and strict path traversal sanitization.
3. **Financial mutation security is fortified** with double-entry ledger balance enforcement, cryptographic SHA-256 idempotency fingerprinting, and strict role-based access control (RBAC).

---

## 2. Threat Modeling & Defense-in-Depth Analysis

### Threat 1: Cross-Tenant Data Leakage via File Download

- **Attack Vector:** An authenticated attacker belonging to Tenant B guesses or enumerates a document ID belonging to Tenant A and requests `GET /api/v1/documents/:id/download`.
- **Mitigation:**
  1. `DocumentService.getDocumentById(businessId, documentId)` enforces tenant filtering in the SQL query (`WHERE id = ? AND business_id = ?`).
  2. If the document belongs to another tenant, the query returns `undefined`, triggering an immediate RFC 7807 `404 Not Found` response.
  3. `DocumentStorage.getDownloadStream(businessId, filename)` validates that the resolved path strictly resides inside `storage/documents/<business_id>/`.
  4. Verified in automated test: `Cross-tenant download is blocked with 404/403` in `server/tests/documents.test.ts`.

### Threat 2: Path Traversal File System Attacks

- **Attack Vector:** An attacker submits an upload request with a manipulated filename like `../../etc/passwd` or `..\..\Windows\System32\drivers\etc\hosts`.
- **Mitigation:**
  1. `DocumentStorage.sanitizeFilename()` replaces all path separator characters (`/`, `\`) and non-alphanumeric characters with safe underscores.
  2. The target disk path is strictly composed as `path.join(storageDir, businessId, `${documentId}_${sanitizedFilename}`)`.
  3. Canonical path assertion verifies `targetPath.startsWith(tenantDir)`. Any divergence throws an immediate security error.

### Threat 3: Arbitrary Executable File Upload (Malware / Web Shells)

- **Attack Vector:** An attacker renames a malicious executable (`payload.exe` or `shell.elf`) to `receipt.pdf` and sets `Content-Type: application/pdf`.
- **Mitigation:**
  1. Header signature verification inspects the actual first 4–8 bytes of the binary payload regardless of declared HTTP headers.
  2. Payloads with Windows PE headers (`0x4D 0x5A` / `MZ`) or Linux executable headers (`0x7F 0x45 0x4C 0x46` / `ELF`) are immediately rejected with `400 Bad Request`.
  3. PDF documents must start with `%PDF-` (`0x25 0x50 0x44 0x46 0x2D`). PNGs must start with `\x89PNG`. JPEGs must start with `\xFF\xD8\xFF`.

### Threat 4: Buffer Exhaustion / Denial of Service

- **Attack Vector:** An attacker floods a JSON REST endpoint with huge payloads, exhausting Node.js heap memory.
- **Mitigation:**
  1. Global JSON parser in `server/src/app.ts` is strictly hard-capped at 1MB.
  2. File uploads (`POST /api/v1/documents/upload`) bypass the JSON parser and stream directly into a capped 15MB buffer in `DocumentStorage.ts`. Any payload exceeding 15MB is aborted with `413 Payload Too Large`.

---

## 3. Financial RBAC Boundary Matrix

| Capability / Action           |  Owner  |        Employee         |       Accountant        | Implementation Guard           |
| :---------------------------- | :-----: | :---------------------: | :---------------------: | :----------------------------- |
| **Upload Receipt / Document** | Allowed |         Allowed         | Restricted (Read-only)  | Role checked in route handler  |
| **View Tenant Documents**     | Allowed |  Allowed (Own uploads)  |      Allowed (All)      | Scoped query by user/tenant    |
| **Trigger OCR Processing**    | Allowed |         Allowed         | Blocked (403 Forbidden) | `DEF-19` RBAC enforcement      |
| **Review & Confirm OCR**      | Allowed | Blocked (403 Forbidden) | Blocked (403 Forbidden) | Owner-only confirmation        |
| **Post / Send Invoices**      | Allowed | Blocked (403 Forbidden) | Blocked (403 Forbidden) | Balance post to General Ledger |
| **Record Invoice Payments**   | Allowed | Blocked (403 Forbidden) | Blocked (403 Forbidden) | AR credit post to Ledger       |
| **Approve Employee Expenses** | Allowed | Blocked (403 Forbidden) | Blocked (403 Forbidden) | Expense post to Ledger         |
| **View General Ledger & P&L** | Allowed | Blocked (403 Forbidden) |   Allowed (Read-only)   | Auditor compliance role        |

---

## 4. Production Deployment Recommendations

1. **Object Storage Migration:** In production cloud deployments, migrate `DocumentStorage.ts` from local filesystem to S3-compatible object storage (e.g., AWS S3, Google Cloud Storage) with pre-signed URLs and server-side encryption (`AES-256` / `SSE-KMS`).
2. **Virus Scanning Sidecar:** Integrate ClamAV or cloud malware scanning daemon to asynchronously scan uploaded documents in the background before marking them as `Ready`.
3. **Strict Content-Security-Policy (CSP):** Serve all downloaded attachments with `Content-Disposition: attachment; filename="..."` and `X-Content-Type-Options: nosniff` to prevent browser execution of SVG or HTML polyglots.
