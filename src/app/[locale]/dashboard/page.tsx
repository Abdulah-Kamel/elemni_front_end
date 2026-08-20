import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import StudentDashboard, {
  type CourseRecommendation,
} from "@/src/features/dashboard/components/student-dashboard";
import {
  getGrades,
  getPublicCourses,
  getStreams,
} from "@/src/lib/student-api/public";
import { getAccessToken } from "@/src/lib/student-api/session";

export const metadata = { title: "الرئيسية | بوابة الطالب | علمني" };

export default async function StudentDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  if (!(await getAccessToken()))
    redirect(locale === "ar" ? "/login" : `/${locale}/login`);

  const [courses, grades, streams] = await Promise.all([
    getPublicCourses(),
    getGrades(),
    getStreams(),
  ]);
  const recommendations: CourseRecommendation[] = courses.ok
    ? courses.data
        .flatMap((course) =>
          course.teacher_slug
            ? [
                {
                  course,
                  teacherName: course.teacher_name || "مدرس علمني",
                  teacherSlug: course.teacher_slug,
                },
              ]
            : [],
        )
        .slice(0, 3)
    : [];

  return (
    <StudentDashboard
      recommendations={recommendations}
      grades={grades.ok ? grades.data : []}
      streams={streams.ok ? streams.data : []}
    />
  );
}
