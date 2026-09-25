"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import type { CourseTestsApiError } from "../client";
import { getCourseTestsClient } from "../client";
import { AutosaveQueue } from "./autosave-queue";

const serverSnapshot = { status: "saved", pendingCount: 0 } as const;

/**
 * One AutosaveQueue per mounted attempt. Flushes on load, on reconnect, when
 * the tab is hidden and on unmount; the caller flushes before submit/exit.
 */
export function useAutosave(attemptId: number, questionIds: number[], onClosed: (error: CourseTestsApiError) => void) {
  const [queue] = useState(
    () =>
      new AutosaveQueue({
        attemptId,
        questionIds,
        save: async (questionId, input) => (await getCourseTestsClient()).saveAnswer(attemptId, questionId, input),
      }),
  );

  useEffect(() => {
    queue.setClosedHandler(onClosed);
  }, [queue, onClosed]);

  const snapshot = useSyncExternalStore(queue.subscribe, queue.getSnapshot, () => serverSnapshot);

  useEffect(() => {
    void queue.flush();
    const flush = () => void queue.flush();
    const onVisibility = () => {
      if (document.visibilityState === "hidden") flush();
    };
    window.addEventListener("online", flush);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("online", flush);
      document.removeEventListener("visibilitychange", onVisibility);
      // Send whatever is still debouncing; anything unsent stays in localStorage.
      void queue.flush().finally(() => queue.dispose());
    };
  }, [queue]);

  return { queue, snapshot };
}
