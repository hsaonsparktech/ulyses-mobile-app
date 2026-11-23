export type EstimateStatus = "Draft" | "Sent" | "Accepted" | "Declined";

export interface EstimateLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface Estimate {
  id: string;
  estimateNumber: string;
  name: string;
  businessId: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  date: string;
  currency: string;
  items: EstimateLineItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: EstimateStatus;
  template?: "clean" | "modern" | "classic";
  convertedToInvoiceId?: string;
}

export interface CreateEstimateInput {
  name: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  date?: string;
  currency?: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
  }>;
  tax?: number;
  status?: EstimateStatus;
  template?: "clean" | "modern" | "classic";
}
