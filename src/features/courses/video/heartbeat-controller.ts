import { StudentApiError } from "@/src/lib/student-api/client";
import type { HeartbeatDto, HeartbeatRequestDto, HeartbeatState } from "@/src/lib/student-api/contract";
import { classifyVideoError, isAmbiguousFailure, type VideoErrorKind } from "@/src/lib/student-api/video-errors";

// Backend rejects playing→playing heartbeats < 15 s apart and caps credit per
// heartbeat at 60 s of server-measured elapsed time.
export const HEARTBEAT_INTERVAL_MS = 20_000;
// Wait 16 s after the response to safely exceed the server's 15 s receipt-based throttle.
const MIN_PLAYING_GAP_MS = 16_000;
const DEFAULT_RETRY_DELAYS_MS = [1_000, 3_000] as const;
const DEFAULT_HOLD_SEC = 2;

export type InterruptReason = "session-lost" | "attempt-ended" | "network";

export interface HeartbeatControllerOptions {
  send(body: HeartbeatRequestDto): Promise<HeartbeatDto>;
  onProgress?(data: HeartbeatDto): void;
  onCompleted(data: HeartbeatDto): void;
  onInterrupted(reason: InterruptReason): void;
  onFatal(kind: VideoErrorKind): void;
  intervalMs?: number;
  retryDelaysMs?: readonly number[];
}

export interface HeartbeatController {
  updatePosition(seconds: number): void;
  playing(): void;
  paused(): void;
  ended(): void;
  flush(): Promise<void>;
  stop(): void;
  readonly stopped: boolean;
}

export function createHeartbeatController(options: HeartbeatControllerOptions): HeartbeatController {
  const intervalMs = options.intervalMs ?? HEARTBEAT_INTERVAL_MS;
  const retryDelays = options.retryDelaysMs ?? DEFAULT_RETRY_DELAYS_MS;
  let playerState: "idle" | HeartbeatState = "idle";
  let position = 0;
  let sequence = 1;
  let busy = false;
  let stopped = false;
  const queue: HeartbeatState[] = [];
  let tickTimer: ReturnType<typeof setTimeout> | null = null;
  let holdTimer: ReturnType<typeof setTimeout> | null = null;
  let retryTimer: ReturnType<typeof setTimeout> | null = null;
  let flushWaiters: Array<() => void> = [];

  const clearTick = () => {
    if (tickTimer) clearTimeout(tickTimer);
    tickTimer = null;
  };

  const settleFlush = () => {
    if (stopped || (!busy && queue.length === 0 && !holdTimer && !retryTimer)) {
      const waiters = flushWaiters;
      flushWaiters = [];
      waiters.forEach((resolve) => resolve());
    }
  };

  const stopInternal = () => {
    stopped = true;
    clearTick();
    if (holdTimer) clearTimeout(holdTimer);
    if (retryTimer) clearTimeout(retryTimer);
    holdTimer = null;
    retryTimer = null;
    queue.length = 0;
    busy = false;
    settleFlush();
  };

  const scheduleTick = (sentAt: number) => {
    clearTick();
    if (stopped || playerState !== "playing") return;
    tickTimer = setTimeout(() => {
      tickTimer = null;
      if (playerState === "playing" && queue.length === 0) enqueue("playing");
    }, Math.max(sentAt + intervalMs - Date.now(), MIN_PLAYING_GAP_MS));
  };

  function enqueue(state: HeartbeatState) {
    if (stopped) return;
    if (queue.at(-1) === state) return;
    queue.push(state);
    pump();
  }

  function pump() {
    if (busy || stopped || holdTimer || retryTimer) return;
    const state = queue.shift();
    if (!state) {
      settleFlush();
      return;
    }
    busy = true;
    attempt({ sequence, position_sec: position, state }, 0, Date.now());
  }

  function attempt(body: HeartbeatRequestDto, retryIndex: number, sentAt: number) {
    options.send(body).then(
      (data) => {
        if (stopped) return;
        sequence = body.sequence + 1;
        busy = false;
        options.onProgress?.(data);
        if (data.completed) {
          stopInternal();
          options.onCompleted(data);
          return;
        }
        if (body.state === "playing") scheduleTick(sentAt);
        pump();
      },
      (error: unknown) => {
        if (stopped) return;
        if (isAmbiguousFailure(error)) {
          if (retryIndex < retryDelays.length) {
            retryTimer = setTimeout(() => {
              retryTimer = null;
              if (!stopped) attempt(body, retryIndex + 1, Date.now());
            }, retryDelays[retryIndex]);
            return;
          }
          stopInternal();
          options.onInterrupted("network");
          return;
        }
        const kind = classifyVideoError(error);
        if (kind === "transient") {
          sequence = body.sequence + 1;
          busy = false;
          if (body.state !== "playing") queue.unshift(body.state); // transitions are never dropped
          const holdSec = error instanceof StudentApiError && error.retryAfterSec !== undefined
            ? error.retryAfterSec
            : DEFAULT_HOLD_SEC;
          holdTimer = setTimeout(() => {
            holdTimer = null;
            if (playerState === "playing" && queue.length === 0) enqueue("playing");
            else pump();
          }, holdSec * 1_000);
          return;
        }
        stopInternal();
        if (kind === "session-lost" || kind === "attempt-ended") options.onInterrupted(kind);
        else options.onFatal(kind);
      },
    );
  }

  return {
    updatePosition(seconds: number) {
      if (Number.isFinite(seconds) && seconds >= 0) position = seconds;
    },
    playing() {
      if (stopped || playerState === "playing") return;
      playerState = "playing";
      enqueue("playing");
    },
    paused() {
      if (stopped || playerState !== "playing") return;
      playerState = "paused";
      clearTick();
      enqueue("paused");
    },
    ended() {
      if (stopped || playerState === "ended" || playerState === "idle") return;
      playerState = "ended";
      clearTick();
      enqueue("ended");
    },
    flush() {
      return new Promise<void>((resolve) => {
        flushWaiters.push(resolve);
        settleFlush();
      });
    },
    stop() {
      if (!stopped) stopInternal();
    },
    get stopped() {
      return stopped;
    },
  };
}
