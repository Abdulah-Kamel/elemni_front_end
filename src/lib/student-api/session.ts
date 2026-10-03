import "server-only";

import { cookies } from "next/headers";
import { backendFetch, type BackendResult } from "./backend";
import type { TokenDto } from "./contract";

const ACCESS_COOKIE = "elemni_access";
const REFRESH_COOKIE = "elemni_refresh";

const baseCookie = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

const inFlightRefresh = new Map<string, Promise<TokenDto | null>>();

export async function setSession(accessToken: string, refreshToken: string) {
  const store = await cookies();
  store.set(ACCESS_COOKIE, accessToken, { ...baseCookie, maxAge: 30 * 60 });
  store.set(REFRESH_COOKIE, refreshToken, { ...baseCookie, maxAge: 7 * 24 * 60 * 60 });
}

export async function clearSession() {
  const store = await cookies();
  store.delete(ACCESS_COOKIE);
  store.delete(REFRESH_COOKIE);
}

export async function getRefreshToken() {
  return (await cookies()).get(REFRESH_COOKIE)?.value;
}

export async function getAccessToken() {
  return (await cookies()).get(ACCESS_COOKIE)?.value;
}

export async function hasStudentSession() {
  return Boolean((await getAccessToken()) || (await getRefreshToken()));
}

async function refreshAccessToken(): Promise<TokenDto | null> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return null;

  const existingRefresh = inFlightRefresh.get(refreshToken);
  const refreshPromise = existingRefresh ?? (async () => {
    const response = await backendFetch<TokenDto>("/api/v1/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!response.ok) return null;
    try {
      await setSession(response.data.access_token, response.data.refresh_token);
    } catch {
      // Server Components cannot set cookies; the refreshed token still serves this request.
    }
    return response.data;
  })();

  if (!existingRefresh) {
    inFlightRefresh.set(
      refreshToken,
      refreshPromise.finally(() => inFlightRefresh.delete(refreshToken)),
    );
  }

  return refreshPromise;
}

export async function authenticatedBackendFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<BackendResult<T>> {
  let accessToken = await getAccessToken();
  if (!accessToken) {
    if (!(await getRefreshToken())) {
      return { ok: false, error: { status: 401, code: "SESSION_REQUIRED" } };
    }
    const refreshed = await refreshAccessToken();
    if (!refreshed) {
      await clearSession().catch(() => undefined);
      return { ok: false, error: { status: 401, code: "SESSION_EXPIRED" } };
    }
    accessToken = refreshed.access_token;
  }

  const request = (token: string) =>
    backendFetch<T>(path, {
      ...init,
      headers: { ...init.headers, Authorization: `Bearer ${token}` },
    });

  let result = await request(accessToken);
  if (result.ok || result.error.status !== 401) return result;

  if (!(await getRefreshToken())) {
    await clearSession();
    return result;
  }

  const refreshed = await refreshAccessToken();
  if (!refreshed) {
    await clearSession();
    return { ok: false, error: { status: 401, code: "SESSION_EXPIRED" } };
  }

  result = await request(refreshed.access_token);
  return result;
}
