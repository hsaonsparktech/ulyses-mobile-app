# Document Ingestion & Storage Architecture — Libros

**Document Version:** 1.0.0  
**Date:** November 22, 2026  
**Status:** Implemented & Verified in Sprint 10B

---

## 1. Overview & Objectives

The Libros Document Ingestion Pipeline provides secure, tenant-isolated file upload, validation, persistence, and retrieval for business accounting records (receipts, invoices, and bank statements).

### Core Invariants

1. **Payload Isolation:** File upload streaming is completely decoupled from the 1MB REST JSON body parser to prevent denial-of-service memory exhaustion.
2. **Strict Content Gating:** Files are inspected for magic-byte binary signatures. Executables and forged MIME types are rejected immediately before disk writing.
3. **Multi-Tenant Boundary:** Files are stored in tenant-isolated directory trees (`storage/documents/<business_id>/`) and can only be downloaded by users possessing active membership in the owning business.
4. **Provisional Accounting Safeguard:** Documents ingested for OCR processing are marked `provisional: true`. Ingested documents never post automated ledger entries without human confirmation.

---

## 2. Ingestion Pipeline Architecture

```
[Mobile Client / App]
         │
         │  1. POST /api/v1/documents/upload (Binary Stream, 15MB max)
         │     Headers: X-Business-Id, Content-Type, X-Filename, X-Folder
         ▼
[Node.js HTTP Server (server/src/app.ts)]
         │
         ├──► Route match: /api/v1/documents/upload
         │    (Bypasses 1MB parseJsonBody middleware)
         ▼
[DocumentStorage.ts Streaming Handler]
         │
         ├──► 2. Stream Buffer Capture (Max 15 * 1024 * 1024 bytes)
         │
         ├──► 3. Magic-Bytes Signature Inspection & Malware Gating
         │       - Checks %PDF-, PNG, JPEG, or CSV ASCII
         │       - Rejects MZ (Windows PE) and ELF (Linux Executable)
         │
         ├──► 4. Filename & Path Sanitization
         │       - Strips relative traversal characters (../, ..\)
         │       - Enforces pattern [a-zA-Z0-9_.-]
         │
         ├──► 5. Atomic Disk Persistence
         │       - Destination: storage/documents/<business_id>/<doc_id>_<filename>
         │
         ▼
[DocumentService.ts & SQLite Database]
         │
         ├──► 6. Inserts metadata row into `documents` table
         │
         ▼
[Client Response: 201 Created (DocumentProfile JSON)]
```

---

## 3. Magic-Bytes Signature Validation Matrix

| File Type | Allowed Extension | Allowed MIME Types        | Magic-Bytes Header Signature                                    |
| :-------- | :---------------: | :------------------------ | :-------------------------------------------------------------- |
| **PDF**   |      `.pdf`       | `application/pdf`         | `0x25 0x50 0x44 0x46 0x2D` (`%PDF-`)                            |
| **PNG**   |      `.png`       | `image/png`               | `0x89 0x50 0x4E 0x47 0x0D 0x0A 0x1A 0x0A` (`\x89PNG\r\n\x1a\n`) |
| **JPEG**  |  `.jpg`, `.jpeg`  | `image/jpeg`, `image/jpg` | `0xFF 0xD8 0xFF`                                                |
| **CSV**   |      `.csv`       | `text/csv`, `text/plain`  | Printable ASCII / UTF-8 text with commas, semicolons, or tabs   |

### Executable Header Rejection Rules

Any file payload beginning with the following signatures is rejected with `400 Bad Request` regardless of declared MIME type or extension:

- **Windows PE / DOS Executable:** `0x4D 0x5A` (`MZ`)
- **Linux Executable and Linkable Format:** `0x7F 0x45 0x4C 0x46` (`.ELF`)

---

## 4. Storage & Retrieval Security

### Directory Layout

```
storage/
└── documents/
    ├── biz_01/
    │   ├── doc_101_november_receipt.pdf
    │   └── doc_102_bank_statement.pdf
    └── biz_02/
        └── doc_201_supplier_invoice.pdf
```

### Retrieval & Download Security (`GET /api/v1/documents/:id/download`)

1. **Authentication:** Requires valid Bearer JWT.
2. **Tenant Membership:** The caller's `X-Business-Id` must match the document's `business_id`, verified against the user's active tenant memberships.
3. **Canonical Path Verification:** The target file path is resolved and validated with `path.resolve()` ensuring it resides strictly within `storage/documents/<business_id>/`.
4. **Streaming Response:** Files are streamed using `fs.createReadStream` with appropriate `Content-Type` and `Content-Disposition` headers.

---

## 5. Verification & Test Evidence

All functionality is covered by automated integration tests in `server/tests/documents.test.ts`:

- Binary upload of PDF documents with correct file size and status `201 Created`.
- Verified binary download stream matches uploaded file bytes identically.
- Rejection of payloads with executable `MZ` headers with `400 Bad Request`.
- Rejection of payloads exceeding 15MB limit with `413 Payload Too Large`.
- Rejection of cross-tenant download attempts with `403 Forbidden` / `404 Not Found`.
