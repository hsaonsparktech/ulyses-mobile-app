import { httpClient, type RequestOptions } from "@/services/api/httpClient";

export type DocumentFolder = "Receipts" | "Invoices" | "Statements";
export type DocumentStatus =
  | "Ready"
  | "Processing"
  | "Needs Review"
  | "Archived";
export type DocumentFileType = "pdf" | "png" | "jpg" | "jpeg" | "csv";

export interface DocumentProfile {
  id: string;
  businessId: string;
  filename: string;
  fileType: DocumentFileType;
  fileSizeBytes: number;
  mimeType: string;
  folder: DocumentFolder;
  storagePath: string;
  status: DocumentStatus;
  uploadedBy: string;
  uploaderName?: string;
  notes: string | null;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDocumentInput {
  filename: string;
  fileSizeBytes: number;
  mimeType: string;
  folder: DocumentFolder;
  storagePath?: string;
  notes?: string;
  initialStatus?: DocumentStatus;
}

export const documentAdapter = {
  list: async (
    businessId: string,
    filters: { folder?: DocumentFolder; isArchived?: boolean } = {},
    options?: Omit<RequestOptions, "businessId">,
  ): Promise<DocumentProfile[]> => {
    const params = new URLSearchParams();
    if (filters.folder) params.set("folder", filters.folder);
    if (typeof filters.isArchived === "boolean") {
      params.set("isArchived", String(filters.isArchived));
    }
    const queryString = params.toString() ? `?${params.toString()}` : "";

    return httpClient.get<DocumentProfile[]>(
      `/api/v1/documents${queryString}`,
      {
        ...options,
        businessId,
      },
    );
  },

  getById: async (
    id: string,
    businessId: string,
    options?: Omit<RequestOptions, "businessId">,
  ): Promise<DocumentProfile> => {
    return httpClient.get<DocumentProfile>(`/api/v1/documents/${id}`, {
      ...options,
      businessId,
    });
  },

  create: async (
    input: CreateDocumentInput,
    businessId: string,
    options?: Omit<RequestOptions, "businessId">,
  ): Promise<DocumentProfile> => {
    return httpClient.post<DocumentProfile>("/api/v1/documents", input, {
      ...options,
      businessId,
    });
  },

  archive: async (
    id: string,
    businessId: string,
    isArchived = true,
    options?: Omit<RequestOptions, "businessId">,
  ): Promise<DocumentProfile> => {
    return httpClient.post<DocumentProfile>(
      `/api/v1/documents/${id}/archive`,
      { isArchived },
      {
        ...options,
        businessId,
      },
    );
  },

  uploadBinary: async (
    businessId: string,
    filename: string,
    folder: DocumentFolder,
    data: Blob | ArrayBuffer | Uint8Array | string,
    notes?: string,
    options?: Omit<RequestOptions, "businessId">,
  ): Promise<DocumentProfile> => {
    const extraHeaders: Record<string, string> = {
      "X-File-Name": filename,
      "X-Folder": folder,
    };
    if (notes) extraHeaders["X-Notes"] = notes;

    return httpClient.post<DocumentProfile>("/api/v1/documents/upload", data, {
      ...options,
      headers: {
        ...options?.headers,
        ...extraHeaders,
      },
      businessId,
    });
  },

  getDownloadUrl: (businessId: string, documentId: string): string => {
    const baseUrl =
      process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:3001";
    return `${baseUrl.replace(/\/+$/, "")}/api/v1/documents/${documentId}/download`;
  },
};
