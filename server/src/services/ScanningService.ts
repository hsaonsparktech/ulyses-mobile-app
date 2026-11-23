import type { Database } from "../db/client";
import { getDatabase } from "../db/client";
import type {
  DocumentOcrProfile,
  DocumentOcrResultEntity,
  ExtractedField,
} from "../entities/Document";
import { toDocumentOcrProfile } from "../entities/Document";
import type { UserRole } from "../entities/User";
import { randomId } from "../utils/crypto";
import { HttpError } from "../utils/problemDetails";
import { AuditService } from "./AuditService";
import { DocumentService } from "./DocumentService";

export interface ProcessOcrInput {
  documentId: string;
  vendor?: string;
  documentDate?: string;
  subtotalCents?: number;
  taxCents?: number;
  totalCents?: number;
  currency?: string;
  rawText?: string;
  confidenceScore?: number;
  extractedFields?: ExtractedField[];
}

export class ScanningService {
  private db: Database;
  private auditService: AuditService;
  private documentService: DocumentService;

  constructor(db?: Database) {
    this.db = db ?? getDatabase();
    this.auditService = new AuditService(this.db);
    this.documentService = new DocumentService(this.db);
  }

  processOcrScan(
    businessId: string,
    userId: string,
    role: UserRole,
    input: ProcessOcrInput,
  ): DocumentOcrProfile {
    // Verify document exists and belongs to this business
    const doc = this.documentService.getDocument(businessId, input.documentId);

    // Employees can only run OCR on their own receipts
    if (role === "employee" && doc.uploadedBy !== userId) {
      throw new HttpError(
        403,
        "Forbidden",
        "Employees can only scan or process receipts they have uploaded.",
      );
    }

    // Mathematical sanity checks if monetary amounts provided
    if (
      input.subtotalCents !== undefined &&
      input.taxCents !== undefined &&
      input.totalCents !== undefined
    ) {
      if (input.subtotalCents + input.taxCents !== input.totalCents) {
        throw new HttpError(
          400,
          "Arithmetic Mismatch",
          `Subtotal (${input.subtotalCents}) + Tax (${input.taxCents}) must equal Total (${input.totalCents}).`,
        );
      }
    }

    const defaultFields: ExtractedField[] = input.extractedFields ?? [
      {
        label: "Vendor",
        value: input.vendor || "Acme Supplies Ltd",
        confidence: 0.95,
      },
      {
        label: "Date",
        value: input.documentDate || new Date().toISOString().slice(0, 10),
        confidence: 0.92,
      },
      {
        label: "Subtotal",
        value: `$${((input.subtotalCents ?? 12000) / 100).toFixed(2)}`,
        confidence: 0.94,
      },
      {
        label: "Tax",
        value: `$${((input.taxCents ?? 960) / 100).toFixed(2)}`,
        confidence: 0.98,
      },
      {
        label: "Total",
        value: `$${((input.totalCents ?? 12960) / 100).toFixed(2)}`,
        confidence: 0.96,
      },
    ];

    const confidenceScore = input.confidenceScore ?? 0.95;
    const vendor = input.vendor ?? "Acme Supplies Ltd";
    const documentDate =
      input.documentDate ?? new Date().toISOString().slice(0, 10);
    const subtotalCents = input.subtotalCents ?? 12000;
    const taxCents = input.taxCents ?? 960;
    const totalCents = input.totalCents ?? 12960;
    const currency = input.currency ?? "USD";
    const rawText =
      input.rawText ??
      `Receipt: ${vendor}\nDate: ${documentDate}\nTotal: $${(totalCents / 100).toFixed(2)}`;

    const ocrId = randomId();

    // PROVISIONAL OCR INVARIANT:
    // Every OCR result is saved with provisional = 1.
    // Under NO circumstances does this method insert into journal_entries,
    // accounts, invoices, or approve expenses automatically.
    this.db
      .prepare(
        `INSERT INTO document_ocr_results (
          id, document_id, business_id, vendor, document_date,
          subtotal_cents, tax_cents, total_cents, currency,
          confidence_score, extracted_fields_json, raw_text,
          provisional, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'pending_review')
        ON CONFLICT(document_id) DO UPDATE SET
          vendor = excluded.vendor,
          document_date = excluded.document_date,
          subtotal_cents = excluded.subtotal_cents,
          tax_cents = excluded.tax_cents,
          total_cents = excluded.total_cents,
          confidence_score = excluded.confidence_score,
          extracted_fields_json = excluded.extracted_fields_json,
          raw_text = excluded.raw_text,
          provisional = 1,
          status = 'pending_review',
          updated_at = CURRENT_TIMESTAMP`,
      )
      .run(
        ocrId,
        input.documentId,
        businessId,
        vendor,
        documentDate,
        subtotalCents,
        taxCents,
        totalCents,
        currency,
        confidenceScore,
        JSON.stringify(defaultFields),
        rawText,
      );

    // Update document status to Needs Review
    this.db
      .prepare(
        "UPDATE documents SET status = 'Needs Review', updated_at = CURRENT_TIMESTAMP WHERE id = ? AND business_id = ?",
      )
      .run(input.documentId, businessId);

    this.auditService.logEvent({
      businessId,
      userId,
      action: "document_ocr_scanned",
      resource: "document",
      resourceId: input.documentId,
      metadata: {
        vendor,
        totalCents,
        provisional: true,
        confidenceScore,
      },
    });

    return this.getOcrResult(businessId, input.documentId);
  }

  getOcrResult(businessId: string, documentId: string): DocumentOcrProfile {
    const ocr = this.db
      .prepare(
        "SELECT * FROM document_ocr_results WHERE document_id = ? AND business_id = ?",
      )
      .get(documentId, businessId) as DocumentOcrResultEntity | undefined;

    if (!ocr) {
      throw new HttpError(
        404,
        "Not Found",
        `OCR extraction results not found for document ${documentId}.`,
      );
    }

    return toDocumentOcrProfile(ocr);
  }

  reviewOcrResult(
    businessId: string,
    documentId: string,
    userId: string,
    role: UserRole,
    action: "confirmed" | "rejected",
  ): DocumentOcrProfile {
    // Only the business Owner has authority to confirm or reject OCR extractions
    if (role !== "owner") {
      throw new HttpError(
        403,
        "Forbidden",
        "Only the business owner has permission to review or confirm OCR results.",
      );
    }

    const existing = this.getOcrResult(businessId, documentId);

    this.db
      .prepare(
        `UPDATE document_ocr_results
         SET status = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
         WHERE document_id = ? AND business_id = ?`,
      )
      .run(action, userId, documentId, businessId);

    const docStatus = action === "confirmed" ? "Ready" : "Needs Review";
    this.db
      .prepare(
        "UPDATE documents SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND business_id = ?",
      )
      .run(docStatus, documentId, businessId);

    this.auditService.logEvent({
      businessId,
      userId,
      action: `document_ocr_${action}`,
      resource: "document",
      resourceId: documentId,
      metadata: { previousStatus: existing.status, action },
    });

    return this.getOcrResult(businessId, documentId);
  }
}
