"use client";

import type { ReactNode } from "react";
import { MotionProvider } from "@/src/components/ui/motion-provider";
import Navbar from "@/src/features/landing/components/client/navbar";
import Footer from "@/src/features/landing/components/server/footer";
import { useDarkMode } from "@/src/lib/use-dark-mode";

export default function AuthChrome({
  children,
  locale,
}: {
  children: ReactNode;
  locale: string;
}) {
  const [isDarkMode, setIsDarkMode] = useDarkMode();
  const homeHref = locale === "ar" ? "/" : `/${locale}`;

  return (
    <MotionProvider>
      <div dir="rtl" className="min-h-screen bg-[#F9F8FC] font-readex text-[#1B1B24] dark:bg-[#0B132B] dark:text-slate-100">
        <Navbar
          onOpenAuth={() => undefined}
          onSearchChange={() => undefined}
          searchQuery=""
          showSearch={false}
          landingBaseHref={homeHref}
          isDarkMode={isDarkMode}
          onToggleDarkMode={() => setIsDarkMode((current) => !current)}
        />
        <main className="flex min-h-[calc(100vh-5rem)] items-center justify-center px-4 pb-16 pt-32 sm:px-6 sm:pb-20 sm:pt-36">
          {children}
        </main>
        <Footer homeHref={homeHref} />
      </div>
    </MotionProvider>
  );
}
