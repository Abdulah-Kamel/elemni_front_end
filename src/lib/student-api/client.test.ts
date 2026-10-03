import { afterEach, describe, expect, it, vi } from "vitest";
import { StudentApiError, studentApiFetch } from "./client";

afterEach(() => vi.unstubAllGlobals());

describe("studentApiFetch errors", () => {
  it("exposes detail and Retry-After seconds", async () => {
    vi.stubGlobal("fetch", vi.fn(async () =>
      new Response(JSON.stringify({ code: "BACKEND_ERROR_429", detail: "Heartbeat throttled" }), {
        status: 429,
        headers: { "Retry-After": "15" },
      }),
    ));
    const error = await studentApiFetch("/api/x").catch((caught) => caught);
    expect(error).toBeInstanceOf(StudentApiError);
    expect(error).toMatchObject({ status: 429, code: "BACKEND_ERROR_429", detail: "Heartbeat throttled", retryAfterSec: 15 });
  });

  it("ignores a non-numeric Retry-After", async () => {
    vi.stubGlobal("fetch", vi.fn(async () =>
      new Response("{}", { status: 503, headers: { "Retry-After": "Wed, 21 Oct 2026 07:28:00 GMT" } }),
    ));
    const error = await studentApiFetch("/api/x").catch((caught) => caught);
    if (!(error instanceof StudentApiError)) throw error;
    expect(error.retryAfterSec).toBeUndefined();
  });

  it("maps a network failure to SERVICE_UNAVAILABLE", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("Failed to fetch"); }));
    const error = await studentApiFetch("/api/x").catch((caught) => caught);
    expect(error).toMatchObject({ status: 503, code: "SERVICE_UNAVAILABLE" });
  });
});
