import axios from "axios";
import type { z } from "zod";
import { env } from "@/config/env";
import { credentials } from "@/lib/storage/credentials";
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly canceled = false,
  ) {
    super(message);
    this.name = "ApiError";
  }
}
export const api = axios.create({ baseURL: env.apiBaseUrl, timeout: 15000 });
api.interceptors.request.use(async (config) => {
  const token = await credentials.read();
  if (token) config.headers.set("Authorization", `Bearer ${token}`);
  return config;
});
export function normalizeError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (axios.isCancel(error))
    return new ApiError("Request canceled.", undefined, true);
  if (axios.isAxiosError(error))
    return new ApiError(
      error.response?.status === 401
        ? "Please sign in again."
        : "Unable to complete the request.",
      error.response?.status,
    );
  return new ApiError("Unable to complete the request.");
}
export async function getValidated<T>(
  path: string,
  schema: z.ZodType<T>,
  signal?: AbortSignal,
): Promise<T> {
  try {
    const response = await api.get<unknown>(path, { signal });
    return schema.parse(response.data);
  } catch (error) {
    throw normalizeError(error);
  }
}
