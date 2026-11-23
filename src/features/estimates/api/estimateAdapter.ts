import type { InvoiceProfile } from "@/features/invoices/api/invoiceAdapter";
import { httpClient, type RequestOptions } from "@/services/api/httpClient";

export type EstimateStatus =
  | "draft"
  | "sent"
  | "accepted"
  | "rejected"
  | "converted"
  | "expired";

export interface EstimateItemProfile {
  id: string;
  description: string;
  quantity: number;
  unitPriceCents: number;
  totalCents: number;
}

export interface EstimateProfile {
  id: string;
  businessId: string;
  clientId: string;
  clientName?: string;
  estimateNumber: string;
  issueDate: string;
  validUntil: string;
  status: EstimateStatus;
  currency: string;
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
  notes: string | null;
  convertedInvoiceId: string | null;
  items: EstimateItemProfile[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateEstimateItemInput {
  description: string;
  quantity: number;
  unitPriceCents: number;
}

export interface CreateEstimateInput {
  clientId: string;
  estimateNumber?: string;
  issueDate: string;
  validUntil: string;
  currency?: string;
  items: CreateEstimateItemInput[];
  taxCents?: number;
  taxRateBps?: number;
  notes?: string;
  idempotencyKey?: string;
}

export const estimateAdapter = {
  list: async (
    businessId: string,
    filters: { status?: EstimateStatus; clientId?: string } = {},
    options?: Omit<RequestOptions, "businessId">,
  ): Promise<EstimateProfile[]> => {
    const params = new URLSearchParams();
    if (filters.status) params.set("status", filters.status);
    if (filters.clientId) params.set("clientId", filters.clientId);
    const queryString = params.toString() ? `?${params.toString()}` : "";

    return httpClient.get<EstimateProfile[]>(
      `/api/v1/estimates${queryString}`,
      {
        ...options,
        businessId,
      },
    );
  },

  getById: async (
    id: string,
    businessId: string,
    options?: Omit<RequestOptions, "businessId">,
  ): Promise<EstimateProfile> => {
    return httpClient.get<EstimateProfile>(`/api/v1/estimates/${id}`, {
      ...options,
      businessId,
    });
  },

  create: async (
    businessId: string,
    input: CreateEstimateInput,
    options?: Omit<RequestOptions, "businessId">,
  ): Promise<EstimateProfile> => {
    return httpClient.post<EstimateProfile>("/api/v1/estimates", input, {
      ...options,
      businessId,
      idempotencyKey: input.idempotencyKey,
    });
  },

  convert: async (
    id: string,
    businessId: string,
    options?: Omit<RequestOptions, "businessId"> & { idempotencyKey?: string },
  ): Promise<InvoiceProfile> => {
    return httpClient.post<InvoiceProfile>(
      `/api/v1/estimates/${id}/convert`,
      {},
      {
        ...options,
        businessId,
        idempotencyKey: options?.idempotencyKey,
      },
    );
  },

  convertToInvoice: async (
    id: string,
    businessId: string,
    options?: Omit<RequestOptions, "businessId"> & { idempotencyKey?: string },
  ): Promise<InvoiceProfile> => {
    return httpClient.post<InvoiceProfile>(
      `/api/v1/estimates/${id}/convert`,
      {},
      {
        ...options,
        businessId,
        idempotencyKey: options?.idempotencyKey,
      },
    );
  },
};
