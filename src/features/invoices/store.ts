import { create } from "zustand";
import { env } from "@/config/env";
import { type InvoiceProfile, invoiceAdapter } from "./api/invoiceAdapter";
import { sampleInvoices } from "./data/sampleInvoices";
import type { CreateInvoiceInput, Invoice, InvoiceLineItem } from "./types";

export function mapInvoiceProfileToInvoice(p: InvoiceProfile): Invoice {
  const statusMap: Record<string, Invoice["status"]> = {
    draft: "Draft",
    sent: "Unpaid",
    partially_paid: "Unpaid",
    paid: "Paid",
    overdue: "Overdue",
    cancelled: "Draft",
  };

  return {
    id: p.id,
    invoiceNumber: p.invoiceNumber,
    businessId: p.businessId,
    clientId: p.clientId,
    clientName: p.clientName || "Client",
    clientEmail: "",
    issueDate: p.issueDate,
    dueDate: p.dueDate,
    currency: p.currency,
    items: (p.items || []).map((item) => ({
      id: item.id,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPriceCents / 100,
      amount: item.totalCents / 100,
    })),
    subtotal: p.subtotalCents / 100,
    tax: p.taxCents / 100,
    total: p.totalCents / 100,
    status: statusMap[p.status] || "Draft",
    deliveryStatus: p.status === "draft" ? "Not sent" : "Sent",
    template: "clean",
    accentColor: "Libros blue",
    showTaxAndLineItems: true,
  };
}

interface InvoiceState {
  invoices: Invoice[];
  isLoading: boolean;
  error: string | null;
  fetchInvoices: (businessId: string) => Promise<Invoice[]>;
  getInvoicesByBusiness: (businessId: string) => Invoice[];
  getInvoiceById: (id: string) => Invoice | undefined;
  addInvoice: (businessId: string, input: CreateInvoiceInput) => Invoice;
  markAsPaid: (
    id: string,
    paidDate?: string,
    paymentMethod?: string,
    businessId?: string,
  ) => void;
  updateDeliveryStatus: (
    id: string,
    status: "Not sent" | "Sent" | "Failed",
    businessId?: string,
  ) => void;
  updateInvoiceTemplate: (
    id: string,
    template: "clean" | "modern" | "classic",
    accentColor?: string,
  ) => void;
  resetRemoteState: () => void;
}

export const useInvoiceStore = create<InvoiceState>((set, get) => ({
  invoices: sampleInvoices,
  isLoading: false,
  error: null,

  fetchInvoices: async (businessId: string) => {
    if (env.mockAuth) {
      return get().getInvoicesByBusiness(businessId);
    }

    set({ isLoading: true, error: null });
    try {
      const profiles = await invoiceAdapter.list(businessId);
      const mapped = profiles.map(mapInvoiceProfileToInvoice);
      set((state) => {
        const otherInvoices = state.invoices.filter(
          (inv) => inv.businessId !== businessId,
        );
        return {
          invoices: [...mapped, ...otherInvoices],
          isLoading: false,
        };
      });
      return mapped;
    } catch (err: any) {
      set({
        error: err?.message || "Failed to load invoices.",
        isLoading: false,
      });
      return get().getInvoicesByBusiness(businessId);
    }
  },

  getInvoicesByBusiness: (businessId: string) => {
    return get().invoices.filter((inv) => inv.businessId === businessId);
  },

  getInvoiceById: (id: string) => {
    return get().invoices.find((inv) => inv.id === id);
  },

  addInvoice: (businessId: string, input: CreateInvoiceInput) => {
    const nextNum = get().invoices.length + 242;
    const invoiceNumber = `INV-0${nextNum}`;
    const id = `inv-${Date.now()}`;
    const items: InvoiceLineItem[] = input.items.map((item, index) => ({
      id: `item-${Date.now()}-${index}`,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      amount: item.quantity * item.unitPrice,
    }));
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const tax = input.tax ?? 0;
    const total = subtotal + tax;

    const newInvoice: Invoice = {
      id,
      invoiceNumber,
      businessId,
      clientId: input.clientId,
      clientName: input.clientName,
      clientEmail: input.clientEmail,
      issueDate: input.issueDate,
      dueDate: input.dueDate,
      currency: input.currency ?? "USD",
      items,
      subtotal,
      tax,
      total,
      status: input.status ?? "Draft",
      deliveryStatus: "Not sent",
      template: input.template ?? "clean",
      accentColor: "Libros blue",
      showTaxAndLineItems: true,
    };

    set((state) => ({
      invoices: [newInvoice, ...state.invoices],
    }));

    if (!env.mockAuth) {
      invoiceAdapter
        .create(businessId, {
          clientId: input.clientId,
          issueDate: input.issueDate,
          dueDate: input.dueDate,
          currency: input.currency ?? "USD",
          items: input.items.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unitPriceCents: Math.round(item.unitPrice * 100),
          })),
          taxCents: Math.round((input.tax ?? 0) * 100),
          idempotencyKey: `inv-create-${id}`,
        })
        .then((created) => {
          set((state) => ({
            invoices: state.invoices.map((inv) =>
              inv.id === id ? mapInvoiceProfileToInvoice(created) : inv,
            ),
          }));
        })
        .catch(() => {});
    }

    return newInvoice;
  },

  markAsPaid: (
    id: string,
    paidDate?: string,
    paymentMethod?: string,
    businessId?: string,
  ) => {
    set((state) => ({
      invoices: state.invoices.map((inv) =>
        inv.id === id
          ? {
              ...inv,
              status: "Paid",
              paidDate: paidDate ?? "Nov 08, 2026",
              paymentMethod: paymentMethod ?? "External payment recorded",
            }
          : inv,
      ),
    }));

    if (!env.mockAuth) {
      const inv = get().invoices.find((i) => i.id === id);
      const bId = businessId || inv?.businessId;
      if (bId && inv) {
        invoiceAdapter
          .recordPayment(
            id,
            bId,
            {
              amountCents: Math.round(inv.total * 100),
              paymentDate: paidDate,
              notes: paymentMethod,
            },
            { idempotencyKey: `pay-${id}-${Date.now()}` },
          )
          .catch(() => {});
      }
    }
  },

  updateDeliveryStatus: (
    id: string,
    status: "Not sent" | "Sent" | "Failed",
    businessId?: string,
  ) => {
    set((state) => ({
      invoices: state.invoices.map((inv) =>
        inv.id === id
          ? {
              ...inv,
              deliveryStatus: status,
              sentAt: new Date().toISOString(),
              status: inv.status === "Draft" ? "Unpaid" : inv.status,
            }
          : inv,
      ),
    }));

    if (!env.mockAuth && status === "Sent") {
      const inv = get().invoices.find((i) => i.id === id);
      const bId = businessId || inv?.businessId;
      if (bId) {
        invoiceAdapter.send(id, bId).catch(() => {});
      }
    }
  },

  updateInvoiceTemplate: (id: string, template, accentColor) => {
    set((state) => ({
      invoices: state.invoices.map((inv) =>
        inv.id === id
          ? {
              ...inv,
              template,
              accentColor: accentColor ?? inv.accentColor,
            }
          : inv,
      ),
    }));
  },

  resetRemoteState: () => {
    set({ invoices: sampleInvoices, isLoading: false, error: null });
  },
}));
