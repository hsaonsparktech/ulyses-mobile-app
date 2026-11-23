import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { createApp } from "../../src/app";
import { Database } from "../../src/db/client";
import { runMigrations } from "../../src/db/migrate";

export interface TestResponse<T = any> {
  status: number;
  headers: Headers;
  body: T;
}

export interface TestContext {
  server: Server;
  baseUrl: string;
  db: Database;
  get: <T = any>(
    path: string,
    headers?: Record<string, string>,
  ) => Promise<TestResponse<T>>;
  post: <T = any>(
    path: string,
    body?: any,
    headers?: Record<string, string>,
  ) => Promise<TestResponse<T>>;
  put: <T = any>(
    path: string,
    body?: any,
    headers?: Record<string, string>,
  ) => Promise<TestResponse<T>>;
  patch: <T = any>(
    path: string,
    body?: any,
    headers?: Record<string, string>,
  ) => Promise<TestResponse<T>>;
  del: <T = any>(
    path: string,
    headers?: Record<string, string>,
  ) => Promise<TestResponse<T>>;
  close: () => Promise<void>;
}

export async function createTestApp(): Promise<TestContext> {
  // Create completely isolated in-memory database using Database wrapper
  const db = new Database(":memory:");

  // Run migrations
  runMigrations(db);

  const handler = createApp(db);
  const server = createServer(handler);

  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve());
  });

  const address = server.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${address.port}`;

  const request = async <T = any>(
    method: string,
    path: string,
    body?: any,
    headers: Record<string, string> = {},
  ): Promise<TestResponse<T>> => {
    const reqHeaders: Record<string, string> = { ...headers };
    let reqBody: any;

    if (body !== undefined) {
      if (Buffer.isBuffer(body)) {
        reqBody = body;
        if (!reqHeaders["content-type"]) {
          reqHeaders["content-type"] = "application/octet-stream";
        }
      } else {
        reqHeaders["content-type"] = "application/json";
        reqBody = JSON.stringify(body);
      }
    }

    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: reqHeaders,
      body: reqBody,
    });

    let resBody: any = null;
    const text = await response.text();
    if (text.length > 0) {
      try {
        resBody = JSON.parse(text);
      } catch {
        resBody = text;
      }
    }

    return {
      status: response.status,
      headers: response.headers,
      body: resBody as T,
    };
  };

  return {
    server,
    baseUrl,
    db,
    get: (path, headers) => request("GET", path, undefined, headers),
    post: (path, body, headers) => request("POST", path, body, headers),
    put: (path, body, headers) => request("PUT", path, body, headers),
    patch: (path, body, headers) => request("PATCH", path, body, headers),
    del: (path, headers) => request("DELETE", path, undefined, headers),
    close: async () => {
      await new Promise<void>((resolve) => server.close(() => resolve()));
      db.close();
    },
  };
}
