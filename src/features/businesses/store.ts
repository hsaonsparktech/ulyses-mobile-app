import { create } from "zustand";
import { resetRemoteState } from "@/lib/query/client";
import { sampleBusinesses } from "./data/sampleBusinesses";
import type { Business } from "./types";

interface BusinessState {
  businesses: Business[];
  activeBusinessId: string;
  activeBusiness: () => Business;
  setActiveBusinessId: (id: string) => Promise<void>;
  addBusiness: (business: Omit<Business, "id">) => void;
}

export const useBusinessStore = create<BusinessState>((set, get) => ({
  businesses: sampleBusinesses,
  activeBusinessId: sampleBusinesses[0]?.id ?? "biz-1",
  activeBusiness: () => {
    const { businesses, activeBusinessId } = get();
    const fallback: Business = businesses[0] ?? {
      id: "biz-1",
      name: "Acme Services LLC",
      type: "Freelancer / Small business",
      currency: "USD",
    };
    return businesses.find((b) => b.id === activeBusinessId) ?? fallback;
  },
  setActiveBusinessId: async (id: string) => {
    await resetRemoteState();
    set({ activeBusinessId: id });
  },
  addBusiness: (data) => {
    const id = `biz-${Date.now()}`;
    const newBiz: Business = { id, ...data };
    set((state) => ({
      businesses: [...state.businesses, newBiz],
      activeBusinessId: id,
    }));
  },
}));
