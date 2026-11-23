import { create } from "zustand";
import { env } from "@/config/env";
import {
  type AccountProfile,
  type JournalEntryProfile,
  ledgerAdapter,
} from "./api/ledgerAdapter";
import {
  sampleAccountantDocuments,
  sampleAccountantMetrics,
  sampleAccountantPermissions,
  sampleMonthlyFinancials,
  sampleProfitAndLoss,
  sampleVendorSpending,
} from "./data/sampleAccountantData";
import type {
  AccountantDocument,
  AccountantOverviewMetrics,
  AccountantPermission,
  MonthlyFinancialData,
  ProfitAndLossStatement,
  ReportExportConfig,
  VendorSpendingItem,
} from "./types";

interface AccountantStoreState {
  metrics: AccountantOverviewMetrics;
  monthlyData: MonthlyFinancialData[];
  pnl: ProfitAndLossStatement;
  vendorSpending: VendorSpendingItem[];
  documents: AccountantDocument[];
  permissions: AccountantPermission[];
  selectedPeriod: string;
  activeDocumentFilter: string;
  isExporting: boolean;
  lastExportResult: {
    format: string;
    timestamp: string;
    filename: string;
  } | null;
  isLoading: boolean;
  error: string | null;

  setSelectedPeriod: (period: string) => void;
  setActiveDocumentFilter: (filter: string) => void;
  markDocumentReconciled: (id: string) => void;
  exportReport: (config: ReportExportConfig) => Promise<boolean>;
  resetExportState: () => void;
  fetchLedgerAccounts: (businessId: string) => Promise<AccountProfile[]>;
  fetchJournalEntries: (
    businessId: string,
    status?: "draft" | "posted" | "voided",
  ) => Promise<JournalEntryProfile[]>;
  resetRemoteState: () => void;
}

export const useAccountantStore = create<AccountantStoreState>((set) => ({
  metrics: sampleAccountantMetrics,
  monthlyData: sampleMonthlyFinancials,
  pnl: sampleProfitAndLoss,
  vendorSpending: sampleVendorSpending,
  documents: sampleAccountantDocuments,
  permissions: sampleAccountantPermissions,
  selectedPeriod: "Q3 2026",
  activeDocumentFilter: "All",
  isExporting: false,
  lastExportResult: null,
  isLoading: false,
  error: null,

  setSelectedPeriod: (period) => set({ selectedPeriod: period }),

  setActiveDocumentFilter: (filter) => set({ activeDocumentFilter: filter }),

  markDocumentReconciled: (id) => {
    set((state) => ({
      documents: state.documents.map((doc) =>
        doc.id === id ? { ...doc, status: "Reconciled" as const } : doc,
      ),
    }));
  },

  exportReport: async (config) => {
    set({ isExporting: true });
    // Simulate brief export processing
    await new Promise((resolve) => setTimeout(resolve, 600));

    const timestamp = new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const filename = `Financial_Report_${config.period.replace(/\s+/g, "_")}.${config.format.toLowerCase()}`;

    set({
      isExporting: false,
      lastExportResult: {
        format: config.format,
        timestamp,
        filename,
      },
    });

    return true;
  },

  resetExportState: () => set({ lastExportResult: null, isExporting: false }),

  fetchLedgerAccounts: async (businessId: string) => {
    if (env.mockAuth) {
      return [];
    }

    set({ isLoading: true, error: null });
    try {
      const accounts = await ledgerAdapter.listAccounts(businessId);
      set({ isLoading: false });
      return accounts;
    } catch (err: any) {
      set({
        error: err?.message || "Failed to load ledger accounts.",
        isLoading: false,
      });
      return [];
    }
  },

  fetchJournalEntries: async (businessId, status) => {
    if (env.mockAuth) {
      return [];
    }

    set({ isLoading: true, error: null });
    try {
      const entries = await ledgerAdapter.listJournalEntries(businessId, {
        status,
      });
      set({ isLoading: false });
      return entries;
    } catch (err: any) {
      set({
        error: err?.message || "Failed to load journal entries.",
        isLoading: false,
      });
      return [];
    }
  },

  resetRemoteState: () => {
    set({
      metrics: sampleAccountantMetrics,
      monthlyData: sampleMonthlyFinancials,
      pnl: sampleProfitAndLoss,
      vendorSpending: sampleVendorSpending,
      documents: sampleAccountantDocuments,
      permissions: sampleAccountantPermissions,
      isLoading: false,
      error: null,
      lastExportResult: null,
      isExporting: false,
    });
  },
}));
