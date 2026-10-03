import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { StudentApiError } from "@/src/lib/student-api/client";

const transport = vi.hoisted(() => ({
  requestPlayback: vi.fn(),
  sendHeartbeat: vi.fn(),
  endSession: vi.fn(async () => undefined),
}));
vi.mock("@/src/lib/student-api/video-analytics", () => transport);

type Handler = (value?: unknown) => void;
const fakeBridge = vi.hoisted(() => ({
  handlers: new Map<string, Set<Handler>>(),
  readyResolve: null as null | (() => void),
  readyReject: null as null | ((e: Error) => void),
  currentTime: 0,
  paused: true,
  setCurrentTime: vi.fn(),
  destroy: vi.fn(),
}));
vi.mock("./player-bridge", () => ({
  createPlayerBridge: vi.fn(() => {
    fakeBridge.handlers = new Map();
    const ready = new Promise<void>((resolve, reject) => {
      fakeBridge.readyResolve = resolve;
      fakeBridge.readyReject = reject;
    });
    return {
      ready,
      on: (event: string, cb: Handler) => {
        const set = fakeBridge.handlers.get(event) ?? new Set();
        set.add(cb);
        fakeBridge.handlers.set(event, set);
        return () => set.delete(cb);
      },
      setCurrentTime: fakeBridge.setCurrentTime,
      getCurrentTime: async () => fakeBridge.currentTime,
      getPaused: async () => fakeBridge.paused,
      destroy: fakeBridge.destroy,
    };
  }),
}));

import { confirmSeek, useVideoSession } from "./use-video-session";

const emit = (event: string, value?: unknown) => fakeBridge.handlers.get(event)?.forEach((cb) => cb(value));
const playback = (sessionId = 105) => ({
  embed_url: "https://iframe.mediadelivery.net/embed/1/abc?token=t&expires=1",
  attempt_id: 10, session_id: sessionId, attempt_status: "active", expires_in: 3600,
  allowance_remaining: 1, allowance_source: "base", completed_attempts: 0,
});
const heartbeatOk = { accepted: true, duplicate: false, completed: false, watched_percent: 10, last_position_sec: 30 };

function setup() {
  const client = new QueryClient();
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  const onUnauthenticated = vi.fn();
  const hook = renderHook(() => useVideoSession({ itemId: 42, courseId: 7, durationSec: 100, initiallyCompleted: false, onUnauthenticated }), { wrapper });
  const attachIframe = () => act(() => hook.result.current.iframeRef(document.createElement("iframe")));
  return { ...hook, attachIframe, onUnauthenticated };
}

async function startAndPlay(view: ReturnType<typeof setup>, position = 30) {
  transport.requestPlayback.mockResolvedValueOnce(playback());
  transport.sendHeartbeat.mockResolvedValue(heartbeatOk);
  await act(async () => view.result.current.start(position));
  view.attachIframe();
  fakeBridge.paused = false;
  await act(async () => { fakeBridge.readyResolve?.(); });
  await act(async () => { await vi.advanceTimersByTimeAsync(600); });
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: false });
  Object.values(transport).forEach((fn) => fn.mockReset());
  transport.endSession.mockResolvedValue(undefined);
  fakeBridge.currentTime = 0;
  fakeBridge.paused = true;
  fakeBridge.setCurrentTime.mockReset();
  fakeBridge.setCurrentTime.mockImplementation((s: number) => { fakeBridge.currentTime = s; });
  fakeBridge.destroy.mockReset();
});
afterEach(() => vi.useRealTimers());

describe("useVideoSession", () => {
  it("ignores a double start while starting", async () => {
    const view = setup();
    transport.requestPlayback.mockReturnValue(new Promise(() => undefined));
    act(() => { view.result.current.start(0); view.result.current.start(0); });
    expect(transport.requestPlayback).toHaveBeenCalledTimes(1);
    expect(view.result.current.status).toEqual({ kind: "starting" });
  });

  it("seeks to the resume position, confirms it, then sends the first playing heartbeat", async () => {
    const view = setup();
    await startAndPlay(view, 30);
    expect(fakeBridge.setCurrentTime).toHaveBeenCalledWith(30);
    expect(view.result.current.status).toEqual({ kind: "playing" });
    expect(transport.sendHeartbeat).toHaveBeenCalledWith(105, { sequence: 1, position_sec: 30, state: "playing" });
  });

  it("ends a superseded playback response's session", async () => {
    const view = setup();
    let resolveFirst!: (value: unknown) => void;
    transport.requestPlayback.mockReturnValueOnce(new Promise((resolve) => { resolveFirst = resolve; }));
    act(() => view.result.current.start(0));
    view.unmount();
    await act(async () => { resolveFirst(playback(999)); });
    expect(transport.endSession).toHaveBeenCalledWith(999);
  });

  it("flushes a paused heartbeat before ending the session on unmount", async () => {
    const view = setup();
    await startAndPlay(view, 30);
    transport.sendHeartbeat.mockClear();
    fakeBridge.currentTime = 44;
    act(() => emit("timeupdate", { seconds: 44, duration: 100 }));
    view.unmount();
    await act(async () => { await vi.advanceTimersByTimeAsync(10); });
    expect(transport.sendHeartbeat).toHaveBeenCalledWith(105, expect.objectContaining({ state: "paused", position_sec: 44 }));
    const heartbeatOrder = transport.sendHeartbeat.mock.invocationCallOrder.at(-1)!;
    const endOrder = transport.endSession.mock.invocationCallOrder.at(-1)!;
    expect(endOrder).toBeGreaterThan(heartbeatOrder);
    expect(transport.endSession).toHaveBeenCalledWith(105, { beacon: false });
  });

  it("does not auto-recover on session loss", async () => {
    const view = setup();
    await startAndPlay(view, 30);
    transport.sendHeartbeat.mockRejectedValueOnce(new StudentApiError(409, "BACKEND_ERROR_409", "Session is no longer active"));
    act(() => emit("pause"));
    await act(async () => { await vi.advanceTimersByTimeAsync(10); });
    expect(view.result.current.status).toEqual({ kind: "interrupted", reason: "session-lost" });
    await act(async () => { await vi.advanceTimersByTimeAsync(60_000); });
    expect(transport.requestPlayback).toHaveBeenCalledTimes(1);
  });

  it("marks completion and keeps the status playing", async () => {
    const view = setup();
    await startAndPlay(view, 0);
    expect(transport.sendHeartbeat).toHaveBeenCalled();
    transport.sendHeartbeat.mockResolvedValueOnce({ ...heartbeatOk, completed: true });
    act(() => emit("pause"));
    await act(async () => { await vi.advanceTimersByTimeAsync(10); });
    expect(view.result.current.isCompleted).toBe(true);
    expect(view.result.current.status.kind).toBe("playing");
  });

  it("ends via sendBeacon on pagehide", async () => {
    const view = setup();
    await startAndPlay(view, 0);
    act(() => { window.dispatchEvent(new Event("pagehide")); });
    await act(async () => { await vi.advanceTimersByTimeAsync(10); });
    expect(transport.endSession).toHaveBeenCalledWith(105, { beacon: true });
  });

  it("maps a watch-limit playback error", async () => {
    const view = setup();
    transport.requestPlayback.mockRejectedValueOnce(new StudentApiError(403, "BACKEND_ERROR_403", "Watch limit reached (2)"));
    await act(async () => view.result.current.start(0));
    expect(view.result.current.status).toEqual({ kind: "error", reason: "watch-limit" });
  });

  it("reports player-timeout when the player never becomes ready", async () => {
    const view = setup();
    transport.requestPlayback.mockResolvedValueOnce(playback());
    await act(async () => view.result.current.start(0));
    view.attachIframe();
    await act(async () => { fakeBridge.readyReject?.(new Error("PLAYER_READY_TIMEOUT")); });
    expect(view.result.current.status).toEqual({ kind: "error", reason: "player-timeout" });
    expect(transport.endSession).toHaveBeenCalledWith(105, { beacon: false });
  });

  it("ends the session when the player reports an error", async () => {
    const view = setup();
    await startAndPlay(view);
    act(() => emit("timeupdate", { seconds: 44, duration: 100 }));
    transport.sendHeartbeat.mockClear();
    act(() => emit("error"));
    await act(async () => { await vi.advanceTimersByTimeAsync(10); });
    expect(view.result.current.status).toEqual({ kind: "error", reason: "player-error" });
    expect(transport.sendHeartbeat).toHaveBeenCalledWith(105, { sequence: 2, position_sec: 44, state: "paused" });
    expect(transport.endSession).toHaveBeenCalledWith(105, { beacon: false });
    const heartbeatOrder = transport.sendHeartbeat.mock.invocationCallOrder.at(-1)!;
    const endOrder = transport.endSession.mock.invocationCallOrder.at(-1)!;
    expect(endOrder).toBeGreaterThan(heartbeatOrder);
    const callsAfterFlush = transport.sendHeartbeat.mock.calls.length;
    await act(async () => { await vi.advanceTimersByTimeAsync(60_000); });
    expect(transport.sendHeartbeat).toHaveBeenCalledTimes(callsAfterFlush);
  });

  it("ends the session when the seek cannot be confirmed", async () => {
    const view = setup();
    fakeBridge.setCurrentTime.mockImplementation(() => undefined);
    transport.requestPlayback.mockResolvedValueOnce(playback());
    await act(async () => view.result.current.start(30));
    view.attachIframe();
    await act(async () => { fakeBridge.readyResolve?.(); });
    await act(async () => { await vi.advanceTimersByTimeAsync(6_000); });
    expect(fakeBridge.setCurrentTime).toHaveBeenCalledWith(30);
    expect(view.result.current.status).toEqual({ kind: "error", reason: "player-timeout" });
    expect(transport.endSession).toHaveBeenCalledWith(105, { beacon: false });
  });

  it("calls onUnauthenticated on 401", async () => {
    const view = setup();
    transport.requestPlayback.mockRejectedValueOnce(new StudentApiError(401, "SESSION_EXPIRED"));
    await act(async () => view.result.current.start(0));
    expect(view.onUnauthenticated).toHaveBeenCalled();
  });
});

describe("confirmSeek", () => {
  it("resolves true within tolerance and false on timeout", async () => {
    vi.useFakeTimers();
    let current = 0;
    const bridge = { getCurrentTime: async () => current };
    const ok = confirmSeek(bridge, 30, 5_000);
    current = 29;
    await vi.advanceTimersByTimeAsync(600);
    await expect(ok).resolves.toBe(true);

    current = 0;
    const late = confirmSeek(bridge, 30, 5_000);
    await vi.advanceTimersByTimeAsync(5_500);
    await expect(late).resolves.toBe(false);
  });
});
