import { create } from "zustand";
import type { Role } from "@/features/auth/schemas/session";

interface UiState {
  previewRole: Role;
  setPreviewRole: (role: Role) => void;
}
export const useUiStore = create<UiState>((set) => ({
  previewRole: "owner",
  setPreviewRole: (previewRole) => set({ previewRole }),
}));
