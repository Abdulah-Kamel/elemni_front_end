import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StudentApiError } from "@/src/lib/student-api/client";
import type { HeartbeatDto, HeartbeatRequestDto } from "@/src/lib/student-api/contract";
import { createHeartbeatController, HEARTBEAT_INTERVAL_MS } from "./heartbeat-controller";

const okData = (overrides: Partial<HeartbeatDto> = {}): HeartbeatDto => ({
  accepted: true, duplicate: false, completed: false, watched_percent: 1, last_position_sec: 1, ...overrides,
});

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

let sent: HeartbeatRequestDto[];
let replies: Array<ReturnType<typeof deferred<HeartbeatDto>>>;
const callbacks = {
  onProgress: vi.fn(), onCompleted: vi.fn(), onInterrupted: vi.fn(), onFatal: vi.fn(),
};

function make() {
  return createHeartbeatController({
    ...callbacks,
    send: (body) => {
      sent.push(body);
      const reply = deferred<HeartbeatDto>();
      replies.push(reply);
      return reply.promise;
    },
  });
}
const settle = () => vi.advanceTimersByTimeAsync(0);

beforeEach(() => {
  vi.useFakeTimers();
  sent = [];
  replies = [];
  Object.values(callbacks).forEach((fn) => fn.mockReset());
});
afterEach(() => vi.useRealTimers());

describe("heartbeat controller", () => {
  it("sends playing immediately, then every 20 s with increasing sequence", async () => {
    const c = make();
    c.updatePosition(10);
    c.playing();
    expect(sent).toEqual([{ sequence: 1, position_sec: 10, state: "playing" }]);
    replies[0].resolve(okData());
    await settle();
    c.updatePosition(30);
    await vi.advanceTimersByTimeAsync(HEARTBEAT_INTERVAL_MS - 1);
    expect(sent).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(sent[1]).toEqual({ sequence: 2, position_sec: 30, state: "playing" });
  });

  it("never ticks sooner than 16 s after a slow response", async () => {
    const c = make();
    c.playing();
    await vi.advanceTimersByTimeAsync(25_000);
    replies[0].resolve(okData());
    await settle();
    await vi.advanceTimersByTimeAsync(15_999);
    expect(sent).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(sent[1]).toMatchObject({ sequence: 2, state: "playing" });
  });

  it("sends ended immediately and stops ticking", async () => {
    const c = make();
    c.playing();
    replies[0].resolve(okData());
    await settle();
    c.updatePosition(600);
    c.ended();
    expect(sent[1]).toEqual({ sequence: 2, position_sec: 600, state: "ended" });
    replies[1].resolve(okData());
    await vi.advanceTimersByTimeAsync(HEARTBEAT_INTERVAL_MS * 3);
    expect(sent).toHaveLength(2);
  });

  it("sends pause immediately, stops ticking, and resumes immediately", async () => {
    const c = make();
    c.playing();
    replies[0].resolve(okData());
    await settle();
    c.updatePosition(42);
    c.paused();
    expect(sent[1]).toMatchObject({ sequence: 2, state: "paused", position_sec: 42 });
    replies[1].resolve(okData());
    await vi.advanceTimersByTimeAsync(HEARTBEAT_INTERVAL_MS * 3);
    expect(sent).toHaveLength(2);
    c.playing();
    expect(sent[2]).toMatchObject({ sequence: 3, state: "playing" }); // resume is immediate
  });

  it("queues pause behind an in-flight heartbeat with the latest position", async () => {
    const c = make();
    c.updatePosition(5);
    c.playing();
    c.updatePosition(9);
    c.paused();
    expect(sent).toHaveLength(1);
    c.updatePosition(11);
    replies[0].resolve(okData());
    await settle();
    expect(sent[1]).toEqual({ sequence: 2, position_sec: 11, state: "paused" });
  });

  it("collapses repeated queued states", async () => {
    const c = make();
    c.playing();
    c.paused();
    c.playing();
    c.paused();
    replies[0].resolve(okData());
    await settle();
    expect(sent.map((b) => b.state)).toEqual(["playing", "paused"]);
  });

  it("retries an ambiguous failure with the same sequence and body, then interrupts", async () => {
    const c = make();
    c.updatePosition(7);
    c.playing();
    replies[0].reject(new StudentApiError(503, "SERVICE_UNAVAILABLE"));
    await settle();
    c.updatePosition(99);
    await vi.advanceTimersByTimeAsync(1_000);
    expect(sent[1]).toEqual(sent[0]);
    replies[1].reject(new StudentApiError(503, "SERVICE_UNAVAILABLE"));
    await settle();
    await vi.advanceTimersByTimeAsync(3_000);
    expect(sent[2]).toEqual(sent[0]);
    replies[2].reject(new StudentApiError(503, "SERVICE_UNAVAILABLE"));
    await settle();
    expect(callbacks.onInterrupted).toHaveBeenCalledWith("network");
    expect(c.stopped).toBe(true);
  });

  it("holds after 429 for Retry-After and keeps a queued pause", async () => {
    const c = make();
    c.playing();
    replies[0].resolve(okData());
    await settle();
    await vi.advanceTimersByTimeAsync(HEARTBEAT_INTERVAL_MS);
    replies[1].reject(new StudentApiError(429, "BACKEND_ERROR_429", "Heartbeat throttled", 15));
    await settle();
    c.paused();
    await vi.advanceTimersByTimeAsync(14_999);
    expect(sent).toHaveLength(2);
    await vi.advanceTimersByTimeAsync(1);
    expect(sent[2]).toMatchObject({ state: "paused", sequence: 3 });
  });

  it("reports completion once and stops", async () => {
    const c = make();
    c.playing();
    replies[0].resolve(okData({ completed: true, watched_percent: 91 }));
    await settle();
    expect(callbacks.onCompleted).toHaveBeenCalledTimes(1);
    expect(c.stopped).toBe(true);
    c.paused();
    await vi.advanceTimersByTimeAsync(HEARTBEAT_INTERVAL_MS);
    expect(sent).toHaveLength(1);
  });

  it.each([
    ["Session is no longer active", "session-lost"],
    ["Attempt has expired", "attempt-ended"],
  ])("409 %s interrupts with %s", async (detail, reason) => {
    const c = make();
    c.playing();
    replies[0].reject(new StudentApiError(409, "BACKEND_ERROR_409", detail));
    await settle();
    expect(callbacks.onInterrupted).toHaveBeenCalledWith(reason);
    expect(c.stopped).toBe(true);
  });

  it("403 watch limit is fatal", async () => {
    const c = make();
    c.playing();
    replies[0].reject(new StudentApiError(403, "BACKEND_ERROR_403", "Watch limit reached (2)"));
    await settle();
    expect(callbacks.onFatal).toHaveBeenCalledWith("watch-limit");
  });

  it("flush resolves after the queue drains", async () => {
    const c = make();
    c.playing();
    c.paused();
    let flushed = false;
    void c.flush().then(() => { flushed = true; });
    await settle();
    expect(flushed).toBe(false);
    replies[0].resolve(okData());
    await settle();
    replies[1].resolve(okData());
    await settle();
    expect(flushed).toBe(true);
  });

  it("stop is idempotent and resolves flush", async () => {
    const c = make();
    c.playing();
    const flushing = c.flush();
    c.stop();
    c.stop();
    await expect(flushing).resolves.toBeUndefined();
  });

  it("ignores pause before any play", () => {
    const c = make();
    c.paused();
    expect(sent).toHaveLength(0);
  });
});
