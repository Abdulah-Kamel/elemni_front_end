import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import TeacherProfileShell from "@/src/features/teachers/components/client/teacher-profile-shell";
import { toTeacher } from "@/src/lib/student-api/adapters";
import { getPublicTeacher, getPublicTeacherCourses, getPublicTeachers } from "@/src/lib/student-api/public";

export default async function TeacherProfilePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const [teacherResult, coursesResult] = await Promise.all([
    getPublicTeacher(id),
    getPublicTeacherCourses(id),
  ]);
  let teacherData;
  if (teacherResult.ok) {
    teacherData = teacherResult.data;
  } else {
    const teachersResult = await getPublicTeachers();
    teacherData = teachersResult.ok
      ? teachersResult.data.find((teacher) => teacher.slug === id)
      : undefined;
    if (!teacherData && teacherResult.error.status === 404) notFound();
    if (!teacherData) throw new Error(teacherResult.error.message);
  }

  const teacher = toTeacher(
    teacherData,
    coursesResult.ok ? coursesResult.data : [],
  );

  return <TeacherProfileShell teacher={teacher} locale={locale} />;
}
