export type ExpenseStatus = "draft" | "submitted" | "approved" | "rejected";

export interface ExpenseDraft {
  id: string;
  vendor: string;
  amount: number;
  date: string;
  category: string;
  receiptFileName?: string;
  receiptUri?: string;
  status: ExpenseStatus;
  notes?: string;
  submittedAt?: string;
  rejectionReason?: string;
}

export interface EmployeeDocument {
  id: string;
  filename: string;
  type: "Receipt" | "Statement" | "Policy";
  date: string;
  fileSize: string;
  fileTypeLabel: "PDF" | "JPG" | "PNG";
  category: string;
  vendorOrClient?: string;
  status: "Ready" | "Processing";
}

export interface EmployeePermission {
  id: string;
  name: string;
  status: "Enabled" | "Restricted";
  description: string;
}
