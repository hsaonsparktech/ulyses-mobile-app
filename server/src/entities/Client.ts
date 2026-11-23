export interface ClientEntity {
  id: string;
  business_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  address: string | null;
  status: "active" | "archived";
  created_at: string;
  updated_at: string;
}

export interface ClientProfile {
  id: string;
  businessId: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  address: string | null;
  status: "active" | "archived";
  totalInvoicedCents?: number;
  outstandingBalanceCents?: number;
  createdAt: string;
  updatedAt: string;
}

export function toClientProfile(
  client: ClientEntity,
  metrics?: { totalInvoicedCents: number; outstandingBalanceCents: number },
): ClientProfile {
  return {
    id: client.id,
    businessId: client.business_id,
    name: client.name,
    email: client.email,
    phone: client.phone,
    company: client.company,
    address: client.address,
    status: client.status,
    totalInvoicedCents: metrics?.totalInvoicedCents ?? 0,
    outstandingBalanceCents: metrics?.outstandingBalanceCents ?? 0,
    createdAt: client.created_at,
    updatedAt: client.updated_at,
  };
}
