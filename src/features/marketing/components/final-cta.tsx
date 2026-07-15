import { getTranslations } from "next-intl/server";
import { GraduationCap } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Section } from "@/src/components/ui/section";
import { Reveal } from "@/src/components/ui/reveal";

export async function FinalCta() {
  const t = await getTranslations("finalCta");

  return (
    <Section className="relative overflow-hidden bg-cta-gradient text-center text-white">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-20 start-[-4rem] size-64 rounded-full bg-white/10 blur-3xl motion-safe:animate-float" />
        <div
          className="absolute bottom-[-5rem] end-[-3rem] size-72 rounded-full bg-accent-400/20 blur-3xl motion-safe:animate-float"
          style={{ animationDelay: "2s" }}
        />
        <div
          className="absolute top-1/2 end-1/4 size-40 rounded-full bg-brand-300/20 blur-3xl motion-safe:animate-float"
          style={{ animationDelay: "4s" }}
        />
      </div>

      <Reveal className="relative">
        <h2 className="text-3xl font-black md:text-4xl">{t("heading")}</h2>
        <p className="mx-auto mt-3 max-w-2xl text-white/80">{t("subtitle")}</p>

        {/* TODO: wire to signup — decorative until the auth flow exists */}
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <input
            type="email"
            placeholder={t("emailPlaceholder")}
            aria-label={t("emailPlaceholder")}
            className="w-full max-w-xs rounded-full px-6 py-3 text-ink outline-none ring-2 ring-transparent focus-visible:ring-accent-400 sm:w-auto"
          />
          <Button variant="primary" className="motion-safe:hover:-translate-y-0.5">
            {t("cta")}
          </Button>
        </div>

        <p className="mt-6 flex items-center justify-center gap-2 text-sm text-white/70">
          <GraduationCap className="size-4" />
          {t("note")}
        </p>
      </Reveal>
    </Section>
  );
}
