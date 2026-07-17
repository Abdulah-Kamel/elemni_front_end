import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import Header from "@/src/features/marketing/components/header";
import Hero from "@/src/features/marketing/components/hero";
import { StatsBar } from "@/src/features/marketing/components/stats-bar";
import { FeaturesGrid } from "@/src/features/marketing/components/features-grid";
import { HlsSection } from "@/src/features/marketing/components/hls-section";
import CurriculumSection from "@/src/features/marketing/components/curriculum-section";
import VideoDemoSection from "@/src/features/marketing/components/video-demo";
import PaymentsSection from "@/src/features/marketing/components/payments-section";
import { ComparisonTable } from "@/src/features/marketing/components/comparison-table";
import { BeforeAfter } from "@/src/features/marketing/components/before-after";
import { StepsSection } from "@/src/features/marketing/components/steps-section";
import { MigrationSection } from "@/src/features/marketing/components/migration-section";
import { Testimonials } from "@/src/features/marketing/components/testimonials";
import { PricingSection } from "@/src/features/marketing/components/pricing-section";
import { FaqSection } from "@/src/features/marketing/components/faq-section";
import { FinalCta } from "@/src/features/marketing/components/final-cta";
import { Footer } from "@/src/features/marketing/components/footer";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "teachers.meta" });
  return { title: t("title"), description: t("description") };
}

export default async function TeachersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Header />
      <main>
        <Hero />
        <StatsBar />
        <FeaturesGrid />
        <HlsSection />
        <CurriculumSection />
        <VideoDemoSection />
        <PaymentsSection />
        <ComparisonTable />
        <BeforeAfter />
        <StepsSection />
        <MigrationSection />
        <Testimonials />
        <PricingSection />
        <FaqSection />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
