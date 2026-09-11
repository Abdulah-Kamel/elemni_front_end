import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import StudentDashboard from "@/src/features/dashboard/components/student-dashboard";
import {
  getGrades,
  getStreams,
} from "@/src/lib/student-api/public";
import { getAccessToken } from "@/src/lib/student-api/session";

export const metadata = { title: "الرئيسية | بوابة الطالب | علمني" };
export const dynamic = "force-dynamic";

export default async function StudentDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  if (!(await getAccessToken()))
    redirect(locale === "ar" ? "/login?next=/dashboard" : `/${locale}/login?next=/${locale}/dashboard`);

  const [grades, streams] = await Promise.all([getGrades(), getStreams()]);

  return (
    <StudentDashboard
      grades={grades.ok ? grades.data : []}
      streams={streams.ok ? streams.data : []}
    />
  );
}
