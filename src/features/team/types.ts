export type TeamRole = "Owner" | "Accountant" | "Employee";

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: TeamRole;
  status: "Active" | "Pending" | "Revoked";
  joinedDate: string;
  avatarColor?: string;
}

export interface RolePermission {
  id: string;
  name: string;
  description: string;
  allowedRoles: TeamRole[];
}
