import { getTranslations, setRequestLocale } from "next-intl/server";
import AuthPageShell from "@/src/features/auth/components/auth-page-shell";
import { ForgotPasswordForm } from "@/src/features/auth/components/password-recovery-form";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pageMetadata" });
  return { title: t("forgotPasswordPage") };
}
export const dynamic = "force-dynamic";

export default async function ForgotPasswordPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <AuthPageShell locale={locale}><ForgotPasswordForm /></AuthPageShell>;
}
