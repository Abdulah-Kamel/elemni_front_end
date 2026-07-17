"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/src/i18n/navigation";
import { cn } from "@/src/lib/cn";

export function LocaleSwitcher({ className }: { className?: string }) {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const isAr = locale === "ar";

  const change = (next: string) => {
    if (next === locale) return;
    router.replace(pathname, { locale: next, scroll: false });
  };

  return (
    <div
      className={cn(
        "relative inline-grid w-[88px] grid-cols-2 rounded-full border border-brand-200 bg-white",
        className,
      )}
    >
      <div
        className={cn(
          "absolute inset-y-0 start-0 w-1/2 rounded-full bg-brand-600 motion-safe:transition-transform motion-safe:duration-200",
          isAr ? "translate-x-0" : "ltr:translate-x-full rtl:-translate-x-full",
        )}
      />
      <button
        type="button"
        onClick={() => change("ar")}
        aria-pressed={isAr}
        className={cn(
          "relative z-10 rounded-full px-3 py-1.5 text-xs font-bold motion-safe:transition-colors cursor-pointer",
          isAr ? "text-white" : "text-muted hover:text-ink",
        )}
      >
        ع
      </button>
      <button
        type="button"
        onClick={() => change("en")}
        aria-pressed={!isAr}
        className={cn(
          "relative z-10 rounded-full px-3 py-1.5 text-xs font-bold motion-safe:transition-colors cursor-pointer",
          !isAr ? "text-white" : "text-muted hover:text-ink",
        )}
      >
        EN
      </button>
    </div>
  );
}
