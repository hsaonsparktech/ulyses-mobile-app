import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { seedDatabase } from "../src/db/seed";
import { createTestApp, type TestContext } from "./helpers/testClient";

describe("Role-Based Access Control (RBAC) & Team Management", () => {
  let ctx: TestContext;
  let ownerToken = "";
  let employeeToken = "";
  let accountantToken = "";
  const businessId = "biz_acme_services_001";

  before(async () => {
    ctx = await createTestApp();
    seedDatabase(ctx.db);

    // Sign in Owner
    const ownerRes = await ctx.post("/api/v1/auth/sign-in", {
      email: "owner@acmeservices.com",
      password: "OwnerPassword123!",
    });
    ownerToken = ownerRes.body.accessToken;

    // Sign in Employee
    const empRes = await ctx.post("/api/v1/auth/sign-in", {
      email: "employee@acmeservices.com",
      password: "EmployeePassword123!",
    });
    employeeToken = empRes.body.accessToken;

    // Sign in Accountant
    const accRes = await ctx.post("/api/v1/auth/sign-in", {
      email: "accountant@cpa-firm.com",
      password: "AccountantPassword123!",
    });
    accountantToken = accRes.body.accessToken;
  });

  after(async () => {
    await ctx.close();
  });

  it("Owner can view full team roster", async () => {
    const res = await ctx.get("/api/v1/team/members", {
      authorization: `Bearer ${ownerToken}`,
      "x-business-id": businessId,
    });

    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body));
    assert.ok(res.body.length >= 3);
  });

  it("Accountant can view team roster", async () => {
    const res = await ctx.get("/api/v1/team/members", {
      authorization: `Bearer ${accountantToken}`,
      "x-business-id": businessId,
    });

    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body));
  });

  it("Employee is denied viewing full team roster with 403 Forbidden", async () => {
    const res = await ctx.get("/api/v1/team/members", {
      authorization: `Bearer ${employeeToken}`,
      "x-business-id": businessId,
    });

    assert.equal(res.status, 403);
    assert.equal(res.body.title, "Access Denied");
  });

  it("Owner can create team invitations", async () => {
    const res = await ctx.post(
      "/api/v1/team/invite",
      { role: "employee", email: "new.hire@acmeservices.com" },
      {
        authorization: `Bearer ${ownerToken}`,
        "x-business-id": businessId,
      },
    );

    assert.equal(res.status, 201);
    assert.ok(res.body.inviteCode);
    assert.equal(res.body.role, "employee");
    assert.equal(res.body.businessId, businessId);
  });

  it("Employee cannot create invitations (403 Forbidden)", async () => {
    const res = await ctx.post(
      "/api/v1/team/invite",
      { role: "employee", email: "rogue@acmeservices.com" },
      {
        authorization: `Bearer ${employeeToken}`,
        "x-business-id": businessId,
      },
    );

    assert.equal(res.status, 403);
    assert.equal(res.body.title, "Access Denied");
  });

  it("Accountant cannot create invitations (403 Forbidden)", async () => {
    const res = await ctx.post(
      "/api/v1/team/invite",
      { role: "accountant" },
      {
        authorization: `Bearer ${accountantToken}`,
        "x-business-id": businessId,
      },
    );

    assert.equal(res.status, 403);
    assert.equal(res.body.title, "Access Denied");
  });

  it("Owner can update business settings", async () => {
    // Note: handler is on PATCH per REST standard
    const patchRes = await fetch(`${ctx.baseUrl}/api/v1/businesses/current`, {
      method: "PATCH",
      headers: {
        authorization: `Bearer ${ownerToken}`,
        "x-business-id": businessId,
        "content-type": "application/json",
      },
      body: JSON.stringify({ name: "Acme Services Group LLC" }),
    });

    assert.equal(patchRes.status, 200);
    const body = await patchRes.json();
    assert.equal(body.name, "Acme Services Group LLC");
  });

  it("Employee cannot mutate business settings (403 Forbidden)", async () => {
    const patchRes = await fetch(`${ctx.baseUrl}/api/v1/businesses/current`, {
      method: "PATCH",
      headers: {
        authorization: `Bearer ${employeeToken}`,
        "x-business-id": businessId,
        "content-type": "application/json",
      },
      body: JSON.stringify({ name: "Hacked Business LLC" }),
    });

    assert.equal(patchRes.status, 403);
  });

  it("Accountant cannot mutate business settings (403 Forbidden)", async () => {
    const patchRes = await fetch(`${ctx.baseUrl}/api/v1/businesses/current`, {
      method: "PATCH",
      headers: {
        authorization: `Bearer ${accountantToken}`,
        "x-business-id": businessId,
        "content-type": "application/json",
      },
      body: JSON.stringify({ name: "Accountant Takeover" }),
    });

    assert.equal(patchRes.status, 403);
  });
});
