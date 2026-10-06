import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import StudentDashboard from "@/src/features/dashboard/components/student-dashboard";
import {
  getGrades,
  getStreams,
} from "@/src/lib/student-api/public";
import { sessionGate } from "@/src/lib/student-api/session";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pageMetadata" });
  return { title: t("dashboardPage") };
}
export const dynamic = "force-dynamic";

export default async function StudentDashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const gate = await sessionGate();
  if (gate === "none")
    redirect(locale === "ar" ? "/login?next=/dashboard" : `/${locale}/login?next=/${locale}/dashboard`);
  if (gate === "refresh") {
    const nextQuery = new URLSearchParams();
    for (const [key, value] of Object.entries(await searchParams)) {
      if (Array.isArray(value)) value.forEach((entry) => nextQuery.append(key, entry));
      else if (value !== undefined) nextQuery.set(key, value);
    }
    const nextPath = `${locale === "ar" ? "" : `/${locale}`}/dashboard${nextQuery.size ? `?${nextQuery}` : ""}`;
    redirect(`/api/student/auth/refresh?next=${encodeURIComponent(nextPath)}`);
  }

  const [grades, streams] = await Promise.all([getGrades(), getStreams()]);

  return (
    <StudentDashboard
      grades={grades.ok ? grades.data : []}
      streams={streams.ok ? streams.data : []}
    />
  );
}
