import "server-only";

import { apiFetchRetry } from "@/src/lib/api/index";
import {
  SubjectsResponseSchema,
} from "@/src/features/student-landing/schemas/subject";
import {
  GradesResponseSchema,
} from "@/src/features/student-landing/schemas/grade";
import {
  StreamsResponseSchema,
} from "@/src/features/student-landing/schemas/stream";
import {
  FeaturedContentResponseSchema,
} from "@/src/features/student-landing/schemas/featured-content";
import { fallbackSubjects, fallbackGrades, fallbackStreams, fallbackFeatured } from "@/src/features/student-landing/data";

export async function getSubjects(locale: string = "ar") {
  const result = await apiFetchRetry(
    "/v1/subjects",
    { locale, next: { revalidate: 3600, tags: ["curriculum"] } },
    SubjectsResponseSchema,
  );
  if (!result.ok) return fallbackSubjects;
  return result.data.data;
}

export async function getGrades(locale: string = "ar") {
  const result = await apiFetchRetry(
    "/v1/grades",
    { locale, next: { revalidate: 3600, tags: ["curriculum"] } },
    GradesResponseSchema,
  );
  if (!result.ok) return fallbackGrades;
  return result.data.data;
}

export async function getStreams(locale: string = "ar", gradeId?: string) {
  const query = gradeId ? `?gradeId=${gradeId}` : "";
  const result = await apiFetchRetry(
    `/v1/streams${query}`,
    { locale, next: { revalidate: 3600, tags: ["curriculum"] } },
    StreamsResponseSchema,
  );
  if (!result.ok) return fallbackStreams;
  return result.data.data;
}

export async function getFeaturedContent(locale: string = "ar") {
  const result = await apiFetchRetry(
    "/v1/featured-content",
    { locale, next: { revalidate: 3600, tags: ["curriculum"] } },
    FeaturedContentResponseSchema,
  );
  if (!result.ok) return fallbackFeatured;
  return result.data.data;
}
