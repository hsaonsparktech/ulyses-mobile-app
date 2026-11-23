import { httpClient, type RequestOptions } from "@/services/api/httpClient";

export interface ClientProfile {
  id: string;
  businessId: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  address: string | null;
  status: "active" | "archived";
  totalInvoicedCents: number;
  outstandingBalanceCents: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClientInput {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  address?: string;
}

export interface UpdateClientInput {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  address?: string;
}

export const clientAdapter = {
  list: async (
    businessId: string,
    options?: Omit<RequestOptions, "businessId">,
  ): Promise<ClientProfile[]> => {
    return httpClient.get<ClientProfile[]>("/api/v1/clients", {
      ...options,
      businessId,
    });
  },

  getById: async (
    id: string,
    businessId: string,
    options?: Omit<RequestOptions, "businessId">,
  ): Promise<ClientProfile> => {
    return httpClient.get<ClientProfile>(`/api/v1/clients/${id}`, {
      ...options,
      businessId,
    });
  },

  create: async (
    businessId: string,
    input: CreateClientInput,
    options?: Omit<RequestOptions, "businessId">,
  ): Promise<ClientProfile> => {
    return httpClient.post<ClientProfile>("/api/v1/clients", input, {
      ...options,
      businessId,
    });
  },

  update: async (
    id: string,
    businessId: string,
    input: UpdateClientInput,
    options?: Omit<RequestOptions, "businessId">,
  ): Promise<ClientProfile> => {
    return httpClient.patch<ClientProfile>(`/api/v1/clients/${id}`, input, {
      ...options,
      businessId,
    });
  },

  archive: async (
    id: string,
    businessId: string,
    options?: Omit<RequestOptions, "businessId">,
  ): Promise<{ archived: boolean }> => {
    return httpClient.del<{ archived: boolean }>(`/api/v1/clients/${id}`, {
      ...options,
      businessId,
    });
  },
};
