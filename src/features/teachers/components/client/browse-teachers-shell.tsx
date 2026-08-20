"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import type { GradeDto, StreamDto } from "@/src/lib/student-api/contract";
import type { TeacherSummary } from "../../types";
import { MotionProvider } from "@/src/components/ui/motion-provider";
import BrowseTeachersView from "./browse-teachers-view";
import Navbar from "@/src/features/landing/components/client/navbar";
import Footer from "@/src/features/landing/components/server/footer";

const AuthModal = dynamic(
  () => import("@/src/features/landing/components/client/auth-modal"),
  { ssr: false },
);

export default function BrowseTeachersShell({
  locale,
  teachers,
  grades,
  streams,
  loadError,
}: {
  locale: string;
  teachers: TeacherSummary[];
  grades: GradeDto[];
  streams: StreamDto[];
  loadError: boolean;
}) {
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [isDarkMode, setIsDarkMode] = useState(false);

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

  const openAuth = (mode: "signin" | "signup") => {
    setAuthMode(mode);
    setAuthOpen(true);
  };
  const homeHref = locale === "ar" ? "/" : `/${locale}`;

  return (
    <MotionProvider>
      <div className="min-h-screen bg-page font-cairo text-ink">
        <Navbar
          onOpenAuth={openAuth}
          onSearchChange={() => undefined}
          searchQuery=""
          showSearch={false}
          landingBaseHref={homeHref}
          isDarkMode={isDarkMode}
          onToggleDarkMode={() => setIsDarkMode((current) => !current)}
        />
        <main className="pt-20">
          <BrowseTeachersView teachers={teachers} grades={grades} streams={streams} loadError={loadError} />
        </main>
        <Footer homeHref={homeHref} />
        {authOpen && (
          <AuthModal
            isOpen
            initialMode={authMode}
            onClose={() => setAuthOpen(false)}
            onSuccess={() => undefined}
          />
        )}
      </div>
    </MotionProvider>
  );
}
