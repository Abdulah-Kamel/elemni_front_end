"use client";

import { useTranslations } from "next-intl";
import { GraduationCap, Phone } from "lucide-react";
import { Link } from "@/src/i18n/navigation";
import { SUPPORT_PHONE, SUPPORT_PHONE_HREF } from "@/src/features/contact/contact-details";

export default function Footer({ homeHref = "" }: { homeHref?: string }) {
  const t = useTranslations("landingFooter");
  const brand = useTranslations("brand");
  const landingHref = (hash: string) => `${homeHref}${hash}`;

  return (
    <footer className="border-t border-slate-800 bg-[#0F172A] pb-12 pt-16 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 border-b border-slate-800 pb-12 text-start md:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-4 lg:col-span-2">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-white shadow-lg">
                <GraduationCap className="size-6" aria-hidden="true" />
              </div>
              <span className="text-2xl font-black tracking-tight text-white">
                {brand("name")} {" "}
                <span className="rounded-md border border-primary/40 bg-primary/20 px-2 py-0.5 text-xs font-bold text-primary">
                  ELEMNI
                </span>
              </span>
            </div>
            <div className="max-w-md">
              <p className="text-sm font-normal leading-relaxed text-slate-400">
                {t("description")}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="border-s-2 border-primary ps-2 text-sm font-extrabold text-primary-light">
              {t("quickLinksTitle")}
            </h2>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><a href={landingHref("#hero")} className="transition-colors hover:text-white">{t("home")}</a></li>
              <li><a href={landingHref("#courses")} className="transition-colors hover:text-white">{t("courses")}</a></li>
              <li><a href={landingHref("#features")} className="transition-colors hover:text-white">{t("features")}</a></li>
              <li><a href={landingHref("#faq")} className="transition-colors hover:text-white">{t("faq")}</a></li>
              <li><Link href="/legal" className="transition-colors hover:text-white">{t("legal")}</Link></li>
              <li><Link href="/contact" className="transition-colors hover:text-white">{t("contact")}</Link></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h2 className="border-s-2 border-primary ps-2 text-sm font-extrabold text-primary-light">
              {t("curriculumTitle")}
            </h2>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><a href={landingHref("#courses")} className="transition-colors hover:text-white">{t("grade12")}</a></li>
              <li><a href={landingHref("#courses")} className="transition-colors hover:text-white">{t("grade11")}</a></li>
              <li><a href={landingHref("#courses")} className="transition-colors hover:text-white">{t("grade10")}</a></li>
              <li><a href={landingHref("#faq")} className="transition-colors hover:text-white">{t("faq")}</a></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h2 className="border-s-2 border-primary ps-2 text-sm font-extrabold text-primary-light">
              {t("contactTitle")}
            </h2>
            <a
              href={SUPPORT_PHONE_HREF}
              dir="ltr"
              className="flex items-center gap-2 text-xs text-slate-400 transition-colors hover:text-white"
            >
              <Phone className="size-3.5 text-primary" aria-hidden="true" />
              <span>{SUPPORT_PHONE}</span>
            </a>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 pt-8 text-center text-xs text-slate-500 sm:flex-row sm:text-start">
          <p>{t("copyright")}</p>
        </div>
      </div>
    </footer>
  );
}
