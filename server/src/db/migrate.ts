import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { logger } from "../config/logger";
import { type Database, getDatabase } from "./client";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface MigrationRecord {
  version: number;
  name: string;
  applied_at: string;
}

export class MigrationRunner {
  private db: Database;
  private migrationsDir: string;

  constructor(db: Database, migrationsDir?: string) {
    this.db = db;
    if (migrationsDir) {
      this.migrationsDir = migrationsDir;
    } else {
      const candidates = [
        path.join(__dirname, "migrations"),
        path.resolve(__dirname, "../../src/db/migrations"),
        path.resolve(process.cwd(), "server/src/db/migrations"),
      ];
      this.migrationsDir =
        candidates.find((dir) => fs.existsSync(dir)) ??
        candidates[0] ??
        path.join(__dirname, "migrations");
    }
  }

  initMigrationsTable(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }

  getAppliedMigrations(): MigrationRecord[] {
    this.initMigrationsTable();
    const rows = this.db
      .prepare(
        "SELECT version, name, applied_at FROM schema_migrations ORDER BY version ASC",
      )
      .all();
    return rows as unknown as MigrationRecord[];
  }

  getPendingMigrations(): {
    version: number;
    name: string;
    fullPath: string;
  }[] {
    const applied = new Set(this.getAppliedMigrations().map((m) => m.version));
    if (!fs.existsSync(this.migrationsDir)) {
      return [];
    }

    const files = fs
      .readdirSync(this.migrationsDir)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    const pending: { version: number; name: string; fullPath: string }[] = [];
    for (const file of files) {
      const match = file.match(/^(\d+)_(.+)\.sql$/);
      if (match?.[1] && match[2]) {
        const version = parseInt(match[1], 10);
        const name = match[2];
        if (!applied.has(version)) {
          pending.push({
            version,
            name,
            fullPath: path.join(this.migrationsDir, file),
          });
        }
      }
    }

    return pending.sort((a, b) => a.version - b.version);
  }

  applyPending(): { applied: string[]; total: number } {
    this.initMigrationsTable();
    const pending = this.getPendingMigrations();
    const applied: string[] = [];

    for (const migration of pending) {
      const sql = fs.readFileSync(migration.fullPath, "utf-8");
      this.db.transaction(() => {
        this.db.exec(sql);
        this.db
          .prepare(
            "INSERT INTO schema_migrations (version, name) VALUES (?, ?)",
          )
          .run(migration.version, migration.name);
      });
      applied.push(`${migration.version}_${migration.name}`);
      logger.info(`Applied migration: ${migration.version}_${migration.name}`);
    }

    return {
      applied,
      total: this.getAppliedMigrations().length,
    };
  }
}

export function runMigrations(db?: Database): {
  applied: string[];
  total: number;
} {
  const database = db ?? getDatabase();
  const runner = new MigrationRunner(database);
  return runner.applyPending();
}

// Direct execution support
if (
  process.argv[1] &&
  (process.argv[1].endsWith("migrate.ts") ||
    process.argv[1].endsWith("migrate.js"))
) {
  try {
    const res = runMigrations();
    console.log(
      `Migrations complete. Applied ${res.applied.length} new migrations. Total migrations: ${res.total}`,
    );
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}
