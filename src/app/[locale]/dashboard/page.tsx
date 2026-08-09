import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import StudentDashboard, { type CourseRecommendation } from "@/src/features/student-portal/components/student-dashboard";
import { getGrades, getPublicTeachers, getStreams, getTeacherCoursesPreview } from "@/src/lib/student-api/public";
import { getAccessToken } from "@/src/lib/student-api/session";

export const metadata = { title: "الرئيسية | بوابة الطالب | علمني" };

export default async function StudentDashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  if (!(await getAccessToken())) redirect(locale === "ar" ? "/login" : `/${locale}/login`);

  const [teachers, grades, streams] = await Promise.all([getPublicTeachers(), getGrades(), getStreams()]);
  let recommendations: CourseRecommendation[] = [];
  if (teachers.ok) {
    const previews = await Promise.all(teachers.data.slice(0, 6).map(async (teacher) => ({ teacher, courses: await getTeacherCoursesPreview(teacher.slug, 1) })));
    recommendations = previews.flatMap(({ teacher, courses }) => courses.ok && courses.data[0] ? [{ course: courses.data[0], teacherName: teacher.name, teacherSlug: teacher.slug }] : []).slice(0, 3);
  }

  return <StudentDashboard recommendations={recommendations} grades={grades.ok ? grades.data : []} streams={streams.ok ? streams.data : []} />;
}
