export type ExpenseStatus = "pending" | "approved" | "rejected" | "reimbursed";

export interface ExpenseEntity {
  id: string;
  business_id: string;
  category: string;
  merchant: string;
  amount_cents: number;
  currency: string;
  date: string;
  receipt_url: string | null;
  status: ExpenseStatus;
  created_by: string;
  approved_by: string | null;
  journal_entry_id: string | null;
  idempotency_key: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExpenseProfile {
  id: string;
  businessId: string;
  category: string;
  merchant: string;
  amountCents: number;
  currency: string;
  date: string;
  receiptUrl: string | null;
  status: ExpenseStatus;
  createdBy: string;
  creatorName?: string;
  approvedBy: string | null;
  journalEntryId: string | null;
  createdAt: string;
  updatedAt: string;
}

export function toExpenseProfile(
  expense: ExpenseEntity,
  creatorName?: string,
): ExpenseProfile {
  return {
    id: expense.id,
    businessId: expense.business_id,
    category: expense.category,
    merchant: expense.merchant,
    amountCents: expense.amount_cents,
    currency: expense.currency,
    date: expense.date,
    receiptUrl: expense.receipt_url,
    status: expense.status,
    createdBy: expense.created_by,
    creatorName,
    approvedBy: expense.approved_by,
    journalEntryId: expense.journal_entry_id,
    createdAt: expense.created_at,
    updatedAt: expense.updated_at,
  };
}
