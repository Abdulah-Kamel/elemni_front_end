// Minimal client for the open player.js postMessage protocol implemented by
// Bunny Stream's embed (https://bunny.net/docs/stream/playback-api).
const CONTEXT = "player.js";
const VERSION = "0.0.11";
const EVENTS = ["play", "pause", "timeupdate", "seeked", "ended", "error"] as const;

export interface TimeUpdate { seconds: number; duration: number }
export type PlayerEvent = "play" | "pause" | "seeked" | "ended" | "error";

export interface PlayerBridge {
  ready: Promise<void>;
  on(event: "timeupdate", cb: (update: TimeUpdate) => void): () => void;
  on(event: PlayerEvent, cb: (value: unknown) => void): () => void;
  setCurrentTime(seconds: number): void;
  getCurrentTime(): Promise<number>;
  getPaused(): Promise<boolean>;
  destroy(): void;
}

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

export function createPlayerBridge(
  iframe: HTMLIFrameElement,
  embedUrl: string,
  { readyTimeoutMs = 10_000, probeIntervalMs = 500, methodTimeoutMs = 3_000 }: {
    readyTimeoutMs?: number; probeIntervalMs?: number; methodTimeoutMs?: number;
  } = {},
): PlayerBridge {
  const origin = new URL(embedUrl).origin;
  let nextId = 1;
  const newId = () => `elemni-${nextId++}`;
  const readyListenerId = newId();
  const eventListenerIds = new Map<string, string>();
  const callbacks = new Map<string, Set<(value: unknown) => void>>();
  const pending = new Map<string, {
    resolve: (value: unknown) => void;
    reject: (error: Error) => void;
    timer: ReturnType<typeof setTimeout>;
  }>();
  let destroyed = false;
  let isReady = false;

  let resolveReady!: () => void;
  let rejectReady!: (error: Error) => void;
  const ready = new Promise<void>((resolve, reject) => {
    resolveReady = resolve;
    rejectReady = reject;
  });
  ready.catch(() => undefined);

  const post = (message: Record<string, unknown>) => {
    if (destroyed) return;
    iframe.contentWindow?.postMessage(JSON.stringify({ context: CONTEXT, version: VERSION, ...message }), origin);
  };

  const parse = (data: unknown): Record<string, unknown> | null => {
    let value = data;
    if (typeof value === "string") {
      try {
        value = JSON.parse(value);
      } catch {
        return null;
      }
    }
    if (!value || typeof value !== "object") return null;
    const record = value as Record<string, unknown>;
    return record.context === CONTEXT ? record : null;
  };

  const emit = (event: string, value: unknown) => {
    callbacks.get(event)?.forEach((cb) => cb(value));
  };

  const probe = () => post({ method: "addEventListener", value: "ready", listener: readyListenerId });
  const probeTimer = setInterval(probe, probeIntervalMs);
  const deadline = setTimeout(() => {
    if (isReady) return;
    stopProbing();
    rejectReady(new Error("PLAYER_READY_TIMEOUT"));
  }, readyTimeoutMs);

  function stopProbing() {
    clearInterval(probeTimer);
    clearTimeout(deadline);
    iframe.removeEventListener("load", probe);
  }

  function handleReady() {
    if (isReady) return;
    isReady = true;
    stopProbing();
    for (const event of EVENTS) {
      const id = newId();
      eventListenerIds.set(event, id);
      post({ method: "addEventListener", value: event, listener: id });
    }
    resolveReady();
  }

  const onMessage = (message: MessageEvent) => {
    if (destroyed || message.origin !== origin || message.source !== iframe.contentWindow) return;
    const data = parse(message.data);
    if (!data || typeof data.event !== "string") return;
    const listener = typeof data.listener === "string" ? data.listener : undefined;
    const waiter = listener ? pending.get(listener) : undefined;
    if (listener && waiter) {
      pending.delete(listener);
      clearTimeout(waiter.timer);
      waiter.resolve(data.value);
      return;
    }
    if (data.event === "ready") {
      handleReady();
      return;
    }
    if (data.event === "timeupdate") {
      const value = data.value as { seconds?: unknown; duration?: unknown } | null;
      if (!value || !isFiniteNumber(value.seconds) || !isFiniteNumber(value.duration)) return;
      emit("timeupdate", { seconds: value.seconds, duration: value.duration });
      return;
    }
    if ((EVENTS as readonly string[]).includes(data.event)) emit(data.event, data.value);
  };

  // Listen before the first probe so an early ready reply is never missed.
  window.addEventListener("message", onMessage);
  iframe.addEventListener("load", probe);
  probe();

  function call(method: string): Promise<unknown> {
    return new Promise((resolve, reject) => {
      if (destroyed) {
        reject(new Error("PLAYER_DESTROYED"));
        return;
      }
      const id = newId();
      const timer = setTimeout(() => {
        pending.delete(id);
        reject(new Error("PLAYER_METHOD_TIMEOUT"));
      }, methodTimeoutMs);
      pending.set(id, { resolve, reject, timer });
      post({ method, listener: id });
    });
  }

  return {
    ready,
    on(event: string, cb: (value: never) => void) {
      const set = callbacks.get(event) ?? new Set();
      set.add(cb as (value: unknown) => void);
      callbacks.set(event, set);
      return () => {
        set.delete(cb as (value: unknown) => void);
      };
    },
    setCurrentTime(seconds: number) {
      if (isFiniteNumber(seconds) && seconds >= 0) post({ method: "setCurrentTime", value: seconds });
    },
    async getCurrentTime() {
      const value = await call("getCurrentTime");
      if (!isFiniteNumber(value)) throw new Error("PLAYER_BAD_VALUE");
      return value;
    },
    async getPaused() {
      return Boolean(await call("getPaused"));
    },
    destroy() {
      if (destroyed) return;
      for (const [event, id] of eventListenerIds) post({ method: "removeEventListener", value: event, listener: id });
      destroyed = true;
      stopProbing();
      window.removeEventListener("message", onMessage);
      for (const waiter of pending.values()) {
        clearTimeout(waiter.timer);
        waiter.reject(new Error("PLAYER_DESTROYED"));
      }
      pending.clear();
      callbacks.clear();
      if (!isReady) rejectReady(new Error("PLAYER_DESTROYED"));
    },
  } as PlayerBridge;
}
