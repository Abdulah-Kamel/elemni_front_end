import "server-only";

import { backendFetch } from "./backend";
import { getAccessToken } from "./session";
import type {
  GradeDto,
  PublicCourseDto,
  PublicTeacherDetailDto,
  PublicTeacherDto,
  StreamDto,
  SubjectDto,
} from "./contract";

const publicCache = { next: { revalidate: 300 } } satisfies RequestInit;

export function getPublicTeachers(params?: {
  gradeId?: number;
  streamId?: number;
  search?: string;
}) {
  const query = new URLSearchParams();
  if (params?.gradeId) query.set("grade_id", String(params.gradeId));
  if (params?.streamId) query.set("stream_id", String(params.streamId));
  if (params?.search) query.set("search", params.search);
  const suffix = query.size ? `?${query}` : "";
  return backendFetch<PublicTeacherDto[]>(
    `/api/v1/teachers${suffix}`,
    publicCache,
  );
}

export function getPublicTeacher(slug: string) {
  return backendFetch<PublicTeacherDetailDto>(
    `/api/v1/teachers/${encodeURIComponent(slug)}`,
    publicCache,
  );
}

export function getPublicCourses(limit = 100) {
  return backendFetch<PublicCourseDto[]>(
    `/api/v1/catalog/courses?limit=${limit}`,
    publicCache,
  );
}

export async function getPublicTeacherCourses(slug: string) {
  const accessToken = await getAccessToken();
  const list = await backendFetch<PublicCourseDto[]>(
    `/api/v1/teachers/${encodeURIComponent(slug)}/courses?limit=100`,
    {
      cache: accessToken ? "no-store" : undefined,
      next: accessToken ? undefined : { revalidate: 300 },
      headers: accessToken
        ? { Authorization: `Bearer ${accessToken}` }
        : undefined,
    },
  );
  if (!list.ok || !accessToken) return list;

  const courses = await Promise.all(
    list.data.map(async (course) => {
      if (!course.is_subscribed) return course;
      const detail = await backendFetch<PublicCourseDto>(
        `/api/v1/teachers/${encodeURIComponent(slug)}/courses/${course.id}`,
        {
          cache: "no-store",
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );
      return detail.ok ? detail.data : course;
    }),
  );
  return { ...list, data: courses };
}

export function getSubjects() {
  return backendFetch<SubjectDto[]>("/api/v1/subjects", {
    next: { revalidate: 3600 },
  });
}

export function getGrades() {
  return backendFetch<GradeDto[]>("/api/v1/grades", {
    next: { revalidate: 3600 },
  });
}

export function getStreams() {
  return backendFetch<StreamDto[]>("/api/v1/streams", {
    next: { revalidate: 3600 },
  });
}
