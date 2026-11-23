-- Migration 003: Document Intake and Provisional OCR Architecture
-- Provides structured document storage metadata and provisional OCR extraction results.
-- CRITICAL INVARIANT: Provisional OCR extractions NEVER automatically mutate or post to the General Ledger.

-- 1. Documents Table
CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK(file_type IN ('pdf', 'png', 'jpg', 'jpeg', 'csv')),
  file_size_bytes INTEGER NOT NULL CHECK(file_size_bytes > 0 AND file_size_bytes <= 15728640),
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

CREATE INDEX IF NOT EXISTS idx_documents_business ON documents(business_id);
CREATE INDEX IF NOT EXISTS idx_documents_folder ON documents(business_id, folder);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(business_id, status);
CREATE INDEX IF NOT EXISTS idx_documents_archived ON documents(business_id, is_archived);

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

CREATE INDEX IF NOT EXISTS idx_ocr_results_document ON document_ocr_results(document_id);
CREATE INDEX IF NOT EXISTS idx_ocr_results_business ON document_ocr_results(business_id);
CREATE INDEX IF NOT EXISTS idx_ocr_results_provisional ON document_ocr_results(business_id, provisional);
