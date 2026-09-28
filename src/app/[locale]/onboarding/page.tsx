import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import OnboardingFlow from "@/src/features/onboarding/components/onboarding-flow";
import { getGrades, getStreams, getSubjects } from "@/src/lib/student-api/public";
import { getAccessToken } from "@/src/lib/student-api/session";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pageMetadata" });
  return { title: t("onboardingPage") };
}
export const dynamic = "force-dynamic";

export default async function OnboardingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  if (!(await getAccessToken())) redirect(locale === "ar" ? "/login" : `/${locale}/login`);

  const [grades, streams, subjects] = await Promise.all([getGrades(), getStreams(), getSubjects()]);
  return <OnboardingFlow grades={grades.ok ? grades.data : []} streams={streams.ok ? streams.data : []} subjects={subjects.ok ? subjects.data : []} />;
}
