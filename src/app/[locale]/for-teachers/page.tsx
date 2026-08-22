import TeacherMarketingPage from "@/src/features/marketing/page";

export { generateMetadata } from "@/src/features/marketing/page";

export default async function ForTeachersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  return <TeacherMarketingPage params={params} />;
}
