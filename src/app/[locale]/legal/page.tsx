import { getTranslations } from "next-intl/server";
import LegalChrome from "@/src/features/legal/components/legal-chrome";
import { TermsAccordion } from "@/src/features/legal/components/terms-accordion";
import { RefundSection } from "@/src/features/legal/components/refund-section";

export default async function LegalPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("legal");

  return (
    <LegalChrome locale={locale}>
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            {t("title")}
          </h1>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
            {t("refund.intro")}
          </p>
        </div>

        {/* Terms & Conditions */}
        <section className="mb-16">
          <h2 className="text-xl font-bold text-slate-900 mb-6 dark:text-white">
            {t("terms.title")}
          </h2>
          <TermsAccordion />
        </section>

        {/* Refund Policy */}
        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-6 dark:text-white">
            {t("refund.title")}
          </h2>
          <RefundSection />
        </section>
      </div>
    </LegalChrome>
  );
}