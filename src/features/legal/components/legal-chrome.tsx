"use client";

import { useEffect, useState, type ReactNode } from "react";
import { MotionProvider } from "@/src/components/ui/motion-provider";
import Navbar from "@/src/features/landing/components/client/navbar";

export default function LegalChrome({
  children,
  locale,
  footer,
}: {
  children: ReactNode;
  locale: string;
  footer?: ReactNode;
}) {
  const [isDarkMode, setIsDarkMode] = useState<boolean | null>(null);
  const homeHref = locale === "ar" ? "/" : `/${locale}`;

  useEffect(() => {
    if (localStorage.getItem("elemni-dark-mode") === "true") {
      // Hydrate the persisted browser preference after the server render.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsDarkMode(true);
    }
  }, []);

  useEffect(() => {
    if (isDarkMode === null) return;
    document.documentElement.classList.toggle("dark", isDarkMode);
    localStorage.setItem("elemni-dark-mode", String(isDarkMode));
  }, [isDarkMode]);

  return (
    <MotionProvider>
      <div
        dir={locale === "ar" ? "rtl" : "ltr"}
        className={`min-h-screen bg-[#F9F8FC] text-[#1B1B24] dark:bg-[#0B132B] ${
          locale === "ar"
            ? "font-[family-name:var(--font-cairo)]"
            : "font-[family-name:var(--font-inter)]"
        }`}
      >
        <Navbar
          onOpenAuth={() => undefined}
          onSearchChange={() => undefined}
          searchQuery=""
          showSearch={false}
          landingBaseHref={homeHref}
          isDarkMode={isDarkMode ?? false}
          onToggleDarkMode={() => setIsDarkMode((current) => !current)}
        />
        <main className="pt-24 pb-16">
          {children}
        </main>
        {footer}
      </div>
    </MotionProvider>
  );
}
