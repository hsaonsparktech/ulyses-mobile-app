import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { createTestApp, type TestContext } from "./helpers/testClient";

describe("Authentication & Session Lifecycle Endpoints", () => {
  let ctx: TestContext;
  let testVerificationCode = "";
  let accessToken = "";
  let refreshToken = "";

  before(async () => {
    ctx = await createTestApp();
  });

  after(async () => {
    await ctx.close();
  });

  it("POST /api/v1/auth/register creates a new unverified user", async () => {
    const res = await ctx.post("/api/v1/auth/register", {
      email: "alex.rivera@acme.com",
      password: "SecurePassword123!",
      fullName: "Alex Rivera",
      termsAccepted: true,
    });

    assert.equal(res.status, 201);
    assert.equal(res.body.email, "alex.rivera@acme.com");
    assert.equal(res.body.verified, false);
    assert.ok(res.body.previewCode);
    testVerificationCode = res.body.previewCode;
  });

  it("POST /api/v1/auth/register rejects duplicate email with 409 Conflict", async () => {
    const res = await ctx.post("/api/v1/auth/register", {
      email: "alex.rivera@acme.com",
      password: "AnotherPassword123!",
      fullName: "Alex Duplicate",
      termsAccepted: true,
    });

    assert.equal(res.status, 409);
    assert.equal(res.headers.get("content-type"), "application/problem+json");
    assert.equal(res.body.title, "Email Already Registered");
  });

  it("POST /api/v1/auth/sign-in blocks unverified accounts with 403 Forbidden", async () => {
    const res = await ctx.post("/api/v1/auth/sign-in", {
      email: "alex.rivera@acme.com",
      password: "SecurePassword123!",
    });

    assert.equal(res.status, 403);
    assert.equal(res.body.title, "Email Verification Required");
  });

  it("POST /api/v1/auth/verify-email rejects incorrect OTP with 400 Bad Request", async () => {
    const res = await ctx.post("/api/v1/auth/verify-email", {
      email: "alex.rivera@acme.com",
      code: "999999",
    });

    assert.equal(res.status, 400);
    assert.equal(res.body.title, "Invalid Verification Code");
  });

  it("POST /api/v1/auth/verify-email activates account", async () => {
    const res = await ctx.post("/api/v1/auth/verify-email", {
      email: "alex.rivera@acme.com",
      code: testVerificationCode,
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.verified, true);
  });

  it("POST /api/v1/auth/sign-in successfully authenticates verified user", async () => {
    const res = await ctx.post("/api/v1/auth/sign-in", {
      email: "alex.rivera@acme.com",
      password: "SecurePassword123!",
    });

    assert.equal(res.status, 200);
    assert.ok(res.body.accessToken);
    assert.ok(res.body.refreshToken);
    assert.equal(res.body.user.email, "alex.rivera@acme.com");
    accessToken = res.body.accessToken;
    refreshToken = res.body.refreshToken;
  });

  it("POST /api/v1/auth/sign-in rejects invalid credentials with 401 Unauthorized", async () => {
    const res = await ctx.post("/api/v1/auth/sign-in", {
      email: "alex.rivera@acme.com",
      password: "WrongPassword!",
    });

    assert.equal(res.status, 401);
    assert.equal(res.body.title, "Invalid Credentials");
  });

  it("GET /api/v1/auth/me returns current user identity with valid Bearer token", async () => {
    const res = await ctx.get("/api/v1/auth/me", {
      authorization: `Bearer ${accessToken}`,
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.user.email, "alex.rivera@acme.com");
    assert.equal(res.body.user.fullName, "Alex Rivera");
  });

  it("GET /api/v1/auth/me rejects requests without token with 401 Unauthorized", async () => {
    const res = await ctx.get("/api/v1/auth/me");
    assert.equal(res.status, 401);
    assert.equal(res.body.title, "Authentication Required");
  });

  it("POST /api/v1/auth/refresh rotates refresh token and invalidates old token", async () => {
    const oldRefreshToken = refreshToken;

    const res = await ctx.post("/api/v1/auth/refresh", {
      refreshToken: oldRefreshToken,
    });

    assert.equal(res.status, 200);
    assert.ok(res.body.accessToken);
    assert.ok(res.body.refreshToken);
    assert.notEqual(res.body.refreshToken, oldRefreshToken);

    const newAccessToken = res.body.accessToken;
    const newRefreshToken = res.body.refreshToken;

    // Verify new access token is valid
    const meRes = await ctx.get("/api/v1/auth/me", {
      authorization: `Bearer ${newAccessToken}`,
    });
    assert.equal(meRes.status, 200);

    // Verify replaying old refresh token is rejected (theft/replay defense)
    const replayRes = await ctx.post("/api/v1/auth/refresh", {
      refreshToken: oldRefreshToken,
    });
    assert.equal(replayRes.status, 401);

    refreshToken = newRefreshToken;
    accessToken = newAccessToken;
  });

  it("POST /api/v1/auth/forgot-password sends recovery notice", async () => {
    const forgotRes = await ctx.post("/api/v1/auth/forgot-password", {
      email: "alex.rivera@acme.com",
    });
    assert.equal(forgotRes.status, 200);
    assert.equal(forgotRes.body.sent, true);
  });

  it("POST /api/v1/auth/sign-out revokes session and disables refresh token", async () => {
    const signOutRes = await ctx.post(
      "/api/v1/auth/sign-out",
      { refreshToken },
      { authorization: `Bearer ${accessToken}` },
    );
    assert.equal(signOutRes.status, 200);

    // Verify refresh token cannot be used after logout
    const refreshRes = await ctx.post("/api/v1/auth/refresh", {
      refreshToken,
    });
    assert.equal(refreshRes.status, 401);
  });
});
