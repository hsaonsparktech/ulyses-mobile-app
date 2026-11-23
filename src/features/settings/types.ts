export interface BusinessSettings {
  legalName: string;
  dba: string;
  ein: string;
  currency: string;
  accountingMethod: "Cash" | "Accrual";
  fiscalYearEnd: string;
  defaultPaymentTerms: "Due on Receipt" | "Net 15" | "Net 30" | "Net 60";
  biometricLockEnabled: boolean;
}
