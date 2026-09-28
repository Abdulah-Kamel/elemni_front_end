import "server-only";

import { env } from "@/src/env";

export interface BackendError {
  status: number;
  code: string;
  detail?: string;
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
          code: typeof body?.code === "string" ? body.code : `BACKEND_ERROR_${response.status}`,
          ...(typeof body?.detail === "string" ? { detail: body.detail } : {}),
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
      error: { status: 503, code: "SERVICE_UNAVAILABLE" },
    };
  }
}

export function backendErrorResponse(error: BackendError) {
  const status = error.status >= 400 && error.status <= 599 ? error.status : 502;
  return Response.json(
    { code: error.code || `BACKEND_ERROR_${status}`, ...(error.detail ? { detail: error.detail } : {}) },
    { status },
  );
}
