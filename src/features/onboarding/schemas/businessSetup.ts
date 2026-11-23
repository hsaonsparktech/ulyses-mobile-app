import { z } from "zod";

export const businessSetupSchema = z.object({
  businessName: z
    .string()
    .trim()
    .min(2, "Business name must be at least 2 characters."),
  businessType: z
    .string()
    .trim()
    .min(1, "Please select or enter a business type."),
  currency: z.string().trim().min(3, "Currency must be specified (e.g. USD)."),
});

export type BusinessSetupInput = z.infer<typeof businessSetupSchema>;
