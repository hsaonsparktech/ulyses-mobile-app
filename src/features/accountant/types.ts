export interface AccountantOverviewMetrics {
  totalIncome: number;
  incomeTrend: string;
  totalExpenses: number;
  expenseTrend: string;
  netProfit: number;
  profitMargin: string;
  reconciledThrough: string;
  clientName: string;
  clientId: string;
  scopeDescription: string;
}

export interface MonthlyFinancialData {
  month: string;
  income: number;
  expenses: number;
  net: number;
}

export interface ProfitAndLossStatement {
  period: string;
  grossRevenue: number;
  costOfGoodsSold: number;
  grossProfit: number;
  operatingExpenses: number;
  taxDepreciation: number;
  netIncome: number;
}

export interface VendorSpendingItem {
  id: string;
  name: string;
  category: string;
  amount: number;
  invoiceCount: number;
  percentage: string;
}

export interface AccountantDocument {
  id: string;
  filename: string;
  type: "Invoice" | "Receipt" | "Tax Filing" | "Statement";
  date: string;
  fileSize: string;
  fileTypeLabel: "PDF" | "CSV" | "XLSX" | "PNG";
  status: "Reconciled" | "Needs Review" | "Pending";
  vendorOrClient: string;
  amount?: number;
  period?: string;
}

export interface AccountantPermission {
  id: string;
  name: string;
  status: "Granted" | "Restricted";
  description: string;
}

export interface ReportExportConfig {
  format: "PDF" | "CSV" | "XLSX";
  period: string;
  includeReceipts: boolean;
}
