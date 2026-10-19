import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import OnboardingFlow from "@/src/features/onboarding/components/onboarding-flow";
import type { StudentProfileDto, UserDto } from "@/src/lib/student-api/contract";
import { getGrades, getStreams, getSubjects } from "@/src/lib/student-api/public";
import { authenticatedBackendFetch, sessionGate } from "@/src/lib/student-api/session";

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
  const query = await searchParams;
  const prefix = locale === "ar" ? "" : `/${locale}`;
  const nextQuery = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (Array.isArray(value)) value.forEach((entry) => nextQuery.append(key, entry));
    else if (value !== undefined) nextQuery.set(key, value);
  }
  const nextPath = `${prefix}/onboarding${nextQuery.size ? `?${nextQuery}` : ""}`;
  // The refresh route renews the cookies, or clears them and opens login?next=… when it can't.
  const refreshPath = `/api/student/auth/refresh?next=${encodeURIComponent(nextPath)}`;

  const gate = await sessionGate();
  if (gate === "none") redirect(`${prefix}/login?next=${encodeURIComponent(nextPath)}`);
  if (gate === "refresh") redirect(refreshPath);

  // Server Components can't rewrite cookies, so a rejected token goes through the refresh route.
  const [me, profile] = await Promise.all([
    authenticatedBackendFetch<UserDto>("/api/v1/auth/me", { cache: "no-store" }, { refreshSession: false }),
    authenticatedBackendFetch<StudentProfileDto>("/api/v1/students/me/profile", { cache: "no-store" }, { refreshSession: false }),
  ]);
  if ((!me.ok && me.error.status === 401) || (!profile.ok && profile.error.status === 401)) redirect(refreshPath);

  // Students who already chose a grade only come back here to edit their answers.
  if (profile.ok && profile.data.grade_id != null && query.edit !== "1") redirect(`${prefix}/dashboard`);

  const [grades, streams, subjects] = await Promise.all([getGrades(), getStreams(), getSubjects()]);
  return (
    <OnboardingFlow
      grades={grades.ok ? grades.data : []}
      streams={streams.ok ? streams.data : []}
      subjects={subjects.ok ? subjects.data : []}
      ownerId={me.ok ? me.data.id : undefined}
      needsPhone={!profile.ok || profile.data.phone_number == null}
      initialProfile={profile.ok ? profile.data : null}
    />
  );
}
