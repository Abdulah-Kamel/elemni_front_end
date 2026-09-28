"use client";

import { m } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/src/lib/cn";
import { pageRange } from "./pagination-range";
import "@/src/features/portal/styles/sticker.css";

/**
 * Page navigation for client-side paginated lists. Renders nothing for a
 * single page. `scrollTargetId` brings the list back into view on change.
 */
export function Pagination({
  page,
  totalPages,
  onPageChange,
  label,
  scrollTargetId,
  className,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** Accessible name of the navigation landmark, e.g. "صفحات الكورسات". */
  label?: string;
  scrollTargetId?: string;
  className?: string;
}) {
  const t = useTranslations("pagination");
  const locale = useLocale();
  if (totalPages <= 1) return null;

  // Chevrons point in the reading direction: "next" is to the left in Arabic.
  const PrevIcon = locale === "ar" ? ChevronRight : ChevronLeft;
  const NextIcon = locale === "ar" ? ChevronLeft : ChevronRight;

  const go = (next: number) => {
    if (next < 1 || next > totalPages || next === page) return;
    onPageChange(next);
    if (scrollTargetId) {
      const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      document.getElementById(scrollTargetId)?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    }
  };

  const arrow = "sticker-btn-outline grid size-11 place-items-center text-ink disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-100";

  return (
    <nav aria-label={label ?? t("navigation")} className={cn("mt-10 flex flex-col items-center gap-3", className)}>
      <ul className="flex flex-wrap items-center justify-center gap-2">
        <li>
          <button type="button" onClick={() => go(page - 1)} disabled={page === 1} aria-label={t("previous")} className={arrow}>
            <PrevIcon className="size-4" aria-hidden="true" />
          </button>
        </li>
        {pageRange(page, totalPages).map((token) =>
          typeof token === "number" ? (
            <li key={token}>
              <button
                type="button"
                onClick={() => go(token)}
                aria-label={t("page", { page: token })}
                aria-current={token === page ? "page" : undefined}
                className={cn(
                  "relative grid size-11 place-items-center rounded-full text-sm font-black tabular-nums transition-colors",
                  token === page ? "text-white" : "sticker-btn-outline text-ink dark:text-slate-100",
                )}
              >
                {token === page && (
                  <m.span
                    layoutId={`pagination-current-${label ?? "list"}`}
                    className="absolute inset-0 rounded-full border-2 border-ink bg-brand-600 shadow-[2px_2px_0_0_var(--color-ink)] dark:border-brand-300 dark:shadow-[2px_2px_0_0_#020617]"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative">{token}</span>
              </button>
            </li>
          ) : (
            <li key={token} aria-hidden="true" className="grid size-11 place-items-center text-sm font-black text-muted dark:text-slate-400">
              …
            </li>
          ),
        )}
        <li>
          <button type="button" onClick={() => go(page + 1)} disabled={page === totalPages} aria-label={t("next")} className={arrow}>
            <NextIcon className="size-4" aria-hidden="true" />
          </button>
        </li>
      </ul>
      <p className="text-xs font-bold text-muted tabular-nums dark:text-slate-400">{t("status", { page, total: totalPages })}</p>
    </nav>
  );
}
