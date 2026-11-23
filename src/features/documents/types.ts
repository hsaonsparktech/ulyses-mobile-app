import type { DocumentType } from "@/components/ui/DocumentCard";

export type { DocumentType };

export interface DocumentItem {
  id: string;
  businessId: string;
  filename: string;
  type: DocumentType;
  status: "Ready" | "Processing" | "Needs Review" | "Archived";
  date: string;
  fileTypeLabel: "PDF" | "PNG" | "JPG" | "CSV";
  fileSize: string;
  folder: "Receipts" | "Invoices" | "Statements";
  vendorOrClient?: string;
  totalAmount?: number;
  extractedDate?: string;
  category?: string;
  notes?: string;
  archived?: boolean;
}
