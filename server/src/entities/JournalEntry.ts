export type JournalEntryStatus = "draft" | "posted" | "voided";

export interface JournalEntryLineEntity {
  id: string;
  journal_entry_id: string;
  account_id: string;
  debit_cents: number;
  credit_cents: number;
  description: string | null;
  created_at: string;
}

export interface JournalEntryLineProfile {
  id: string;
  accountId: string;
  accountCode?: string;
  accountName?: string;
  debitCents: number;
  creditCents: number;
  description: string | null;
}

export interface JournalEntryEntity {
  id: string;
  business_id: string;
  entry_number: number;
  entry_date: string;
  description: string;
  status: JournalEntryStatus;
  created_by: string;
  posted_at: string | null;
  reversed_by_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface JournalEntryProfile {
  id: string;
  businessId: string;
  entryNumber: number;
  entryDate: string;
  description: string;
  status: JournalEntryStatus;
  createdBy: string;
  postedAt: string | null;
  reversedById: string | null;
  lines: JournalEntryLineProfile[];
  totalDebitCents: number;
  totalCreditCents: number;
}
