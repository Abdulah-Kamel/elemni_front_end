import { describe, expect, it } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import type { StudentCourseDetailDto } from "@/src/lib/student-api/contract";
import { studentQueryKeys } from "../query-keys";
import { useVideoProgressCache } from "./use-video-analytics-queries";

function setup(detail: StudentCourseDetailDto) {
  const client = new QueryClient();
  client.setQueryData(studentQueryKeys.course(7, undefined), detail);
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(() => useVideoProgressCache(7), { wrapper });
  return { client, cache: result.current };
}

const detail = (videoProgress: unknown[]) => ({
  course: {},
  teacher: null,
  enrollment: { progress: { completed_item_ids: [], video_progress: videoProgress } },
}) as unknown as StudentCourseDetailDto;

describe("useVideoProgressCache.applyHeartbeat", () => {
  it("writes position-based percent for the item", () => {
    const { client, cache } = setup(detail([]));
    cache.applyHeartbeat(42, { accepted: true, duplicate: false, completed: false, watched_percent: 10, last_position_sec: 50 }, 200);
    const updated = client.getQueryData<StudentCourseDetailDto>(studentQueryKeys.course(7, undefined));
    expect(updated?.enrollment?.progress.video_progress).toEqual([
      { item_id: 42, last_position_sec: 50, watched_percent: 25, is_completed: false },
    ]);
  });

  it("keeps completion sticky", () => {
    const { client, cache } = setup(detail([{ item_id: 42, last_position_sec: 190, watched_percent: 95, is_completed: true }]));
    cache.applyHeartbeat(42, { accepted: true, duplicate: false, completed: false, watched_percent: 5, last_position_sec: 10 }, 200);
    const entry = client.getQueryData<StudentCourseDetailDto>(studentQueryKeys.course(7, undefined))
      ?.enrollment?.progress.video_progress?.[0];
    expect(entry).toMatchObject({ last_position_sec: 10, watched_percent: 5, is_completed: true });
  });
});
