import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function PortalTeacherProfilePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  redirect(locale === "ar" ? `/teachers/${id}` : `/${locale}/teachers/${id}`);
}
