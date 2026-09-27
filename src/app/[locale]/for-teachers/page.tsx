import { permanentRedirect } from "next/navigation";

export default async function ForTeachersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  permanentRedirect(locale === "ar" ? "/" : `/${locale}`);
}
