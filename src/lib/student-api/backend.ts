import "server-only";

import { env } from "@/src/env";

export interface BackendError {
  status: number;
  message: string;
}

export type BackendResult<T> =
  | { ok: true; data: T; status: number }
  | { ok: false; error: BackendError };

export async function backendFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<BackendResult<T>> {
  try {
    const response = await fetch(`${env.API_URL}${path}`, {
      ...init,
      headers: {
        Accept: "application/json",
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...init.headers,
      },
      signal: init.signal ?? AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      return {
        ok: false,
        error: {
          status: response.status,
          message:
            typeof body?.detail === "string"
              ? body.detail
              : "تعذر إتمام الطلب حالياً.",
        },
      };
    }

    if (response.status === 204) {
      return { ok: true, data: undefined as T, status: response.status };
    }

    return {
      ok: true,
      data: (await response.json()) as T,
      status: response.status,
    };
  } catch {
    return {
      ok: false,
      error: { status: 503, message: "خدمة المنصة غير متاحة حالياً." },
    };
  }
}

export function backendErrorResponse(error: BackendError) {
  return Response.json(
    { detail: error.message },
    { status: error.status >= 400 && error.status <= 599 ? error.status : 502 },
  );
}
