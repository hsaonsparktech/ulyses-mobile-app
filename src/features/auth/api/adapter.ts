import { credentials } from "@/lib/storage/credentials";
import type { Session, SignInInput } from "../schemas/session";

export interface AuthAdapter {
  restore(signal: AbortSignal): Promise<Session | null>;
  signIn(input: SignInInput, signal: AbortSignal): Promise<Session>;
  signOut(): Promise<void>;
}

// Fail-closed fallback when backend is unavailable or unconfigured
export const unavailableAuth: AuthAdapter = {
  restore: async () => null,
  signIn: async () => {
    throw new Error(
      "Authentication is not connected. Contact your administrator.",
    );
  },
  signOut: async () => {},
};

export function createHttpAuth(baseUrl: string): AuthAdapter {
  // If unconfigured or example invalid, fail closed
  if (!baseUrl || baseUrl.includes("example.invalid")) {
    return unavailableAuth;
  }

  const cleanBase = baseUrl.replace(/\/+$/, "");

  return {
    restore: async (signal: AbortSignal): Promise<Session | null> => {
      try {
        const token = await credentials.read();
        if (!token) return null;

        const res = await fetch(`${cleanBase}/api/v1/auth/me`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
          signal,
        });

        if (!res.ok) {
          await credentials.clear();
          return null;
        }

        const data = await res.json();
        const primaryMembership = data.memberships?.[0];
        return {
          userId: data.user.id,
          role: primaryMembership?.role ?? "owner",
          businessId: primaryMembership?.businessId ?? "biz_default",
        };
      } catch {
        return null;
      }
    },

    signIn: async (
      input: SignInInput,
      signal: AbortSignal,
    ): Promise<Session> => {
      const res = await fetch(`${cleanBase}/api/v1/auth/sign-in`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          email: input.email,
          password: input.password,
        }),
        signal,
      });

      if (!res.ok) {
        let errorDetail = "Sign in failed. Check your credentials.";
        try {
          const problem = await res.json();
          if (problem.detail) errorDetail = problem.detail;
          else if (problem.title) errorDetail = problem.title;
        } catch {}
        throw new Error(errorDetail);
      }

      const data = await res.json();
      if (data.accessToken) {
        try {
          await credentials.write(data.accessToken);
        } catch {
          // Non-blocking on environments where SecureStore is unavailable
        }
      }

      return {
        userId: data.session?.userId ?? data.user?.id,
        role: data.session?.role ?? "owner",
        businessId: data.session?.businessId ?? "biz_default",
      };
    },

    signOut: async (): Promise<void> => {
      try {
        const token = await credentials.read();
        if (token) {
          await fetch(`${cleanBase}/api/v1/auth/sign-out`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({}),
          });
        }
      } catch {
        // Best-effort remote revocation
      } finally {
        await credentials.clear();
      }
    },
  };
}
