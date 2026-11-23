import type { ServerResponse } from "node:http";
import { z } from "zod";
import type { Database } from "../db/client";
import { getDatabase } from "../db/client";
import type { RequestWithAuth } from "../middleware/auth";
import { ClientService } from "../services/ClientService";
import { HttpError } from "../utils/problemDetails";

const createClientSchema = z.object({
  name: z.string().trim().min(2, "Client name must be at least 2 characters."),
  email: z.string().email("Enter a valid email address.").optional(),
  phone: z.string().trim().optional(),
  company: z.string().trim().optional(),
  address: z.string().trim().optional(),
});

const updateClientSchema = z.object({
  name: z.string().trim().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().trim().optional(),
  company: z.string().trim().optional(),
  address: z.string().trim().optional(),
  status: z.enum(["active", "archived"]).optional(),
});

export function createClientRoutes(db?: Database) {
  const database = db ?? getDatabase();
  const clientService = new ClientService(database);

  return {
    handleListClients: (req: RequestWithAuth, res: ServerResponse): void => {
      if (!req.businessContext) {
        throw new HttpError(
          400,
          "Business Context Required",
          "Tenant context missing.",
        );
      }

      const search = req.query?.search;
      const status = req.query?.status as "active" | "archived" | undefined;
      const limit = req.query?.limit
        ? parseInt(req.query.limit, 10)
        : undefined;
      const offset = req.query?.offset
        ? parseInt(req.query.offset, 10)
        : undefined;

      const clients = clientService.getClients(req.businessContext.businessId, {
        search,
        status,
        limit,
        offset,
      });

      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(clients, null, 2));
    },

    handleGetClient: (req: RequestWithAuth, res: ServerResponse): void => {
      if (!req.businessContext) {
        throw new HttpError(
          400,
          "Business Context Required",
          "Tenant context missing.",
        );
      }

      const clientId = req.params?.id;
      if (!clientId) {
        throw new HttpError(400, "Client ID Missing", "Client ID is required.");
      }

      const client = clientService.getClientById(
        req.businessContext.businessId,
        clientId,
      );

      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(client, null, 2));
    },

    handleCreateClient: (req: RequestWithAuth, res: ServerResponse): void => {
      if (!req.businessContext || !req.user) {
        throw new HttpError(
          400,
          "Business Context Required",
          "Tenant context missing.",
        );
      }

      if (req.businessContext.role !== "owner") {
        throw new HttpError(
          403,
          "Access Denied",
          "Only business owners are authorized to create clients.",
        );
      }

      const parsed = createClientSchema.parse(req.body);
      const ip =
        (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress;

      const result = clientService.createClient(
        req.businessContext.businessId,
        req.user.id,
        parsed,
        ip,
      );

      res.statusCode = 201;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(result, null, 2));
    },

    handleUpdateClient: (req: RequestWithAuth, res: ServerResponse): void => {
      if (!req.businessContext || !req.user) {
        throw new HttpError(
          400,
          "Business Context Required",
          "Tenant context missing.",
        );
      }

      if (req.businessContext.role !== "owner") {
        throw new HttpError(
          403,
          "Access Denied",
          "Only business owners are authorized to update clients.",
        );
      }

      const clientId = req.params?.id;
      if (!clientId) {
        throw new HttpError(400, "Client ID Missing", "Client ID is required.");
      }

      const parsed = updateClientSchema.parse(req.body);
      const ip =
        (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress;

      const result = clientService.updateClient(
        req.businessContext.businessId,
        req.user.id,
        clientId,
        parsed,
        ip,
      );

      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(result, null, 2));
    },

    handleArchiveClient: (req: RequestWithAuth, res: ServerResponse): void => {
      if (!req.businessContext || !req.user) {
        throw new HttpError(
          400,
          "Business Context Required",
          "Tenant context missing.",
        );
      }

      if (req.businessContext.role !== "owner") {
        throw new HttpError(
          403,
          "Access Denied",
          "Only business owners can archive clients.",
        );
      }

      const clientId = req.params?.id;
      if (!clientId) {
        throw new HttpError(400, "Client ID Missing", "Client ID is required.");
      }

      const ip =
        (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress;
      clientService.archiveClient(
        req.businessContext.businessId,
        req.user.id,
        clientId,
        ip,
      );

      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ archived: true, clientId }, null, 2));
    },
  };
}
