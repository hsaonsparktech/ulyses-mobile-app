export interface ExtractedField {
  label: string;
  value: string;
  confidence: number; // 0 - 100
  isConfirmed?: boolean;
}

export interface StatementLine {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
  type: "debit" | "credit";
  status: "matched" | "unmatched" | "review";
}

export interface ScanResult {
  id: string;
  sourceType: "camera" | "library" | "pdf";
  imageUri?: string;
  fileName: string;
  status: "idle" | "processing" | "review" | "failed" | "confirmed";
  documentType: "receipt" | "invoice" | "statement";
  vendor: string;
  date: string;
  category: string;
  subtotal: number;
  tax: number;
  total: number;
  confidence: number;
  lines?: StatementLine[];
  errorMessage?: string;
}
