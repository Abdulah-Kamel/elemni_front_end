import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import ExploreTeachers from "@/src/features/teachers/components/client/explore-teachers";
import { getGrades, getPublicCourses, getPublicTeachers } from "@/src/lib/student-api/public";
import { sessionGate } from "@/src/lib/student-api/session";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: (await getTranslations({ locale, namespace: "teacherDirectory.meta" }))("exploreTitle"),
  };
}

export default async function ExploreTeachersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const gate = await sessionGate();
  if (gate === "none") {
    redirect(locale === "ar" ? "/login?next=/explore/teachers" : `/${locale}/login?next=/${locale}/explore/teachers`);
  }
  if (gate === "refresh") {
    const nextQuery = new URLSearchParams();
    for (const [key, value] of Object.entries(await searchParams)) {
      if (Array.isArray(value)) value.forEach((entry) => nextQuery.append(key, entry));
      else if (value !== undefined) nextQuery.set(key, value);
    }
    const nextPath = `${locale === "ar" ? "" : `/${locale}`}/explore/teachers${nextQuery.size ? `?${nextQuery}` : ""}`;
    redirect(`/api/student/auth/refresh?next=${encodeURIComponent(nextPath)}`);
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
