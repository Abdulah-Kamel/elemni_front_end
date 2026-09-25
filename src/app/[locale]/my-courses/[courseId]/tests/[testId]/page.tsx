import { notFound, redirect } from "next/navigation";
import { authenticatedBackendFetch, getAccessToken } from "@/src/lib/student-api/session";
import { CourseTestFlow } from "@/src/features/course-tests/course-test-flow";
import type { CourseTestAttempt, CourseTestDetail } from "@/src/features/course-tests/types";

export default async function CourseTestPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; courseId: string; testId: string }>;
  searchParams: Promise<{ attemptId?: string; review?: string }>;
}) {
  const { locale, courseId: courseRaw, testId: testRaw } = await params;
  const { attemptId: attemptRaw, review } = await searchParams;
  if (!(await getAccessToken())) redirect(`/${locale}/login?next=/my-courses/${courseRaw}/tests/${testRaw}`);
  const courseId = Number(courseRaw);
  const testId = Number(testRaw);
  if (![courseId, testId].every((id) => Number.isInteger(id) && id > 0)) notFound();

  const detail = await authenticatedBackendFetch<CourseTestDetail>(`/api/v1/my/courses/${courseId}/tests/${testId}`, { cache: "no-store" });
  if (!detail.ok) {
    if (detail.error.status === 404) notFound();
    throw new Error(detail.error.message);
  }

  let initialAttempt: CourseTestAttempt | null = null;
  let initialResult: Record<string, unknown> | null = null;
  if (attemptRaw && Number.isInteger(Number(attemptRaw))) {
    const endpoint = review === "true" ? `/api/v1/attempts/${Number(attemptRaw)}/review` : `/api/v1/attempts/${Number(attemptRaw)}/result`;
    const result = await authenticatedBackendFetch<Record<string, unknown>>(endpoint, { cache: "no-store" });
    if (result.ok) initialResult = result.data;
  } else if (detail.data.open_attempt_id) {
    const resumed = await authenticatedBackendFetch<CourseTestAttempt>(`/api/v1/attempts/${detail.data.open_attempt_id}`, { cache: "no-store" });
    if (resumed.ok) initialAttempt = resumed.data;
  }

  return <CourseTestFlow test={detail.data} initialAttempt={initialAttempt} initialResult={initialResult} />;
}
