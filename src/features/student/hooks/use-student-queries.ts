"use client";

import { useQuery } from "@tanstack/react-query";
import type {
  MyCoursesDto,
  StudentCourseDetailDto,
  UserDto,
} from "@/src/lib/student-api/contract";
import {
  isStudentUnauthorized,
  studentApiFetch,
} from "@/src/lib/student-api/client";
import { studentQueryKeys } from "../query-keys";

const privateQueryDefaults = {
  staleTime: 30_000,
  gcTime: 5 * 60_000,
  refetchOnWindowFocus: true,
  refetchOnReconnect: true,
  retry: (failureCount: number, error: unknown) =>
    !isStudentUnauthorized(error) && failureCount < 1,
};

export function useCurrentStudent(enabled = true) {
  return useQuery({
    queryKey: studentQueryKeys.me(),
    queryFn: () => studentApiFetch<UserDto>("/api/student/auth/me"),
    enabled,
    ...privateQueryDefaults,
  });
}

export function useMyCourses() {
  return useQuery({
    queryKey: studentQueryKeys.myCourses(),
    queryFn: () => studentApiFetch<MyCoursesDto>("/api/student/my-courses"),
    ...privateQueryDefaults,
  });
}

export function useStudentCourse(
  courseId: number,
  teacherSlug?: string,
  options?: { enabled?: boolean },
) {
  const teacherQuery = teacherSlug
    ? `?teacher=${encodeURIComponent(teacherSlug)}`
    : "";

  return useQuery({
    queryKey: studentQueryKeys.course(courseId, teacherSlug),
    queryFn: () =>
      studentApiFetch<StudentCourseDetailDto>(
        `/api/student/my-courses/${courseId}${teacherQuery}`,
      ),
    enabled: options?.enabled ?? true,
    ...privateQueryDefaults,
  });
}
