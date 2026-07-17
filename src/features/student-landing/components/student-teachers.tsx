import { getTranslations } from "next-intl/server";
import { User, Star, ChevronLeft } from "lucide-react";
import { Link } from "@/src/i18n/navigation";
import { Section } from "@/src/components/ui/section";
import { Reveal } from "@/src/components/ui/reveal";
import { STUDENT_TEACHERS } from "@/src/features/marketing/data";

export async function StudentTeachersSection() {
  const t = await getTranslations("studentLanding.teachers");

  return (
    <Section id="teachers" className="bg-white">
      <Reveal>
        <div className="mb-4 text-center">
          <span className="inline-block rounded-full bg-brand-100 px-4 py-1.5 text-xs font-bold text-brand-600">
            {t("badge")}
          </span>
        </div>
        <h2 className="text-gradient mb-3 text-center text-3xl font-black md:text-4xl">
          {t("heading")}
        </h2>
        <p className="mx-auto mb-10 max-w-2xl text-center text-sm text-muted">
          {t("subtitle")}
        </p>
      </Reveal>

      <div className="grid gap-5 md:grid-cols-3">
        {STUDENT_TEACHERS.map(({ key, tagClass }, i) => (
          <Reveal key={key} delay={i * 80} className="h-full">
            <div className="flex h-full flex-col rounded-2xl border border-brand-200/70 bg-white p-5">
              <div className="flex items-start justify-between">
                <div className="grid size-14 place-items-center rounded-full bg-brand-100">
                  <User className="size-6 text-brand-600" />
                </div>
                <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-bold ${tagClass}`}>
                  {t(`${key}.subject`)}
                </span>
              </div>

              <p className="mt-3 text-start text-base font-bold text-ink">
                {t(`${key}.name`)}
              </p>
              <p className="text-start text-xs text-muted">
                {t(`${key}.role`)}
              </p>

              <div className="mt-3 flex items-center gap-2 text-start">
                {[...Array(5)].map((_, s) => (
                  <Star key={s} className="size-3 fill-accent-500 text-accent-500" />
                ))}
                <span className="text-xs font-bold text-ink">{t(`${key}.rating`)}</span>
                <span className="text-xs text-muted">·</span>
                <span className="text-xs text-muted">{t(`${key}.students`)}</span>
              </div>

              <div className="mt-auto pt-4">
                <Link
                  href="/teachers"
                  className="flex w-full items-center justify-center rounded-full border border-brand-200/70 py-2.5 text-sm font-bold text-ink transition-colors hover:bg-brand-100/50"
                >
                  {t("cta")}
                </Link>
              </div>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal delay={160}>
        <div className="mt-6 text-center">
          <Link
            href="/teachers"
            className="inline-flex items-center gap-1 text-sm font-bold text-brand-600"
          >
            {t("viewAll")}
            <ChevronLeft className="size-3.5" />
          </Link>
        </div>
      </Reveal>
    </Section>
  );
}
