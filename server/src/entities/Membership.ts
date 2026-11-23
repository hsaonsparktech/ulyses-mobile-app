import type { UserRole } from "./User";

export interface MembershipEntity {
  id: string;
  user_id: string;
  business_id: string;
  role: UserRole;
  status: "active" | "suspended" | "revoked";
  permissions: string; // JSON string array
  created_at: string;
  updated_at: string;
}

export interface MembershipProfile {
  id: string;
  userId: string;
  businessId: string;
  role: UserRole;
  status: string;
  permissions: string[];
  createdAt: string;
}

export function toMembershipProfile(
  membership: MembershipEntity,
): MembershipProfile {
  let permissions: string[] = [];
  try {
    permissions = JSON.parse(membership.permissions);
  } catch {
    permissions = [];
  }
  return {
    id: membership.id,
    userId: membership.user_id,
    businessId: membership.business_id,
    role: membership.role,
    status: membership.status,
    permissions,
    createdAt: membership.created_at,
  };
}
