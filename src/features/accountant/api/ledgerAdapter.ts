import { httpClient, type RequestOptions } from "@/services/api/httpClient";

export type AccountType =
  | "asset"
  | "liability"
  | "equity"
  | "revenue"
  | "expense";

export interface AccountProfile {
  id: string;
  businessId: string;
  code: string;
  name: string;
  type: AccountType;
  currency: string;
  status: "active" | "archived";
  balanceCents: number;
  createdAt: string;
}

export interface JournalEntryLineProfile {
  id: string;
  accountId: string;
  accountCode?: string;
  accountName?: string;
  debitCents: number;
  creditCents: number;
  description: string | null;
}

export interface JournalEntryProfile {
  id: string;
  businessId: string;
  entryNumber: number;
  entryDate: string;
  description: string;
  status: "draft" | "posted" | "voided";
  createdBy: string;
  postedAt: string | null;
  reversedById: string | null;
  lines: JournalEntryLineProfile[];
  totalDebitCents: number;
  totalCreditCents: number;
}

export interface CreateJournalLineInput {
  accountId: string;
  debitCents: number;
  creditCents: number;
  description?: string;
}

export interface CreateJournalEntryInput {
  entryDate: string;
  description: string;
  lines: CreateJournalLineInput[];
}

export interface ReversalResult {
  originalEntry: JournalEntryProfile;
  reversalEntry: JournalEntryProfile;
}

export const ledgerAdapter = {
  listAccounts: async (
    businessId: string,
    options?: Omit<RequestOptions, "businessId">,
  ): Promise<AccountProfile[]> => {
    return httpClient.get<AccountProfile[]>("/api/v1/ledger/accounts", {
      ...options,
      businessId,
    });
  },

  listJournalEntries: async (
    businessId: string,
    filters: { status?: "draft" | "posted" | "voided" } = {},
    options?: Omit<RequestOptions, "businessId">,
  ): Promise<JournalEntryProfile[]> => {
    const params = new URLSearchParams();
    if (filters.status) params.set("status", filters.status);
    const queryString = params.toString() ? `?${params.toString()}` : "";

    return httpClient.get<JournalEntryProfile[]>(
      `/api/v1/ledger/entries${queryString}`,
      {
        ...options,
        businessId,
      },
    );
  },

  createJournalEntry: async (
    businessId: string,
    input: CreateJournalEntryInput,
    options?: Omit<RequestOptions, "businessId">,
  ): Promise<JournalEntryProfile> => {
    return httpClient.post<JournalEntryProfile>(
      "/api/v1/ledger/entries",
      input,
      {
        ...options,
        businessId,
      },
    );
  },

  reverseJournalEntry: async (
    id: string,
    businessId: string,
    reason: string,
    options?: Omit<RequestOptions, "businessId">,
  ): Promise<ReversalResult> => {
    return httpClient.post<ReversalResult>(
      `/api/v1/ledger/entries/${id}/reverse`,
      { reason },
      {
        ...options,
        businessId,
      },
    );
  },
};
