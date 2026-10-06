import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createPlayerBridge } from "./player-bridge";

const EMBED = "https://iframe.mediadelivery.net/embed/1/abc?token=t&expires=1";
const ORIGIN = "https://iframe.mediadelivery.net";

let iframe: HTMLIFrameElement;
let posted: Record<string, unknown>[];

function receive(data: unknown, { origin = ORIGIN, source }: { origin?: string; source?: unknown } = {}) {
  window.dispatchEvent(new MessageEvent("message", {
    data: typeof data === "string" ? data : JSON.stringify(data),
    origin,
    source: (source ?? iframe.contentWindow) as MessageEventSource,
  }));
}
const fromPlayer = (event: string, value?: unknown, listener?: string) =>
  ({ context: "player.js", version: "0.0.11", event, value, listener });

beforeEach(() => {
  vi.useFakeTimers();
  iframe = document.createElement("iframe");
  document.body.appendChild(iframe);
  posted = [];
  vi.spyOn(iframe.contentWindow as Window, "postMessage").mockImplementation((message: unknown, targetOrigin?: unknown) => {
    expect(targetOrigin).toBe(ORIGIN);
    posted.push(JSON.parse(message as string));
  });
});

afterEach(() => {
  iframe.remove();
  vi.useRealTimers();
});

describe("createPlayerBridge", () => {
  it("probes ready with one listener id until ready, then subscribes to events", async () => {
    const bridge = createPlayerBridge(iframe, EMBED);
    iframe.dispatchEvent(new Event("load"));
    vi.advanceTimersByTime(1_000);
    const probes = posted.filter((m) => m.method === "addEventListener" && m.value === "ready");
    expect(probes.length).toBeGreaterThanOrEqual(2);
    expect(new Set(probes.map((m) => m.listener)).size).toBe(1);

    receive(fromPlayer("ready", {}, probes[0].listener as string));
    await expect(bridge.ready).resolves.toBeUndefined();
    const subscribed = posted.filter((m) => m.method === "addEventListener" && m.value !== "ready").map((m) => m.value);
    expect(subscribed.sort()).toEqual(["ended", "error", "pause", "play", "seeked", "timeupdate"]);

    const before = posted.length;
    receive(fromPlayer("ready", {}, probes[0].listener as string));
    vi.advanceTimersByTime(2_000);
    expect(posted.length).toBe(before); // ready handled once, probing stopped
  });

  it("ignores messages from other origins or sources", async () => {
    const bridge = createPlayerBridge(iframe, EMBED, { readyTimeoutMs: 1_000 });
    receive(fromPlayer("ready"), { origin: "https://evil.example" });
    receive(fromPlayer("ready"), { source: window });
    vi.advanceTimersByTime(1_000);
    await expect(bridge.ready).rejects.toThrow("PLAYER_READY_TIMEOUT");
  });

  it("times out even if the iframe never fires load", async () => {
    const bridge = createPlayerBridge(iframe, EMBED, { readyTimeoutMs: 10_000 });
    vi.advanceTimersByTime(10_000);
    await expect(bridge.ready).rejects.toThrow("PLAYER_READY_TIMEOUT");
  });

  it("accepts object payloads and validates timeupdate numbers", async () => {
    const bridge = createPlayerBridge(iframe, EMBED);
    receive(fromPlayer("ready"));
    await bridge.ready;
    const updates: unknown[] = [];
    bridge.on("timeupdate", (u) => updates.push(u));
    window.dispatchEvent(new MessageEvent("message", {
      data: fromPlayer("timeupdate", { seconds: 12.5, duration: 100 }),
      origin: ORIGIN,
      source: iframe.contentWindow as MessageEventSource,
    }));
    receive(fromPlayer("timeupdate", { seconds: "x", duration: 100 }));
    receive(fromPlayer("timeupdate", { seconds: Infinity, duration: 100 }));
    expect(updates).toEqual([{ seconds: 12.5, duration: 100 }]);
  });

  it("emits play/pause/ended/seeked/error to subscribers and supports unsubscribe", async () => {
    const bridge = createPlayerBridge(iframe, EMBED);
    receive(fromPlayer("ready"));
    await bridge.ready;
    const seen: string[] = [];
    const off = bridge.on("play", () => seen.push("play"));
    bridge.on("ended", () => seen.push("ended"));
    receive(fromPlayer("play"));
    off();
    receive(fromPlayer("play"));
    receive(fromPlayer("ended"));
    expect(seen).toEqual(["play", "ended"]);
  });

  it("resolves getters by listener id and times them out", async () => {
    const bridge = createPlayerBridge(iframe, EMBED);
    receive(fromPlayer("ready"));
    await bridge.ready;
    const time = bridge.getCurrentTime();
    const request = posted.at(-1)!;
    expect(request.method).toBe("getCurrentTime");
    receive(fromPlayer("getCurrentTime", 31.2, request.listener as string));
    await expect(time).resolves.toBe(31.2);

    const paused = bridge.getPaused();
    vi.advanceTimersByTime(3_000);
    await expect(paused).rejects.toThrow("PLAYER_METHOD_TIMEOUT");
  });

  it("posts setCurrentTime", async () => {
    const bridge = createPlayerBridge(iframe, EMBED);
    receive(fromPlayer("ready"));
    await bridge.ready;
    bridge.setCurrentTime(872);
    expect(posted.at(-1)).toMatchObject({ context: "player.js", method: "setCurrentTime", value: 872 });
  });

  it("destroy unsubscribes, rejects pending work and ignores later messages", async () => {
    const bridge = createPlayerBridge(iframe, EMBED);
    receive(fromPlayer("ready"));
    await bridge.ready;
    const seen: string[] = [];
    bridge.on("play", () => seen.push("play"));
    const pending = bridge.getCurrentTime();
    bridge.destroy();
    expect(posted.filter((m) => m.method === "removeEventListener").length).toBe(6);
    await expect(pending).rejects.toThrow("PLAYER_DESTROYED");
    receive(fromPlayer("play"));
    expect(seen).toEqual([]);
  });

  it("rejects ready when destroyed before ready", async () => {
    const bridge = createPlayerBridge(iframe, EMBED);
    bridge.destroy();
    await expect(bridge.ready).rejects.toThrow("PLAYER_DESTROYED");
  });
});
