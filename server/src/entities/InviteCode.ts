import type { UserRole } from "./User";

export interface InviteCodeEntity {
  id: string;
  business_id: string;
  code: string;
  role: UserRole;
  email: string | null;
  created_by: string;
  expires_at: string;
  used_at: string | null;
  used_by: string | null;
  created_at: string;
}

export interface InviteVerificationResult {
  valid: boolean;
  code: string;
  businessId: string;
  businessName: string;
  role: UserRole;
  inviterName: string;
}
