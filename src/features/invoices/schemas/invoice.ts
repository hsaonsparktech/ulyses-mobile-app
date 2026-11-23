import { z } from "zod";

export const invoiceLineItemSchema = z.object({
  description: z.string().min(1, "Item description is required"),
  quantity: z.number().positive("Quantity must be greater than zero"),
  unitPrice: z.number().nonnegative("Unit price cannot be negative"),
});

export const invoiceSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  clientName: z.string().min(1, "Client name is required"),
  clientEmail: z.string().email("Valid client email is required"),
  issueDate: z.string().min(1, "Issue date is required"),
  dueDate: z.string().min(1, "Due date is required"),
  items: z
    .array(invoiceLineItemSchema)
    .min(1, "At least one line item is required"),
  tax: z.number().nonnegative().default(0),
  currency: z.string().default("USD"),
});

export type InvoiceFormValues = z.infer<typeof invoiceSchema>;
