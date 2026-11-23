import { create } from "zustand";
import { env } from "@/config/env";
import { type EstimateProfile, estimateAdapter } from "./api/estimateAdapter";
import { sampleEstimates } from "./data/sampleEstimates";
import type {
  CreateEstimateInput,
  Estimate,
  EstimateLineItem,
  EstimateStatus,
} from "./types";

export function mapEstimateProfileToEstimate(p: EstimateProfile): Estimate {
  const statusMap: Record<string, EstimateStatus> = {
    draft: "Draft",
    sent: "Sent",
    accepted: "Accepted",
    converted: "Accepted",
    rejected: "Declined",
    expired: "Declined",
  };

  return {
    id: p.id,
    estimateNumber: p.estimateNumber,
    name: p.notes || "Estimate",
    businessId: p.businessId,
    clientId: p.clientId,
    clientName: p.clientName || "Client",
    clientEmail: "",
    date: p.issueDate,
    currency: p.currency,
    items: (p.items || []).map((item) => ({
      id: item.id,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPriceCents / 100,
      amount: item.totalCents / 100,
    })),
    subtotal: p.subtotalCents / 100,
    tax: p.taxCents / 100,
    total: p.totalCents / 100,
    status: statusMap[p.status] || "Draft",
    template: "clean",
    convertedToInvoiceId: p.convertedInvoiceId || undefined,
  };
}

interface EstimateState {
  estimates: Estimate[];
  isLoading: boolean;
  error: string | null;
  fetchEstimates: (businessId: string) => Promise<Estimate[]>;
  getEstimatesByBusiness: (businessId: string) => Estimate[];
  getEstimateById: (id: string) => Estimate | undefined;
  addEstimate: (businessId: string, input: CreateEstimateInput) => Estimate;
  updateEstimateStatus: (
    id: string,
    status: EstimateStatus,
    businessId?: string,
  ) => void;
  markConverted: (
    estimateId: string,
    invoiceId: string,
    businessId?: string,
  ) => void;
  convertEstimate: (
    estimateId: string,
    businessId: string,
  ) => Promise<string | null>;
  resetRemoteState: () => void;
}

export const useEstimateStore = create<EstimateState>((set, get) => ({
  estimates: sampleEstimates,
  isLoading: false,
  error: null,

  fetchEstimates: async (businessId: string) => {
    if (env.mockAuth) {
      return get().getEstimatesByBusiness(businessId);
    }

    set({ isLoading: true, error: null });
    try {
      const profiles = await estimateAdapter.list(businessId);
      const mapped = profiles.map(mapEstimateProfileToEstimate);
      set((state) => {
        const otherEstimates = state.estimates.filter(
          (est) => est.businessId !== businessId,
        );
        return {
          estimates: [...mapped, ...otherEstimates],
          isLoading: false,
        };
      });
      return mapped;
    } catch (err: any) {
      set({
        error: err?.message || "Failed to load estimates.",
        isLoading: false,
      });
      return get().getEstimatesByBusiness(businessId);
    }
  },

  getEstimatesByBusiness: (businessId: string) => {
    return get().estimates.filter((est) => est.businessId === businessId);
  },

  getEstimateById: (id: string) => {
    return get().estimates.find((est) => est.id === id);
  },

  addEstimate: (businessId: string, input: CreateEstimateInput) => {
    const nextNum = get().estimates.length + 109;
    const estimateNumber = `EST-0${nextNum}`;
    const id = `est-${Date.now()}`;
    const items: EstimateLineItem[] = input.items.map((item, index) => ({
      id: `est-item-${Date.now()}-${index}`,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      amount: item.quantity * item.unitPrice,
    }));
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const tax = input.tax ?? 0;
    const total = subtotal + tax;

    const newEstimate: Estimate = {
      id,
      estimateNumber,
      name: input.name,
      businessId,
      clientId: input.clientId,
      clientName: input.clientName,
      clientEmail: input.clientEmail,
      date: input.date ?? "Nov 08, 2026",
      currency: input.currency ?? "USD",
      items,
      subtotal,
      tax,
      total,
      status: input.status ?? "Draft",
      template: input.template ?? "clean",
    };

    set((state) => ({
      estimates: [newEstimate, ...state.estimates],
    }));

    if (!env.mockAuth) {
      estimateAdapter
        .create(businessId, {
          clientId: input.clientId,
          issueDate:
            input.date ??
            (new Date().toISOString().split("T")[0] || "2026-11-22"),
          validUntil:
            new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0] ||
            "2026-12-22",
          currency: input.currency ?? "USD",
          items: input.items.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unitPriceCents: Math.round(item.unitPrice * 100),
          })),
          taxCents: Math.round((input.tax ?? 0) * 100),
          notes: input.name,
          idempotencyKey: `est-create-${id}`,
        })
        .then((created) => {
          set((state) => ({
            estimates: state.estimates.map((est) =>
              est.id === id ? mapEstimateProfileToEstimate(created) : est,
            ),
          }));
        })
        .catch(() => {});
    }

    return newEstimate;
  },

  updateEstimateStatus: (
    id: string,
    status: EstimateStatus,
    _businessId?: string,
  ) => {
    set((state) => ({
      estimates: state.estimates.map((est) =>
        est.id === id ? { ...est, status } : est,
      ),
    }));
  },

  markConverted: (
    estimateId: string,
    invoiceId: string,
    businessId?: string,
  ) => {
    set((state) => ({
      estimates: state.estimates.map((est) =>
        est.id === estimateId
          ? { ...est, status: "Accepted", convertedToInvoiceId: invoiceId }
          : est,
      ),
    }));

    if (!env.mockAuth) {
      const est = get().estimates.find((e) => e.id === estimateId);
      const bId = businessId || est?.businessId;
      if (bId) {
        estimateAdapter.convertToInvoice(estimateId, bId).catch(() => {});
      }
    }
  },

  convertEstimate: async (
    estimateId: string,
    businessId: string,
  ): Promise<string | null> => {
    if (env.mockAuth) {
      const fakeInvoiceId = `inv-conv-${Date.now()}`;
      get().markConverted(estimateId, fakeInvoiceId, businessId);
      return fakeInvoiceId;
    }

    try {
      const invoice = await estimateAdapter.convertToInvoice(
        estimateId,
        businessId,
        {
          idempotencyKey: `conv-${estimateId}-${Date.now()}`,
        },
      );
      get().markConverted(estimateId, invoice.id, businessId);
      return invoice.id;
    } catch (err: any) {
      set({ error: err?.message || "Failed to convert estimate." });
      return null;
    }
  },

  resetRemoteState: () => {
    set({ estimates: sampleEstimates, isLoading: false, error: null });
  },
}));
