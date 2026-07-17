import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { TrendingUp } from "lucide-react";
import { Section } from "@/src/components/ui/section";
import { Reveal } from "@/src/components/ui/reveal";
import { STUDENT_TESTIMONIALS } from "@/src/features/marketing/data";

export async function StudentTestimonials() {
  const t = await getTranslations("studentLanding.testimonials");

  return (
    <Section className="bg-white" id="stories">
      <Reveal>
        <h2 className="text-gradient mb-12 text-center text-3xl font-bold md:text-4xl">
          {t("heading")}
        </h2>
      </Reveal>

      <div className="grid gap-6 md:grid-cols-3">
        {STUDENT_TESTIMONIALS.map(({ key, avatar }, i) => (
          <Reveal key={key} delay={i * 80} className="h-full">
            <div className="flex h-full flex-col gap-4 rounded-2xl bg-white p-6 border border-brand-200/70 transition-colors hover:border-brand-200">
              <div className="text-start">
                <span
                  aria-hidden
                  className="text-5xl font-black leading-none text-accent-400"
                >
                  {"99"}
                </span>
              </div>

              <p className="leading-relaxed text-brand-700">{t(`${key}.quote`)}</p>

              <div className="border-t border-brand-100 pt-4">
                <div className="flex items-center gap-3">
                  <Image
                    src={avatar}
                    alt=""
                    width={48}
                    height={48}
                    className="size-12 shrink-0 rounded-full"
                  />
                  <div>
                    <p className="font-bold text-brand-900">{t(`${key}.name`)}</p>
                    <p className="text-sm text-muted">{t(`${key}.role`)}</p>
                  </div>
                </div>
              </div>

              <div className="mt-auto inline-flex w-fit items-center gap-1.5 rounded-full bg-success-500/15 px-3 py-1 text-sm font-bold text-success-700">
                <TrendingUp className="size-4" />
                <span>{t(`${key}.result`)}</span>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
