"use client";

import { useEffect, useState } from "react";
import { secondsUntil, serverClockOffset } from "../format";

/** Screen readers hear the timer only when it crosses these marks (seconds). */
export const ANNOUNCE_THRESHOLDS = [300, 120, 60] as const;
export const WARNING_SECONDS = 120;

export const isTimeWarning = (remaining: number | null) => remaining !== null && remaining < WARNING_SECONDS;

/** The threshold (seconds) crossed between two readings, or null. */
export function crossedThreshold(previous: number | null, next: number | null): number | null {
  if (previous === null || next === null || next >= previous) return null;
  const crossed = ANNOUNCE_THRESHOLDS.filter((mark) => previous > mark && next <= mark);
  return crossed.length ? Math.min(...crossed) : null;
}

/**
 * Seconds left until the server deadline, corrected by the server clock offset
 * measured when the attempt loaded. Null for tests without a time limit.
 */
export function useRemainingSeconds(deadlineAt: string | null, serverNow: string) {
  const [offset] = useState(() => serverClockOffset(serverNow));
  const [remaining, setRemaining] = useState(() => (deadlineAt ? secondsUntil(deadlineAt, offset) : null));

  useEffect(() => {
    if (!deadlineAt) return;
    const tick = () => setRemaining(secondsUntil(deadlineAt, offset));
    const id = window.setInterval(tick, 250);
    // Timers are throttled in background tabs; resync when the tab comes back.
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [deadlineAt, offset]);

  return deadlineAt ? remaining : null;
}

/** Minutes to announce, updated only when a threshold is crossed. */
export function useTimerAnnouncement(remaining: number | null) {
  const [previous, setPrevious] = useState(remaining);
  const [announced, setAnnounced] = useState<number | null>(null);
  if (remaining !== previous) {
    const crossed = crossedThreshold(previous, remaining);
    setPrevious(remaining);
    if (crossed !== null) setAnnounced(crossed / 60);
  }
  return announced;
}
