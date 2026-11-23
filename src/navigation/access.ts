import type { Role, Session } from "@/features/auth/schemas/session";
export function accessState(
  loading: boolean,
  session: Session | null,
  role?: Role,
) {
  if (loading) return "loading";
  if (!session) return "unauthenticated";
  if (role && session.role !== role) return "forbidden";
  return "authorized";
}
export function homeForRole(
  role: Role,
): "/owner" | "/employee" | "/accountant" {
  return `/${role}`;
}
