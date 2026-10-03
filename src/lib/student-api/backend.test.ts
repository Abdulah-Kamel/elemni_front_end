import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/src/env", () => ({ env: { API_URL: "http://backend.test" } }));

import { backendErrorResponse, backendFetch } from "./backend";

afterEach(() => vi.unstubAllGlobals());

describe("backend Retry-After passthrough", () => {
  it("captures Retry-After on backend errors", async () => {
    vi.stubGlobal("fetch", vi.fn(async () =>
      new Response(JSON.stringify({ detail: "Heartbeat throttled" }), {
        status: 429,
        headers: { "Retry-After": "15", "Content-Type": "application/json" },
      }),
    ));
    const result = await backendFetch("/x");
    expect(result).toEqual({
      ok: false,
      error: { status: 429, code: "BACKEND_ERROR_429", detail: "Heartbeat throttled", retryAfter: "15" },
    });
  });

  it("re-emits Retry-After from backendErrorResponse", () => {
    const response = backendErrorResponse({ status: 503, code: "BACKEND_ERROR_503", retryAfter: "1" });
    expect(response.status).toBe(503);
    expect(response.headers.get("Retry-After")).toBe("1");
  });

  it("omits Retry-After when absent", () => {
    expect(backendErrorResponse({ status: 409, code: "X" }).headers.get("Retry-After")).toBeNull();
  });
});
