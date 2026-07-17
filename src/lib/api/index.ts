import "server-only";

import { env } from "@/src/env";

export type ApiErrorType =
  | "Unauthorized"
  | "Forbidden"
  | "NotFound"
  | "Validation"
  | "RateLimited"
  | "Conflict"
  | "Upstream"
  | "Network";

export interface ApiError {
  type: ApiErrorType;
  message?: string;
  fields?: Record<string, string>;
  requestId?: string;
}

export type ApiResult<T> =
  | { ok: true; data: T; }
  | { ok: false; error: ApiError; };

function statusToType(status: number): ApiErrorType {
  if (status === 401) return "Unauthorized";
  if (status === 403) return "Forbidden";
  if (status === 404) return "NotFound";
  if (status === 422) return "Validation";
  if (status === 429) return "RateLimited";
  if (status === 409) return "Conflict";
  if (status >= 500) return "Upstream";
  return "Upstream";
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { timeoutMs?: number; locale?: string } = {},
  schema: { parse: (data: unknown) => T },
): Promise<ApiResult<T>> {
  const { timeoutMs = 10000, locale = "ar", ...fetchOptions } = options;

  const url = `${env.API_URL}${path}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        "Accept-Language": locale,
        "X-Request-Id": crypto.randomUUID(),
        ...fetchOptions.headers,
      },
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      return {
        ok: false,
        error: {
          type: statusToType(response.status),
          message: body?.error?.message,
          fields: body?.error?.fields,
          requestId: body?.error?.requestId,
        },
      };
    }

    const json = await response.json();
    const parsed = schema.parse(json);
    return { ok: true, data: parsed };
  } catch (err) {
    clearTimeout(timeout);
    if (err instanceof DOMException && err.name === "AbortError") {
      return { ok: false, error: { type: "Network", message: "Request timed out" } };
    }
    return { ok: false, error: { type: "Network", message: "Network error" } };
  }
}

export async function apiFetchRetry<T>(
  path: string,
  options: RequestInit & { timeoutMs?: number; locale?: string } = {},
  schema: { parse: (data: unknown) => T },
  retries = 2,
): Promise<ApiResult<T>> {
  // Only retry idempotent GETs
  const method = (options.method ?? "GET").toUpperCase();
  if (method !== "GET") {
    return apiFetch(path, options, schema);
  }

  for (let i = 0; i <= retries; i++) {
    const result = await apiFetch(path, options, schema);
    if (result.ok || result.error.type !== "Network") return result;
    // Exponential backoff
    await new Promise((r) => setTimeout(r, Math.pow(2, i) * 200));
  }

  return { ok: false, error: { type: "Network", message: "All retries exhausted" } };
}
