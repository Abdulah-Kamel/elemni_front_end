import { getLocale } from "next-intl/server";
import "./landing.css";

import {
  getGrades,
  getPublicCourses,
  getStreams,
  getSubjects,
} from "@/src/lib/student-api/public";
import LandingInteractiveShell from "./components/client/landing-interactive-shell";
import TeacherJoinCTA from "./components/server/teacher-join-cta";
import SubjectGrid from "./components/server/subject-grid";
import BentoGrid from "./components/server/bento-grid";
import Comparison from "./components/server/comparison";
// import MobileApp from "./components/server/mobile-app";
import InteractiveWhiteboard3D from "./components/client/interactive-whiteboard-3d";
import FaqSection from "./components/client/faq-section";
import FinalCta from "./components/server/final-cta";
import Footer from "./components/server/footer";
import WhatsAppButton from "./components/client/whatsapp-button";

export default async function StudentLandingPage() {
  const locale = await getLocale();
  const teacherJoinHref = locale === "ar" ? "/for-teachers" : `/${locale}/for-teachers`;
  const [coursesResult, gradesResult, streamsResult, subjectsResult] = await Promise.all([
    getPublicCourses(),
    getGrades(),
    getStreams(),
    getSubjects(),
  ]);

  return (
    <LandingInteractiveShell
      courses={coursesResult.ok ? coursesResult.data : []}
      coursesLoadError={!coursesResult.ok}
      grades={gradesResult.ok ? gradesResult.data : []}
      streams={streamsResult.ok ? streamsResult.data : []}
      subjects={subjectsResult.ok ? subjectsResult.data : []}
      afterCourses={
        <>
          <TeacherJoinCTA href={teacherJoinHref} />
          <SubjectGrid subjects={subjectsResult.ok ? subjectsResult.data : []} />
          <BentoGrid />
          <InteractiveWhiteboard3D />
          <Comparison />
          {/* <MobileApp /> */}
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
