"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, type ReactNode } from "react";
import type { TeacherSummary } from "../../types";
import type { GradeDto, StreamDto } from "@/src/lib/student-api/contract";
import { MotionProvider } from "@/src/components/ui/motion-provider";
import Navbar from "./navbar";
import Hero from "../server/hero";
import TeacherGrid from "../server/teacher-grid";
import InteractiveQuiz from "./interactive-quiz";
import LandingRevealController from "./landing-reveal-controller";
import { useRouter } from "@/src/i18n/navigation";

const VideoModal = dynamic(() => import("./video-modal"), { ssr: false });

interface LandingInteractiveShellProps {
  teachers: TeacherSummary[];
  teachersLoadError: boolean;
  grades: GradeDto[];
  streams: StreamDto[];
  afterTeachers: ReactNode;
  afterQuiz: ReactNode;
  footer: ReactNode;
  floatingActions: ReactNode;
}

export default function LandingInteractiveShell({
  teachers,
  teachersLoadError,
  grades,
  streams,
  afterTeachers,
  afterQuiz,
  footer,
  floatingActions,
}: LandingInteractiveShellProps) {
  const router = useRouter();
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("elemni-dark-mode");
    if (stored === "true") {
      // Hydrate the persisted browser preference after the server render.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("elemni-dark-mode", "true");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("elemni-dark-mode", "false");
    }
  }, [isDarkMode]);

  const handleOpenAuth = (mode: "signin" | "signup") => {
    router.push(mode === "signup" ? "/register" : "/login");
  };

  const scrollToTeachers = () => {
    document.getElementById("teachers")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <MotionProvider>
    <div dir="rtl" className="landing-shell min-h-screen bg-[#F8FAFC] text-[#0F172A] antialiased selection:bg-[#0284C7] selection:text-white dark:bg-[#0B132B] dark:text-[#F8FAFC]">
      <LandingRevealController />

      <Navbar
        onOpenAuth={handleOpenAuth}
        onSearchChange={setSearchQuery}
        searchQuery={searchQuery}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode((prev) => !prev)}
      />

      <main className="landing-content">
        <Hero
          onOpenAuth={handleOpenAuth}
          onOpenVideoTour={() => setVideoModalOpen(true)}
          onExploreTeachers={scrollToTeachers}
        />
        <TeacherGrid teachers={teachers} grades={grades} streams={streams} searchQuery={searchQuery} loadError={teachersLoadError} />
        {afterTeachers}
        <InteractiveQuiz onExploreTeachers={scrollToTeachers} />
        {afterQuiz}
      </main>

      {footer}
      {floatingActions}

      {videoModalOpen && (
        <VideoModal
          isOpen
          onClose={() => setVideoModalOpen(false)}
        />
      )}
    </div>
    </MotionProvider>
  );
}
