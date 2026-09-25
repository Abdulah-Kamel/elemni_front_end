import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CourseTestsApiError } from "../client";
import type { AttemptQuestion, SaveAnswerInput } from "../types";
import { mergePending } from "./attempt-state";
import { AutosaveQueue, nextClientVersion, pendingStorageKey, readPending } from "./autosave-queue";

const ATTEMPT = 42;
const stored = () => JSON.parse(localStorage.getItem(pendingStorageKey(ATTEMPT)) ?? "null") as Record<string, SaveAnswerInput> | null;

function deferred() {
  let resolve!: () => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe("AutosaveQueue", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("persists every change to localStorage before sending, debounced per question", async () => {
    const save = vi.fn<(id: number, input: SaveAnswerInput) => Promise<void>>().mockResolvedValue(undefined);
    const queue = new AutosaveQueue({ attemptId: ATTEMPT, save });

    queue.enqueue(1, { response: "a", flagged: false });
    queue.enqueue(1, { response: "b", flagged: false });
    queue.enqueue(2, { response: "x", flagged: true });

    expect(stored()).toMatchObject({ 1: { response: "b" }, 2: { response: "x", flagged: true } });
    expect(save).not.toHaveBeenCalled();
    expect(queue.getSnapshot()).toEqual({ status: "saving", pendingCount: 2 });

    await vi.advanceTimersByTimeAsync(800);
    expect(save).toHaveBeenCalledTimes(2);
    expect(save).toHaveBeenCalledWith(1, expect.objectContaining({ response: "b", flagged: false }));
    expect(stored()).toBeNull();
    expect(queue.getSnapshot()).toEqual({ status: "saved", pendingCount: 0 });
  });

  it("keeps a failed answer on the device, shows the error state and flushes it on retry", async () => {
    const save = vi.fn<(id: number, input: SaveAnswerInput) => Promise<void>>().mockRejectedValueOnce(new CourseTestsApiError("network", 0)).mockResolvedValue(undefined);
    const queue = new AutosaveQueue({ attemptId: ATTEMPT, save });

    queue.enqueue(7, { response: ["a", "b"], flagged: false });
    await vi.advanceTimersByTimeAsync(800);
    expect(queue.getSnapshot().status).toBe("error");
    expect(stored()).toMatchObject({ 7: { response: ["a", "b"] } });

    await expect(queue.flush()).resolves.toBe(true);
    expect(save).toHaveBeenCalledTimes(2);
    expect(stored()).toBeNull();
    expect(queue.getSnapshot().status).toBe("saved");
    queue.dispose();
  });

  it("restores pending answers from a previous session and flushes them", async () => {
    const first = new AutosaveQueue({ attemptId: ATTEMPT, save: () => Promise.reject(new CourseTestsApiError("network", 0)) });
    first.enqueue(3, { response: "offline answer", flagged: true });
    first.dispose();

    const save = vi.fn<(id: number, input: SaveAnswerInput) => Promise<void>>().mockResolvedValue(undefined);
    const second = new AutosaveQueue({ attemptId: ATTEMPT, save, questionIds: [3] });
    expect(second.getPending()).toMatchObject({ 3: { response: "offline answer", flagged: true } });
    await second.flush();
    expect(save).toHaveBeenCalledWith(3, expect.objectContaining({ response: "offline answer", flagged: true }));
    expect(readPending(ATTEMPT)).toEqual({});
  });

  it("drops stored answers for questions that are not in this attempt", () => {
    localStorage.setItem(pendingStorageKey(ATTEMPT), JSON.stringify({ 99: { response: "x", flagged: false, client_version: 1 }, 3: { response: "y", flagged: false, client_version: 2 } }));
    const queue = new AutosaveQueue({ attemptId: ATTEMPT, save: vi.fn(), questionIds: [3] });
    expect(Object.keys(queue.getPending())).toEqual(["3"]);
    expect(Object.keys(stored() ?? {})).toEqual(["3"]);
  });

  it("does not drop a newer change that arrived while an older version was in flight", async () => {
    const inflight = deferred();
    const save = vi.fn<(id: number, input: SaveAnswerInput) => Promise<void>>().mockReturnValueOnce(inflight.promise).mockResolvedValue(undefined);
    const queue = new AutosaveQueue({ attemptId: ATTEMPT, save });

    queue.enqueue(5, { response: "old", flagged: false });
    await vi.advanceTimersByTimeAsync(800);
    queue.enqueue(5, { response: "new", flagged: false });
    inflight.resolve();
    await vi.advanceTimersByTimeAsync(0);

    // The acknowledged old version must not remove the newer pending one.
    expect(stored()).toMatchObject({ 5: { response: "new" } });
    await vi.advanceTimersByTimeAsync(800);
    expect(save).toHaveBeenLastCalledWith(5, expect.objectContaining({ response: "new" }));
    const [first, second] = save.mock.calls.map(([, input]) => input.client_version);
    expect(second).toBeGreaterThan(first);
    expect(stored()).toBeNull();
  });

  it("closes on 409 (deadline passed / already submitted) and reports it once", async () => {
    const onClosed = vi.fn();
    const queue = new AutosaveQueue({ attemptId: ATTEMPT, save: () => Promise.reject(new CourseTestsApiError("انتهى الوقت.", 409)), onClosed });
    queue.enqueue(1, { response: "a", flagged: false });
    queue.enqueue(2, { response: "b", flagged: false });
    await expect(queue.flush()).resolves.toBe(false);
    expect(onClosed).toHaveBeenCalledTimes(1);
    expect(queue.getSnapshot().status).toBe("closed");
    queue.enqueue(3, { response: "ignored", flagged: false });
    expect(queue.getPending()[3]).toBeUndefined();
  });

  it("retries automatically with backoff after a failure", async () => {
    const save = vi.fn<(id: number, input: SaveAnswerInput) => Promise<void>>().mockRejectedValueOnce(new CourseTestsApiError("network", 0)).mockResolvedValue(undefined);
    const queue = new AutosaveQueue({ attemptId: ATTEMPT, save, retryDelaysMs: [1_000] });
    queue.enqueue(1, { response: "a", flagged: false });
    await vi.advanceTimersByTimeAsync(800);
    expect(queue.getSnapshot().status).toBe("error");
    await vi.advanceTimersByTimeAsync(1_000);
    expect(save).toHaveBeenCalledTimes(2);
    expect(queue.getSnapshot().status).toBe("saved");
  });
});

describe("client versions and merging", () => {
  it("issues strictly increasing client versions even within the same millisecond", () => {
    const a = nextClientVersion(1_000);
    const b = nextClientVersion(1_000);
    const c = nextClientVersion(500);
    expect(b).toBeGreaterThan(a);
    expect(c).toBeGreaterThan(b);
  });

  const question = (id: number, extra: Partial<AttemptQuestion> & { client_version?: number } = {}): AttemptQuestion => ({
    id,
    type: "single",
    text: "q",
    code_snippet: null,
    image_url: null,
    points: 1,
    options: [],
    response: "server",
    flagged: false,
    client_version: 0,
    ...extra,
  });

  it("puts unsent local answers over the server response", () => {
    const merged = mergePending([question(1), question(2)], { 1: { response: "local", flagged: true, client_version: 10 } });
    expect(merged[1]).toEqual({ response: "local", flagged: true });
    expect(merged[2]).toEqual({ response: "server", flagged: false });
  });

  it("ignores a stale local answer when the server reports a newer client_version", () => {
    const merged = mergePending([question(1, { client_version: 20 })], { 1: { response: "stale", flagged: false, client_version: 10 } });
    expect(merged[1].response).toBe("server");
  });
});
