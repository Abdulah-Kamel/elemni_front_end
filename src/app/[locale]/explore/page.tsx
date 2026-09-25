import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import ExploreCourses, {
  type ExploreCourseEntry,
} from "@/src/features/courses/components/explore-courses";
import {
  getGrades,
  getPublicCourses,
  getPublicTeachers,
  getStreams,
  getSubjects,
} from "@/src/lib/student-api/public";
import { getAccessToken } from "@/src/lib/student-api/session";

export const metadata = { title: "استكشف الكورسات | بوابة الطالب | علمني" };
export const dynamic = "force-dynamic";

export default async function ExploreCoursesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ view?: string; q?: string; tgrade?: string; tsubject?: string; tsort?: string; tpage?: string }>;
}) {
  const { locale } = await params;
  const query = await searchParams;
  setRequestLocale(locale);
  if (query.view === "teachers") {
    const nextParams = new URLSearchParams();
    if (query.q) nextParams.set("q", query.q);
    if (query.tgrade) nextParams.set("grade", query.tgrade);
    if (query.tsubject) nextParams.set("subject", query.tsubject);
    if (query.tsort) nextParams.set("sort", query.tsort);
    if (query.tpage) nextParams.set("page", query.tpage);
    const destination = locale === "ar" ? "/explore/teachers" : `/${locale}/explore/teachers`;
    redirect(`${destination}${nextParams.size ? `?${nextParams.toString()}` : ""}`);
  }
  if (!(await getAccessToken()))
    redirect(locale === "ar" ? "/login?next=/explore" : `/${locale}/login?next=/${locale}/explore`);

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
