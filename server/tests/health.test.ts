import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { createTestApp, type TestContext } from "./helpers/testClient";

describe("Health and System Endpoints", () => {
  let ctx: TestContext;

  before(async () => {
    ctx = await createTestApp();
  });

  after(async () => {
    await ctx.close();
  });

  it("GET /api/v1/health returns 200 with database healthy status", async () => {
    const res = await ctx.get("/api/v1/health");
    assert.equal(res.status, 200);
    assert.equal(res.body.status, "healthy");
    assert.equal(res.body.database, "connected");
    assert.equal(typeof res.body.uptimeSeconds, "number");
    assert.equal(typeof res.body.timestamp, "string");
  });

  it("OPTIONS preflight returns 204 with standard CORS headers", async () => {
    const res = await fetch(`${ctx.baseUrl}/api/v1/health`, {
      method: "OPTIONS",
      headers: {
        Origin: "http://localhost:8081",
        "Access-Control-Request-Method": "GET",
      },
    });
    assert.equal(res.status, 204);
    assert.equal(res.headers.get("access-control-allow-origin"), "*");
    assert.ok(res.headers.get("access-control-allow-methods")?.includes("GET"));
  });

  it("Non-existent route returns 404 with RFC 7807 Problem Details", async () => {
    const res = await ctx.get("/api/v1/non-existent-route");
    assert.equal(res.status, 404);
    assert.equal(res.headers.get("content-type"), "application/problem+json");
    assert.equal(res.body.status, 404);
    assert.equal(res.body.title, "Not Found");
    assert.equal(res.body.type, "https://api.libros.io/errors/not-found");
  });
});
