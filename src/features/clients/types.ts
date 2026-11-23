export interface Client {
  id: string;
  businessId: string;
  name: string;
  email: string;
  phone: string;
  billingAddress: string;
  currency: string;
  invoicesCount: number;
  outstandingAmount: number;
  lastActivity: string;
  createdAt: string;
}

export interface CreateClientInput {
  name: string;
  email: string;
  phone: string;
  billingAddress: string;
  currency?: string;
}
