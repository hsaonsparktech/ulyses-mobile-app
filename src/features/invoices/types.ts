export type InvoiceStatus = "Draft" | "Unpaid" | "Paid" | "Overdue";

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  businessId: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  issueDate: string;
  dueDate: string;
  currency: string;
  items: InvoiceLineItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: InvoiceStatus;
  deliveryStatus?: "Not sent" | "Sent" | "Failed";
  sentAt?: string;
  paidDate?: string;
  paymentMethod?: string;
  template?: "clean" | "modern" | "classic";
  accentColor?: string;
  showTaxAndLineItems?: boolean;
}

export interface CreateInvoiceInput {
  clientId: string;
  clientName: string;
  clientEmail: string;
  issueDate: string;
  dueDate: string;
  currency?: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
  }>;
  tax?: number;
  status?: InvoiceStatus;
  template?: "clean" | "modern" | "classic";
}
