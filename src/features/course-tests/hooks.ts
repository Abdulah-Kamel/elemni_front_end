"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { getCourseTestsClient } from "./client";

export const courseTestKeys = {
  all: ["course-tests"] as const,
  progress: (courseId: number) => [...courseTestKeys.all, "progress", courseId] as const,
  test: (courseId: number, testId: number) => [...courseTestKeys.all, "test", courseId, testId] as const,
  attempt: (attemptId: number) => [...courseTestKeys.all, "attempt", attemptId] as const,
  result: (attemptId: number) => [...courseTestKeys.all, "result", attemptId] as const,
  review: (attemptId: number) => [...courseTestKeys.all, "review", attemptId] as const,
};

const defaults = { staleTime: 10_000, retry: 1, refetchOnWindowFocus: true } as const;

export function useCourseTestsProgress(courseId: number, enabled = true) {
  return useQuery({
    queryKey: courseTestKeys.progress(courseId),
    queryFn: async () => (await getCourseTestsClient()).getProgress(courseId),
    enabled,
    ...defaults,
  });
}

export function useCourseTest(courseId: number, testId: number) {
  return useQuery({
    queryKey: courseTestKeys.test(courseId, testId),
    queryFn: async () => (await getCourseTestsClient()).getTest(courseId, testId),
    ...defaults,
  });
}

/** Attempts are always read fresh: the server owns the clock and saved answers. */
export function useAttempt(attemptId: number | null) {
  return useQuery({
    queryKey: courseTestKeys.attempt(attemptId ?? 0),
    queryFn: async () => (await getCourseTestsClient()).getAttempt(attemptId!),
    enabled: attemptId !== null,
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

export function useAttemptResult(attemptId: number | null) {
  return useQuery({
    queryKey: courseTestKeys.result(attemptId ?? 0),
    queryFn: async () => (await getCourseTestsClient()).getResult(attemptId!),
    enabled: attemptId !== null,
    ...defaults,
  });
}

export function useAttemptReview(attemptId: number | null) {
  return useQuery({
    queryKey: courseTestKeys.review(attemptId ?? 0),
    queryFn: async () => (await getCourseTestsClient()).getReview(attemptId!),
    enabled: attemptId !== null,
    ...defaults,
  });
}

/** Call after start/submit so the sidebar, start screen and results refresh. */
export function useInvalidateCourseTests() {
  const queryClient = useQueryClient();
  return useCallback(() => queryClient.invalidateQueries({ queryKey: courseTestKeys.all }), [queryClient]);
}
