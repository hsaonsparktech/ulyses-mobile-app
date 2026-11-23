import { create } from "zustand";
import type {
  BillingCycle,
  DataExportConfig,
  SubscriptionState,
} from "./types";

interface MembershipStore {
  subscription: SubscriptionState;
  exportConfig: DataExportConfig;
  isExporting: boolean;
  exportReady: boolean;
  setCycle: (cycle: BillingCycle) => void;
  cancelSubscription: () => void;
  reactivateSubscription: () => void;
  updateExportConfig: (partial: Partial<DataExportConfig>) => void;
  prepareExport: () => Promise<void>;
  resetExport: () => void;
}

const initialSubscription: SubscriptionState = {
  planName: "Pro plan",
  priceFormatted: "$20/mo",
  cycle: "monthly",
  status: "active",
  renewalDate: "November 28, 2026",
  nextBillingDate: "November 28, 2026",
  annualSavings: "Save $40/yr with annual billing",
  dataRetentionDays: 90,
  exportWindowDays: 30,
  isCancelled: false,
};

const initialExportConfig: DataExportConfig = {
  report: "All records and attachments",
  period: "All dates",
  business: "Acme Services LLC",
  format: "PDF / CSV",
  status: "idle",
};

export const useMembershipStore = create<MembershipStore>((set, get) => ({
  subscription: initialSubscription,
  exportConfig: initialExportConfig,
  isExporting: false,
  exportReady: false,

  setCycle: (cycle: BillingCycle) => {
    set((state) => ({
      subscription: {
        ...state.subscription,
        cycle,
        priceFormatted: cycle === "annual" ? "$200/yr" : "$20/mo",
        annualSavings:
          cycle === "annual"
            ? "Annual plan active · saving $40/yr"
            : "Save $40/yr with annual billing",
      },
    }));
  },

  cancelSubscription: () => {
    set((state) => ({
      subscription: {
        ...state.subscription,
        status: "cancelled",
        isCancelled: true,
      },
    }));
  },

  reactivateSubscription: () => {
    set((state) => ({
      subscription: {
        ...state.subscription,
        status: "active",
        isCancelled: false,
      },
    }));
  },

  updateExportConfig: (partial: Partial<DataExportConfig>) => {
    set((state) => ({
      exportConfig: { ...state.exportConfig, ...partial },
    }));
  },

  prepareExport: async () => {
    set({ isExporting: true, exportReady: false });
    // Simulate generation of export bundle
    await new Promise((resolve) => setTimeout(resolve, 800));
    set({
      isExporting: false,
      exportReady: true,
      exportConfig: {
        ...get().exportConfig,
        status: "ready",
        generatedAt: new Date().toISOString(),
        downloadUrl: "libros-export-acme-all.zip",
      },
    });
  },

  resetExport: () => {
    set({
      isExporting: false,
      exportReady: false,
      exportConfig: { ...initialExportConfig },
    });
  },
}));
