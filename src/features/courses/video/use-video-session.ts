"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useVideoProgressCache } from "@/src/features/student/hooks/use-video-analytics-queries";
import { endSession, requestPlayback, sendHeartbeat } from "@/src/lib/student-api/video-analytics";
import { classifyVideoError, type VideoErrorKind } from "@/src/lib/student-api/video-errors";
import { createHeartbeatController, type HeartbeatController, type InterruptReason } from "./heartbeat-controller";
import { createPlayerBridge, type PlayerBridge } from "./player-bridge";

const SEEK_TOLERANCE_SEC = 2;
const SEEK_TIMEOUT_MS = 5_000;
const SEEK_POLL_MS = 500;
const EXIT_FLUSH_CAP_MS = 4_000;

export type VideoSessionStatus =
  | { kind: "idle" }
  | { kind: "starting" }
  | { kind: "seeking" }
  | { kind: "playing" }
  | { kind: "interrupted"; reason: InterruptReason }
  | { kind: "error"; reason: VideoErrorKind | "player-timeout" | "player-error" };

export interface UseVideoSessionResult {
  status: VideoSessionStatus;
  embedUrl: string | null;
  isCompleted: boolean;
  lastPositionSec: number;
  start(positionSec: number): void;
  iframeRef(node: HTMLIFrameElement | null): void;
}

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export async function confirmSeek(
  bridge: Pick<PlayerBridge, "getCurrentTime">,
  target: number,
  timeoutMs = SEEK_TIMEOUT_MS,
): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const current = await bridge.getCurrentTime().catch(() => null);
    if (current !== null && Math.abs(current - target) <= SEEK_TOLERANCE_SEC) return true;
    await delay(SEEK_POLL_MS);
  }
  return false;
}

interface ActiveSession {
  id: number;
  generation: number;
  bridge: PlayerBridge | null;
  controller: HeartbeatController | null;
  ended: boolean;
  cancelPlaybackWait?: () => void;
}

export function useVideoSession({
  itemId,
  courseId,
  durationSec,
  initiallyCompleted,
  onUnauthenticated,
}: {
  itemId: number;
  courseId: number;
  durationSec: number | null | undefined;
  initiallyCompleted: boolean;
  onUnauthenticated?: () => void;
}): UseVideoSessionResult {
  const cache = useVideoProgressCache(courseId);
  const [status, setStatus] = useState<VideoSessionStatus>({ kind: "idle" });
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [iframe, setIframe] = useState<HTMLIFrameElement | null>(null);
  const [isCompleted, setIsCompleted] = useState(initiallyCompleted);
  const [lastPositionSec, setLastPositionSec] = useState(0);

  const generationRef = useRef(0);
  const startingRef = useRef(false);
  const mountedRef = useRef(true);
  const sessionRef = useRef<ActiveSession | null>(null);
  const positionRef = useRef(0);
  const targetRef = useRef(0);
  const callbacksRef = useRef({ cache, onUnauthenticated, durationSec });
  useEffect(() => {
    callbacksRef.current = { cache, onUnauthenticated, durationSec };
  });

  const fail = useCallback((reason: VideoErrorKind | "player-timeout" | "player-error") => {
    if (reason === "unauthenticated") callbacksRef.current.onUnauthenticated?.();
    if (mountedRef.current) setStatus({ kind: "error", reason });
  }, []);

  /** Ends the current session. Controlled exits flush a final `paused` checkpoint first. */
  const endCurrent = useCallback(async ({ beacon }: { beacon: boolean }) => {
    const session = sessionRef.current;
    if (!session || session.ended) return;
    session.ended = true;
    sessionRef.current = null;
    session.cancelPlaybackWait?.();
    session.bridge?.destroy();
    const controller = session.controller;
    if (controller && !controller.stopped && !beacon) {
      controller.updatePosition(positionRef.current);
      controller.paused();
      await Promise.race([controller.flush(), delay(EXIT_FLUSH_CAP_MS)]);
    }
    controller?.stop();
    await endSession(session.id, { beacon });
    callbacksRef.current.cache.invalidateAfterPlayback(itemId);
  }, [itemId]);

  const failSession = useCallback((session: ActiveSession, reason: "player-timeout" | "player-error") => {
    if (sessionRef.current !== session) return;
    void endCurrent({ beacon: false });
    fail(reason);
  }, [endCurrent, fail]);

  const start = useCallback((positionSec: number) => {
    if (startingRef.current) return;
    startingRef.current = true;
    const generation = ++generationRef.current;
    void endCurrent({ beacon: false });
    setEmbedUrl(null);
    setStatus({ kind: "starting" });
    requestPlayback(itemId, positionSec).then(
      (data) => {
        if (!mountedRef.current || generation !== generationRef.current) {
          void endSession(data.session_id);
          return;
        }
        startingRef.current = false;
        sessionRef.current = { id: data.session_id, generation, bridge: null, controller: null, ended: false };
        targetRef.current = positionSec;
        positionRef.current = positionSec;
        setLastPositionSec(positionSec);
        setEmbedUrl(data.embed_url);
        setStatus({ kind: "seeking" });
      },
      (error: unknown) => {
        if (!mountedRef.current || generation !== generationRef.current) return;
        startingRef.current = false;
        fail(classifyVideoError(error));
      },
    );
  }, [endCurrent, fail, itemId]);

  // Wire the bridge + controller once the signed iframe is mounted.
  useEffect(() => {
    const session = sessionRef.current;
    if (!iframe || !embedUrl || !session || session.bridge) return;
    const bridge = createPlayerBridge(iframe, embedUrl);
    session.bridge = bridge;
    let seekConfirmed = false;
    let pendingPlay = false;
    let playbackStarted = false;
    let resolvePlaybackStart!: (started: boolean) => void;
    const playbackStart = new Promise<boolean>((resolve) => { resolvePlaybackStart = resolve; });
    session.cancelPlaybackWait = () => resolvePlaybackStart(false);
    const notePlaybackStarted = () => {
      playbackStarted = true;
      resolvePlaybackStart(true);
    };
    const isCurrentSession = () => sessionRef.current === session && !session.ended && mountedRef.current;

    const ensureController = () => {
      if (!isCurrentSession()) return null;
      if (session.controller) return session.controller;
      const controller = createHeartbeatController({
        send: (body) => sendHeartbeat(session.id, body),
        onProgress: (data) => {
          callbacksRef.current.cache.applyHeartbeat(itemId, data, callbacksRef.current.durationSec);
          if (mountedRef.current) setLastPositionSec(data.last_position_sec);
        },
        onCompleted: () => {
          if (mountedRef.current) setIsCompleted(true);
          callbacksRef.current.cache.invalidateAfterPlayback(itemId);
        },
        onInterrupted: (reason) => {
          session.bridge?.destroy();
          callbacksRef.current.cache.invalidateAfterPlayback(itemId);
          if (mountedRef.current && sessionRef.current === session) {
            setLastPositionSec(positionRef.current);
            setStatus({ kind: "interrupted", reason });
          }
        },
        onFatal: (kind) => {
          session.bridge?.destroy();
          if (sessionRef.current === session) fail(kind);
        },
      });
      controller.updatePosition(positionRef.current);
      session.controller = controller;
      return controller;
    };

    bridge.on("timeupdate", ({ seconds }) => {
      positionRef.current = seconds;
      session.controller?.updatePosition(seconds);
      if (seconds > 0) notePlaybackStarted();
    });
    bridge.on("play", () => {
      notePlaybackStarted();
      if (seekConfirmed) ensureController()?.playing();
      else pendingPlay = true;
    });
    bridge.on("pause", () => {
      if (session.controller) session.controller.paused();
      else pendingPlay = false;
    });
    bridge.on("ended", () => {
      if (session.controller) session.controller.ended();
      else pendingPlay = false;
    });
    bridge.on("error", () => {
      failSession(session, "player-error");
    });

    bridge.ready.then(async () => {
      if (!isCurrentSession()) return;
      const max = callbacksRef.current.durationSec && callbacksRef.current.durationSec > 0
        ? callbacksRef.current.durationSec
        : Number.POSITIVE_INFINITY;
      const clampedTarget = Math.min(Math.max(0, targetRef.current), max);
      const target = Number.isFinite(max) && clampedTarget >= max - 3 ? 0 : clampedTarget;
      if (target > 0) {
        // Bunny can report ready before it accepts seeks. Wait for actual playback,
        // allowing the student to press its play button if autoplay was blocked.
        if (!playbackStarted && !pendingPlay) {
          const started = await Promise.race([
            playbackStart,
            bridge.getPaused().then((paused) => paused ? playbackStart : true, () => playbackStart),
          ]);
          if (!isCurrentSession() || !started) return;
        }
        bridge.setCurrentTime(target);
        const confirmed = await confirmSeek(bridge, target);
        if (!isCurrentSession()) return;
        if (!confirmed) {
          failSession(session, "player-timeout");
          return;
        }
      }
      const position = await bridge.getCurrentTime().catch(() => target);
      if (!isCurrentSession()) return;
      positionRef.current = position;
      seekConfirmed = true;
      if (mountedRef.current) setStatus({ kind: "playing" });
      const paused = await bridge.getPaused().catch(() => !pendingPlay);
      if (!isCurrentSession()) return;
      if (!paused) ensureController()?.playing();
    }, () => {
      failSession(session, "player-timeout");
    });
  }, [embedUrl, fail, failSession, iframe, itemId]);

  // pagehide → best-effort beacon; bfcache restore → session is gone.
  useEffect(() => {
    const onPageHide = () => {
      if (startingRef.current) {
        generationRef.current += 1;
        startingRef.current = false;
      }
      void endCurrent({ beacon: true });
    };
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted && mountedRef.current) {
        setStatus((current) => (current.kind === "playing" || current.kind === "seeking" || current.kind === "starting"
          ? { kind: "interrupted", reason: "session-lost" }
          : current));
      }
    };
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("pageshow", onPageShow);
    return () => {
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, [endCurrent]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      generationRef.current += 1;
      void endCurrent({ beacon: false });
    };
  }, [endCurrent]);

  return {
    status,
    embedUrl,
    isCompleted,
    lastPositionSec,
    start,
    iframeRef: setIframe,
  };
}
