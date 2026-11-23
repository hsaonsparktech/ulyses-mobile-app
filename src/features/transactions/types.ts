export type TransactionType = "Income" | "Expense";

export interface Transaction {
  id: string;
  businessId: string;
  type: TransactionType;
  amount: number;
  formattedAmount: string;
  merchant: string;
  category: string;
  date: string;
  categoryDate: string;
  receiptFile?: string;
  archived?: boolean;
}
