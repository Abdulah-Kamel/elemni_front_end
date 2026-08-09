import { notFound, redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import PortalTeacherProfile from "@/src/features/student-portal/components/portal-teacher-profile";
import type { PublicTeacherDetailDto } from "@/src/lib/student-api/contract";
import { getPublicTeacher, getPublicTeacherCourses, getPublicTeachers } from "@/src/lib/student-api/public";
import { getAccessToken } from "@/src/lib/student-api/session";

export const metadata = { title: "الملف الشخصي للمدرس | بوابة الطالب | علمني" };

export default async function PortalTeacherProfilePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  if (!(await getAccessToken())) {
    redirect(locale === "ar" ? "/login" : `/${locale}/login`);
  }

  const [teacherResult, coursesResult] = await Promise.all([
    getPublicTeacher(id),
    getPublicTeacherCourses(id),
  ]);

  let teacher: PublicTeacherDetailDto;
  if (teacherResult.ok) {
    teacher = teacherResult.data;
  } else {
    const teachersResult = await getPublicTeachers();
    const summary = teachersResult.ok
      ? teachersResult.data.find((item) => item.slug === id)
      : undefined;

    if (!summary && teacherResult.error.status === 404) notFound();
    if (!summary) throw new Error(teacherResult.error.message);

    teacher = {
      name: summary.name,
      slug: summary.slug,
      description: summary.description,
      img: summary.img,
      subjects: summary.subjects,
      grades: summary.grades,
      location: null,
      experience: null,
      course_count: coursesResult.ok ? coursesResult.data.length : 0,
    };
  }

  return (
    <PortalTeacherProfile
      teacher={teacher}
      courses={coursesResult.ok ? coursesResult.data : []}
      coursesLoadError={!coursesResult.ok}
    />
  );
}
