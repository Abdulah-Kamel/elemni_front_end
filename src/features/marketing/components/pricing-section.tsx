import { getTranslations } from "next-intl/server";
import { MessageCircle, ShieldCheck } from "lucide-react";
import { Section } from "@/src/components/ui/section";
import { Button } from "@/src/components/ui/button";
import { Reveal } from "@/src/components/ui/reveal";

/**
 * The pricing model is not decided yet, so this section deliberately shows NO
 * tiers, prices, or commission rates — only a contact CTA. Do not reintroduce
 * numbers here from the design mockups; when pricing exists it is owned by the
 * API, not this repo (see CLAUDE.md "Money"). The originally transcribed tier
 * copy is kept in the team's internal planning docs for when that day comes.
 */
export async function PricingSection() {
  const t = await getTranslations("pricing");

  return (
    <Section className="bg-brand-50" id="pricing">
      <Reveal>
        <div className="mx-auto max-w-3xl rounded-card bg-white p-8 text-center shadow-soft md:p-12">
          <span className="mx-auto mb-5 grid size-14 place-items-center rounded-2xl bg-brand-100 text-brand-600">
            <MessageCircle className="size-7" />
          </span>

          <h2 className="text-3xl font-bold text-brand-900 md:text-4xl">
            {t("heading")}
          </h2>

          <div className="mt-8">
            <Button variant="primary" className="motion-safe:hover:-translate-y-0.5">
              {t("cta")}
            </Button>
          </div>

          <p className="mt-6 flex items-center justify-center gap-2 text-sm text-muted">
            <ShieldCheck className="size-4 shrink-0 text-success-700" />
            {t("note")}
          </p>
        </div>
      </Reveal>
    </Section>
  );
}
