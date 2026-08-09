import { getLocale } from "next-intl/server";
import "./redesign.css";

import { getGrades, getPublicTeachers, getStreams, getSubjects, getTeacherCoursesPreview } from "@/src/lib/student-api/public";
import { toTeacherSummary } from "@/src/lib/student-api/adapters";
import LandingInteractiveShell from "./components/client/landing-interactive-shell";
import Features from "./components/server/features";
import TeacherJoinCTA from "./components/server/teacher-join-cta";
import SubjectGrid from "./components/server/subject-grid";
import FeaturedLessons from "./components/server/featured-lessons";
import BentoGrid from "./components/server/bento-grid";
import StepsSection from "./components/server/steps-section";
import Comparison from "./components/server/comparison";
import MobileApp from "./components/server/mobile-app";
import FaqSection from "./components/client/faq-section";
import FinalCta from "./components/server/final-cta";
import Footer from "./components/server/footer";
import WhatsAppButton from "./components/client/whatsapp-button";

export default async function StudentLandingPage() {
  const locale = await getLocale();
  const teacherJoinHref = locale === "ar" ? "/teachers" : `/${locale}/teachers`;
  const [teachersResult, gradesResult, streamsResult, subjectsResult] = await Promise.all([
    getPublicTeachers(),
    getGrades(),
    getStreams(),
    getSubjects(),
  ]);
  const teachers = teachersResult.ok ? teachersResult.data.map(toTeacherSummary) : [];
  const coursePreviews = teachersResult.ok
    ? await Promise.all(
        teachersResult.data.slice(0, 6).map(async (teacher) => ({
          teacher,
          result: await getTeacherCoursesPreview(teacher.slug),
        })),
      )
    : [];
  const featuredCourses = coursePreviews
    .flatMap(({ teacher, result }) =>
      result.ok && result.data[0]
        ? [{ course: result.data[0], teacherName: teacher.name, teacherSlug: teacher.slug }]
        : [],
    )
    .slice(0, 3);

  return (
    <LandingInteractiveShell
      teachers={teachers}
      teachersLoadError={!teachersResult.ok}
      grades={gradesResult.ok ? gradesResult.data : []}
      streams={streamsResult.ok ? streamsResult.data : []}
      afterTeachers={
        <>
          <Features />
          <TeacherJoinCTA href={teacherJoinHref} />
          <SubjectGrid subjects={subjectsResult.ok ? subjectsResult.data : []} />
          <FeaturedLessons courses={featuredCourses} />
          <BentoGrid />
          <StepsSection />
          <Comparison />
          <MobileApp />
        </>
      }
      afterQuiz={
        <>
          <FaqSection />
          <FinalCta />
        </>
      }
      footer={<Footer />}
      floatingActions={<WhatsAppButton />}
    />
  );
}
