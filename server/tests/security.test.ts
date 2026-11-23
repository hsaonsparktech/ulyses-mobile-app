import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { loadEnv } from "../src/config/env";
import { resetRateLimits } from "../src/middleware/rateLimiter";
import { createTestApp, type TestContext } from "./helpers/testClient";

describe("Phase 0 Security Gate & Production Fortification", () => {
  let ctx: TestContext;

  before(async () => {
    ctx = await createTestApp();
    resetRateLimits();
  });

  after(async () => {
    resetRateLimits();
    await ctx.close();
  });

  it("Production environment rejects default development JWT_SECRET", () => {
    assert.throws(
      () => {
        loadEnv({
          NODE_ENV: "production",
          JWT_SECRET: "libros_jwt_secret_dev_key_only_min_32_chars",
        });
      },
      (err: any) => {
        return (
          err.name === "ZodError" &&
          JSON.stringify(err.issues).includes(
            "Production deployment requires a cryptographically strong",
          )
        );
      },
    );
  });

  it("Production environment allows cryptographically strong custom JWT_SECRET", () => {
    const customSecret =
      "a_very_strong_production_secret_key_exceeding_32_characters_12345";
    const env = loadEnv({
      NODE_ENV: "production",
      JWT_SECRET: customSecret,
    });
    assert.equal(env.NODE_ENV, "production");
    assert.equal(env.JWT_SECRET, customSecret);
  });

  it("Rate limiter enforces rate limit and returns 429 Problem Details when threshold exceeded", async () => {
    resetRateLimits();

    // Send 30 requests within limit
    for (let i = 0; i < 30; i++) {
      const res = await ctx.post("/api/v1/auth/sign-in", {
        email: "any@example.com",
        password: "WrongPassword!",
      });
      // Should not be 429
      assert.notEqual(res.status, 429);
      assert.ok(res.headers.get("x-ratelimit-remaining") !== null);
    }

    // 31st request exceeds rate limit
    const blockedRes = await ctx.post("/api/v1/auth/sign-in", {
      email: "any@example.com",
      password: "WrongPassword!",
    });

    assert.equal(blockedRes.status, 429);
    assert.equal(
      blockedRes.headers.get("content-type"),
      "application/problem+json",
    );
    assert.equal(blockedRes.body.title, "Too Many Requests");
    assert.ok(blockedRes.headers.get("retry-after"));

    // Reset rate limits for clean state in subsequent suites
    resetRateLimits();
  });
});
