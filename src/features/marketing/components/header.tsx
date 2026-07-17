"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/src/i18n/navigation";
import { LocaleSwitcher } from "@/src/components/locale-switcher";
import { GraduationCap, Menu, X } from "lucide-react";
import { Button } from "@/src/components/ui/button";

const NAV_ITEMS = ["home", "features", "pricing", "faq", "stories"] as const;

export default function Header() {
  const [open, setOpen] = useState(false);
  const tNav = useTranslations("nav");
  const tBrand = useTranslations("brand");

  return (
    <header className="sticky top-0 z-50 border-b border-brand-100 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link
          href="/"
          className="flex items-center gap-2 font-bold text-brand-700"
        >
          <GraduationCap className="size-6" />
          {tBrand("name")}
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {NAV_ITEMS.map((item) => (
            <a
              key={item}
              href={item === "home" ? "#home" : `#${item}`}
              className="text-sm font-medium text-ink hover:text-brand-700 motion-safe:transition-colors"
            >
              {tNav(item)}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <LocaleSwitcher />
          <Link
            href="/login"
            className="text-sm font-medium text-ink hover:text-brand-700 motion-safe:transition-colors"
          >
            {tNav("login")}
          </Link>
          <Button variant="primary">{tNav("cta")}</Button>
        </div>

        <button
          type="button"
          className="md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={tNav("menu")}
        >
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>

      {open && (
        <div
          id="mobile-menu"
          className="border-t border-brand-100 px-4 pb-4 pt-2 md:hidden"
        >
          <nav className="mb-4 flex flex-col gap-3">
            {NAV_ITEMS.map((item) => (
              <a
                key={item}
                href={item === "home" ? "#home" : `#${item}`}
                className="text-sm font-medium text-ink hover:text-brand-700 motion-safe:transition-colors"
                onClick={() => setOpen(false)}
              >
                {tNav(item)}
              </a>
            ))}
          </nav>
          <div className="flex flex-wrap items-center gap-3 border-t border-brand-100 pt-4">
            <LocaleSwitcher />
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="text-sm font-medium text-ink hover:text-brand-700 motion-safe:transition-colors"
            >
              {tNav("login")}
            </Link>
            <Button variant="primary" className="ms-auto">
              {tNav("cta")}
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
