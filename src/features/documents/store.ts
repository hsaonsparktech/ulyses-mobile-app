import { create } from "zustand";
import { env } from "@/config/env";
import { type DocumentProfile, documentAdapter } from "./api/documentAdapter";
import { sampleDocuments } from "./data/sampleDocuments";
import type { DocumentItem } from "./types";

export function mapDocumentProfileToItem(p: DocumentProfile): DocumentItem {
  const rawExt = p.fileType.toUpperCase();
  const fileExt = (rawExt === "JPEG" ? "JPG" : rawExt) as
    | "PDF"
    | "PNG"
    | "JPG"
    | "CSV";

  const typeMap: Record<string, DocumentItem["type"]> = {
    Invoices: "Invoice",
    Statements: "Statement",
    Receipts: "Receipt",
  };

  const formattedDate = p.createdAt
    ? p.createdAt.split("T")[0] || "2026-11-22"
    : "2026-11-22";

  return {
    id: p.id,
    businessId: p.businessId,
    filename: p.filename,
    type: typeMap[p.folder] || "Receipt",
    status: p.status,
    date: formattedDate,
    fileTypeLabel: fileExt,
    fileSize: `${Math.max(1, Math.round(p.fileSizeBytes / 1024))} KB`,
    folder: p.folder,
    vendorOrClient: p.uploaderName,
    notes: p.notes || undefined,
    archived: p.isArchived,
  };
}

interface DocumentState {
  documents: DocumentItem[];
  isLoading: boolean;
  error: string | null;

  fetchDocuments: (
    businessId: string,
    folder?: "Receipts" | "Invoices" | "Statements",
  ) => Promise<DocumentItem[]>;
  addDocument: (
    doc: Omit<DocumentItem, "id">,
    businessId?: string,
  ) => DocumentItem;
  archiveDocument: (id: string, businessId?: string) => void;
  unarchiveDocument: (id: string, businessId?: string) => void;
  deleteDocument: (id: string) => void;
  resetRemoteState: () => void;
}

export const useDocumentStore = create<DocumentState>((set, get) => ({
  documents: sampleDocuments,
  isLoading: false,
  error: null,

  fetchDocuments: async (businessId, folder) => {
    if (env.mockAuth) {
      return get().documents.filter((d) =>
        folder ? d.folder === folder : true,
      );
    }

    set({ isLoading: true, error: null });
    try {
      const profiles = await documentAdapter.list(businessId, { folder });
      const mapped = profiles.map(mapDocumentProfileToItem);
      set((state) => {
        const otherDocs = state.documents.filter(
          (d) => d.businessId !== businessId,
        );
        return {
          documents: [...mapped, ...otherDocs],
          isLoading: false,
        };
      });
      return mapped;
    } catch (err: any) {
      set({
        error: err?.message || "Failed to load documents.",
        isLoading: false,
      });
      return get().documents.filter((d) =>
        folder ? d.folder === folder : true,
      );
    }
  },

  addDocument: (docData, businessId?: string) => {
    const newDoc: DocumentItem = {
      ...docData,
      id: `doc-${Date.now()}`,
    };
    set((state) => ({
      documents: [newDoc, ...state.documents],
    }));

    const bId = businessId || docData.businessId;
    if (!env.mockAuth && bId) {
      documentAdapter
        .create(
          {
            filename: docData.filename,
            fileSizeBytes: 1024,
            mimeType:
              docData.fileTypeLabel === "PDF"
                ? "application/pdf"
                : "image/jpeg",
            folder: docData.folder,
            notes: docData.notes,
            initialStatus: docData.status,
          },
          bId,
        )
        .then((created) => {
          set((state) => ({
            documents: state.documents.map((d) =>
              d.id === newDoc.id ? mapDocumentProfileToItem(created) : d,
            ),
          }));
        })
        .catch(() => {});
    }

    return newDoc;
  },

  archiveDocument: (id: string, businessId?: string) => {
    set((state) => ({
      documents: state.documents.map((d) =>
        d.id === id ? { ...d, archived: true, status: "Archived" } : d,
      ),
    }));

    if (!env.mockAuth) {
      const doc = get().documents.find((d) => d.id === id);
      const bId = businessId || doc?.businessId;
      if (bId) {
        documentAdapter.archive(id, bId, true).catch(() => {});
      }
    }
  },

  unarchiveDocument: (id: string, businessId?: string) => {
    set((state) => ({
      documents: state.documents.map((d) =>
        d.id === id ? { ...d, archived: false, status: "Ready" } : d,
      ),
    }));

    if (!env.mockAuth) {
      const doc = get().documents.find((d) => d.id === id);
      const bId = businessId || doc?.businessId;
      if (bId) {
        documentAdapter.archive(id, bId, false).catch(() => {});
      }
    }
  },

  deleteDocument: (id: string) => {
    set((state) => ({
      documents: state.documents.filter((d) => d.id !== id),
    }));
  },

  resetRemoteState: () => {
    set({ documents: sampleDocuments, isLoading: false, error: null });
  },
}));
