import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { seedDatabase } from "../src/db/seed";
import { createTestApp, type TestContext } from "./helpers/testClient";

describe("Clients API & Tenant Isolation", () => {
  let ctx: TestContext;
  let ownerToken = "";
  let accountantToken = "";
  let employeeToken = "";
  const businessId = "biz_acme_services_001";
  let createdClientId = "";

  before(async () => {
    ctx = await createTestApp();
    seedDatabase(ctx.db);

    const ownerLogin = await ctx.post("/api/v1/auth/sign-in", {
      email: "owner@acmeservices.com",
      password: "OwnerPassword123!",
    });
    ownerToken = ownerLogin.body.accessToken;

    const accLogin = await ctx.post("/api/v1/auth/sign-in", {
      email: "accountant@cpa-firm.com",
      password: "AccountantPassword123!",
    });
    accountantToken = accLogin.body.accessToken;

    const empLogin = await ctx.post("/api/v1/auth/sign-in", {
      email: "employee@acmeservices.com",
      password: "EmployeePassword123!",
    });
    employeeToken = empLogin.body.accessToken;
  });

  after(async () => {
    await ctx.close();
  });

  it("Owner can list seeded clients with balance metrics", async () => {
    const res = await ctx.get("/api/v1/clients", {
      authorization: `Bearer ${ownerToken}`,
      "x-business-id": businessId,
    });

    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body));
    assert.ok(res.body.length >= 1);
    const apex = res.body.find((c: any) => c.name === "Apex Holdings LLC");
    assert.ok(apex);
    assert.equal(typeof apex.totalInvoicedCents, "number");
    assert.equal(typeof apex.outstandingBalanceCents, "number");
  });

  it("Owner can create a new client", async () => {
    const res = await ctx.post(
      "/api/v1/clients",
      {
        name: "Starlight Media Inc",
        email: "billing@starlight.com",
        phone: "+1-555-0248",
        company: "Starlight Media",
        address: "742 Evergreen Terrace, Springfield",
      },
      {
        authorization: `Bearer ${ownerToken}`,
        "x-business-id": businessId,
      },
    );

    assert.equal(res.status, 201);
    assert.equal(res.body.name, "Starlight Media Inc");
    assert.equal(res.body.email, "billing@starlight.com");
    assert.equal(res.body.status, "active");
    createdClientId = res.body.id;
  });

  it("Creating duplicate client with same email in same tenant fails with 409 Conflict", async () => {
    const res = await ctx.post(
      "/api/v1/clients",
      {
        name: "Starlight Duplicate",
        email: "billing@starlight.com",
      },
      {
        authorization: `Bearer ${ownerToken}`,
        "x-business-id": businessId,
      },
    );

    assert.equal(res.status, 409);
    assert.equal(res.body.title, "Client Email Conflict");
  });

  it("Employee cannot create a client (403 Forbidden)", async () => {
    const res = await ctx.post(
      "/api/v1/clients",
      {
        name: "Rogue Client",
        email: "rogue@example.com",
      },
      {
        authorization: `Bearer ${employeeToken}`,
        "x-business-id": businessId,
      },
    );

    assert.equal(res.status, 403);
    assert.equal(res.body.title, "Access Denied");
  });

  it("Accountant cannot create a client (403 Forbidden)", async () => {
    const res = await ctx.post(
      "/api/v1/clients",
      {
        name: "Accountant Client",
        email: "cpa.client@example.com",
      },
      {
        authorization: `Bearer ${accountantToken}`,
        "x-business-id": businessId,
      },
    );

    assert.equal(res.status, 403);
    assert.equal(res.body.title, "Access Denied");
  });

  it("Accountant cannot update a client (403 Forbidden)", async () => {
    const res = await ctx.patch(
      `/api/v1/clients/${createdClientId}`,
      { company: "Accountant Modified Company" },
      {
        authorization: `Bearer ${accountantToken}`,
        "x-business-id": businessId,
      },
    );

    assert.equal(res.status, 403);
    assert.equal(res.body.title, "Access Denied");
  });

  it("Owner can update client details", async () => {
    const res = await ctx.patch(
      `/api/v1/clients/${createdClientId}`,
      {
        company: "Starlight Media Global",
        phone: "+1-555-9999",
      },
      {
        authorization: `Bearer ${ownerToken}`,
        "x-business-id": businessId,
      },
    );

    assert.equal(res.status, 200);
    assert.equal(res.body.company, "Starlight Media Global");
    assert.equal(res.body.phone, "+1-555-9999");
  });

  it("Cross-tenant intrusion: User cannot access client belonging to another business", async () => {
    // Create another tenant
    const reg2 = await ctx.post("/api/v1/auth/register", {
      email: "tenant2.owner@other.com",
      password: "Password123!",
      fullName: "Other Owner",
      termsAccepted: true,
    });
    await ctx.post("/api/v1/auth/verify-email", {
      email: "tenant2.owner@other.com",
      code: reg2.body.previewCode,
    });
    const login2 = await ctx.post("/api/v1/auth/sign-in", {
      email: "tenant2.owner@other.com",
      password: "Password123!",
    });
    const user2Token = login2.body.accessToken;

    const biz2 = await ctx.post(
      "/api/v1/businesses",
      { businessName: "Other Corp", businessType: "Logistics" },
      { authorization: `Bearer ${user2Token}` },
    );
    const biz2Id = biz2.body.business.id;

    // Tenant 2 owner tries to access createdClientId from Tenant 1
    const res = await ctx.get(`/api/v1/clients/${createdClientId}`, {
      authorization: `Bearer ${user2Token}`,
      "x-business-id": biz2Id,
    });

    assert.equal(res.status, 404);
    assert.equal(res.body.title, "Client Not Found");
  });

  it("Accountant cannot archive a client (403 Forbidden)", async () => {
    const res = await ctx.del(`/api/v1/clients/${createdClientId}`, {
      authorization: `Bearer ${accountantToken}`,
      "x-business-id": businessId,
    });

    assert.equal(res.status, 403);
    assert.equal(res.body.title, "Access Denied");
  });

  it("Owner can archive client", async () => {
    const res = await ctx.del(`/api/v1/clients/${createdClientId}`, {
      authorization: `Bearer ${ownerToken}`,
      "x-business-id": businessId,
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.archived, true);

    const getRes = await ctx.get(`/api/v1/clients/${createdClientId}`, {
      authorization: `Bearer ${ownerToken}`,
      "x-business-id": businessId,
    });
    assert.equal(getRes.body.status, "archived");
  });
});
