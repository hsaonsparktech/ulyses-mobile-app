import { z } from "zod";

export const clientSchema = z.object({
  name: z
    .string()
    .min(2, "Company or client name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(7, "Phone number is required"),
  billingAddress: z.string().min(2, "Billing address is required"),
  currency: z.string().default("USD"),
});

export type ClientFormValues = z.infer<typeof clientSchema>;
