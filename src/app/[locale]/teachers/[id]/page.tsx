import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/src/i18n/routing";
import { TEACHERS_DATA } from "@/src/features/student-redesign/data/mock-data";
import TeacherProfileView from "@/src/features/student-redesign/components/client/teacher-profile-view";

export function generateStaticParams() {
  const params: { locale: string; id: string }[] = [];
  for (const locale of routing.locales) {
    for (const teacher of TEACHERS_DATA) {
      params.push({ locale, id: teacher.id });
    }
  }
  return params;
}

export default async function TeacherProfilePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const teacher = TEACHERS_DATA.find((t) => t.id === id);
  if (!teacher) notFound();

  return <TeacherProfileView teacher={teacher} />;
}
