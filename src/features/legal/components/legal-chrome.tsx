"use client";

import type { ReactNode } from "react";
import { MotionProvider } from "@/src/components/ui/motion-provider";
import Navbar from "@/src/features/landing/components/client/navbar";
import { useDarkMode } from "@/src/lib/use-dark-mode";

export default function LegalChrome({
  children,
  locale,
  footer,
}: {
  children: ReactNode;
  locale: string;
  footer?: ReactNode;
}) {
  const [isDarkMode, setIsDarkMode] = useDarkMode();
  const homeHref = locale === "ar" ? "/" : `/${locale}`;

  return (
    <MotionProvider>
      <div
        dir={locale === "ar" ? "rtl" : "ltr"}
        className="min-h-screen bg-[#F9F8FC] font-[family-name:var(--font-readex-pro)] text-[#1B1B24] dark:bg-[#0B132B]"
      >
        <Navbar
          onOpenAuth={() => undefined}
          onSearchChange={() => undefined}
          searchQuery=""
          showSearch={false}
          landingBaseHref={homeHref}
          isDarkMode={isDarkMode}
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
