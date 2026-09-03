import { getTranslations } from "next-intl/server";
import { ArrowUpRight, Phone } from "lucide-react";
import { ContactForm } from "@/src/features/contact/components/contact-form";
import Footer from "@/src/features/landing/components/server/footer";
import { SUPPORT_PHONE, SUPPORT_PHONE_HREF } from "@/src/features/contact/contact-details";
import LegalChrome from "@/src/features/legal/components/legal-chrome";

type ContactPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: ContactPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contact" });

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function ContactPage({ params }: ContactPageProps) {
  const { locale } = await params;
  const t = await getTranslations("contact");
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

        <section className="mt-10 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]" aria-label={t("supportSection")}>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Phone className="size-6" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <h2
                  id="contact-phone-heading"
                  className="text-lg font-bold text-slate-900 dark:text-white"
                >
                  {t("phoneLabel")}
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {t("phoneDescription")}
                </p>
                <a
                  href={SUPPORT_PHONE_HREF}
                  dir="ltr"
                  className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-5 py-3 text-base font-bold text-white transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
                >
                  <span>{SUPPORT_PHONE}</span>
                  <ArrowUpRight className="size-4" aria-hidden="true" />
                  <span className="sr-only">{t("callAction")}</span>
                </a>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {t("form.title")}
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
              {t("form.description")}
            </p>
            <div className="mt-6">
              <ContactForm />
            </div>
          </div>
        </section>
      </article>
    </LegalChrome>
  );
}
