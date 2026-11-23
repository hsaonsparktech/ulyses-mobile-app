import { create } from "zustand";
import { env } from "@/config/env";
import { scanAdapter } from "./api/scanAdapter";
import type { ScanResult } from "./types";

interface ScanStoreState {
  currentScan: ScanResult | null;
  isProcessing: boolean;
  scanModalOpen: boolean;
  reviewModalOpen: boolean;
  zoomModalOpen: boolean;
  statementModalOpen: boolean;
  failedModalOpen: boolean;

  openScanSource: () => void;
  closeScanSource: () => void;
  startScanning: (
    source: "camera" | "library" | "pdf",
    failSimulate?: boolean,
  ) => void;
  setProcessing: (isProc: boolean) => void;
  setReviewModalOpen: (open: boolean) => void;
  setZoomModalOpen: (open: boolean) => void;
  setStatementModalOpen: (open: boolean) => void;
  setFailedModalOpen: (open: boolean) => void;
  updateCurrentScanField: (field: keyof ScanResult, value: unknown) => void;
  confirmScan: (businessId?: string, documentId?: string) => Promise<void>;
  resetScan: () => void;
  resetRemoteState: () => void;
}

const mockReceiptScan: ScanResult = {
  id: "scan-mock-01",
  sourceType: "camera",
  fileName: "Receipt_OfficeDepot_Nov04.jpg",
  status: "review",
  documentType: "receipt",
  vendor: "Office Depot",
  date: "2026-11-04",
  category: "Office Supplies",
  subtotal: 124.5,
  tax: 11.2,
  total: 135.7,
  confidence: 98,
};

const mockStatementScan: ScanResult = {
  id: "scan-mock-02",
  sourceType: "pdf",
  fileName: "Chase_Operating_Oct2026.pdf",
  status: "review",
  documentType: "statement",
  vendor: "Chase Commercial Bank",
  date: "2026-10-31",
  category: "Banking",
  subtotal: 4250.0,
  tax: 0.0,
  total: 4250.0,
  confidence: 96,
  lines: [
    {
      id: "stl-1",
      date: "2026-10-02",
      description: "Chevron Fuel Station",
      category: "Fuel & Travel",
      amount: 68.4,
      type: "debit",
      status: "matched",
    },
    {
      id: "stl-2",
      date: "2026-10-05",
      description: "AWS Cloud Hosting",
      category: "Software & IT",
      amount: 412.18,
      type: "debit",
      status: "matched",
    },
    {
      id: "stl-3",
      date: "2026-10-12",
      description: "Client Wire: Acme Labs",
      category: "Income",
      amount: 5200.0,
      type: "credit",
      status: "matched",
    },
    {
      id: "stl-4",
      date: "2026-10-18",
      description: "Staples Business Delivery",
      category: "Office Supplies",
      amount: 145.2,
      type: "debit",
      status: "review",
    },
  ],
};

export const useScanStore = create<ScanStoreState>((set, get) => ({
  currentScan: null,
  isProcessing: false,
  scanModalOpen: false,
  reviewModalOpen: false,
  zoomModalOpen: false,
  statementModalOpen: false,
  failedModalOpen: false,

  openScanSource: () => set({ scanModalOpen: true }),
  closeScanSource: () => set({ scanModalOpen: false }),

  startScanning: (source, failSimulate = false) => {
    set({
      scanModalOpen: false,
      isProcessing: true,
      currentScan: null,
    });

    // Simulate OCR processing steps
    setTimeout(() => {
      set({ isProcessing: false });
      if (failSimulate) {
        set({
          failedModalOpen: true,
          currentScan: {
            id: `scan-${Date.now()}`,
            sourceType: source,
            fileName: "Unreadable_Document.png",
            status: "failed",
            documentType: "receipt",
            vendor: "",
            date: "",
            category: "",
            subtotal: 0,
            tax: 0,
            total: 0,
            confidence: 12,
            errorMessage:
              "Unable to detect legible text. Glare or blur detected.",
          },
        });
      } else if (source === "pdf") {
        set({
          statementModalOpen: true,
          currentScan: { ...mockStatementScan, id: `scan-${Date.now()}` },
        });
      } else {
        set({
          reviewModalOpen: true,
          currentScan: {
            ...mockReceiptScan,
            id: `scan-${Date.now()}`,
            sourceType: source,
          },
        });
      }
    }, 1200);
  },

  setProcessing: (isProc) => set({ isProcessing: isProc }),
  setReviewModalOpen: (open) => set({ reviewModalOpen: open }),
  setZoomModalOpen: (open) => set({ zoomModalOpen: open }),
  setStatementModalOpen: (open) => set({ statementModalOpen: open }),
  setFailedModalOpen: (open) => set({ failedModalOpen: open }),

  updateCurrentScanField: (field, value) => {
    set((state) => {
      if (!state.currentScan) return state;
      return {
        currentScan: {
          ...state.currentScan,
          [field]: value,
        },
      };
    });
  },

  confirmScan: async (businessId?: string, documentId?: string) => {
    const current = get().currentScan;
    if (current) {
      set({
        currentScan: { ...current, status: "confirmed" },
        reviewModalOpen: false,
        statementModalOpen: false,
      });

      if (!env.mockAuth && businessId && (documentId || current.id)) {
        const docId = documentId || current.id;
        try {
          await scanAdapter.review(docId, "confirmed", businessId);
        } catch {}
      }
    }
  },

  resetScan: () => {
    set({
      currentScan: null,
      isProcessing: false,
      scanModalOpen: false,
      reviewModalOpen: false,
      zoomModalOpen: false,
      statementModalOpen: false,
      failedModalOpen: false,
    });
  },

  resetRemoteState: () => {
    set({
      currentScan: null,
      isProcessing: false,
      scanModalOpen: false,
      reviewModalOpen: false,
      zoomModalOpen: false,
      statementModalOpen: false,
      failedModalOpen: false,
    });
  },
}));
