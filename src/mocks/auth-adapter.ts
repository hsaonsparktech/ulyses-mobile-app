import type { AuthAdapter } from "@/features/auth/api/adapter";
import type { Role } from "@/features/auth/schemas/session";

export function createMockAuth(role: Role): AuthAdapter {
  if (!__DEV__) throw new Error("Mock authentication is development-only.");
  return {
    restore: async () => null,
    signIn: async ({ email }, signal) => {
      if (signal.aborted) throw new Error("Aborted");

      // Support explicit persona emails or fall back to the selected previewRole
      let effectiveRole: Role = role;
      const lower = email.toLowerCase();
      if (lower.includes("employee")) {
        effectiveRole = "employee";
      } else if (lower.includes("accountant")) {
        effectiveRole = "accountant";
      } else if (lower.includes("owner")) {
        effectiveRole = "owner";
      }

      return {
        userId: `development-${effectiveRole}`,
        role: effectiveRole,
        businessId: "biz-1",
      };
    },
    signOut: async () => {},
  };
}
