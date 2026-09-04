import { getTranslations } from "next-intl/server";
import { ArrowDown, ArrowUpRight, MessageCircle, Phone } from "lucide-react";
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
      <article className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <section
          data-testid="contact-hero"
          aria-labelledby="contact-page-title"
          className="relative isolate overflow-hidden rounded-3xl bg-brand-700 px-6 py-10 text-white shadow-lift sm:px-10 sm:py-14 lg:px-14 lg:py-16"
        >
          <div
            aria-hidden="true"
            className="absolute -start-24 -top-28 size-72 rounded-full border border-white/10 bg-white/[0.04]"
          />
          <div
            aria-hidden="true"
            className="absolute -bottom-36 -end-20 size-80 rounded-full border border-white/10"
          />

          <div className="relative grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-center lg:gap-16">
            <div className="max-w-2xl">
              <h1
                id="contact-page-title"
                className="text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl"
              >
                {t("title")}
              </h1>
              <p className="mt-5 text-base leading-8 text-brand-100 sm:text-lg">
                {t("description")}
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <a
                  href="#contact-form"
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-extrabold text-brand-900 transition hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-700"
                >
                  {t("form.jump")}
                  <ArrowDown className="size-4" aria-hidden="true" />
                </a>
              </div>
            </div>

            <div className="relative rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur-sm">
              <div className="flex size-11 items-center justify-center rounded-xl bg-white text-brand-700">
                <Phone className="size-5" aria-hidden="true" />
              </div>
              <h2 className="mt-5 text-lg font-extrabold">{t("phoneLabel")}</h2>
              <p className="mt-2 text-sm leading-7 text-brand-100">
                {t("phoneDescription")}
              </p>
              <a
                href={SUPPORT_PHONE_HREF}
                dir="ltr"
                className="mt-5 inline-flex items-center gap-2 text-sm font-extrabold text-white underline decoration-white/50 underline-offset-4 transition hover:decoration-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <span>{SUPPORT_PHONE}</span>
                <ArrowUpRight className="size-4" aria-hidden="true" />
                <span className="sr-only">{t("callAction")}</span>
              </a>
            </div>
          </div>
        </section>

        <section
          id="contact-form"
          aria-label={t("supportSection")}
          className="mx-auto mt-10 max-w-3xl scroll-mt-28 rounded-2xl border border-slate-200 bg-white p-6 shadow-soft sm:p-8 lg:p-10 dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex items-start justify-between gap-6 border-b border-slate-200 pb-6 dark:border-slate-800">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                {t("form.title")}
              </h2>
              <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                {t("form.description")}
              </p>
            </div>
            <div className="hidden size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:flex">
              <MessageCircle className="size-5" aria-hidden="true" />
            </div>
          </div>
          <div className="mt-8">
            <ContactForm />
          </div>
        </section>
      </article>
    </LegalChrome>
  );
}
