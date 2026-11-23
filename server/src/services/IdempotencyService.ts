import crypto from "node:crypto";
import type { Database } from "../db/client";
import { getDatabase } from "../db/client";
import { HttpError } from "../utils/problemDetails";

export interface IdempotencyRecord {
  key: string;
  businessId: string;
  userId: string;
  endpoint: string;
  requestHash: string;
  statusCode: number;
  responseBody: string;
  createdAt: string;
}

export class IdempotencyService {
  private db: Database;

  constructor(db?: Database) {
    this.db = db ?? getDatabase();
  }

  computeHash(payload: unknown): string {
    const serialized = JSON.stringify(payload ?? {});
    return crypto.createHash("sha256").update(serialized).digest("hex");
  }

  async runWithIdempotency<T>(params: {
    businessId: string;
    userId: string;
    endpoint: string;
    key?: string | null;
    payload: unknown;
    execute: () => Promise<{ statusCode: number; data: T }>;
  }): Promise<{ statusCode: number; data: T; isCached: boolean }> {
    const { businessId, userId, endpoint, key, payload, execute } = params;

    if (!key || key.trim().length === 0) {
      const result = await execute();
      return { ...result, isCached: false };
    }

    const trimmedKey = key.trim();
    const currentHash = this.computeHash(payload);

    // 1. Check existing key
    const existing = this.db
      .prepare(
        `SELECT key, business_id, user_id, endpoint, request_hash, status_code, response_body, created_at
         FROM idempotency_keys
         WHERE business_id = ? AND key = ?`,
      )
      .get(businessId, trimmedKey) as
      | {
          key: string;
          business_id: string;
          user_id: string;
          endpoint: string;
          request_hash: string;
          status_code: number;
          response_body: string;
          created_at: string;
        }
      | undefined;

    if (existing) {
      // 2. Reject conflicting reuse of key with different payload (409 Conflict)
      if (existing.request_hash !== currentHash) {
        throw new HttpError(
          409,
          "Idempotency Conflict",
          "This idempotency key was previously used with a different request payload.",
        );
      }

      // 3. Return cached result safely
      const cachedData = JSON.parse(existing.response_body) as T;
      return {
        statusCode: existing.status_code,
        data: cachedData,
        isCached: true,
      };
    }

    // 4. Execute operation inside transaction and persist key
    const result = await execute();

    try {
      this.db
        .prepare(
          `INSERT INTO idempotency_keys (
            key, business_id, user_id, endpoint, request_hash, status_code, response_body
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          trimmedKey,
          businessId,
          userId,
          endpoint,
          currentHash,
          result.statusCode,
          JSON.stringify(result.data),
        );
    } catch (err: unknown) {
      // If another concurrent request inserted the same key simultaneously
      const checkAgain = this.db
        .prepare(
          "SELECT status_code, response_body, request_hash FROM idempotency_keys WHERE business_id = ? AND key = ?",
        )
        .get(businessId, trimmedKey) as
        | { status_code: number; response_body: string; request_hash: string }
        | undefined;

      if (checkAgain) {
        if (checkAgain.request_hash !== currentHash) {
          throw new HttpError(
            409,
            "Idempotency Conflict",
            "This idempotency key was previously used with a different request payload.",
          );
        }
        return {
          statusCode: checkAgain.status_code,
          data: JSON.parse(checkAgain.response_body) as T,
          isCached: true,
        };
      }
      throw err;
    }

    return { ...result, isCached: false };
  }
}
