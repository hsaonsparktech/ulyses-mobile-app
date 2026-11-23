import { z } from "zod";

export const userRoleEnum = z.enum(["owner", "employee", "accountant"]);
export type UserRole = z.infer<typeof userRoleEnum>;

export interface UserEntity {
  id: string;
  email: string;
  password_hash: string;
  password_salt: string;
  full_name: string;
  is_verified: number;
  verification_code: string | null;
  verification_code_expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  isVerified: boolean;
  createdAt: string;
}

export function toUserProfile(user: UserEntity): UserProfile {
  return {
    id: user.id,
    email: user.email,
    fullName: user.full_name,
    isVerified: Boolean(user.is_verified),
    createdAt: user.created_at,
  };
}
