import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import ExploreCourses, { type ExploreCourseEntry } from "@/src/features/student-portal/components/explore-courses";
import { getGrades, getPublicTeachers, getStreams, getSubjects, getTeacherCoursesPreview } from "@/src/lib/student-api/public";
import { getAccessToken } from "@/src/lib/student-api/session";

export const metadata = { title: "استكشف الكورسات | بوابة الطالب | علمني" };

export default async function ExploreCoursesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  if (!(await getAccessToken())) redirect(locale === "ar" ? "/login" : `/${locale}/login`);

  const [teachers, grades, streams, subjects] = await Promise.all([
    getPublicTeachers(),
    getGrades(),
    getStreams(),
    getSubjects(),
  ]);

  const courseResults = teachers.ok
    ? await Promise.all(
        teachers.data.map(async (teacher) => ({
          teacher,
          courses: await getTeacherCoursesPreview(teacher.slug, 100),
        })),
      )
    : [];

  const catalog: ExploreCourseEntry[] = courseResults.flatMap(({ teacher, courses }) =>
    courses.ok
      ? courses.data.map((course) => ({
          course,
          teacher: {
            name: teacher.name,
            slug: teacher.slug,
            img: teacher.img,
            subjects: teacher.subjects.map((subject) => subject.name),
            grades: teacher.grades.map((grade) => grade.name),
          },
        }))
      : [],
  );

  return (
    <ExploreCourses
      catalog={catalog}
      teachers={teachers.ok ? teachers.data : []}
      grades={grades.ok ? grades.data : []}
      streams={streams.ok ? streams.data : []}
      subjects={subjects.ok ? subjects.data : []}
      loadError={!teachers.ok || courseResults.some(({ courses }) => !courses.ok)}
    />
  );
}
