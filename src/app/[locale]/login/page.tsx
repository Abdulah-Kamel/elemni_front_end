import { setRequestLocale } from "next-intl/server";
import AuthPageShell from "@/src/features/auth/components/auth-page-shell";
import StudentAuthForm from "@/src/features/auth/components/student-auth-form";

export const metadata = { title: "تسجيل الدخول | علمني" };
export const dynamic = "force-dynamic";

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ next?: string }>;
}) {
  const { locale } = await params;
  const { next } = await searchParams;
  setRequestLocale(locale);
  const returnTo = next && next.startsWith("/") && !next.startsWith("//") ? next : undefined;
  return <AuthPageShell locale={locale}><StudentAuthForm mode="login" returnTo={returnTo} /></AuthPageShell>;
}
