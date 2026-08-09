import { setRequestLocale } from "next-intl/server";
import AuthPageShell from "@/src/features/student-auth/components/auth-page-shell";
import { ResetPasswordForm } from "@/src/features/student-auth/components/password-recovery-form";

export const metadata = { title: "تعيين كلمة مرور جديدة | علمني" };

export default async function ResetPasswordPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ token?: string | string[] }> }) {
  const { locale } = await params;
  const query = await searchParams;
  setRequestLocale(locale);
  const token = typeof query.token === "string" ? query.token : "";
  return <AuthPageShell locale={locale}><ResetPasswordForm token={token} /></AuthPageShell>;
}
