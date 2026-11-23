import type { ServerResponse } from "node:http";
import type { Database } from "../db/client";
import { getDatabase } from "../db/client";
import type { RequestWithAuth } from "../middleware/auth";

export function createHealthRoutes(db?: Database) {
  const database = db ?? getDatabase();

  return {
    handleHealth: (_req: RequestWithAuth, res: ServerResponse): void => {
      let dbStatus = "connected";
      try {
        database.prepare("SELECT 1").get();
      } catch {
        dbStatus = "error";
      }

      const body = {
        status: dbStatus === "connected" ? "healthy" : "degraded",
        timestamp: new Date().toISOString(),
        uptimeSeconds: Math.floor(process.uptime()),
        database: dbStatus,
        version: "1.0.0",
        nodeVersion: process.version,
      };

      res.statusCode = dbStatus === "connected" ? 200 : 503;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(body, null, 2));
    },
  };
}
