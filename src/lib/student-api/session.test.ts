import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  accessToken: "expired-access",
  refreshToken: "valid-refresh",
  requestCount: 0,
  refreshCount: 0,
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
      if (name === "elemni_access") mocks.accessToken = value;
      if (name === "elemni_refresh") mocks.refreshToken = value;
    },
    delete: (name: string) => {
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
