import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { serverEnv } from "../config/env";
import { logger } from "../config/logger";

export interface DatabaseStatement {
  run(...params: unknown[]): {
    changes: number;
    lastInsertRowid: number | bigint;
  };
  get(...params: unknown[]): Record<string, unknown> | undefined;
  all(...params: unknown[]): Record<string, unknown>[];
}

export class Database {
  private db: DatabaseSync;
  private transactionDepth = 0;

  constructor(filePath: string = serverEnv.DATABASE_PATH) {
    if (filePath !== ":memory:") {
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
    this.db = new DatabaseSync(filePath);
    // Enable WAL mode and foreign key constraints
    if (filePath !== ":memory:") {
      this.db.exec("PRAGMA journal_mode = WAL;");
    }
    this.db.exec("PRAGMA foreign_keys = ON;");
    logger.debug(`Database initialized at: ${filePath}`);
  }

  exec(sql: string): void {
    this.db.exec(sql);
  }

  prepare(sql: string): DatabaseStatement {
    return this.db.prepare(sql) as unknown as DatabaseStatement;
  }

  transaction<T>(fn: () => T): T {
    this.transactionDepth++;
    const savepoint = `sp_${this.transactionDepth}`;

    if (this.transactionDepth === 1) {
      this.db.exec("BEGIN");
    } else {
      this.db.exec(`SAVEPOINT ${savepoint}`);
    }

    try {
      const result = fn();
      if (this.transactionDepth === 1) {
        this.db.exec("COMMIT");
      } else {
        this.db.exec(`RELEASE SAVEPOINT ${savepoint}`);
      }
      return result;
    } catch (error) {
      if (this.transactionDepth === 1) {
        this.db.exec("ROLLBACK");
      } else {
        this.db.exec(`ROLLBACK TO SAVEPOINT ${savepoint}`);
      }
      throw error;
    } finally {
      this.transactionDepth--;
    }
  }

  close(): void {
    this.db.close();
  }
}

let defaultDbInstance: Database | null = null;

export function getDatabase(filePath?: string): Database {
  if (filePath) {
    return new Database(filePath);
  }
  if (!defaultDbInstance) {
    defaultDbInstance = new Database();
  }
  return defaultDbInstance;
}

export function closeDatabase(): void {
  if (defaultDbInstance) {
    defaultDbInstance.close();
    defaultDbInstance = null;
  }
}
