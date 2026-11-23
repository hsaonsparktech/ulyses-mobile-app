import { z } from "zod";

export const registerSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters."),
  email: z.email("Enter a valid work email address."),
  password: z.string().min(8, "Password must be at least 8 characters long."),
  termsAccepted: z
    .boolean()
    .refine(
      (val) => val === true,
      "You must agree to the Terms and Privacy Policy.",
    ),
});

export type RegisterInput = z.infer<typeof registerSchema>;
