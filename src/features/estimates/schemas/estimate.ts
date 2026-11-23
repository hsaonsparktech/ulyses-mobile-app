import { z } from "zod";

export const estimateLineItemSchema = z.object({
  description: z.string().min(1, "Item description is required"),
  quantity: z.number().positive("Quantity must be greater than zero"),
  unitPrice: z.number().nonnegative("Unit price cannot be negative"),
});

export const estimateSchema = z.object({
  name: z.string().min(2, "Proposal or estimate name is required"),
  clientId: z.string().min(1, "Client is required"),
  clientName: z.string().min(1, "Client name is required"),
  clientEmail: z.string().email("Valid client email is required"),
  items: z
    .array(estimateLineItemSchema)
    .min(1, "At least one line item is required"),
  tax: z.number().nonnegative().default(0),
  currency: z.string().default("USD"),
});

export type EstimateFormValues = z.infer<typeof estimateSchema>;
