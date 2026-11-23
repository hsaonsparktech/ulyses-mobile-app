export type AccountType =
  | "asset"
  | "liability"
  | "equity"
  | "revenue"
  | "expense";

export interface AccountEntity {
  id: string;
  business_id: string;
  code: string;
  name: string;
  type: AccountType;
  currency: string;
  status: "active" | "archived";
  created_at: string;
}

export interface AccountProfile {
  id: string;
  businessId: string;
  code: string;
  name: string;
  type: AccountType;
  currency: string;
  status: "active" | "archived";
  balanceCents: number;
}

export function toAccountProfile(
  account: AccountEntity,
  balanceCents = 0,
): AccountProfile {
  return {
    id: account.id,
    businessId: account.business_id,
    code: account.code,
    name: account.name,
    type: account.type,
    currency: account.currency,
    status: account.status,
    balanceCents,
  };
}
