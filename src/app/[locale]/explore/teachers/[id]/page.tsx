import { redirect, notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import DashboardTeacherProfile from "@/src/features/teachers/components/client/dashboard-teacher-profile";
import { toTeacher } from "@/src/lib/student-api/adapters";
import type { UserDto } from "@/src/lib/student-api/contract";
import { authenticatedBackendFetch, sessionGate } from "@/src/lib/student-api/session";
import { getPublicTeacher, getPublicTeacherCourses, getPublicTeachers } from "@/src/lib/student-api/public";

export const dynamic = "force-dynamic";

export default async function PortalTeacherProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const gate = await sessionGate();
  if (gate === "none") {
    redirect(locale === "ar" ? `/login?next=/explore/teachers/${id}` : `/${locale}/login?next=/${locale}/explore/teachers/${id}`);
  }
  if (gate === "refresh") {
    const nextQuery = new URLSearchParams();
    for (const [key, value] of Object.entries(await searchParams)) {
      if (Array.isArray(value)) value.forEach((entry) => nextQuery.append(key, entry));
      else if (value !== undefined) nextQuery.set(key, value);
    }
    const nextPath = `${locale === "ar" ? "" : `/${locale}`}/explore/teachers/${id}${nextQuery.size ? `?${nextQuery}` : ""}`;
    redirect(`/api/student/auth/refresh?next=${encodeURIComponent(nextPath)}`);
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
    if (!teacherData) throw new Error(teacherResult.error.detail ?? teacherResult.error.code);
  }

  const teacher = toTeacher(teacherData, coursesResult.ok ? coursesResult.data : []);
  return <DashboardTeacherProfile teacher={teacher} user={userResult.data} />;
}
