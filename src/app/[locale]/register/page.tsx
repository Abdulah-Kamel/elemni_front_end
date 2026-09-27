import { setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { getAccessToken } from "@/src/lib/student-api/session";
import AuthPageShell from "@/src/features/auth/components/auth-page-shell";
import StudentAuthForm from "@/src/features/auth/components/student-auth-form";

export const metadata = { title: "إنشاء حساب | علمني" };
export const dynamic = "force-dynamic";

export default async function RegisterPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ next?: string }> }) {
  const { locale } = await params;
  const { next } = await searchParams;
  setRequestLocale(locale);
  const returnTo = next && next.startsWith("/") && !next.startsWith("//") ? next : undefined;
  if (await getAccessToken()) redirect(locale === "ar" ? returnTo || "/dashboard" : returnTo || `/${locale}/dashboard`);
  return <AuthPageShell locale={locale}><StudentAuthForm mode="register" returnTo={returnTo} /></AuthPageShell>;
}
