import { credentials } from "@/lib/storage/credentials";

export interface ApiProblemDetails {
  type?: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
  invalidParams?: Array<{ name: string; reason: string }>;
}

export class ApiError extends Error {
  readonly status: number;
  readonly title: string;
  readonly detail?: string;
  readonly invalidParams?: Array<{ name: string; reason: string }>;

  constructor(problem: ApiProblemDetails) {
    super(
      problem.detail ||
        problem.title ||
        `API request failed with status ${problem.status}`,
    );
    this.name = "ApiError";
    this.status = problem.status;
    this.title = problem.title;
    this.detail = problem.detail;
    this.invalidParams = problem.invalidParams;
  }
}

export interface RequestOptions {
  businessId?: string;
  token?: string;
  signal?: AbortSignal;
  headers?: Record<string, string>;
  idempotencyKey?: string;
}

export function getBaseApiUrl(): string {
  const url = process.env.EXPO_PUBLIC_API_BASE_URL || "";
  return url.replace(/\/+$/, "");
}

export async function request<T = unknown>(
  method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE",
  path: string,
  body?: unknown,
  options: RequestOptions = {},
): Promise<T> {
  const baseUrl = getBaseApiUrl();
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${baseUrl}${cleanPath}`;

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...options.headers,
  };

  // Resolve authorization token
  const token = options.token ?? (await credentials.read());
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  // Inject tenant context header
  if (options.businessId) {
    headers["X-Business-Id"] = options.businessId;
  }

  // Inject idempotency key if provided
  if (options.idempotencyKey) {
    headers["Idempotency-Key"] = options.idempotencyKey;
  }

  let reqBody: string | undefined;
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    reqBody = JSON.stringify(body);
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: reqBody,
      signal: options.signal,
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "AbortError") {
      throw err;
    }
    throw new ApiError({
      status: 0,
      title: "Network Error",
      detail:
        err instanceof Error
          ? err.message
          : "Unable to communicate with server.",
    });
  }

  if (!response.ok) {
    let problem: ApiProblemDetails;
    try {
      const data = await response.json();
      problem = {
        status: response.status,
        title: data.title || response.statusText || "Request Failed",
        detail: data.detail,
        invalidParams: data.invalidParams,
      };
    } catch {
      problem = {
        status: response.status,
        title: response.statusText || "Request Failed",
        detail: `Server returned HTTP ${response.status}`,
      };
    }
    throw new ApiError(problem);
  }

  if (response.status === 204) {
    return undefined as unknown as T;
  }

  return (await response.json()) as T;
}

export const httpClient = {
  get: <T = unknown>(path: string, options?: RequestOptions) =>
    request<T>("GET", path, undefined, options),
  post: <T = unknown>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("POST", path, body, options),
  patch: <T = unknown>(
    path: string,
    body?: unknown,
    options?: RequestOptions,
  ) => request<T>("PATCH", path, body, options),
  put: <T = unknown>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("PUT", path, body, options),
  del: <T = unknown>(path: string, options?: RequestOptions) =>
    request<T>("DELETE", path, undefined, options),
};
