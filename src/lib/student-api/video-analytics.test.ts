import { afterEach, describe, expect, it, vi } from "vitest";
import { endSession, requestPlayback, sendHeartbeat } from "./video-analytics";

const ok = (data: unknown) => new Response(JSON.stringify(data), { status: 200 });
afterEach(() => vi.unstubAllGlobals());

describe("video analytics transport", () => {
  it("omits the playback body when no position is given", async () => {
    const fetchMock = vi.fn(async () => ok({}));
    vi.stubGlobal("fetch", fetchMock);
    await requestPlayback(42);
    expect(fetchMock).toHaveBeenCalledWith("/api/student/video-analytics/items/42/playback", expect.objectContaining({ method: "POST" }));
    expect((fetchMock.mock.calls[0] as unknown[])[1]).not.toHaveProperty("body");
  });

  it("sends position 0 explicitly", async () => {
    const fetchMock = vi.fn(async () => ok({}));
    vi.stubGlobal("fetch", fetchMock);
    await requestPlayback(42, 0);
    expect((fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].body).toBe('{"position_sec":0}');
  });

  it("posts heartbeats as JSON", async () => {
    const fetchMock = vi.fn(async () => ok({ accepted: true }));
    vi.stubGlobal("fetch", fetchMock);
    await sendHeartbeat(105, { sequence: 1, position_sec: 3, state: "playing" });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/student/video-analytics/sessions/105/heartbeat",
      expect.objectContaining({ method: "POST", body: '{"sequence":1,"position_sec":3,"state":"playing"}' }),
    );
  });

  it("uses sendBeacon when asked and it enqueues", async () => {
    const beacon = vi.fn(() => true);
    const fetchMock = vi.fn();
    vi.stubGlobal("navigator", { sendBeacon: beacon });
    vi.stubGlobal("fetch", fetchMock);
    await endSession(105, { beacon: true });
    expect(beacon).toHaveBeenCalledWith("/api/student/video-analytics/sessions/105/end");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("falls back to keepalive fetch when sendBeacon refuses", async () => {
    vi.stubGlobal("navigator", { sendBeacon: vi.fn(() => false) });
    const fetchMock = vi.fn(async () => ok({}));
    vi.stubGlobal("fetch", fetchMock);
    await endSession(105, { beacon: true });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/student/video-analytics/sessions/105/end",
      expect.objectContaining({ method: "POST", keepalive: true }),
    );
  });

  it("never throws from endSession", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("offline"); }));
    await expect(endSession(105)).resolves.toBeUndefined();
  });
});
