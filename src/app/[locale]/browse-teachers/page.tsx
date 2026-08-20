import { redirect } from "next/navigation";

export default async function BrowseTeachersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(locale === "ar" ? "/teachers" : `/${locale}/teachers`);
}
