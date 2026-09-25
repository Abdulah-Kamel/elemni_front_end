// Autosave queue for an in-progress attempt. Every change is written to
// localStorage *before* it is sent, sent per question after a debounce, and
// removed from storage only once the server acknowledged that exact version.
// Framework-free so it can be unit tested with fake timers.
import { CourseTestsApiError } from "../client";
import type { AnswerResponse, SaveAnswerInput } from "../types";

export type PendingAnswer = SaveAnswerInput;
export type PendingAnswers = Record<string, PendingAnswer>;
export type AutosaveStatus = "saved" | "saving" | "retrying" | "error" | "closed";
export type AutosaveSnapshot = { status: AutosaveStatus; pendingCount: number };

export const pendingStorageKey = (attemptId: number) => `course-test:${attemptId}:pending`;

let lastClientVersion = 0;

/** Monotonically increasing, Date.now()-based so versions keep growing across reloads. */
export function nextClientVersion(now = Date.now()) {
  lastClientVersion = Math.max(now, lastClientVersion + 1);
  return lastClientVersion;
}

function observeClientVersion(version: number) {
  if (version > lastClientVersion) lastClientVersion = version;
}

function browserStorage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

function isPendingAnswer(value: unknown): value is PendingAnswer {
  if (!value || typeof value !== "object") return false;
  const entry = value as Partial<PendingAnswer>;
  return typeof entry.client_version === "number" && typeof entry.flagged === "boolean" && "response" in entry;
}

export function readPending(attemptId: number, storage: Storage | null = browserStorage()): PendingAnswers {
  if (!storage) return {};
  try {
    const parsed = JSON.parse(storage.getItem(pendingStorageKey(attemptId)) ?? "null") as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    return Object.fromEntries(Object.entries(parsed).filter(([, value]) => isPendingAnswer(value))) as PendingAnswers;
  } catch {
    return {};
  }
}

export function writePending(attemptId: number, pending: PendingAnswers, storage: Storage | null = browserStorage()) {
  if (!storage) return;
  try {
    if (Object.keys(pending).length) storage.setItem(pendingStorageKey(attemptId), JSON.stringify(pending));
    else storage.removeItem(pendingStorageKey(attemptId));
  } catch {
    /* storage full or blocked: the in-memory queue still retries */
  }
}

export type AutosaveQueueOptions = {
  attemptId: number;
  save: (questionId: number, input: SaveAnswerInput) => Promise<void>;
  storage?: Storage | null;
  /** Unknown ids found in storage (e.g. from another attempt shape) are dropped. */
  questionIds?: number[];
  debounceMs?: number;
  /** Automatic retry backoff after a failed save; the last value repeats. */
  retryDelaysMs?: number[];
  /** The server closed the attempt (HTTP 409: submitted or past the deadline). */
  onClosed?: (error: CourseTestsApiError) => void;
};

export class AutosaveQueue {
  private readonly attemptId: number;
  private readonly save: AutosaveQueueOptions["save"];
  private readonly storage: Storage | null;
  private readonly debounceMs: number;
  private readonly retryDelaysMs: number[];
  private onClosed?: AutosaveQueueOptions["onClosed"];
  private pending: PendingAnswers;
  private readonly timers = new Map<string, ReturnType<typeof setTimeout>>();
  private readonly inflight = new Map<string, Promise<boolean>>();
  private readonly failed = new Set<string>();
  private readonly listeners = new Set<() => void>();
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private retryCount = 0;
  private closed = false;
  private snapshot: AutosaveSnapshot;

  constructor(options: AutosaveQueueOptions) {
    this.attemptId = options.attemptId;
    this.save = options.save;
    this.storage = options.storage === undefined ? browserStorage() : options.storage;
    this.debounceMs = options.debounceMs ?? 800;
    this.retryDelaysMs = options.retryDelaysMs ?? [5_000, 10_000, 20_000, 30_000];
    this.onClosed = options.onClosed;
    const stored = readPending(this.attemptId, this.storage);
    const known = options.questionIds ? new Set(options.questionIds.map(String)) : null;
    this.pending = known ? Object.fromEntries(Object.entries(stored).filter(([id]) => known.has(id))) : stored;
    for (const entry of Object.values(this.pending)) observeClientVersion(entry.client_version);
    if (known && Object.keys(this.pending).length !== Object.keys(stored).length) this.persist();
    this.snapshot = this.compute();
  }

  // --- external store API (useSyncExternalStore) ---
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getSnapshot = () => this.snapshot;

  /** Unsent answers, keyed by question id. */
  getPending(): PendingAnswers {
    return { ...this.pending };
  }

  /** Replace the 409 handler (kept current by the React hook). */
  setClosedHandler(handler: AutosaveQueueOptions["onClosed"]) {
    this.onClosed = handler;
  }

  get isClosed() {
    return this.closed;
  }

  /** Record a change: persisted locally right away, sent after the debounce. */
  enqueue(questionId: number, answer: { response: AnswerResponse; flagged: boolean }) {
    if (this.closed) return;
    const key = String(questionId);
    this.pending[key] = { response: answer.response, flagged: answer.flagged, client_version: nextClientVersion() };
    this.persist();
    this.clearTimer(key);
    this.timers.set(key, setTimeout(() => void this.send(key), this.debounceMs));
    this.emit();
  }

  /** Send everything now. Resolves true when nothing is left unsent. */
  async flush(): Promise<boolean> {
    for (const key of [...this.timers.keys()]) this.clearTimer(key);
    this.clearRetry();
    for (let round = 0; round < 3; round++) {
      if (this.closed) return false;
      const keys = Object.keys(this.pending);
      if (!keys.length) return true;
      const results = await Promise.all(keys.map((key) => this.send(key)));
      if (results.some((ok) => !ok)) return false;
    }
    return !this.closed && Object.keys(this.pending).length === 0;
  }

  /** Stop timers (pending answers stay in storage for the next load). */
  dispose() {
    for (const key of [...this.timers.keys()]) this.clearTimer(key);
    this.clearRetry();
  }

  /** Forget every unsent answer (the attempt is over). */
  clear() {
    this.dispose();
    this.pending = {};
    this.failed.clear();
    this.persist();
    this.emit();
  }

  private async send(key: string): Promise<boolean> {
    this.clearTimer(key);
    const running = this.inflight.get(key);
    if (running) {
      await running;
      return this.send(key);
    }
    if (this.closed) return false;
    const entry = this.pending[key];
    if (!entry) return true;

    const request = this.save(Number(key), entry).then(
      () => {
        // Only drop it if no newer change arrived while this one was in flight.
        if (this.pending[key]?.client_version === entry.client_version) {
          delete this.pending[key];
          this.persist();
        }
        this.failed.delete(key);
        if (!this.failed.size) this.retryCount = 0;
        return true;
      },
      (error: unknown) => {
        this.handleError(key, error);
        return false;
      },
    );
    this.inflight.set(key, request);
    this.emit();
    const ok = await request;
    this.inflight.delete(key);
    this.emit();
    return ok;
  }

  private handleError(key: string, error: unknown) {
    if (error instanceof CourseTestsApiError && error.status === 409) {
      if (this.closed) return;
      this.closed = true;
      this.dispose();
      this.onClosed?.(error);
      return;
    }
    this.failed.add(key);
    if (this.retryTimer) return;
    const delay = this.retryDelaysMs[Math.min(this.retryCount, this.retryDelaysMs.length - 1)];
    this.retryCount++;
    this.retryTimer = setTimeout(() => {
      this.retryTimer = null;
      void this.flush();
    }, delay);
  }

  private clearTimer(key: string) {
    const timer = this.timers.get(key);
    if (timer) clearTimeout(timer);
    this.timers.delete(key);
  }

  private clearRetry() {
    if (this.retryTimer) clearTimeout(this.retryTimer);
    this.retryTimer = null;
  }

  private persist() {
    writePending(this.attemptId, this.pending, this.storage);
  }

  private compute(): AutosaveSnapshot {
    const pendingCount = Object.keys(this.pending).length;
    let status: AutosaveStatus = "saved";
    if (this.closed) status = "closed";
    else if (this.inflight.size) status = this.failed.size ? "retrying" : "saving";
    else if (this.failed.size && pendingCount) status = "error";
    else if (pendingCount) status = "saving";
    return { status, pendingCount };
  }

  private emit() {
    const next = this.compute();
    if (next.status === this.snapshot.status && next.pendingCount === this.snapshot.pendingCount) return;
    this.snapshot = next;
    for (const listener of this.listeners) listener();
  }
}
