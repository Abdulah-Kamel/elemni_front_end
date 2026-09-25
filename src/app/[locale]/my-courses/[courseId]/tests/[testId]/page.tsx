import { notFound } from "next/navigation";
import { CourseTestDemoPage } from "@/src/features/course-tests/demo-page";

export default async function CourseTestPage({ params, searchParams }: {
  params: Promise<{ courseId: string; testId: string }>;
  searchParams: Promise<{ attemptId?: string; review?: string }>;
}) {
  const { courseId: courseRaw, testId: testRaw } = await params;
  const { attemptId, review } = await searchParams;
  const courseId = Number(courseRaw);
  const testId = Number(testRaw);
  if (![courseId, testId].every((id) => Number.isInteger(id) && id > 0)) notFound();
  return <CourseTestDemoPage courseId={courseId} testId={testId} attemptId={Number(attemptId) || null} review={review === "true"} />;
}
