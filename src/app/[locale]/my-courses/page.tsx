import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import MyCourses from "@/src/features/dashboard/components/my-courses";
import { sessionGate } from "@/src/lib/student-api/session";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pageMetadata" });
  return { title: t("myCoursesPage") };
}

export default async function MyCoursesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const gate = await sessionGate();
  if (gate === "none") redirect(locale === "ar" ? "/login?next=/my-courses" : `/${locale}/login?next=/${locale}/my-courses`);
  if (gate === "refresh") {
    const nextQuery = new URLSearchParams();
    for (const [key, value] of Object.entries(await searchParams)) {
      if (Array.isArray(value)) value.forEach((entry) => nextQuery.append(key, entry));
      else if (value !== undefined) nextQuery.set(key, value);
    }
    const nextPath = `${locale === "ar" ? "" : `/${locale}`}/my-courses${nextQuery.size ? `?${nextQuery}` : ""}`;
    redirect(`/api/student/auth/refresh?next=${encodeURIComponent(nextPath)}`);
  }
  return <MyCourses />;
}
