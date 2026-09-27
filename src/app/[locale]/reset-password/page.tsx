import { getTranslations, setRequestLocale } from "next-intl/server";
import AuthPageShell from "@/src/features/auth/components/auth-page-shell";
import { ResetPasswordForm } from "@/src/features/auth/components/password-recovery-form";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pageMetadata" });
  return { title: t("resetPasswordPage") };
}
export const dynamic = "force-dynamic";

export default async function ResetPasswordPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ token?: string | string[] }> }) {
  const { locale } = await params;
  const query = await searchParams;
  setRequestLocale(locale);
  const token = typeof query.token === "string" ? query.token : "";
  return <AuthPageShell locale={locale}><ResetPasswordForm token={token} /></AuthPageShell>;
}
