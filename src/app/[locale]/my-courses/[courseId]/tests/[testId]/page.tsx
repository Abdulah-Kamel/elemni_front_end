import { notFound, redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import CourseDetail from "@/src/features/courses/components/course-detail";
import { parseTestView } from "@/src/features/course-tests/routes";
import { getGrades, getStreams } from "@/src/lib/student-api/public";
import { getAccessToken } from "@/src/lib/student-api/session";

export const metadata = { title: "الاختبار | بوابة الطالب | علمني" };

export default async function CourseTestPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; courseId: string; testId: string }>;
  searchParams: Promise<{ attempt?: string; view?: string }>;
}) {
  const { locale, courseId, testId } = await params;
  const { attempt, view } = await searchParams;
  setRequestLocale(locale);

  const path = `/my-courses/${courseId}/tests/${testId}`;
  if (!(await getAccessToken())) {
    redirect(locale === "ar" ? `/login?next=${path}` : `/${locale}/login?next=/${locale}${path}`);
  }

  const parsedCourseId = Number(courseId);
  const parsedTestId = Number(testId);
  if (![parsedCourseId, parsedTestId].every((id) => Number.isInteger(id) && id > 0)) notFound();
  const attemptId = Number(attempt);

  const [grades, streams] = await Promise.all([getGrades(), getStreams()]);
  return (
    <CourseDetail
      courseId={parsedCourseId}
      grades={grades.ok ? grades.data : []}
      streams={streams.ok ? streams.data : []}
      activeTest={{
        testId: parsedTestId,
        attemptId: Number.isInteger(attemptId) && attemptId > 0 ? attemptId : null,
        view: parseTestView(view),
      }}
    />
  );
}
