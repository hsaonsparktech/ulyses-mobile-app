import { create } from "zustand";
import { samplePermissions, sampleTeamMembers } from "./data/sampleTeam";
import type { RolePermission, TeamMember, TeamRole } from "./types";

interface TeamState {
  members: TeamMember[];
  permissions: RolePermission[];
  inviteMember: (name: string, email: string, role: TeamRole) => void;
  revokeMember: (id: string) => void;
}

export const useTeamStore = create<TeamState>((set) => ({
  members: sampleTeamMembers,
  permissions: samplePermissions,

  inviteMember: (name, email, role) => {
    const newMember: TeamMember = {
      id: `tm-${Date.now()}`,
      name,
      email,
      role,
      status: "Pending",
      joinedDate: "Today",
      avatarColor: role === "Accountant" ? "#7C3AED" : "#059669",
    };
    set((state) => ({
      members: [...state.members, newMember],
    }));
  },

  revokeMember: (id) => {
    set((state) => ({
      members: state.members.filter((m) => m.id !== id),
    }));
  },
}));
