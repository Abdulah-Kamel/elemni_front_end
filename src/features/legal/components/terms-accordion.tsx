"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { m, useReducedMotion } from "motion/react";
import { ChevronDown } from "lucide-react";

const TERMS_SECTIONS = [0, 1, 2, 3, 4, 5, 6, 7] as const;

export function TermsAccordion() {
  const t = useTranslations("legal.terms");
  const [expandedId, setExpandedId] = useState<number | null>(0);
  const reduce = useReducedMotion() === true;

  function toggle(id: number) {
    setExpandedId(expandedId === id ? null : id);
  }

  return (
    <div className="space-y-3">
      {TERMS_SECTIONS.map((i) => {
        const isOpen = expandedId === i;
        return (
          <div
            key={i}
            className="rounded-xl border border-slate-200 bg-white overflow-hidden dark:border-slate-700 dark:bg-slate-800"
          >
            <button
              type="button"
              id={`terms-btn-${i}`}
              onClick={() => toggle(i)}
              aria-expanded={isOpen}
              aria-controls={`terms-section-${i}`}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-start"
            >
              <span className="text-base font-semibold text-slate-900 dark:text-white">
                {t(`sections.${i}.heading`)}
              </span>
              <span
                className={`shrink-0 transition-transform motion-reduce:transition-none ${isOpen ? "rotate-180" : ""}`}
              >
                <ChevronDown className="h-5 w-5 text-slate-500" />
              </span>
            </button>
            <m.div
              id={`terms-section-${i}`}
              role="region"
              aria-labelledby={`terms-btn-${i}`}
              aria-hidden={!isOpen}
              initial={false}
              animate={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }}
              transition={{ duration: reduce ? 0 : 0.22 }}
              className="overflow-hidden"
            >
              <div className="px-5 pb-5 text-base leading-relaxed text-slate-600 dark:text-slate-300">
                {t(`sections.${i}.content`)}
              </div>
            </m.div>
          </div>
        );
      })}
    </div>
  );
}
