"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  EnrollmentProgressDto,
  MyCoursesDto,
  StudentCourseDetailDto,
  StudentProfileDto,
  UserDto,
} from "@/src/lib/student-api/contract";
import {
  isStudentUnauthorized,
  StudentApiError,
  studentApiFetch,
} from "@/src/lib/student-api/client";
import { clearOnboardingDraft, uploadDraftIfProfileEmpty } from "@/src/features/onboarding/client";
import { studentQueryKeys } from "../query-keys";

const privateQueryDefaults = {
  staleTime: 30_000,
  gcTime: 5 * 60_000,
  refetchOnWindowFocus: true,
  refetchOnReconnect: true,
  retry: (failureCount: number, error: unknown) =>
    !isStudentUnauthorized(error) && failureCount < 1,
};

async function fetchCurrentStudent() {
  const result = await studentApiFetch<UserDto | { user: null }>("/api/student/auth/me");
  return "user" in result ? null : result;
}

export function useCurrentStudent(enabled = true) {
  return useQuery({
    queryKey: studentQueryKeys.me(),
    queryFn: fetchCurrentStudent,
    enabled,
    ...privateQueryDefaults,
  });
}

/**
 * The study profile and phone number saved on the backend. When the profile is
 * still empty, this student's device draft (from a save that failed earlier) is
 * uploaded first.
 */
export function useStudentProfile() {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: studentQueryKeys.profile(),
    queryFn: async () => {
      const profile = await studentApiFetch<StudentProfileDto>("/api/student/profile");
      if (profile.grade_id != null) return profile;
      let user: UserDto | null;
      try {
        user = await queryClient.fetchQuery({
          queryKey: studentQueryKeys.me(),
          queryFn: fetchCurrentStudent,
          staleTime: privateQueryDefaults.staleTime,
        });
      } catch {
        return profile;
      }
      try {
        return await uploadDraftIfProfileEmpty(profile, user?.id);
      } catch (error) {
        // The backend refused the draft (e.g. a subject no longer exists): drop it.
        if (error instanceof StudentApiError && error.status >= 400 && error.status < 500 && error.status !== 401) clearOnboardingDraft();
        return profile;
      }
    },
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
  options?: {
    enabled?: boolean;
    initialData?: StudentCourseDetailDto;
  },
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
    initialData: options?.initialData,
    ...privateQueryDefaults,
  });
}

export function useUpdateCourseProgress(courseId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { itemId: number; completed?: boolean }) =>
      studentApiFetch<EnrollmentProgressDto>(
        `/api/student/my-courses/${courseId}/progress`,
        {
          method: "PUT",
          body: JSON.stringify({
            item_id: input.itemId,
            completed: input.completed ?? true,
          }),
        },
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: studentQueryKeys.myCourses() });
      void queryClient.invalidateQueries({
        queryKey: [...studentQueryKeys.all, "course", courseId],
      });
    },
  });
}
