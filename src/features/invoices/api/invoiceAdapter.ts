import { httpClient, type RequestOptions } from "@/services/api/httpClient";

export type InvoiceStatus =
  | "draft"
  | "sent"
  | "partially_paid"
  | "paid"
  | "overdue"
  | "cancelled";

export interface InvoiceItemProfile {
  id: string;
  description: string;
  quantity: number;
  unitPriceCents: number;
  totalCents: number;
}

export interface InvoiceProfile {
  id: string;
  businessId: string;
  clientId: string;
  clientName?: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
  currency: string;
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
  amountPaidCents: number;
  remainingBalanceCents: number;
  notes: string | null;
  items: InvoiceItemProfile[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateInvoiceItemInput {
  description: string;
  quantity: number;
  unitPriceCents: number;
}

export interface CreateInvoiceInput {
  clientId: string;
  invoiceNumber?: string;
  issueDate: string;
  dueDate: string;
  currency?: string;
  items: CreateInvoiceItemInput[];
  taxCents?: number;
  taxRateBps?: number;
  notes?: string;
  idempotencyKey?: string;
}

export interface RecordPaymentInput {
  amountCents: number;
  paymentDate?: string;
  notes?: string;
}

export const invoiceAdapter = {
  list: async (
    businessId: string,
    filters: { status?: InvoiceStatus; clientId?: string } = {},
    options?: Omit<RequestOptions, "businessId">,
  ): Promise<InvoiceProfile[]> => {
    const params = new URLSearchParams();
    if (filters.status) params.set("status", filters.status);
    if (filters.clientId) params.set("clientId", filters.clientId);
    const queryString = params.toString() ? `?${params.toString()}` : "";

    return httpClient.get<InvoiceProfile[]>(`/api/v1/invoices${queryString}`, {
      ...options,
      businessId,
    });
  },

  getById: async (
    id: string,
    businessId: string,
    options?: Omit<RequestOptions, "businessId">,
  ): Promise<InvoiceProfile> => {
    return httpClient.get<InvoiceProfile>(`/api/v1/invoices/${id}`, {
      ...options,
      businessId,
    });
  },

  create: async (
    businessId: string,
    input: CreateInvoiceInput,
    options?: Omit<RequestOptions, "businessId">,
  ): Promise<InvoiceProfile> => {
    return httpClient.post<InvoiceProfile>("/api/v1/invoices", input, {
      ...options,
      businessId,
      idempotencyKey: input.idempotencyKey,
    });
  },

  send: async (
    id: string,
    businessId: string,
    options?: Omit<RequestOptions, "businessId">,
  ): Promise<InvoiceProfile> => {
    return httpClient.post<InvoiceProfile>(
      `/api/v1/invoices/${id}/send`,
      {},
      {
        ...options,
        businessId,
      },
    );
  },

  recordPayment: async (
    id: string,
    businessId: string,
    payment: RecordPaymentInput,
    options?: Omit<RequestOptions, "businessId">,
  ): Promise<InvoiceProfile> => {
    return httpClient.post<InvoiceProfile>(
      `/api/v1/invoices/${id}/payments`,
      payment,
      {
        ...options,
        businessId,
      },
    );
  },
};
