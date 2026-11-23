export interface BusinessEntity {
  id: string;
  name: string;
  business_type: string;
  currency: string;
  status: "active" | "suspended" | "archived";
  created_at: string;
  updated_at: string;
}

export interface BusinessProfile {
  id: string;
  name: string;
  businessType: string;
  currency: string;
  status: string;
  createdAt: string;
}

export function toBusinessProfile(business: BusinessEntity): BusinessProfile {
  return {
    id: business.id,
    name: business.name,
    businessType: business.business_type,
    currency: business.currency,
    status: business.status,
    createdAt: business.created_at,
  };
}
