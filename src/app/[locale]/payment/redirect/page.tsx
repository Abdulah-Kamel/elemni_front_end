import { getTranslations, setRequestLocale } from "next-intl/server";
import StudentPortalShell from "@/src/features/portal/components/portal-shell";
import PaymentResultView from "@/src/features/payments/components/payment-result-view";
import { parsePaymentResult } from "@/src/features/payments/parse-payment-result";
import type { UserDto } from "@/src/lib/student-api/contract";
import { authenticatedBackendFetch } from "@/src/lib/student-api/session";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "paymentResult" });

  return { title: t("metaTitle") };
}

async function getCurrentUserSafe(): Promise<UserDto | null> {
  try {
    const result = await authenticatedBackendFetch<UserDto>("/api/v1/auth/me", {
      cache: "no-store",
    });
    return result.ok ? result.data : null;
  } catch {
    return null;
  }
}

export default async function PaymentRedirectPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const query = await searchParams;
  const result = parsePaymentResult(query ?? {});
  const user = await getCurrentUserSafe();

  return (
    <StudentPortalShell user={user} active="courses">
      <PaymentResultView result={result} />
    </StudentPortalShell>
  );
}
