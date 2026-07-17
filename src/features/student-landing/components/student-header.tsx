"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/src/i18n/navigation";
import { LocaleSwitcher } from "@/src/components/locale-switcher";
import { GraduationCap, Menu, X } from "lucide-react";
import { Button } from "@/src/components/ui/button";

export default function StudentHeader() {
  const [open, setOpen] = useState(false);
  const tNav = useTranslations("studentLanding.hero");
  const tLinks = useTranslations("studentLanding.nav");
  const tBrand = useTranslations("brand");

  return (
    <header className="sticky top-0 z-50 border-b border-brand-100 bg-white/80 backdrop-blur" style={{ height: "72px" }}>
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-4">
        <Link
          href="/"
          className="flex items-center gap-2 font-bold text-ink"
        >
          <GraduationCap className="size-5 text-brand-600" />
          {tBrand("name")}
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <a href="#teachers" className="text-sm font-medium text-muted hover:text-brand-600 motion-safe:transition-colors">
            {tLinks("teachers")}
          </a>
          <a href="#courses" className="text-sm font-medium text-muted hover:text-brand-600 motion-safe:transition-colors">
            {tLinks("courses")}
          </a>
          <a href="#why" className="text-sm font-medium text-muted hover:text-brand-600 motion-safe:transition-colors">
            {tLinks("features")}
          </a>
          <a href="#how" className="text-sm font-medium text-muted hover:text-brand-600 motion-safe:transition-colors">
            {tLinks("how")}
          </a>
          <a href="#stories" className="text-sm font-medium text-muted hover:text-brand-600 motion-safe:transition-colors">
            {tLinks("testimonials")}
          </a>
          <a href="#faq" className="text-sm font-medium text-muted hover:text-brand-600 motion-safe:transition-colors">
            {tLinks("faq")}
          </a>
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <LocaleSwitcher />
          <Link
            href="/login"
            className="text-sm font-medium text-muted hover:text-brand-600 motion-safe:transition-colors"
          >
            {tNav("ctaSignin")}
          </Link>
          <Button variant="primary" className="text-ink">
            {tNav("ctaSignup")}
          </Button>
        </div>

        <button
          type="button"
          className="md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>

      {open && (
        <div id="mobile-menu" className="border-t border-brand-100 bg-page px-4 pb-4 pt-2 md:hidden">
          <div className="flex flex-col gap-3 pt-2">
            <a href="#why" className="text-sm font-medium text-muted" onClick={() => setOpen(false)}>{tLinks("features")}</a>
            <a href="#courses" className="text-sm font-medium text-muted" onClick={() => setOpen(false)}>{tLinks("courses")}</a>
            <a href="#teachers" className="text-sm font-medium text-muted" onClick={() => setOpen(false)}>{tLinks("teachers")}</a>
            <a href="#how" className="text-sm font-medium text-muted" onClick={() => setOpen(false)}>{tLinks("how")}</a>
            <a href="#stories" className="text-sm font-medium text-muted" onClick={() => setOpen(false)}>{tLinks("testimonials")}</a>
            <a href="#faq" className="text-sm font-medium text-muted" onClick={() => setOpen(false)}>{tLinks("faq")}</a>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-brand-100 pt-4">
            <LocaleSwitcher />
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="text-sm font-medium text-muted hover:text-brand-600 motion-safe:transition-colors"
            >
              {tNav("ctaSignin")}
            </Link>
            <Button variant="primary" className="ms-auto text-ink">
              {tNav("ctaSignup")}
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
