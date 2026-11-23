export type BillingCycle = "monthly" | "annual";

export type SubscriptionStatus = "active" | "trial" | "cancelled";

export interface SubscriptionState {
  planName: string;
  priceFormatted: string;
  cycle: BillingCycle;
  status: SubscriptionStatus;
  renewalDate: string;
  nextBillingDate: string;
  annualSavings: string;
  dataRetentionDays: number;
  exportWindowDays: number;
  isCancelled: boolean;
}

export type ExportFormat = "PDF / CSV" | "JSON";
export type ExportPeriod = "All dates" | "YTD (2026)" | "Last calendar year";
export type ExportReportType =
  | "All records and attachments"
  | "Invoices & Estimates only"
  | "Ledger & Expenses only";

export interface DataExportConfig {
  report: ExportReportType;
  period: ExportPeriod;
  business: string;
  format: ExportFormat;
  status: "idle" | "preparing" | "ready";
  generatedAt?: string;
  downloadUrl?: string;
}
