import { httpClient, type RequestOptions } from "@/services/api/httpClient";

export type ExpenseStatus = "pending" | "approved" | "rejected" | "reimbursed";

export interface ExpenseProfile {
  id: string;
  businessId: string;
  category: string;
  merchant: string;
  amountCents: number;
  currency: string;
  date: string;
  receiptUrl: string | null;
  status: ExpenseStatus;
  createdBy: string;
  creatorName?: string;
  approvedBy: string | null;
  journalEntryId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExpenseInput {
  category: string;
  merchant: string;
  amountCents: number;
  date: string;
  currency?: string;
  receiptUrl?: string;
  idempotencyKey?: string;
}

export const expenseAdapter = {
  list: async (
    businessId: string,
    filters: { status?: ExpenseStatus } = {},
    options?: Omit<RequestOptions, "businessId">,
  ): Promise<ExpenseProfile[]> => {
    const params = new URLSearchParams();
    if (filters.status) params.set("status", filters.status);
    const queryString = params.toString() ? `?${params.toString()}` : "";

    return httpClient.get<ExpenseProfile[]>(`/api/v1/expenses${queryString}`, {
      ...options,
      businessId,
    });
  },

  getById: async (
    id: string,
    businessId: string,
    options?: Omit<RequestOptions, "businessId">,
  ): Promise<ExpenseProfile> => {
    return httpClient.get<ExpenseProfile>(`/api/v1/expenses/${id}`, {
      ...options,
      businessId,
    });
  },

  create: async (
    businessId: string,
    input: CreateExpenseInput,
    options?: Omit<RequestOptions, "businessId">,
  ): Promise<ExpenseProfile> => {
    return httpClient.post<ExpenseProfile>("/api/v1/expenses", input, {
      ...options,
      businessId,
      idempotencyKey: input.idempotencyKey,
    });
  },

  approve: async (
    id: string,
    businessId: string,
    options?: Omit<RequestOptions, "businessId">,
  ): Promise<ExpenseProfile> => {
    return httpClient.post<ExpenseProfile>(
      `/api/v1/expenses/${id}/approve`,
      {},
      {
        ...options,
        businessId,
      },
    );
  },

  reject: async (
    id: string,
    businessId: string,
    reason?: string,
    options?: Omit<RequestOptions, "businessId">,
  ): Promise<ExpenseProfile> => {
    return httpClient.post<ExpenseProfile>(
      `/api/v1/expenses/${id}/reject`,
      { reason },
      {
        ...options,
        businessId,
      },
    );
  },
};
