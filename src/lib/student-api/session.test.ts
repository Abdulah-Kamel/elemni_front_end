import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  accessToken: "expired-access",
  refreshToken: "valid-refresh",
  requestCount: 0,
  refreshCount: 0,
  refreshFails: false,
  cookiesReadOnly: false,
}));

vi.mock("server-only", () => ({}));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => {
      if (name === "elemni_access") return { value: mocks.accessToken };
      if (name === "elemni_refresh") return { value: mocks.refreshToken };
      return undefined;
    },
    set: (name: string, value: string) => {
      if (mocks.cookiesReadOnly) throw new Error("Cookies are read-only");
      if (name === "elemni_access") mocks.accessToken = value;
      if (name === "elemni_refresh") mocks.refreshToken = value;
    },
    delete: (name: string) => {
      if (mocks.cookiesReadOnly) throw new Error("Cookies are read-only");
      if (name === "elemni_access") mocks.accessToken = "";
      if (name === "elemni_refresh") mocks.refreshToken = "";
    },
  }),
}));

vi.mock("./backend", () => ({
  backendFetch: async (path: string, init: RequestInit = {}) => {
    if (path === "/api/v1/auth/refresh") {
      mocks.refreshCount += 1;
      await new Promise((resolve) => setTimeout(resolve, 10));
      if (mocks.refreshFails) {
        return { ok: false, error: { status: 401, code: "INVALID_REFRESH" } };
      }
      return {
        ok: true,
        status: 200,
        data: { access_token: "fresh-access", refresh_token: "fresh-refresh" },
      };
    }

    mocks.requestCount += 1;
    const headers = new Headers(init.headers);
    if (headers.get("Authorization") === "Bearer fresh-access") {
      return { ok: true, status: 200, data: { ok: true } };
    }

    return { ok: false, error: { status: 401, message: "expired" } };
  },
}));

beforeEach(() => {
  mocks.refreshFails = false;
  mocks.cookiesReadOnly = false;
});

describe("authenticatedBackendFetch", () => {
  beforeEach(() => {
    mocks.accessToken = "expired-access";
    mocks.refreshToken = "valid-refresh";
    mocks.requestCount = 0;
    mocks.refreshCount = 0;
  });

  it("deduplicates concurrent refreshes for an expired access token", async () => {
    const { authenticatedBackendFetch } = await import("./session");

    const results = await Promise.all([
      authenticatedBackendFetch<{ ok: boolean }>("/api/v1/one"),
      authenticatedBackendFetch<{ ok: boolean }>("/api/v1/two"),
      authenticatedBackendFetch<{ ok: boolean }>("/api/v1/three"),
    ]);

    expect(mocks.refreshCount).toBe(1);
    expect(mocks.requestCount).toBe(6);
    expect(mocks.accessToken).toBe("fresh-access");
    expect(mocks.refreshToken).toBe("fresh-refresh");
    expect(results).toEqual([
      { ok: true, status: 200, data: { ok: true } },
      { ok: true, status: 200, data: { ok: true } },
      { ok: true, status: 200, data: { ok: true } },
    ]);
  });
});

describe("missing access cookie", () => {
  beforeEach(() => {
    mocks.accessToken = "";
    mocks.refreshToken = "valid-refresh";
    mocks.refreshCount = 0;
    mocks.requestCount = 0;
  });

  it("refreshes before calling the backend", async () => {
    const { authenticatedBackendFetch } = await import("./session");
    const result = await authenticatedBackendFetch("/api/v1/my/courses");
    expect(mocks.refreshCount).toBe(1);
    expect(mocks.requestCount).toBe(1);
    expect(result.ok).toBe(true);
    expect(mocks.accessToken).toBe("fresh-access");
    expect(mocks.refreshToken).toBe("fresh-refresh");
  });

  it("returns SESSION_REQUIRED without any call when no refresh cookie exists", async () => {
    const { authenticatedBackendFetch } = await import("./session");
    mocks.refreshToken = "";
    const result = await authenticatedBackendFetch("/api/v1/my/courses");
    expect(result).toEqual({ ok: false, error: { status: 401, code: "SESSION_REQUIRED" } });
    expect(mocks.refreshCount).toBe(0);
    expect(mocks.requestCount).toBe(0);
  });

  it("deduplicates concurrent refreshes before making authenticated requests", async () => {
    const { authenticatedBackendFetch } = await import("./session");
    const results = await Promise.all([
      authenticatedBackendFetch("/api/v1/one"),
      authenticatedBackendFetch("/api/v1/two"),
      authenticatedBackendFetch("/api/v1/three"),
    ]);
    expect(mocks.refreshCount).toBe(1);
    expect(mocks.requestCount).toBe(3);
    expect(results.every((result) => result.ok)).toBe(true);
  });

  it("uses the refreshed token when Server Components cannot set cookies", async () => {
    const { authenticatedBackendFetch } = await import("./session");
    mocks.cookiesReadOnly = true;
    const result = await authenticatedBackendFetch("/api/v1/my/courses");
    expect(result.ok).toBe(true);
    expect(mocks.refreshCount).toBe(1);
    expect(mocks.requestCount).toBe(1);
    expect(mocks.accessToken).toBe("");
  });

  it("returns SESSION_EXPIRED and clears cookies when refresh fails", async () => {
    const { authenticatedBackendFetch } = await import("./session");
    mocks.refreshFails = true;
    const result = await authenticatedBackendFetch("/api/v1/my/courses");
    expect(result).toEqual({ ok: false, error: { status: 401, code: "SESSION_EXPIRED" } });
    expect(mocks.refreshCount).toBe(1);
    expect(mocks.requestCount).toBe(0);
    expect(mocks.refreshToken).toBe("");
  });

  it("returns SESSION_EXPIRED when Server Components cannot clear cookies", async () => {
    const { authenticatedBackendFetch } = await import("./session");
    mocks.refreshFails = true;
    mocks.cookiesReadOnly = true;
    const result = await authenticatedBackendFetch("/api/v1/my/courses");
    expect(result).toEqual({ ok: false, error: { status: 401, code: "SESSION_EXPIRED" } });
    expect(mocks.refreshCount).toBe(1);
    expect(mocks.requestCount).toBe(0);
  });
});

describe("sessionGate", () => {
  it.each([
    ["a", "", "active"],
    ["a", "r", "active"],
    ["", "r", "refresh"],
    ["", "", "none"],
  ])("access=%s refresh=%s → %s", async (access, refresh, expected) => {
    const { sessionGate } = await import("./session");
    mocks.accessToken = access;
    mocks.refreshToken = refresh;
    await expect(sessionGate()).resolves.toBe(expected);
  });
});
