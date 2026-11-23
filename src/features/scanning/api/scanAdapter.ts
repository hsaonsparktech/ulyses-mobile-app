import { httpClient, type RequestOptions } from "@/services/api/httpClient";

export interface ExtractedField {
  label: string;
  value: string;
  confidence: number;
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

export const scanAdapter = {
  processOcr: async (
    input: ProcessOcrInput,
    businessId: string,
    options?: Omit<RequestOptions, "businessId">,
  ): Promise<DocumentOcrProfile> => {
    return httpClient.post<DocumentOcrProfile>("/api/v1/scanning/ocr", input, {
      ...options,
      businessId,
    });
  },

  getResult: async (
    documentId: string,
    businessId: string,
    options?: Omit<RequestOptions, "businessId">,
  ): Promise<DocumentOcrProfile> => {
    return httpClient.get<DocumentOcrProfile>(
      `/api/v1/scanning/results/${documentId}`,
      {
        ...options,
        businessId,
      },
    );
  },

  review: async (
    documentId: string,
    action: "confirmed" | "rejected",
    businessId: string,
    options?: Omit<RequestOptions, "businessId">,
  ): Promise<DocumentOcrProfile> => {
    return httpClient.post<DocumentOcrProfile>(
      `/api/v1/scanning/results/${documentId}/review`,
      { action },
      {
        ...options,
        businessId,
      },
    );
  },
};
