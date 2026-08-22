import { setRequestLocale } from "next-intl/server";
import AuthPageShell from "@/src/features/auth/components/auth-page-shell";
import { ForgotPasswordForm } from "@/src/features/auth/components/password-recovery-form";

export const metadata = { title: "استعادة كلمة المرور | علمني" };

export default async function ForgotPasswordPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <AuthPageShell locale={locale}><ForgotPasswordForm /></AuthPageShell>;
}
