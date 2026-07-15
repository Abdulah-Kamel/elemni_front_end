import Image from "next/image";
import { getTranslations, getLocale } from "next-intl/server";
import { Clock } from "lucide-react";
import { Section } from "@/src/components/ui/section";
import { Button } from "@/src/components/ui/button";
import { Reveal } from "@/src/components/ui/reveal";
import { LESSONS } from "@/src/features/marketing/data";

const FILTERS = [
  { key: "physics", active: true },
  { key: "chemistry", active: false },
  { key: "thirdSec", active: true },
  { key: "secondSec", active: false },
  { key: "sciMath", active: false },
  { key: "sciBio", active: true },
] as const;

export default async function CurriculumSection() {
  const t = await getTranslations("curriculum");
  const locale = await getLocale();
  const isAr = locale === "ar";

  return (
    <Section className="bg-brand-50" id="curriculum">
      <Reveal>
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-brand-900 md:text-4xl">
            {t("heading")}
          </h2>
          <p className="mt-4 text-lg text-brand-600">{t("subtitle")}</p>
        </div>
      </Reveal>

      {/* Decorative filter chips — display only, not interactive */}
      <Reveal delay={80}>
        <div
          aria-hidden
          className="mt-10 flex flex-wrap items-center justify-center gap-3"
        >
          {FILTERS.map((f) => (
            <span
              key={f.key}
              className={
                f.active
                  ? "rounded-full bg-brand-600 px-4 py-2 text-sm font-medium text-white motion-safe:transition-transform motion-safe:hover:scale-105"
                  : "rounded-full border border-brand-200 bg-white px-4 py-2 text-sm font-medium text-brand-700 motion-safe:transition-transform motion-safe:hover:scale-105"
              }
            >
              {t(`filters.${f.key}`)}
            </span>
          ))}
        </div>
      </Reveal>

      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {LESSONS.map((lesson, i) => (
          <Reveal key={lesson.key} delay={i * 80}>
            <div className="h-full rounded-3xl bg-white p-4 shadow-soft motion-safe:transition-all motion-safe:duration-300 motion-safe:hover:-translate-y-2 motion-safe:hover:shadow-lift">
              <div className="relative aspect-video overflow-hidden rounded-2xl">
                <Image
                  src={lesson.image}
                  alt=""
                  width={640}
                  height={360}
                  className="size-full object-cover"
                />
                <span className="absolute end-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/50 px-2 py-1 text-xs text-white">
                  <Clock className="size-3" />
                  {isAr ? lesson.duration : lesson.durationEn}
                </span>
              </div>
              <div className="mt-4 space-y-2">
                <span className="inline-block rounded-full bg-brand-100 px-3 py-0.5 text-xs font-medium text-brand-700">
                  {t(`lessons.${lesson.key}.chapter`)}
                </span>
                <h3 className="text-lg font-bold text-brand-900">
                  {t(`lessons.${lesson.key}.title`)}
                </h3>
                <p className="text-sm text-brand-500">
                  {t(`lessons.${lesson.key}.grade`)}
                </p>
                <p className="text-sm font-semibold text-brand-700">
                  {"priceKey" in lesson
                    ? t("free")
                    : t("price", { n: isAr ? lesson.price : lesson.priceEn })}
                </p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal delay={240}>
        <div className="mt-10 text-center">
          <Button variant="outline">{t("cta")}</Button>
        </div>
      </Reveal>
    </Section>
  );
}
