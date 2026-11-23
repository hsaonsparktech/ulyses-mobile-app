import { createServer } from "node:http";
import { createApp } from "./app.js";
import { serverEnv } from "./config/env.js";
import { logger } from "./config/logger.js";
import { closeDatabase, getDatabase } from "./db/client.js";
import { runMigrations } from "./db/migrate.js";

export async function startServer() {
  logger.info("Starting Libros Backend Server...", {
    env: serverEnv.NODE_ENV,
    port: serverEnv.PORT,
    host: serverEnv.HOST,
  });

  // Run migrations automatically
  const migrationRes = runMigrations();
  logger.info(
    `Database migrations up to date (${migrationRes.applied.length} newly applied, total: ${migrationRes.total})`,
  );

  const db = getDatabase();
  const requestHandler = createApp(db);

  const server = createServer(requestHandler);

  server.listen(serverEnv.PORT, serverEnv.HOST, () => {
    logger.info(
      `Libros API server listening on http://${serverEnv.HOST}:${serverEnv.PORT}`,
    );
    logger.info(
      `Health check available at http://${serverEnv.HOST}:${serverEnv.PORT}/api/v1/health`,
    );
  });

  const shutdown = () => {
    logger.info(
      "Received shutdown signal. Closing HTTP server and database...",
    );
    server.close(() => {
      closeDatabase();
      logger.info("Libros API server cleanly shut down.");
      process.exit(0);
    });
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  return server;
}

// Auto-start if executed directly
if (
  process.argv[1] &&
  (process.argv[1].endsWith("server.ts") ||
    process.argv[1].endsWith("server.js"))
) {
  startServer().catch((err) => {
    logger.error("Fatal server startup error", { error: String(err) });
    process.exit(1);
  });
}
