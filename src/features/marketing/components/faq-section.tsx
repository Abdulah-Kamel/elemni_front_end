"use client";

import { useId, useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";
import { cn } from "@/src/lib/cn";
import { Reveal } from "@/src/components/ui/reveal";

const FAQ_KEYS = ["q1", "q2", "q3", "q4", "q5", "q6"] as const;
const ANSWER_KEYS = ["a1", "a2", "a3", "a4", "a5", "a6"] as const;

export function FaqSection() {
  const t = useTranslations("faq");
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const baseId = useId();

  return (
    <section id="faq" className="bg-white py-16 md:py-24">
      <div className="mx-auto max-w-3xl px-4">
        <Reveal>
          <h2 className="text-center text-3xl font-black text-brand-700 md:text-4xl">
            {t("heading")}
          </h2>
          <p className="mt-3 text-center text-muted">{t("subtitle")}</p>
        </Reveal>

        <div className="mt-12 space-y-3">
          {FAQ_KEYS.map((key, i) => {
            const isOpen = openIndex === i;
            const panelId = `${baseId}-panel-${i}`;
            const buttonId = `${baseId}-button-${i}`;

            return (
              <Reveal key={key} delay={i * 60}>
                <div className="rounded-2xl bg-white px-5 shadow-soft ring-1 ring-brand-100">
                  <h3>
                    <button
                      type="button"
                      id={buttonId}
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      onClick={() => setOpenIndex(isOpen ? null : i)}
                      className="flex w-full items-center justify-between gap-4 py-5 text-start font-bold text-brand-700"
                    >
                      <span>{t(key)}</span>
                      <ChevronDown
                        aria-hidden
                        className={cn(
                          "size-5 shrink-0 text-brand-400",
                          "motion-safe:transition-transform motion-safe:duration-300",
                          isOpen && "rotate-180",
                        )}
                      />
                    </button>
                  </h3>
                  <div
                    id={panelId}
                    role="region"
                    aria-labelledby={buttonId}
                    className={cn(
                      "grid motion-safe:transition-all motion-safe:duration-300",
                      isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                    )}
                  >
                    <div className="overflow-hidden">
                      <p className="pb-5 text-muted">{t(ANSWER_KEYS[i])}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
