import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import CourseDetail from "@/src/features/courses/components/course-detail";
import { getGrades, getStreams } from "@/src/lib/student-api/public";
import { getAccessToken } from "@/src/lib/student-api/session";

export const metadata = { title: "تفاصيل الكورس | بوابة الطالب | علمني" };

export default async function CourseDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; courseId: string }>;
  searchParams: Promise<{ teacher?: string }>;
}) {
  const { locale, courseId } = await params;
  const { teacher } = await searchParams;
  setRequestLocale(locale);

  const parsedCourseId = Number(courseId);
  if (!Number.isInteger(parsedCourseId) || parsedCourseId <= 0) notFound();
  const isAuthenticated = Boolean(await getAccessToken());

  const [grades, streams] = await Promise.all([getGrades(), getStreams()]);
  return (
    <CourseDetail
      courseId={parsedCourseId}
      teacherSlug={teacher}
      grades={grades.ok ? grades.data : []}
      streams={streams.ok ? streams.data : []}
      isAuthenticated={isAuthenticated}
    />
  );
}
