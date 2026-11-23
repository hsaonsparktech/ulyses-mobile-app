export type EstimateStatus =
  | "draft"
  | "sent"
  | "accepted"
  | "rejected"
  | "converted"
  | "expired";

export interface EstimateItemEntity {
  id: string;
  estimate_id: string;
  description: string;
  quantity: number;
  unit_price_cents: number;
  total_cents: number;
  created_at: string;
}

export interface EstimateItemProfile {
  id: string;
  description: string;
  quantity: number;
  unitPriceCents: number;
  totalCents: number;
}

export interface EstimateEntity {
  id: string;
  business_id: string;
  client_id: string;
  estimate_number: string;
  issue_date: string;
  valid_until: string;
  status: EstimateStatus;
  currency: string;
  subtotal_cents: number;
  tax_cents: number;
  total_cents: number;
  notes: string | null;
  converted_invoice_id: string | null;
  idempotency_key: string | null;
  created_at: string;
  updated_at: string;
}

export interface EstimateProfile {
  id: string;
  businessId: string;
  clientId: string;
  clientName?: string;
  estimateNumber: string;
  issueDate: string;
  validUntil: string;
  status: EstimateStatus;
  currency: string;
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
  notes: string | null;
  convertedInvoiceId: string | null;
  items: EstimateItemProfile[];
  createdAt: string;
  updatedAt: string;
}

export function toEstimateProfile(
  estimate: EstimateEntity,
  items: EstimateItemEntity[] = [],
  clientName?: string,
): EstimateProfile {
  return {
    id: estimate.id,
    businessId: estimate.business_id,
    clientId: estimate.client_id,
    clientName,
    estimateNumber: estimate.estimate_number,
    issueDate: estimate.issue_date,
    validUntil: estimate.valid_until,
    status: estimate.status,
    currency: estimate.currency,
    subtotalCents: estimate.subtotal_cents,
    taxCents: estimate.tax_cents,
    totalCents: estimate.total_cents,
    notes: estimate.notes,
    convertedInvoiceId: estimate.converted_invoice_id,
    items: items.map((item) => ({
      id: item.id,
      description: item.description,
      quantity: item.quantity,
      unitPriceCents: item.unit_price_cents,
      totalCents: item.total_cents,
    })),
    createdAt: estimate.created_at,
    updatedAt: estimate.updated_at,
  };
}
