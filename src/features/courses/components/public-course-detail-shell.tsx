"use client";

import type { ReactNode } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "@/src/i18n/navigation";
import { MotionProvider } from "@/src/components/ui/motion-provider";
import Navbar from "@/src/features/landing/components/client/navbar";
import Footer from "@/src/features/landing/components/server/footer";
import { useDarkMode } from "@/src/lib/use-dark-mode";

export default function PublicCourseDetailShell({
  children,
}: {
  children: ReactNode;
}) {
  const locale = useLocale();
  const router = useRouter();
  const [isDarkMode, setIsDarkMode] = useDarkMode();
  const homeHref = locale === "ar" ? "/" : `/${locale}`;

  return (
    <MotionProvider>
      <div
        data-testid="public-course-detail-shell"
        className="min-h-screen bg-[#F8FAFC] text-[#0F172A] antialiased dark:bg-[#0B132B] dark:text-[#F8FAFC]"
      >
        <Navbar
          onOpenAuth={(mode) => router.push(mode === "signup" ? "/register" : "/login")}
          onSearchChange={() => undefined}
          searchQuery=""
          showSearch={false}
          landingBaseHref={homeHref}
          isDarkMode={isDarkMode}
          onToggleDarkMode={() => setIsDarkMode((current) => !current)}
          onGoHome={() => router.push("/")}
        />
        <main className="pt-24 sm:pt-28">{children}</main>
        <Footer homeHref={homeHref} />
      </div>
    </MotionProvider>
  );
}
