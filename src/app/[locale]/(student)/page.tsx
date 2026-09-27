import { getTranslations, setRequestLocale } from "next-intl/server";
import LandingPage from "@/src/features/landing/page";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pageMetadata" });
  return {
    title: t("homeTitle"),
    description: t("homeDescription"),
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
