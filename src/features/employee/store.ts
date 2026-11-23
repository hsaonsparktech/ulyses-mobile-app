import { create } from "zustand";
import { env } from "@/config/env";
import { type ExpenseProfile, expenseAdapter } from "./api/expenseAdapter";
import {
  sampleEmployeeDocuments,
  sampleEmployeePermissions,
  sampleExpenseDrafts,
} from "./data/sampleEmployeeData";
import type {
  EmployeeDocument,
  EmployeePermission,
  ExpenseDraft,
} from "./types";

export function mapExpenseProfileToDraft(p: ExpenseProfile): ExpenseDraft {
  const statusMap: Record<string, ExpenseDraft["status"]> = {
    pending: "submitted",
    approved: "approved",
    rejected: "rejected",
    reimbursed: "approved",
  };

  return {
    id: p.id,
    vendor: p.merchant,
    amount: p.amountCents / 100,
    date: p.date,
    category: p.category,
    receiptUri: p.receiptUrl || undefined,
    status: statusMap[p.status] || "draft",
    notes: "",
  };
}

interface EmployeeStoreState {
  drafts: ExpenseDraft[];
  documents: EmployeeDocument[];
  permissions: EmployeePermission[];
  activeFilter: "all" | "draft" | "submitted" | "approved";
  isLoading: boolean;
  error: string | null;

  setActiveFilter: (filter: "all" | "draft" | "submitted" | "approved") => void;
  fetchExpenses: (businessId: string) => Promise<ExpenseDraft[]>;
  addDraft: (
    draft: Omit<ExpenseDraft, "id" | "status">,
    businessId?: string,
  ) => void;
  updateDraft: (id: string, partial: Partial<ExpenseDraft>) => void;
  deleteDraft: (id: string) => void;
  submitDraft: (id: string, businessId?: string) => void;
  addDocument: (doc: Omit<EmployeeDocument, "id">) => void;
  resetRemoteState: () => void;
}

export const useEmployeeStore = create<EmployeeStoreState>((set, get) => ({
  drafts: sampleExpenseDrafts,
  documents: sampleEmployeeDocuments,
  permissions: sampleEmployeePermissions,
  activeFilter: "all",
  isLoading: false,
  error: null,

  setActiveFilter: (filter) => set({ activeFilter: filter }),

  fetchExpenses: async (businessId: string) => {
    if (env.mockAuth) {
      return get().drafts;
    }

    set({ isLoading: true, error: null });
    try {
      const profiles = await expenseAdapter.list(businessId);
      const mapped = profiles.map(mapExpenseProfileToDraft);
      set({ drafts: mapped, isLoading: false });
      return mapped;
    } catch (err: any) {
      set({
        error: err?.message || "Failed to load expenses.",
        isLoading: false,
      });
      return get().drafts;
    }
  },

  addDraft: (draft, businessId?: string) => {
    const newDraft: ExpenseDraft = {
      ...draft,
      id: `draft-${Date.now()}`,
      status: "draft",
    };
    set((state) => ({ drafts: [newDraft, ...state.drafts] }));

    if (!env.mockAuth && businessId) {
      expenseAdapter
        .create(businessId, {
          merchant: draft.vendor,
          category: draft.category || "General",
          amountCents: Math.round(draft.amount * 100),
          date:
            draft.date ||
            new Date().toISOString().split("T")[0] ||
            "2026-11-22",
          idempotencyKey: `exp-create-${newDraft.id}`,
        })
        .then((created) => {
          set((state) => ({
            drafts: state.drafts.map((d) =>
              d.id === newDraft.id ? mapExpenseProfileToDraft(created) : d,
            ),
          }));
        })
        .catch(() => {});
    }
  },

  updateDraft: (id, partial) => {
    set((state) => ({
      drafts: state.drafts.map((d) => (d.id === id ? { ...d, ...partial } : d)),
    }));
  },

  deleteDraft: (id) => {
    set((state) => ({
      drafts: state.drafts.filter((d) => d.id !== id),
    }));
  },

  submitDraft: (id, businessId?: string) => {
    const draft = get().drafts.find((d) => d.id === id);
    const submittedDate = new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });

    set((state) => ({
      drafts: state.drafts.map((d) =>
        d.id === id
          ? {
              ...d,
              status: "submitted",
              submittedAt: submittedDate,
            }
          : d,
      ),
    }));

    if (!env.mockAuth && businessId && draft) {
      expenseAdapter
        .create(businessId, {
          merchant: draft.vendor,
          category: draft.category || "General",
          amountCents: Math.round(draft.amount * 100),
          date:
            draft.date ||
            new Date().toISOString().split("T")[0] ||
            "2026-11-22",
          idempotencyKey: `exp-submit-${id}`,
        })
        .then((created) => {
          set((state) => ({
            drafts: state.drafts.map((d) =>
              d.id === id ? mapExpenseProfileToDraft(created) : d,
            ),
          }));
        })
        .catch(() => {});
    }
  },

  addDocument: (doc) => {
    const newDoc: EmployeeDocument = {
      ...doc,
      id: `emp-doc-${Date.now()}`,
    };
    set((state) => ({ documents: [newDoc, ...state.documents] }));
  },

  resetRemoteState: () => {
    set({
      drafts: sampleExpenseDrafts,
      documents: sampleEmployeeDocuments,
      permissions: sampleEmployeePermissions,
      isLoading: false,
      error: null,
    });
  },
}));
