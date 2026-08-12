import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import ExploreCourses, {
  type ExploreCourseEntry,
} from "@/src/features/student-portal/components/explore-courses";
import {
  getGrades,
  getPublicCourses,
  getPublicTeachers,
  getStreams,
  getSubjects,
} from "@/src/lib/student-api/public";
import { getAccessToken } from "@/src/lib/student-api/session";

export const metadata = { title: "استكشف الكورسات | بوابة الطالب | علمني" };

export default async function ExploreCoursesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  if (!(await getAccessToken()))
    redirect(locale === "ar" ? "/login" : `/${locale}/login`);

  const [courses, teachers, grades, streams, subjects] = await Promise.all([
    getPublicCourses(),
    getPublicTeachers(),
    getGrades(),
    getStreams(),
    getSubjects(),
  ]);

  const teachersBySlug = new Map(
    (teachers.ok ? teachers.data : []).map((teacher) => [
      teacher.slug,
      teacher,
    ]),
  );
  const catalog: ExploreCourseEntry[] = courses.ok
    ? courses.data.flatMap((course) => {
        if (!course.teacher_slug) return [];
        const teacher = teachersBySlug.get(course.teacher_slug);
        return [
          {
            course,
            teacher: {
              name: course.teacher_name || teacher?.name || "مدرس علمني",
              slug: course.teacher_slug,
              img: teacher?.img ?? null,
              subjects: teacher?.subjects.map((subject) => subject.name) ?? [],
              grades: teacher?.grades.map((grade) => grade.name) ?? [],
            },
          },
        ];
      })
    : [];

  return (
    <ExploreCourses
      catalog={catalog}
      teachers={teachers.ok ? teachers.data : []}
      grades={grades.ok ? grades.data : []}
      streams={streams.ok ? streams.data : []}
      subjects={subjects.ok ? subjects.data : []}
      loadError={!courses.ok || !teachers.ok}
    />
  );
}
