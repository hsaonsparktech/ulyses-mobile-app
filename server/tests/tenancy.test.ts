import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { createTestApp, type TestContext } from "./helpers/testClient";

describe("Multi-Tenant Boundary Isolation & Tenancy Middleware", () => {
  let ctx: TestContext;
  let user1Token = "";
  let user2Token = "";
  let business1Id = "";
  let business2Id = "";

  before(async () => {
    ctx = await createTestApp();

    // Register & verify User 1
    const reg1 = await ctx.post("/api/v1/auth/register", {
      email: "tenant1.owner@alpha.com",
      password: "Password123!",
      fullName: "Alpha Owner",
      termsAccepted: true,
    });
    await ctx.post("/api/v1/auth/verify-email", {
      email: "tenant1.owner@alpha.com",
      code: reg1.body.previewCode,
    });
    const login1 = await ctx.post("/api/v1/auth/sign-in", {
      email: "tenant1.owner@alpha.com",
      password: "Password123!",
    });
    user1Token = login1.body.accessToken;

    // Create Business 1 for User 1
    const biz1 = await ctx.post(
      "/api/v1/businesses",
      {
        businessName: "Alpha Corp",
        businessType: "Consulting",
        currency: "USD",
      },
      { authorization: `Bearer ${user1Token}` },
    );
    assert.equal(biz1.status, 201);
    business1Id = biz1.body.business.id;

    // Register & verify User 2
    const reg2 = await ctx.post("/api/v1/auth/register", {
      email: "tenant2.owner@beta.com",
      password: "Password123!",
      fullName: "Beta Owner",
      termsAccepted: true,
    });
    await ctx.post("/api/v1/auth/verify-email", {
      email: "tenant2.owner@beta.com",
      code: reg2.body.previewCode,
    });
    const login2 = await ctx.post("/api/v1/auth/sign-in", {
      email: "tenant2.owner@beta.com",
      password: "Password123!",
    });
    user2Token = login2.body.accessToken;

    // Create Business 2 for User 2
    const biz2 = await ctx.post(
      "/api/v1/businesses",
      { businessName: "Beta LLC", businessType: "Retail", currency: "EUR" },
      { authorization: `Bearer ${user2Token}` },
    );
    assert.equal(biz2.status, 201);
    business2Id = biz2.body.business.id;
  });

  after(async () => {
    await ctx.close();
  });

  it("User 1 can legitimately access their own Business 1", async () => {
    const res = await ctx.get("/api/v1/businesses/current", {
      authorization: `Bearer ${user1Token}`,
      "x-business-id": business1Id,
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.id, business1Id);
    assert.equal(res.body.name, "Alpha Corp");
  });

  it("User 2 can legitimately access their own Business 2", async () => {
    const res = await ctx.get("/api/v1/businesses/current", {
      authorization: `Bearer ${user2Token}`,
      "x-business-id": business2Id,
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.id, business2Id);
    assert.equal(res.body.name, "Beta LLC");
  });

  it("Cross-tenant intrusion: User 1 attempting to access Business 2 is rejected with 403 Forbidden", async () => {
    const res = await ctx.get("/api/v1/businesses/current", {
      authorization: `Bearer ${user1Token}`,
      "x-business-id": business2Id,
    });

    assert.equal(res.status, 403);
    assert.equal(res.headers.get("content-type"), "application/problem+json");
    assert.equal(res.body.status, 403);
    assert.equal(res.body.title, "Forbidden Tenant Access");
  });

  it("Cross-tenant intrusion: User 2 attempting to access Business 1 is rejected with 403 Forbidden", async () => {
    const res = await ctx.get("/api/v1/businesses/current", {
      authorization: `Bearer ${user2Token}`,
      "x-business-id": business1Id,
    });

    assert.equal(res.status, 403);
    assert.equal(res.body.status, 403);
    assert.equal(res.body.title, "Forbidden Tenant Access");
  });

  it("Tenant-scoped route without X-Business-Id returns 400 Bad Request", async () => {
    const res = await ctx.get("/api/v1/businesses/current", {
      authorization: `Bearer ${user1Token}`,
    });

    assert.equal(res.status, 400);
    assert.equal(res.body.status, 400);
    assert.equal(res.body.title, "Business Context Required");
  });

  it("Accessing completely non-existent business ID returns 403 Forbidden", async () => {
    const res = await ctx.get("/api/v1/businesses/current", {
      authorization: `Bearer ${user1Token}`,
      "x-business-id": "biz_nonexistent_9999",
    });

    assert.equal(res.status, 403);
    assert.equal(res.body.title, "Forbidden Tenant Access");
  });
});
