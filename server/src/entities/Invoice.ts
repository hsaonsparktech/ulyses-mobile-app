export type InvoiceStatus =
  | "draft"
  | "sent"
  | "partially_paid"
  | "paid"
  | "overdue"
  | "cancelled";

export interface InvoiceItemEntity {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price_cents: number;
  total_cents: number;
  created_at: string;
}

export interface InvoiceItemProfile {
  id: string;
  description: string;
  quantity: number;
  unitPriceCents: number;
  totalCents: number;
}

export interface InvoiceEntity {
  id: string;
  business_id: string;
  client_id: string;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  status: InvoiceStatus;
  currency: string;
  subtotal_cents: number;
  tax_cents: number;
  total_cents: number;
  amount_paid_cents: number;
  notes: string | null;
  idempotency_key: string | null;
  journal_entry_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface InvoiceProfile {
  id: string;
  businessId: string;
  clientId: string;
  clientName?: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
  currency: string;
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
  amountPaidCents: number;
  balanceDueCents: number;
  notes: string | null;
  items: InvoiceItemProfile[];
  journalEntryId: string | null;
  createdAt: string;
  updatedAt: string;
}

export function toInvoiceProfile(
  invoice: InvoiceEntity,
  items: InvoiceItemEntity[] = [],
  clientName?: string,
): InvoiceProfile {
  return {
    id: invoice.id,
    businessId: invoice.business_id,
    clientId: invoice.client_id,
    clientName,
    invoiceNumber: invoice.invoice_number,
    issueDate: invoice.issue_date,
    dueDate: invoice.due_date,
    status: invoice.status,
    currency: invoice.currency,
    subtotalCents: invoice.subtotal_cents,
    taxCents: invoice.tax_cents,
    totalCents: invoice.total_cents,
    amountPaidCents: invoice.amount_paid_cents,
    balanceDueCents: Math.max(
      0,
      invoice.total_cents - invoice.amount_paid_cents,
    ),
    notes: invoice.notes,
    items: items.map((item) => ({
      id: item.id,
      description: item.description,
      quantity: item.quantity,
      unitPriceCents: item.unit_price_cents,
      totalCents: item.total_cents,
    })),
    journalEntryId: invoice.journal_entry_id,
    createdAt: invoice.created_at,
    updatedAt: invoice.updated_at,
  };
}
