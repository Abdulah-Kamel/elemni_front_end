import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  authenticatedBackendFetch: vi.fn(),
  backendErrorResponse: vi.fn((error: { status: number; code: string; detail?: string; retryAfter?: string }) =>
    Response.json(
      { code: error.code, ...(error.detail ? { detail: error.detail } : {}) },
      { status: error.status, ...(error.retryAfter ? { headers: { "Retry-After": error.retryAfter } } : {}) },
    ),
  ),
}));

vi.mock("@/src/lib/student-api/session", () => ({ authenticatedBackendFetch: mocks.authenticatedBackendFetch }));
vi.mock("@/src/lib/student-api/backend", () => ({ backendErrorResponse: mocks.backendErrorResponse }));

import { GET as getLastWatched } from "./last-watched/route";
import { GET as getProgress } from "./items/[itemId]/progress/route";
import { POST as postPlayback } from "./items/[itemId]/playback/route";
import { POST as postHeartbeat } from "./sessions/[sessionId]/heartbeat/route";
import { POST as postEnd } from "./sessions/[sessionId]/end/route";

const itemParams = (itemId: string) => ({ params: Promise.resolve({ itemId }) });
const sessionParams = (sessionId: string) => ({ params: Promise.resolve({ sessionId }) });
const post = (body?: string, headers?: Record<string, string>) =>
  new Request("http://localhost/x", { method: "POST", ...(body === undefined ? {} : { body }), headers });

beforeEach(() => {
  mocks.authenticatedBackendFetch.mockReset();
  mocks.authenticatedBackendFetch.mockResolvedValue({ ok: true, status: 200, data: { ok: 1 } });
  mocks.backendErrorResponse.mockClear();
});

describe("GET last-watched", () => {
  it("proxies to the backend", async () => {
    const response = await getLastWatched();
    expect(response.status).toBe(200);
    expect(mocks.authenticatedBackendFetch).toHaveBeenCalledWith(
      "/api/v1/video-analytics/last-watched",
      expect.objectContaining({ cache: "no-store" }),
    );
  });

  it("passes a 404 through", async () => {
    mocks.authenticatedBackendFetch.mockResolvedValue({
      ok: false, error: { status: 404, code: "BACKEND_ERROR_404", detail: "No video watch history found" },
    });
    const response = await getLastWatched();
    expect(response.status).toBe(404);
  });
});

describe("GET item progress", () => {
  it.each(["0", "-1", "1.5", "abc", "9007199254740993"])("rejects id %s without calling the backend", async (id) => {
    const response = await getProgress(new Request("http://localhost/x"), itemParams(id));
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ code: "INVALID_ID" });
    expect(mocks.authenticatedBackendFetch).not.toHaveBeenCalled();
  });

  it("proxies a valid id", async () => {
    await getProgress(new Request("http://localhost/x"), itemParams("42"));
    expect(mocks.authenticatedBackendFetch).toHaveBeenCalledWith(
      "/api/v1/video-analytics/my-progress/42",
      expect.objectContaining({ cache: "no-store" }),
    );
  });
});

describe("POST playback", () => {
  it("forwards an absent body as absent", async () => {
    await postPlayback(post(), itemParams("42"));
    const init = mocks.authenticatedBackendFetch.mock.calls[0][1];
    expect(mocks.authenticatedBackendFetch.mock.calls[0][0]).toBe("/api/v1/video-analytics/videos/42/playback");
    expect(init.method).toBe("POST");
    expect(init.body).toBeUndefined();
  });

  it("forwards only position_sec", async () => {
    await postPlayback(post(JSON.stringify({ position_sec: 872.5, extra: true })), itemParams("42"));
    expect(mocks.authenticatedBackendFetch.mock.calls[0][1].body).toBe(JSON.stringify({ position_sec: 872.5 }));
  });

  it.each(['{"position_sec":-1}', '{"position_sec":"5"}', "not json", "[]", '{"position_sec":null}'])(
    "rejects body %s",
    async (body) => {
      const response = await postPlayback(post(body), itemParams("42"));
      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({ code: "INVALID_PLAYBACK" });
      expect(mocks.authenticatedBackendFetch).not.toHaveBeenCalled();
    },
  );

  it("passes the watch-limit 403 detail through", async () => {
    mocks.authenticatedBackendFetch.mockResolvedValue({
      ok: false, error: { status: 403, code: "BACKEND_ERROR_403", detail: "Watch limit reached (2)" },
    });
    const response = await postPlayback(post(), itemParams("42"));
    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({ detail: "Watch limit reached (2)" });
  });
});

describe("POST heartbeat", () => {
  const valid = { sequence: 3, position_sec: 12.5, state: "playing" };

  it("forwards exactly sequence, position_sec, state", async () => {
    await postHeartbeat(post(JSON.stringify({ ...valid, junk: 1 })), sessionParams("105"));
    expect(mocks.authenticatedBackendFetch).toHaveBeenCalledWith(
      "/api/v1/video-analytics/sessions/105/heartbeat",
      expect.objectContaining({ method: "POST", body: JSON.stringify(valid), cache: "no-store" }),
    );
  });

  it.each([
    { ...valid, sequence: 0 },
    { ...valid, sequence: 1.5 },
    { ...valid, position_sec: -1 },
    { ...valid, position_sec: "1" },
    { ...valid, state: "buffering" },
    {},
  ])("rejects %o", async (body) => {
    const response = await postHeartbeat(post(JSON.stringify(body)), sessionParams("105"));
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ code: "INVALID_HEARTBEAT" });
  });

  it("passes 429 with Retry-After through", async () => {
    mocks.authenticatedBackendFetch.mockResolvedValue({
      ok: false, error: { status: 429, code: "BACKEND_ERROR_429", detail: "Heartbeat throttled", retryAfter: "15" },
    });
    const response = await postHeartbeat(post(JSON.stringify(valid)), sessionParams("105"));
    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("15");
  });
});

describe("POST end", () => {
  it("accepts a sendBeacon-style request without parsing its body", async () => {
    const response = await postEnd(post("garbage", { "Content-Type": "text/plain;charset=UTF-8" }), sessionParams("105"));
    expect(response.status).toBe(200);
    expect(mocks.authenticatedBackendFetch).toHaveBeenCalledWith(
      "/api/v1/video-analytics/sessions/105/end",
      expect.objectContaining({ method: "POST", cache: "no-store" }),
    );
    expect(mocks.authenticatedBackendFetch.mock.calls[0][1].body).toBeUndefined();
  });

  it("rejects a bad session id", async () => {
    const response = await postEnd(post(), sessionParams("x"));
    expect(response.status).toBe(400);
  });
});
