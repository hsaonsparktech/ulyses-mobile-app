import { z } from "zod";
export const roleSchema = z.enum(["owner", "employee", "accountant"]);
export type Role = z.infer<typeof roleSchema>;
export const sessionSchema = z.object({
  userId: z.string().min(1),
  role: roleSchema,
  businessId: z.string().min(1),
});
export type Session = z.infer<typeof sessionSchema>;
export const signInSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});
export type SignInInput = z.infer<typeof signInSchema>;
