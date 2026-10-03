"use client";

import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { StudentApiError } from "@/src/lib/student-api/client";
import type { HeartbeatDto, ItemVideoProgressDto, StudentCourseDetailDto } from "@/src/lib/student-api/contract";
import { getLastWatched, getVideoProgress } from "@/src/lib/student-api/video-analytics";
import { studentQueryKeys } from "../query-keys";

const noRetryOn = (statuses: number[]) => (failureCount: number, error: unknown) =>
  !(error instanceof StudentApiError && statuses.includes(error.status)) && failureCount < 1;

export function useLastWatched(enabled = true) {
  return useQuery({
    queryKey: studentQueryKeys.lastWatched(),
    queryFn: getLastWatched,
    enabled,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: true,
    retry: noRetryOn([401, 403, 404]),
  });
}

export function useVideoProgress(itemId: number | null) {
  return useQuery({
    queryKey: studentQueryKeys.videoProgress(itemId ?? 0),
    queryFn: () => getVideoProgress(itemId as number),
    enabled: itemId !== null,
    staleTime: 0,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    retry: noRetryOn([401, 403, 404, 409]),
  });
}

export function useVideoProgressCache(courseId: number) {
  const queryClient = useQueryClient();
  return useMemo(() => ({
    applyHeartbeat(itemId: number, data: HeartbeatDto, durationSec: number | null | undefined) {
      queryClient.setQueriesData<StudentCourseDetailDto>(
        { queryKey: studentQueryKeys.coursePrefix(courseId) },
        (detail) => {
          if (!detail?.enrollment) return detail;
          const progress = detail.enrollment.progress;
          const list = progress.video_progress ?? [];
          const existing = list.find((entry) => entry.item_id === itemId);
          const percent = durationSec && durationSec > 0
            ? Math.min(100, Math.floor((data.last_position_sec * 100) / durationSec))
            : existing?.watched_percent ?? 0;
          const next: ItemVideoProgressDto = {
            item_id: itemId,
            last_position_sec: data.last_position_sec,
            watched_percent: percent,
            is_completed: Boolean(existing?.is_completed || data.completed),
          };
          return {
            ...detail,
            enrollment: {
              ...detail.enrollment,
              progress: {
                ...progress,
                video_progress: existing
                  ? list.map((entry) => (entry.item_id === itemId ? next : entry))
                  : [...list, next],
              },
            },
          };
        },
      );
    },
    invalidateAfterPlayback(itemId: number) {
      void queryClient.invalidateQueries({ queryKey: studentQueryKeys.myCourses() });
      void queryClient.invalidateQueries({ queryKey: studentQueryKeys.coursePrefix(courseId) });
      void queryClient.invalidateQueries({ queryKey: studentQueryKeys.videoProgress(itemId) });
      void queryClient.invalidateQueries({ queryKey: studentQueryKeys.lastWatched() });
    },
  }), [queryClient, courseId]);
}
