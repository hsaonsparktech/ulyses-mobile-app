# Sprint 10C — Document Pipeline Acceptance & File Security Tests

**Project:** `ulyses0930` / Libros — AI-Powered Accounting & Financial Management Application  
**Milestone:** Sprint 10C — Real Backend Android E2E, Integration Hardening & Acceptance  
**Date:** November 22, 2026  
**Status:** **PASSED / ACCEPTED**

---

## 1. Overview & Document Storage Architecture

Sprint 10C validated the real binary document pipeline implemented in Sprint 10B. In the Libros architecture:

- Metadata is tracked in SQLite (`documents` table).
- Binary blobs are stored on disk under `./data/storage/{businessId}/{documentId}_{safeFilename}`.
- All uploads require active tenant membership (`X-Business-Id`) and valid Bearer authentication.
- Strict security controls prevent malware uploads, path traversal, oversized payloads, and cross-tenant leakage.

---

## 2. Test Execution & Evidence

Automated file pipeline tests were executed as part of `server/tests/real-backend-e2e.test.ts` against the live backend server.

### 2.1 Binary Integrity & SHA-256 Checksum Verification

- **Uploaded File:** Valid PDF audit document containing standard PDF header `\x25\x50\x44\x46` (`%PDF-1.4 ...`).
- **Endpoint:** `POST /api/v1/documents/upload`
- **Request Headers:**
  - `Content-Type: application/pdf`
  - `X-Filename: verified_november_audit.pdf`
  - `X-Business-Id: biz_acme_services_001`
- **Result:**
  - Server returned `201 Created` with `documentId: "doc_..."`.
  - The SHA-256 hash of the uploaded buffer was calculated in-memory.
  - The disk file was located and read directly from `./data/storage/biz_acme_services_001/`.
  - The SHA-256 hash of the persisted file on disk matched the uploaded buffer **byte-for-byte**.

### 2.2 Streaming Download Verification

- **Endpoint:** `GET /api/v1/documents/:id/download`
- **Result:**
  - HTTP `200 OK` with `Content-Type: application/pdf` and `Content-Disposition: inline; filename="verified_november_audit.pdf"`.
  - Downloaded byte stream matched the uploaded PDF buffer exactly.

### 2.3 Executable Malware Rejection (Magic Bytes)

- **Test Attack Payload:** Binary buffer beginning with Windows Portable Executable (PE) header `\x4D\x5A` (`MZ` header), disguised with header `Content-Type: application/pdf` and filename `invoice.pdf`.
- **Result:**
  - The server inspected magic bytes and detected Windows PE signature.
  - Request immediately aborted with HTTP `400 Bad Request`.
  - RFC 7807 problem details returned: `title: "Unsupported File Type"`, `detail: "Executable or unsafe binary format detected"`.
  - Zero bytes written to disk; zero rows inserted into SQLite.

### 2.4 Payload Size Limit Enforcement (>15MB)

- **Test Attack Payload:** Synthetic buffer of 16MB (`16 * 1024 * 1024` bytes).
- **Result:**
  - The server rejected the upload with HTTP `413 Payload Too Large`.
  - Detail: `File size exceeds maximum allowable limit of 15MB`.

### 2.5 Path Traversal Prevention

- **Test Attack Payload:** Filename header set to `../../../../../../Windows/System32/drivers/etc/hosts.pdf`.
- **Result:**
  - Filename sanitized via `path.basename()` to `hosts.pdf`.
  - File strictly confined within `./data/storage/biz_acme_services_001/`.
  - Directory escape prevented.

### 2.6 Cross-Tenant Isolation

- **Test Scenario:** User authenticated under Tenant B attempts to download a document belonging to Tenant A via `GET /api/v1/documents/:id/download`.
- **Result:**
  - Request blocked with HTTP `404 Not Found` (fail-closed preventing ID enumeration).
  - Cross-tenant data exfiltration completely mitigated.

### 2.7 Multi-Format Compatibility

The following legitimate business file formats were uploaded and verified:

1. `application/pdf` (`.pdf` receipts and audit packs)
2. `image/png` (`.png` receipt snapshots)
3. `image/jpeg` (`.jpg` / `.jpeg` camera scans)
4. `text/csv` (`.csv` bank transaction exports)

All formats successfully passed validation, disk storage, and retrieval tests.
