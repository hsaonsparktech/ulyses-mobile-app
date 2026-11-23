import type { IncomingMessage, ServerResponse } from "node:http";
import { serverEnv } from "../config/env";

export function corsMiddleware(
  req: IncomingMessage,
  res: ServerResponse,
  next: () => void,
): void {
  res.setHeader("Access-Control-Allow-Origin", serverEnv.CORS_ORIGIN);
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PATCH, PUT, DELETE, OPTIONS",
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Business-Id, Accept",
  );
  res.setHeader("Access-Control-Max-Age", "86400");

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  next();
}
