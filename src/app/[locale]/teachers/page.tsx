import { redirect } from "next/navigation";

export default async function TeachersLegacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(locale === "ar" ? "/for-teachers" : `/${locale}/for-teachers`);
}
