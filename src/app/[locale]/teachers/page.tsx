import { setRequestLocale } from "next-intl/server";
import BrowseTeachersShell from "@/src/features/teachers/components/client/browse-teachers-shell";
import { toTeacherSummary } from "@/src/lib/student-api/adapters";
import { getGrades, getPublicTeachers, getStreams } from "@/src/lib/student-api/public";

export default async function TeachersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [teachers, grades, streams] = await Promise.all([
    getPublicTeachers(),
    getGrades(),
    getStreams(),
  ]);

  return (
    <BrowseTeachersShell
      locale={locale}
      teachers={teachers.ok ? teachers.data.map(toTeacherSummary) : []}
      grades={grades.ok ? grades.data : []}
      streams={streams.ok ? streams.data : []}
      loadError={!teachers.ok}
    />
  );
}
