import { setRequestLocale } from "next-intl/server";
import StudentLandingPage from "@/src/features/student-redesign/page";

export async function generateMetadata() {
  return {
    title: "علمني | منصة التعلم الذكي",
    description: "علمني .. بوابتك للتعلم الذكي — المنصة الأولى للتعلم التفاعلي وكورسات المدرسين 2026",
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <StudentLandingPage />;
}
