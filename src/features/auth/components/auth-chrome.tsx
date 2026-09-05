"use client";

import { useEffect, useState, type ReactNode } from "react";
import { MotionProvider } from "@/src/components/ui/motion-provider";
import Navbar from "@/src/features/landing/components/client/navbar";
import Footer from "@/src/features/landing/components/server/footer";

export default function AuthChrome({
  children,
  locale,
}: {
  children: ReactNode;
  locale: string;
}) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const homeHref = locale === "ar" ? "/" : `/${locale}`;

  useEffect(() => {
    if (localStorage.getItem("elemni-dark-mode") === "true") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsDarkMode(true);
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode);
    localStorage.setItem("elemni-dark-mode", String(isDarkMode));
  }, [isDarkMode]);

  return (
    <MotionProvider>
      <div dir="rtl" className="min-h-screen bg-[#F9F8FC] font-readex text-[#1B1B24] dark:bg-[#0B132B]">
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
