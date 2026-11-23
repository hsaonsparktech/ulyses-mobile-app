import { create } from "zustand";
import type { BusinessSettings } from "./types";

interface SettingsState {
  settings: BusinessSettings;
  updateSettings: (partial: Partial<BusinessSettings>) => void;
}

const initialSettings: BusinessSettings = {
  legalName: "Acme Services LLC",
  dba: "Acme Consulting",
  ein: "XX-XXX4910",
  currency: "USD ($)",
  accountingMethod: "Cash",
  fiscalYearEnd: "December 31",
  defaultPaymentTerms: "Net 30",
  biometricLockEnabled: true,
};

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: initialSettings,
  updateSettings: (partial) => {
    set((state) => ({
      settings: { ...state.settings, ...partial },
    }));
  },
}));
