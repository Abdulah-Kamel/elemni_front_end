import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import OnboardingFlow from "@/src/features/onboarding/components/onboarding-flow";
import { getGrades, getStreams, getSubjects } from "@/src/lib/student-api/public";
import { sessionGate } from "@/src/lib/student-api/session";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return { title: (await getTranslations({ locale, namespace: "onboarding" }))("meta") };
}
export const dynamic = "force-dynamic";

export default async function OnboardingPage({ params, searchParams }: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const gate = await sessionGate();
  if (gate === "none") redirect(locale === "ar" ? "/login" : `/${locale}/login`);
  if (gate === "refresh") {
    const nextQuery = new URLSearchParams();
    for (const [key, value] of Object.entries(await searchParams)) {
      if (Array.isArray(value)) value.forEach((entry) => nextQuery.append(key, entry));
      else if (value !== undefined) nextQuery.set(key, value);
    }
    const nextPath = `${locale === "ar" ? "" : `/${locale}`}/onboarding${nextQuery.size ? `?${nextQuery}` : ""}`;
    redirect(`/api/student/auth/refresh?next=${encodeURIComponent(nextPath)}`);
  }

  const [grades, streams, subjects] = await Promise.all([getGrades(), getStreams(), getSubjects()]);
  return <OnboardingFlow grades={grades.ok ? grades.data : []} streams={streams.ok ? streams.data : []} subjects={subjects.ok ? subjects.data : []} />;
}
