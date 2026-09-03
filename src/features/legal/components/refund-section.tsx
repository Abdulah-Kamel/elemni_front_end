"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { m, useReducedMotion } from "motion/react";
import { ChevronDown } from "lucide-react";
import { SUPPORT_PHONE } from "@/src/features/contact/contact-details";

type SectionKey = "eligibility" | "nonRefundable" | "process";

const REFUND_SECTIONS: SectionKey[] = ["eligibility", "nonRefundable", "process"];

const REFUND_ITEM_COUNTS: Record<SectionKey, number> = {
  eligibility: 3,
  nonRefundable: 4,
  process: 4,
};

export function RefundSection() {
  const t = useTranslations("legal.refund");
  const [expandedId, setExpandedId] = useState<SectionKey | null>("eligibility");
  const reduce = useReducedMotion() === true;

  function toggle(id: SectionKey) {
    setExpandedId(expandedId === id ? null : id);
  }

  return (
    <div className="space-y-3">
      <p className="text-base text-slate-600 dark:text-slate-300 mb-4">
        {t("intro")}
      </p>
      {REFUND_SECTIONS.map((key) => {
        const isOpen = expandedId === key;
        return (
          <div
            key={key}
            className="rounded-xl border border-slate-200 bg-white overflow-hidden dark:border-slate-700 dark:bg-slate-800"
          >
            <button
              type="button"
              id={`refund-btn-${key}`}
              onClick={() => toggle(key)}
              aria-expanded={isOpen}
              aria-controls={`refund-section-${key}`}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-start"
            >
              <span className="text-base font-semibold text-slate-900 dark:text-white">
                {t(`${key}.title`)}
              </span>
              <span
                className={`shrink-0 transition-transform motion-reduce:transition-none ${isOpen ? "rotate-180" : ""}`}
              >
                <ChevronDown className="h-5 w-5 text-slate-500" />
              </span>
            </button>
            <m.div
              id={`refund-section-${key}`}
              role="region"
              aria-labelledby={`refund-btn-${key}`}
              aria-hidden={!isOpen}
              initial={false}
              animate={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }}
              transition={{ duration: reduce ? 0 : 0.22 }}
              className="overflow-hidden"
            >
              <div className="px-5 pb-5">
                {key === "process" ? (
                  <ol className="list-decimal list-inside space-y-2 text-base text-slate-600 dark:text-slate-300">
                    {Array.from({ length: REFUND_ITEM_COUNTS[key] }, (_, i) => i).map((i) => (
                      <li key={i}>{t(`${key}.steps.${i}`)}</li>
                    ))}
                  </ol>
                ) : (
                  <ul className="list-disc list-inside space-y-2 text-base text-slate-600 dark:text-slate-300">
                    {Array.from({ length: REFUND_ITEM_COUNTS[key] }, (_, i) => i).map((i) => (
                      <li key={i}>{t(`${key}.items.${i}`)}</li>
                    ))}
                  </ul>
                )}
              </div>
            </m.div>
          </div>
        );
      })}
      <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
        {t("contact", { phone: SUPPORT_PHONE })}
      </p>
    </div>
  );
}
