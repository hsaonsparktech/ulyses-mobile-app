import type { Session } from "@/features/auth/schemas/session";
export const queryKeys = {
  scope: (session: Session) =>
    [
      "session",
      session.userId,
      session.role,
      "business",
      session.businessId,
    ] as const,
  resource: (session: Session, resource: string) =>
    [...queryKeys.scope(session), resource] as const,
};
