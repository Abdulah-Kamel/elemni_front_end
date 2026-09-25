"use client";

import { useSyncExternalStore } from "react";
import { serverClockOffset } from "../format";

// One shared 1s ticker for every countdown on the page (sidebar rows, resume
// banner, cooldown, scheduled). Components subscribe only while mounted.
let now = 0;
let timer: ReturnType<typeof setInterval> | undefined;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!timer) {
    now = Date.now();
    timer = setInterval(() => {
      now = Date.now();
      listeners.forEach((notify) => notify());
    }, 1000);
  }
  return () => {
    listeners.delete(listener);
    if (!listeners.size && timer) {
      clearInterval(timer);
      timer = undefined;
    }
  };
}

const getSnapshot = () => now;
const getServerSnapshot = () => 0;

// Offset between the server clock and ours, captured the first time we see a
// given `server_now` (i.e. right after the payload arrived).
const offsets = new Map<string, number>();
function offsetFor(serverNow: string) {
  let offset = offsets.get(serverNow);
  if (offset === undefined) {
    offset = serverClockOffset(serverNow);
    offsets.set(serverNow, offset);
    if (offsets.size > 64) offsets.delete(offsets.keys().next().value!);
  }
  return offset;
}

/**
 * Seconds until `target` on the server clock, ticking every second.
 * Returns null when there is no target. Before hydration it falls back to the
 * static `target − server_now` difference so SSR and the first client render match.
 */
export function useServerCountdown(target: string | null | undefined, serverNow?: string | null) {
  const clock = useSyncExternalStore(target ? subscribe : noopSubscribe, getSnapshot, getServerSnapshot);
  if (!target) return null;
  const targetMs = new Date(target).getTime();
  if (!clock) {
    return serverNow ? Math.max(0, Math.ceil((targetMs - new Date(serverNow).getTime()) / 1000)) : null;
  }
  const offset = serverNow ? offsetFor(serverNow) : 0;
  return Math.max(0, Math.ceil((targetMs - (clock + offset)) / 1000));
}

function noopSubscribe() {
  return () => {};
}
