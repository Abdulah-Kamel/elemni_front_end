import { setRequestLocale } from "next-intl/server";
import AuthPageShell from "@/src/features/auth/components/auth-page-shell";
import StudentAuthForm from "@/src/features/auth/components/student-auth-form";

export const metadata = { title: "تسجيل الدخول | علمني" };

export default async function LoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <AuthPageShell locale={locale}><StudentAuthForm mode="login" /></AuthPageShell>;
}
