import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import MyCourses from "@/src/features/dashboard/components/my-courses";
import { getAccessToken } from "@/src/lib/student-api/session";

export const metadata = { title: "دوراتي | بوابة الطالب | علمني" };

export default async function MyCoursesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  if (!(await getAccessToken())) redirect(locale === "ar" ? "/login" : `/${locale}/login`);
  return <MyCourses />;
}
