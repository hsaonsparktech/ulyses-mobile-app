import fs from "node:fs";
import path from "node:path";
import { logger } from "../config/logger";
import type { DocumentFileType, DocumentFolder } from "../entities/Document";
import { randomId } from "../utils/crypto";
import { HttpError } from "../utils/problemDetails";

export interface StoredFileResult {
  documentId: string;
  storagePath: string;
  filename: string;
  fileSizeBytes: number;
  fileType: DocumentFileType;
  mimeType: string;
}

export class DocumentStorage {
  private baseDir: string;
  public static readonly MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB

  constructor(baseDir?: string) {
    this.baseDir = baseDir ?? path.resolve(process.cwd(), "storage/documents");
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  /**
   * Sanitizes filenames to eliminate directory traversal, null bytes, and shell metacharacters.
   */
  sanitizeFilename(rawFilename: string): string {
    const basename = path.basename(rawFilename).replace(/\0/g, "");
    const sanitized = basename.replace(/[^a-zA-Z0-9._-]/g, "_");
    if (!sanitized || sanitized === "." || sanitized === "..") {
      return `upload_${Date.now()}.bin`;
    }
    return sanitized;
  }

  /**
   * Magic bytes verification for allowed file types.
   */
  validateFileSignature(
    buffer: Buffer,
    filename: string,
  ): { fileType: DocumentFileType; mimeType: string } {
    if (buffer.length < 4) {
      throw new HttpError(
        400,
        "Malformed File",
        "File is too small to contain a valid signature.",
      );
    }

    const extMatch = filename.toLowerCase().match(/\.([a-z0-9]+)$/);
    const ext = extMatch ? extMatch[1] : "";

    // 1. PDF Magic Bytes: %PDF- (0x25 0x50 0x44 0x46)
    if (
      buffer[0] === 0x25 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x44 &&
      buffer[3] === 0x46
    ) {
      return { fileType: "pdf", mimeType: "application/pdf" };
    }

    // 2. PNG Magic Bytes: \x89PNG (0x89 0x50 0x4E 0x47)
    if (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47
    ) {
      return { fileType: "png", mimeType: "image/png" };
    }

    // 3. JPEG Magic Bytes: \xFF\xD8\xFF
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      return { fileType: "jpg", mimeType: "image/jpeg" };
    }

    // 4. CSV Check: Extension must be .csv, and initial chunk must be valid UTF-8 text without executable headers
    if (ext === "csv") {
      // Reject if executable PE or ELF signature detected
      if (
        (buffer[0] === 0x4d && buffer[1] === 0x5a) || // MZ Windows PE
        (buffer[0] === 0x7f &&
          buffer[1] === 0x45 &&
          buffer[2] === 0x4c &&
          buffer[3] === 0x46) // ELF Linux binary
      ) {
        throw new HttpError(
          400,
          "Security Violation",
          "Binary executable signature detected in CSV payload.",
        );
      }

      // Check for binary null bytes
      const sample = buffer.subarray(0, Math.min(buffer.length, 4096));
      for (let i = 0; i < sample.length; i++) {
        if (sample[i] === 0x00) {
          throw new HttpError(
            400,
            "Invalid File Format",
            "CSV contains illegal null bytes.",
          );
        }
      }

      return { fileType: "csv", mimeType: "text/csv" };
    }

    throw new HttpError(
      400,
      "Unsupported File Type",
      `The file signature does not match any approved format (PDF, PNG, JPG, CSV). Ext: .${ext}`,
    );
  }

  /**
   * Malware inspection integration point.
   */
  async scanForMalware(buffer: Buffer): Promise<void> {
    // Check for Windows executable signatures (MZ)
    if (buffer.length >= 2 && buffer[0] === 0x4d && buffer[1] === 0x5a) {
      throw new HttpError(
        400,
        "Security Gate Rejection",
        "Malware scanner rejected file: Windows executable header detected.",
      );
    }
    // Check for Unix ELF binaries
    if (
      buffer.length >= 4 &&
      buffer[0] === 0x7f &&
      buffer[1] === 0x45 &&
      buffer[2] === 0x4c &&
      buffer[3] === 0x46
    ) {
      throw new HttpError(
        400,
        "Security Gate Rejection",
        "Malware scanner rejected file: ELF binary header detected.",
      );
    }
  }

  /**
   * Persists binary buffer to isolated tenant directory.
   */
  async storeFile(
    businessId: string,
    rawFilename: string,
    buffer: Buffer,
  ): Promise<StoredFileResult> {
    if (buffer.length > DocumentStorage.MAX_FILE_SIZE_BYTES) {
      throw new HttpError(
        413,
        "Payload Too Large",
        `File size (${buffer.length} bytes) exceeds maximum limit of 15MB.`,
      );
    }

    const cleanFilename = this.sanitizeFilename(rawFilename);
    const { fileType, mimeType } = this.validateFileSignature(
      buffer,
      cleanFilename,
    );
    await this.scanForMalware(buffer);

    const documentId = randomId("doc");
    const tenantDir = path.join(this.baseDir, businessId);
    if (!fs.existsSync(tenantDir)) {
      fs.mkdirSync(tenantDir, { recursive: true });
    }

    const targetFilename = `${documentId}_${cleanFilename}`;
    const targetPath = path.join(tenantDir, targetFilename);

    await fs.promises.writeFile(targetPath, buffer);

    logger.info("Document saved to storage", {
      businessId,
      documentId,
      fileSizeBytes: buffer.length,
      fileType,
    });

    return {
      documentId,
      storagePath: targetPath,
      filename: cleanFilename,
      fileSizeBytes: buffer.length,
      fileType,
      mimeType,
    };
  }

  /**
   * Reads file stream for download with tenant isolation check.
   */
  getFileStream(
    businessId: string,
    storagePath: string,
  ): { stream: fs.ReadStream; size: number } {
    // Guard against path traversal outside the tenant directory
    const resolvedPath = path.resolve(storagePath);
    const tenantDir = path.resolve(path.join(this.baseDir, businessId));

    if (!resolvedPath.startsWith(tenantDir)) {
      throw new HttpError(
        403,
        "Access Denied",
        "Path traversal detected: storage path does not belong to this business.",
      );
    }

    if (!fs.existsSync(resolvedPath)) {
      throw new HttpError(
        404,
        "File Not Found",
        "Stored document not found on disk.",
      );
    }

    const stat = fs.statSync(resolvedPath);
    const stream = fs.createReadStream(resolvedPath);
    return { stream, size: stat.size };
  }

  async deleteFile(businessId: string, storagePath: string): Promise<void> {
    const resolvedPath = path.resolve(storagePath);
    const tenantDir = path.resolve(path.join(this.baseDir, businessId));

    if (!resolvedPath.startsWith(tenantDir)) {
      throw new HttpError(
        403,
        "Access Denied",
        "Storage path does not belong to this business.",
      );
    }

    if (fs.existsSync(resolvedPath)) {
      await fs.promises.unlink(resolvedPath);
    }
  }
}
