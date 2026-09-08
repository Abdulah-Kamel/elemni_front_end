import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import CourseDetail from "@/src/features/courses/components/course-detail";
import type { StudentCourseDetailDto } from "@/src/lib/student-api/contract";
import {
  getGrades,
  getPublicCourses,
  getPublicTeacher,
  getPublicTeacherCourse,
  getStreams,
} from "@/src/lib/student-api/public";
import { getAccessToken } from "@/src/lib/student-api/session";

export const metadata = { title: "تفاصيل الكورس | علمني" };

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
  const isAuthenticated = Boolean(await getAccessToken());

  const requestedTeacher = teacher?.trim() || undefined;
  const [grades, streams, catalog] = await Promise.all([
    getGrades(),
    getStreams(),
    getPublicCourses(),
  ]);
  const catalogCourse = catalog?.ok
    ? catalog.data.find((course) => course.id === parsedCourseId)
    : undefined;
  const teacherSlug = requestedTeacher || catalogCourse?.teacher_slug || undefined;
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
      isAuthenticated={isAuthenticated}
      publicMode
      initialDetail={initialDetail}
    />
  );
}
