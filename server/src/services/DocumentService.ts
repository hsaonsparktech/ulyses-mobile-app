import type { Database } from "../db/client";
import { getDatabase } from "../db/client";
import type {
  DocumentEntity,
  DocumentFolder,
  DocumentOcrResultEntity,
  DocumentProfile,
  DocumentStatus,
} from "../entities/Document";
import { toDocumentProfile } from "../entities/Document";
import type { UserRole } from "../entities/User";
import { DocumentStorage } from "../storage/DocumentStorage";
import { randomId } from "../utils/crypto";
import { HttpError } from "../utils/problemDetails";
import { AuditService } from "./AuditService";

export interface CreateDocumentInput {
  filename: string;
  fileSizeBytes: number;
  mimeType: string;
  folder: DocumentFolder;
  storagePath?: string;
  notes?: string;
  initialStatus?: DocumentStatus;
}

export interface ListDocumentsFilter {
  folder?: DocumentFolder;
  isArchived?: boolean;
  status?: DocumentStatus;
  limit?: number;
  offset?: number;
}

export class DocumentService {
  private db: Database;
  private auditService: AuditService;
  private storage: DocumentStorage;

  constructor(db?: Database, storage?: DocumentStorage) {
    this.db = db ?? getDatabase();
    this.auditService = new AuditService(this.db);
    this.storage = storage ?? new DocumentStorage();
  }

  async uploadDocumentBinary(params: {
    businessId: string;
    uploadedBy: string;
    role: UserRole;
    filename: string;
    folder: DocumentFolder;
    buffer: Buffer;
    notes?: string;
  }): Promise<DocumentProfile> {
    const { businessId, uploadedBy, role, filename, folder, buffer, notes } =
      params;

    if (role === "accountant") {
      throw new HttpError(
        403,
        "Forbidden",
        "Accountants have read-only access and cannot upload documents.",
      );
    }

    if (role === "employee" && folder !== "Receipts") {
      throw new HttpError(
        403,
        "Forbidden",
        "Employees may only upload documents to the Receipts folder.",
      );
    }

    const stored = await this.storage.storeFile(businessId, filename, buffer);

    this.db
      .prepare(
        `INSERT INTO documents (
          id, business_id, filename, file_type, file_size_bytes, mime_type,
          folder, storage_path, status, uploaded_by, notes, is_archived
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Ready', ?, ?, 0)`,
      )
      .run(
        stored.documentId,
        businessId,
        stored.filename,
        stored.fileType,
        stored.fileSizeBytes,
        stored.mimeType,
        folder,
        stored.storagePath,
        uploadedBy,
        notes ?? null,
      );

    this.auditService.logEvent({
      businessId,
      userId: uploadedBy,
      action: "document_uploaded",
      resource: "document",
      resourceId: stored.documentId,
      metadata: {
        filename: stored.filename,
        folder,
        fileSizeBytes: stored.fileSizeBytes,
        fileType: stored.fileType,
      },
    });

    return this.getDocument(businessId, stored.documentId);
  }

  getDownloadStream(
    businessId: string,
    documentId: string,
    userId: string,
    role: UserRole,
  ): {
    stream: import("node:fs").ReadStream;
    doc: DocumentProfile;
    size: number;
  } {
    const doc = this.getDocument(businessId, documentId);

    if (
      role === "employee" &&
      doc.folder !== "Receipts" &&
      doc.uploadedBy !== userId
    ) {
      throw new HttpError(
        403,
        "Forbidden",
        "Access denied: Employees may only download their own uploads or Receipts.",
      );
    }

    const fileStreamResult = this.storage.getFileStream(
      businessId,
      doc.storagePath,
    );
    return { ...fileStreamResult, doc };
  }

  createDocument(
    businessId: string,
    uploadedBy: string,
    input: CreateDocumentInput,
  ): DocumentProfile {
    if (!input.filename || input.filename.trim().length === 0) {
      throw new HttpError(400, "Validation Error", "Filename is required.");
    }

    const maxSizeBytes = 15 * 1024 * 1024; // 15MB
    if (!input.fileSizeBytes || input.fileSizeBytes <= 0) {
      throw new HttpError(
        400,
        "Validation Error",
        "File size must be greater than 0 bytes.",
      );
    }
    if (input.fileSizeBytes > maxSizeBytes) {
      throw new HttpError(
        413,
        "Payload Too Large",
        `File size exceeds maximum allowed limit of 15MB (${input.fileSizeBytes} bytes provided).`,
      );
    }

    const extMatch = input.filename.toLowerCase().match(/\.([a-z0-9]+)$/);
    const ext = extMatch?.[1] ?? "";
    const allowedExtensions = ["pdf", "png", "jpg", "jpeg", "csv"];
    if (!allowedExtensions.includes(ext)) {
      throw new HttpError(
        400,
        "Unsupported Media Type",
        `File extension .${ext} is not supported. Supported extensions: ${allowedExtensions.join(", ")}.`,
      );
    }
    const fileType = (ext === "jpeg" ? "jpg" : ext) as
      | "pdf"
      | "png"
      | "jpg"
      | "csv";

    const allowedFolders: DocumentFolder[] = [
      "Receipts",
      "Invoices",
      "Statements",
    ];
    if (!allowedFolders.includes(input.folder)) {
      throw new HttpError(
        400,
        "Validation Error",
        `Invalid folder '${input.folder}'. Must be one of: ${allowedFolders.join(", ")}.`,
      );
    }

    const documentId = randomId();
    const storagePath =
      input.storagePath ||
      `storage/${businessId}/${documentId}_${input.filename.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const status: DocumentStatus = input.initialStatus || "Ready";

    this.db
      .prepare(
        `INSERT INTO documents (
          id, business_id, filename, file_type, file_size_bytes, mime_type,
          folder, storage_path, status, uploaded_by, notes, is_archived
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      )
      .run(
        documentId,
        businessId,
        input.filename.trim(),
        fileType,
        input.fileSizeBytes,
        input.mimeType || "application/octet-stream",
        input.folder,
        storagePath,
        status,
        uploadedBy,
        input.notes ?? null,
      );

    this.auditService.logEvent({
      businessId,
      userId: uploadedBy,
      action: "document_uploaded",
      resource: "document",
      resourceId: documentId,
      metadata: {
        filename: input.filename,
        folder: input.folder,
        fileSizeBytes: input.fileSizeBytes,
      },
    });

    return this.getDocument(businessId, documentId);
  }

  getDocument(businessId: string, documentId: string): DocumentProfile {
    const doc = this.db
      .prepare(
        `SELECT d.*, u.full_name as uploader_name
         FROM documents d
         JOIN users u ON u.id = d.uploaded_by
         WHERE d.id = ? AND d.business_id = ?`,
      )
      .get(documentId, businessId) as
      | (DocumentEntity & { uploader_name?: string })
      | undefined;

    if (!doc) {
      throw new HttpError(
        404,
        "Not Found",
        `Document ${documentId} not found.`,
      );
    }

    const ocr = this.db
      .prepare(
        "SELECT * FROM document_ocr_results WHERE document_id = ? AND business_id = ?",
      )
      .get(documentId, businessId) as DocumentOcrResultEntity | undefined;

    return toDocumentProfile(doc, ocr, doc.uploader_name);
  }

  listDocuments(
    businessId: string,
    userId: string,
    role: UserRole,
    filters: ListDocumentsFilter = {},
  ): DocumentProfile[] {
    let sql = `
      SELECT d.*, u.full_name as uploader_name
      FROM documents d
      JOIN users u ON u.id = d.uploaded_by
      WHERE d.business_id = ?
    `;
    const params: unknown[] = [businessId];

    // RBAC: Employees are restricted to Receipts folder or their own uploads
    if (role === "employee") {
      sql += " AND (d.folder = 'Receipts' OR d.uploaded_by = ?)";
      params.push(userId);
    }

    if (filters.folder) {
      sql += " AND d.folder = ?";
      params.push(filters.folder);
    }

    if (typeof filters.isArchived === "boolean") {
      sql += " AND d.is_archived = ?";
      params.push(filters.isArchived ? 1 : 0);
    }

    if (filters.status) {
      sql += " AND d.status = ?";
      params.push(filters.status);
    }

    sql += " ORDER BY d.created_at DESC";

    const limit = Math.min(Math.max(Number(filters.limit) || 50, 1), 100);
    const offset = Math.max(Number(filters.offset) || 0, 0);
    sql += " LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const rows = this.db
      .prepare(sql)
      .all(...params) as unknown as (DocumentEntity & {
      uploader_name?: string;
    })[];

    return rows.map((doc) => {
      const ocr = this.db
        .prepare(
          "SELECT * FROM document_ocr_results WHERE document_id = ? AND business_id = ?",
        )
        .get(doc.id, businessId) as DocumentOcrResultEntity | undefined;

      return toDocumentProfile(doc, ocr, doc.uploader_name);
    });
  }

  setArchiveStatus(
    businessId: string,
    documentId: string,
    userId: string,
    role: UserRole,
    isArchived: boolean,
  ): DocumentProfile {
    // Only Owners can archive or unarchive documents
    if (role !== "owner") {
      throw new HttpError(
        403,
        "Forbidden",
        "Only the business owner has permission to archive or restore documents.",
      );
    }

    const existing = this.getDocument(businessId, documentId);

    this.db
      .prepare(
        `UPDATE documents
         SET is_archived = ?, status = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ? AND business_id = ?`,
      )
      .run(
        isArchived ? 1 : 0,
        isArchived ? "Archived" : "Ready",
        documentId,
        businessId,
      );

    this.auditService.logEvent({
      businessId,
      userId,
      action: isArchived ? "document_archived" : "document_restored",
      resource: "document",
      resourceId: documentId,
      metadata: { previousStatus: existing.status, isArchived },
    });

    return this.getDocument(businessId, documentId);
  }
}
