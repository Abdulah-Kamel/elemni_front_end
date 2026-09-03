import { getTranslations } from "next-intl/server";
import LegalChrome from "@/src/features/legal/components/legal-chrome";
import { TermsAccordion } from "@/src/features/legal/components/terms-accordion";
import { RefundSection } from "@/src/features/legal/components/refund-section";
import Footer from "@/src/features/landing/components/server/footer";

type LegalPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: LegalPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legal" });

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function LegalPage({
  params,
}: LegalPageProps) {
  const { locale } = await params;
  const t = await getTranslations("legal");
  const homeHref = locale === "ar" ? "/" : `/${locale}`;

  return (
    <LegalChrome locale={locale} footer={<Footer homeHref={homeHref} />}>
      <article className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <header className="border-b border-slate-200 pb-10 dark:border-slate-800">
          <p className="text-sm font-semibold text-primary">Elemni</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            {t("title")}
          </h1>
          <p className="mt-4 text-base leading-8 text-slate-600 dark:text-slate-300">
            {t("description")}
          </p>
        </header>

        <section className="mt-10">
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            {t("terms.title")}
          </h2>
          <div className="mt-5">
            <TermsAccordion />
          </div>
        </section>

        <section className="mt-16 border-t border-slate-200 pt-12 dark:border-slate-800">
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            {t("refund.title")}
          </h2>
          <div className="mt-5">
            <RefundSection />
          </div>
        </section>
      </article>
    </LegalChrome>
  );
}
