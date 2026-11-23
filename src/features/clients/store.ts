import { create } from "zustand";
import { env } from "@/config/env";
import { clientAdapter } from "./api/clientAdapter";
import { sampleClients } from "./data/sampleClients";
import type { Client, CreateClientInput } from "./types";

interface ClientState {
  clients: Client[];
  isLoading: boolean;
  error: string | null;
  fetchClients: (businessId: string) => Promise<Client[]>;
  getClientsByBusiness: (businessId: string) => Client[];
  getClientById: (id: string) => Client | undefined;
  addClient: (businessId: string, input: CreateClientInput) => Client;
  updateClient: (id: string, updates: Partial<Client>) => void;
  resetRemoteState: () => void;
}

export const useClientStore = create<ClientState>((set, get) => ({
  clients: sampleClients,
  isLoading: false,
  error: null,

  fetchClients: async (businessId: string) => {
    if (env.mockAuth) {
      return get().getClientsByBusiness(businessId);
    }

    set({ isLoading: true, error: null });
    try {
      const profiles = await clientAdapter.list(businessId);
      const mappedClients: Client[] = profiles.map((p) => ({
        id: p.id,
        businessId: p.businessId,
        name: p.name,
        email: p.email || "",
        phone: p.phone || "",
        billingAddress: p.address || "",
        currency: "USD",
        invoicesCount: 0,
        outstandingAmount: p.outstandingBalanceCents / 100,
        lastActivity: "Recent",
        createdAt: p.createdAt,
      }));

      set((state) => {
        const otherBusinessesClients = state.clients.filter(
          (c) => c.businessId !== businessId,
        );
        return {
          clients: [...mappedClients, ...otherBusinessesClients],
          isLoading: false,
        };
      });

      return mappedClients;
    } catch (err: any) {
      set({
        error: err?.message || "Failed to load clients.",
        isLoading: false,
      });
      return get().getClientsByBusiness(businessId);
    }
  },

  getClientsByBusiness: (businessId: string) => {
    return get().clients.filter((c) => c.businessId === businessId);
  },

  getClientById: (id: string) => {
    return get().clients.find((c) => c.id === id);
  },

  addClient: (businessId: string, input: CreateClientInput) => {
    const id = `client-${Date.now()}`;
    const newClient: Client = {
      id,
      businessId,
      name: input.name,
      email: input.email,
      phone: input.phone,
      billingAddress: input.billingAddress,
      currency: input.currency ?? "USD",
      invoicesCount: 0,
      outstandingAmount: 0.0,
      lastActivity: "Just now",
      createdAt: new Date().toISOString(),
    };

    set((state) => ({
      clients: [newClient, ...state.clients],
    }));

    if (!env.mockAuth) {
      clientAdapter
        .create(businessId, {
          name: input.name,
          email: input.email,
          phone: input.phone,
          address: input.billingAddress,
        })
        .then((created) => {
          set((state) => ({
            clients: state.clients.map((c) =>
              c.id === id
                ? {
                    ...c,
                    id: created.id,
                    outstandingAmount: created.outstandingBalanceCents / 100,
                  }
                : c,
            ),
          }));
        })
        .catch(() => {});
    }

    return newClient;
  },

  updateClient: (id: string, updates: Partial<Client>) => {
    set((state) => ({
      clients: state.clients.map((c) =>
        c.id === id ? { ...c, ...updates } : c,
      ),
    }));
  },

  resetRemoteState: () => {
    set({ clients: sampleClients, isLoading: false, error: null });
  },
}));
