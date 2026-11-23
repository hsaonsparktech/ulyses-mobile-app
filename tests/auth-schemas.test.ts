import { forgotPasswordSchema } from "@/features/auth/schemas/forgotPassword";
import { inviteCodeSchema } from "@/features/auth/schemas/inviteCode";
import { businessSetupSchema } from "@/features/onboarding/schemas/businessSetup";
import { registerSchema } from "@/features/onboarding/schemas/register";
import { verifyEmailSchema } from "@/features/onboarding/schemas/verifyEmail";

describe("Sprint 01 Authentication & Onboarding Schemas", () => {
  test("registerSchema validates name, email, password length, and terms", () => {
    expect(
      registerSchema.safeParse({
        fullName: "A",
        email: "invalid",
        password: "short",
        termsAccepted: false,
      }).success,
    ).toBe(false);

    expect(
      registerSchema.safeParse({
        fullName: "Jane Doe",
        email: "jane@company.com",
        password: "securepassword123",
        termsAccepted: true,
      }).success,
    ).toBe(true);
  });

  test("verifyEmailSchema requires exactly 6 numeric digits", () => {
    expect(verifyEmailSchema.safeParse({ code: "12345" }).success).toBe(false);
    expect(verifyEmailSchema.safeParse({ code: "abcdef" }).success).toBe(false);
    expect(verifyEmailSchema.safeParse({ code: "123456" }).success).toBe(true);
  });

  test("businessSetupSchema validates required fields", () => {
    expect(
      businessSetupSchema.safeParse({
        businessName: "",
        businessType: "",
        currency: "",
      }).success,
    ).toBe(false);

    expect(
      businessSetupSchema.safeParse({
        businessName: "Acme Corp",
        businessType: "Consulting",
        currency: "USD",
      }).success,
    ).toBe(true);
  });

  test("forgotPasswordSchema validates email", () => {
    expect(
      forgotPasswordSchema.safeParse({ email: "not-an-email" }).success,
    ).toBe(false);
    expect(
      forgotPasswordSchema.safeParse({ email: "user@example.com" }).success,
    ).toBe(true);
  });

  test("inviteCodeSchema enforces minimum length", () => {
    expect(inviteCodeSchema.safeParse({ code: "12" }).success).toBe(false);
    expect(inviteCodeSchema.safeParse({ code: "TEAM2026" }).success).toBe(true);
  });
});
