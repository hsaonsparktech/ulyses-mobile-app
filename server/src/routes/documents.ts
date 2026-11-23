import type { ServerResponse } from "node:http";
import { z } from "zod";
import type { Database } from "../db/client";
import { getDatabase } from "../db/client";
import type { DocumentFolder, DocumentStatus } from "../entities/Document";
import type { RequestWithAuth } from "../middleware/auth";
import { DocumentService } from "../services/DocumentService";
import { HttpError } from "../utils/problemDetails";

const createDocumentSchema = z.object({
  filename: z.string().trim().min(1, "Filename is required."),
  fileSizeBytes: z
    .number()
    .int()
    .positive("File size must be positive integer bytes."),
  mimeType: z.string().trim().min(1, "MIME type is required."),
  folder: z.enum(["Receipts", "Invoices", "Statements"]),
  storagePath: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  initialStatus: z
    .enum(["Ready", "Processing", "Needs Review", "Archived"])
    .optional(),
});

const archiveDocumentSchema = z.object({
  isArchived: z.boolean().default(true),
});

export function createDocumentRoutes(db?: Database) {
  const database = db ?? getDatabase();
  const documentService = new DocumentService(database);

  return {
    handleListDocuments: (req: RequestWithAuth, res: ServerResponse): void => {
      if (!req.businessContext || !req.user) {
        throw new HttpError(
          400,
          "Business Context Required",
          "Tenant context missing.",
        );
      }

      const folder = req.query?.folder as DocumentFolder | undefined;
      const isArchived =
        req.query?.isArchived === undefined
          ? undefined
          : req.query.isArchived === "true";
      const status = req.query?.status as DocumentStatus | undefined;
      const limit = req.query?.limit
        ? parseInt(req.query.limit, 10)
        : undefined;
      const offset = req.query?.offset
        ? parseInt(req.query.offset, 10)
        : undefined;

      const documents = documentService.listDocuments(
        req.businessContext.businessId,
        req.user.id,
        req.businessContext.role,
        { folder, isArchived, status, limit, offset },
      );

      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(documents, null, 2));
    },

    handleGetDocument: (req: RequestWithAuth, res: ServerResponse): void => {
      if (!req.businessContext || !req.user) {
        throw new HttpError(
          400,
          "Business Context Required",
          "Tenant context missing.",
        );
      }

      const documentId = req.params?.id;
      if (!documentId) {
        throw new HttpError(400, "Bad Request", "Document ID is required.");
      }

      const doc = documentService.getDocument(
        req.businessContext.businessId,
        documentId,
      );

      // RBAC: If Employee, they may only access receipts or their own uploads
      if (
        req.businessContext.role === "employee" &&
        doc.folder !== "Receipts" &&
        doc.uploadedBy !== req.user.id
      ) {
        throw new HttpError(
          403,
          "Forbidden",
          "Access denied: Employees may only view their own uploads or Receipts.",
        );
      }

      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(doc, null, 2));
    },

    handleCreateDocument: (req: RequestWithAuth, res: ServerResponse): void => {
      if (!req.businessContext || !req.user) {
        throw new HttpError(
          400,
          "Business Context Required",
          "Tenant context missing.",
        );
      }

      // RBAC: Accountant is read-only per Figma 20:5
      if (req.businessContext.role === "accountant") {
        throw new HttpError(
          403,
          "Forbidden",
          "Accountants have read-only access and cannot upload documents.",
        );
      }

      // RBAC: Employee may only upload to Receipts
      const payload = createDocumentSchema.parse(req.body);
      if (
        req.businessContext.role === "employee" &&
        payload.folder !== "Receipts"
      ) {
        throw new HttpError(
          403,
          "Forbidden",
          "Employees may only upload documents to the Receipts folder.",
        );
      }

      const created = documentService.createDocument(
        req.businessContext.businessId,
        req.user.id,
        payload,
      );

      res.statusCode = 201;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(created, null, 2));
    },

    handleArchiveDocument: (
      req: RequestWithAuth,
      res: ServerResponse,
    ): void => {
      if (!req.businessContext || !req.user) {
        throw new HttpError(
          400,
          "Business Context Required",
          "Tenant context missing.",
        );
      }

      // RBAC: Only Owner can archive
      if (req.businessContext.role !== "owner") {
        throw new HttpError(
          403,
          "Forbidden",
          "Only the business owner has permission to archive documents.",
        );
      }

      const documentId = req.params?.id;
      if (!documentId) {
        throw new HttpError(400, "Bad Request", "Document ID is required.");
      }

      const parsed = archiveDocumentSchema.parse(req.body ?? {});
      const isArchived = parsed.isArchived;

      const updated = documentService.setArchiveStatus(
        req.businessContext.businessId,
        documentId,
        req.user.id,
        req.businessContext.role,
        isArchived,
      );

      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(updated, null, 2));
    },

    handleUploadDocument: async (
      req: RequestWithAuth,
      res: ServerResponse,
      fileBuffer?: Buffer,
    ): Promise<void> => {
      if (!req.businessContext || !req.user) {
        throw new HttpError(
          400,
          "Business Context Required",
          "Tenant context missing.",
        );
      }

      const filename =
        (req.headers["x-file-name"] as string) ||
        (req.headers["x-filename"] as string) ||
        (req.query?.filename as string) ||
        "document.pdf";
      const folder = ((req.headers["x-folder"] as string) ||
        (req.query?.folder as string) ||
        "Receipts") as DocumentFolder;
      const notes =
        (req.headers["x-notes"] as string) || (req.query?.notes as string);

      let buffer: Buffer;
      if (fileBuffer) {
        buffer = fileBuffer;
      } else if (req.body && Buffer.isBuffer(req.body)) {
        buffer = req.body;
      } else {
        buffer = await new Promise<Buffer>((resolve, reject) => {
          const chunks: Buffer[] = [];
          let totalBytes = 0;
          req.on("data", (chunk: Buffer) => {
            totalBytes += chunk.length;
            if (totalBytes > 15 * 1024 * 1024) {
              reject(
                new HttpError(
                  413,
                  "Payload Too Large",
                  "Uploaded file exceeds maximum limit of 15MB.",
                ),
              );
              return;
            }
            chunks.push(chunk);
          });
          req.on("end", () => resolve(Buffer.concat(chunks)));
          req.on("error", reject);
        });
      }

      if (buffer.length === 0) {
        throw new HttpError(400, "Bad Request", "Upload payload is empty.");
      }

      const created = await documentService.uploadDocumentBinary({
        businessId: req.businessContext.businessId,
        uploadedBy: req.user.id,
        role: req.businessContext.role,
        filename,
        folder,
        buffer,
        notes,
      });

      res.statusCode = 201;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(created, null, 2));
    },

    handleDownloadDocument: (
      req: RequestWithAuth,
      res: ServerResponse,
    ): void => {
      if (!req.businessContext || !req.user) {
        throw new HttpError(
          400,
          "Business Context Required",
          "Tenant context missing.",
        );
      }

      const documentId = req.params?.id;
      if (!documentId) {
        throw new HttpError(400, "Bad Request", "Document ID is required.");
      }

      const { stream, doc, size } = documentService.getDownloadStream(
        req.businessContext.businessId,
        documentId,
        req.user.id,
        req.businessContext.role,
      );

      res.statusCode = 200;
      res.setHeader("Content-Type", doc.mimeType);
      res.setHeader("Content-Length", size);
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${doc.filename}"`,
      );
      stream.pipe(res);
    },
  };
}
