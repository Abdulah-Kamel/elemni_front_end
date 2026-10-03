import { notFound, redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import CourseDetail from "@/src/features/courses/components/course-detail";
import { getGrades, getStreams } from "@/src/lib/student-api/public";
import { hasStudentSession } from "@/src/lib/student-api/session";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pageMetadata" });
  return { title: t("myCourseDetailPage") };
}

export default async function MyCourseDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; courseId: string }>;
  searchParams: Promise<{ teacher?: string; item?: string }>;
}) {
  const { locale, courseId } = await params;
  const { teacher, item } = await searchParams;
  setRequestLocale(locale);

  const nextQuery = new URLSearchParams();
  if (teacher?.trim()) nextQuery.set("teacher", teacher.trim());
  if (item && /^\d+$/.test(item)) nextQuery.set("item", item);
  const suffix = nextQuery.size ? `?${nextQuery}` : "";
  const nextPath = locale === "ar" ? `/my-courses/${courseId}${suffix}` : `/${locale}/my-courses/${courseId}${suffix}`;
  if (!(await hasStudentSession())) {
    redirect(`${locale === "ar" ? "" : `/${locale}`}/login?next=${encodeURIComponent(nextPath)}`);
  }

  const parsedCourseId = Number(courseId);
  if (!Number.isInteger(parsedCourseId) || parsedCourseId <= 0) notFound();

  const [grades, streams] = await Promise.all([getGrades(), getStreams()]);
  return (
    <CourseDetail
      courseId={parsedCourseId}
      teacherSlug={teacher?.trim() || undefined}
      grades={grades.ok ? grades.data : []}
      streams={streams.ok ? streams.data : []}
    />
  );
}
