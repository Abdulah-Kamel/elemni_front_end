import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import StudentHeader from "@/src/features/student-landing/components/student-header";
import StudentHero from "@/src/features/student-landing/components/student-hero";
import { StudentTeachersSection } from "@/src/features/student-landing/components/student-teachers";
import CtaBar from "@/src/features/student-landing/components/cta-bar";
import GradeStreamFilter from "@/src/features/student-landing/components/grade-stream-filter";
import SubjectGrid from "@/src/features/student-landing/components/subject-grid";
import FeaturedLessons from "@/src/features/student-landing/components/featured-lessons";
import { StudentFeaturesGrid } from "@/src/features/student-landing/components/student-features";
import { StudentBentoGrid } from "@/src/features/student-landing/components/student-bento";
import { StudentStepsSection } from "@/src/features/student-landing/components/student-steps";
import { StudentTestimonials } from "@/src/features/student-landing/components/student-testimonials";
import { StudentFaqSection } from "@/src/features/student-landing/components/student-faq";
import { StudentComparison } from "@/src/features/student-landing/components/student-comparison";
import { StudentBeforeAfter } from "@/src/features/student-landing/components/student-before-after";
import { StudentMobileApp } from "@/src/features/student-landing/components/student-mobile";
import { StudentFinalCta } from "@/src/features/student-landing/components/student-final-cta";
import StudentFooter from "@/src/features/student-landing/components/student-footer";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "studentLanding.meta" });
  return { title: t("title"), description: t("description") };
}

export const revalidate = 3600;

export default async function StudentLandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <StudentHeader />
      <main>
        <StudentHero />
        <StudentTeachersSection />
        {/* <CtaBar /> */}
        <GradeStreamFilter locale={locale} />
        <SubjectGrid locale={locale} />
        <FeaturedLessons locale={locale} />
        {/* <StudentFeaturesGrid /> */}
        <StudentBentoGrid />
        <StudentStepsSection />
        <StudentTestimonials />
        <StudentFaqSection />
        {/* <StudentComparison /> */}
        <StudentBeforeAfter />
        {/* <StudentMobileApp /> */}
        <StudentFinalCta />
      </main>
      <StudentFooter />
    </>
  );
}
