import { redirect, notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import DashboardTeacherProfile from "@/src/features/teachers/components/client/dashboard-teacher-profile";
import { toTeacher } from "@/src/lib/student-api/adapters";
import type { UserDto } from "@/src/lib/student-api/contract";
import { authenticatedBackendFetch, getAccessToken } from "@/src/lib/student-api/session";
import { getPublicTeacher, getPublicTeacherCourses, getPublicTeachers } from "@/src/lib/student-api/public";

export const dynamic = "force-dynamic";

export default async function PortalTeacherProfilePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  if (!(await getAccessToken())) {
    redirect(locale === "ar" ? `/login?next=/explore/teachers/${id}` : `/${locale}/login?next=/${locale}/explore/teachers/${id}`);
  }

  const [userResult, teacherResult, coursesResult] = await Promise.all([
    authenticatedBackendFetch<UserDto>("/api/v1/auth/me", { cache: "no-store" }),
    getPublicTeacher(id),
    getPublicTeacherCourses(id),
  ]);
  if (!userResult.ok) {
    redirect(locale === "ar" ? `/login?next=/explore/teachers/${id}` : `/${locale}/login?next=/${locale}/explore/teachers/${id}`);
  }

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

  const teacher = toTeacher(teacherData, coursesResult.ok ? coursesResult.data : []);
  return <DashboardTeacherProfile teacher={teacher} user={userResult.data} />;
}
