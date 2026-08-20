import { getLocale } from "next-intl/server";
import "./landing.css";

import {
  getGrades,
  getPublicCourses,
  getPublicTeachers,
  getStreams,
  getSubjects,
} from "@/src/lib/student-api/public";
import { toTeacherSummary } from "@/src/lib/student-api/adapters";
import LandingInteractiveShell from "./components/client/landing-interactive-shell";
import TeacherJoinCTA from "./components/server/teacher-join-cta";
import SubjectGrid from "./components/server/subject-grid";
import FeaturedLessons from "./components/server/featured-lessons";
import BentoGrid from "./components/server/bento-grid";
import Comparison from "./components/server/comparison";
import MobileApp from "./components/server/mobile-app";
import InteractiveWhiteboard3D from "./components/client/interactive-whiteboard-3d";
import FaqSection from "./components/client/faq-section";
import FinalCta from "./components/server/final-cta";
import Footer from "./components/server/footer";
import WhatsAppButton from "./components/client/whatsapp-button";

export default async function StudentLandingPage() {
  const locale = await getLocale();
  const teacherJoinHref = locale === "ar" ? "/teachers" : `/${locale}/teachers`;
  const [
    coursesResult,
    teachersResult,
    gradesResult,
    streamsResult,
    subjectsResult,
  ] = await Promise.all([
    getPublicCourses(),
    getPublicTeachers(),
    getGrades(),
    getStreams(),
    getSubjects(),
  ]);
  const teachers = teachersResult.ok
    ? teachersResult.data.map(toTeacherSummary)
    : [];
  const featuredCourses = (coursesResult.ok ? coursesResult.data : [])
    .flatMap((course) =>
      course.teacher_slug
        ? [
            {
              course,
              teacherName: course.teacher_name || "مدرس علمني",
              teacherSlug: course.teacher_slug,
            },
          ]
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
          <TeacherJoinCTA href={teacherJoinHref} />
          <SubjectGrid
            subjects={subjectsResult.ok ? subjectsResult.data : []}
          />
          <FeaturedLessons courses={featuredCourses} />
          <BentoGrid />
          <InteractiveWhiteboard3D />
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
