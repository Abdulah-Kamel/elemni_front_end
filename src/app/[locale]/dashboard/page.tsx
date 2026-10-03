import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import StudentDashboard from "@/src/features/dashboard/components/student-dashboard";
import {
  getGrades,
  getStreams,
} from "@/src/lib/student-api/public";
import { hasStudentSession } from "@/src/lib/student-api/session";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pageMetadata" });
  return { title: t("dashboardPage") };
}
export const dynamic = "force-dynamic";

export default async function StudentDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  if (!(await hasStudentSession()))
    redirect(locale === "ar" ? "/login?next=/dashboard" : `/${locale}/login?next=/${locale}/dashboard`);

  const [grades, streams] = await Promise.all([getGrades(), getStreams()]);

  return (
    <StudentDashboard
      grades={grades.ok ? grades.data : []}
      streams={streams.ok ? streams.data : []}
    />
  );
}
