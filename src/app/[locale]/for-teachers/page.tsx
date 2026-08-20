import TeacherMarketingPage from "@/src/features/teacher-marketing/page";

export { generateMetadata } from "@/src/features/teacher-marketing/page";

export default async function ForTeachersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  return <TeacherMarketingPage params={params} />;
}
