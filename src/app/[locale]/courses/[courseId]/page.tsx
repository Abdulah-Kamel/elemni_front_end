import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import CourseDetail from "@/src/features/courses/components/course-detail";
import type { StudentCourseDetailDto } from "@/src/lib/student-api/contract";
import {
  getGrades,
  getPublicCourses,
  getPublicTeacher,
  getPublicTeacherCourse,
  getStreams,
} from "@/src/lib/student-api/public";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pageMetadata" });
  return { title: t("courseDetailPage") };
}

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

  const requestedTeacher = teacher?.trim() || undefined;
  const [grades, streams, teacherSlug] = requestedTeacher
    ? await Promise.all([getGrades(), getStreams(), Promise.resolve(requestedTeacher)])
    : await (async () => {
        const [gradeResult, streamResult, catalog] = await Promise.all([
          getGrades(), getStreams(), getPublicCourses(),
        ]);
        return [gradeResult, streamResult, catalog?.ok
          ? catalog.data.find((course) => course.id === parsedCourseId)?.teacher_slug ?? undefined
          : undefined] as const;
      })();
  const [courseResult, teacherResult] = await Promise.all([
    teacherSlug ? getPublicTeacherCourse(teacherSlug, parsedCourseId) : Promise.resolve(null),
    teacherSlug ? getPublicTeacher(teacherSlug) : Promise.resolve(null),
  ]);
  const publicCourse = courseResult?.ok ? courseResult.data : undefined;
  const initialDetail: StudentCourseDetailDto | undefined = publicCourse
    ? {
        course: publicCourse,
        enrollment: null,
        teacher: teacherSlug
          ? {
              name: teacherResult?.ok
                ? teacherResult.data.name
                : publicCourse.teacher_name || "مدرس علمني",
              slug: teacherSlug,
              img: teacherResult?.ok ? teacherResult.data.img : null,
            }
          : null,
      }
    : undefined;

  return (
    <CourseDetail
      courseId={parsedCourseId}
      teacherSlug={teacherSlug}
      grades={grades.ok ? grades.data : []}
      streams={streams.ok ? streams.data : []}
      isAuthenticated={false}
      publicMode
      initialDetail={initialDetail}
    />
  );
}
