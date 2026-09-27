import { setRequestLocale } from "next-intl/server";
import LandingPage from "@/src/features/landing/page";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return {
    title: "علمني | منصة التعلم الذكي",
    description: "علمني .. بوابتك للتعلم مع المعلمين والكورسات المنشورة على المنصة.",
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <LandingPage />;
}
