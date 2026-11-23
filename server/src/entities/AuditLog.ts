export interface AuditLogEntity {
  id: string;
  business_id: string | null;
  user_id: string | null;
  action: string;
  resource: string;
  resource_id: string | null;
  metadata: string | null; // JSON string
  ip_address: string | null;
  created_at: string;
}
