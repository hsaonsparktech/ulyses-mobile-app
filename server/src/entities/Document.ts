export type DocumentFolder = "Receipts" | "Invoices" | "Statements";
export type DocumentStatus =
  | "Ready"
  | "Processing"
  | "Needs Review"
  | "Archived";
export type DocumentFileType = "pdf" | "png" | "jpg" | "jpeg" | "csv";

export interface DocumentEntity {
  id: string;
  business_id: string;
  filename: string;
  file_type: DocumentFileType;
  file_size_bytes: number;
  mime_type: string;
  folder: DocumentFolder;
  storage_path: string;
  status: DocumentStatus;
  uploaded_by: string;
  notes: string | null;
  is_archived: number;
  created_at: string;
  updated_at: string;
}

export interface DocumentOcrResultEntity {
  id: string;
  document_id: string;
  business_id: string;
  vendor: string | null;
  document_date: string | null;
  subtotal_cents: number | null;
  tax_cents: number | null;
  total_cents: number | null;
  currency: string;
  confidence_score: number;
  extracted_fields_json: string;
  raw_text: string | null;
  provisional: number;
  status: "pending_review" | "confirmed" | "rejected";
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExtractedField {
  label: string;
  value: string;
  confidence: number;
}

export interface DocumentProfile {
  id: string;
  businessId: string;
  filename: string;
  fileType: DocumentFileType;
  fileSizeBytes: number;
  mimeType: string;
  folder: DocumentFolder;
  storagePath: string;
  status: DocumentStatus;
  uploadedBy: string;
  uploaderName?: string;
  notes: string | null;
  isArchived: boolean;
  ocrResult?: DocumentOcrProfile | null;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentOcrProfile {
  id: string;
  documentId: string;
  businessId: string;
  vendor: string | null;
  documentDate: string | null;
  subtotalCents: number | null;
  taxCents: number | null;
  totalCents: number | null;
  currency: string;
  confidenceScore: number;
  extractedFields: ExtractedField[];
  rawText: string | null;
  provisional: boolean;
  status: "pending_review" | "confirmed" | "rejected";
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export function toDocumentProfile(
  doc: DocumentEntity,
  ocr?: DocumentOcrResultEntity | null,
  uploaderName?: string,
): DocumentProfile {
  return {
    id: doc.id,
    businessId: doc.business_id,
    filename: doc.filename,
    fileType: doc.file_type,
    fileSizeBytes: doc.file_size_bytes,
    mimeType: doc.mime_type,
    folder: doc.folder,
    storagePath: doc.storage_path,
    status: doc.status,
    uploadedBy: doc.uploaded_by,
    uploaderName,
    notes: doc.notes,
    isArchived: Boolean(doc.is_archived),
    ocrResult: ocr ? toDocumentOcrProfile(ocr) : null,
    createdAt: doc.created_at,
    updatedAt: doc.updated_at,
  };
}

export function toDocumentOcrProfile(
  ocr: DocumentOcrResultEntity,
): DocumentOcrProfile {
  let fields: ExtractedField[] = [];
  try {
    fields = JSON.parse(ocr.extracted_fields_json);
  } catch {
    fields = [];
  }

  return {
    id: ocr.id,
    documentId: ocr.document_id,
    businessId: ocr.business_id,
    vendor: ocr.vendor,
    documentDate: ocr.document_date,
    subtotalCents: ocr.subtotal_cents,
    taxCents: ocr.tax_cents,
    totalCents: ocr.total_cents,
    currency: ocr.currency,
    confidenceScore: ocr.confidence_score,
    extractedFields: fields,
    rawText: ocr.raw_text,
    provisional: Boolean(ocr.provisional),
    status: ocr.status,
    reviewedBy: ocr.reviewed_by,
    reviewedAt: ocr.reviewed_at,
    createdAt: ocr.created_at,
    updatedAt: ocr.updated_at,
  };
}
