export interface SessionEntity {
  id: string;
  user_id: string;
  business_id: string | null;
  refresh_token_hash: string;
  user_agent: string | null;
  ip_address: string | null;
  expires_at: string;
  revoked_at: string | null;
  created_at: string;
}
