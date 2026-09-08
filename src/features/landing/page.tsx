import "./landing.css";

import {
  getGrades,
  getPublicCourses,
  getStreams,
  getSubjects,
} from "@/src/lib/student-api/public";
import LandingInteractiveShell from "./components/client/landing-interactive-shell";
import SubjectGrid from "./components/server/subject-grid";
import BentoGrid from "./components/server/bento-grid";
import Comparison from "./components/server/comparison";
// import MobileApp from "./components/server/mobile-app";
import InteractiveWhiteboard3D from "./components/client/interactive-whiteboard-3d";
import FaqSection from "./components/client/faq-section";
import FinalCta from "./components/server/final-cta";
import Footer from "./components/server/footer";
import WhatsAppButton from "./components/client/whatsapp-button";

// HIDDEN FOR NOW: Teacher marketing route /for-teachers is disabled for SEO.
// To re-enable, restore TeacherJoinCTA import and usage and update for-teachers/page.tsx
// import TeacherJoinCTA from "./components/server/teacher-join-cta";

export default async function StudentLandingPage() {
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
