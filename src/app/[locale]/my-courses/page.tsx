import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import MyCourses from "@/src/features/dashboard/components/my-courses";
import { getAccessToken } from "@/src/lib/student-api/session";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pageMetadata" });
  return { title: t("myCoursesPage") };
}

export default async function MyCoursesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  if (!(await getAccessToken())) redirect(locale === "ar" ? "/login?next=/my-courses" : `/${locale}/login?next=/${locale}/my-courses`);
  return <MyCourses />;
}
