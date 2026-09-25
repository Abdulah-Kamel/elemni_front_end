import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import ExploreTeachers from "@/src/features/teachers/components/client/explore-teachers";
import { getGrades, getPublicCourses, getPublicTeachers } from "@/src/lib/student-api/public";
import { getAccessToken } from "@/src/lib/student-api/session";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === "ar" ? "استكشف المدرسين | بوابة الطالب | علمني" : "Explore teachers | Student portal | Elemni",
  };
}

export default async function ExploreTeachersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  if (!(await getAccessToken())) {
    redirect(locale === "ar" ? "/login?next=/explore/teachers" : `/${locale}/login?next=/${locale}/explore/teachers`);
  }

  const [teachersResult, gradesResult, coursesResult] = await Promise.all([
    getPublicTeachers(),
    getGrades(),
    getPublicCourses(),
  ]);
  const teachers = teachersResult.ok ? teachersResult.data : [];
  const grades = gradesResult.ok
    ? gradesResult.data
    : Array.from(new Map(teachers.flatMap((teacher) => teacher.grades).map((grade) => [grade.id, grade])).values());
  const courseCounts: Record<string, number> = {};
  if (coursesResult.ok) {
    for (const course of coursesResult.data) {
      if (course.teacher_slug) courseCounts[course.teacher_slug] = (courseCounts[course.teacher_slug] ?? 0) + 1;
    }
  }

  return (
    <ExploreTeachers
      teachers={teachers}
      grades={grades}
      courseCounts={courseCounts}
      loadError={!teachersResult.ok || !coursesResult.ok}
    />
  );
}
