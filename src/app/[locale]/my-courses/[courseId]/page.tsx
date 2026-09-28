import { notFound, redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import CourseDetail from "@/src/features/courses/components/course-detail";
import { getGrades, getStreams } from "@/src/lib/student-api/public";
import { getAccessToken } from "@/src/lib/student-api/session";

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
  searchParams: Promise<{ teacher?: string }>;
}) {
  const { locale, courseId } = await params;
  const { teacher } = await searchParams;
  setRequestLocale(locale);

  if (!(await getAccessToken())) {
    redirect(locale === "ar" ? `/login?next=/my-courses/${courseId}` : `/${locale}/login?next=/${locale}/my-courses/${courseId}`);
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
