"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { useRouter } from "@/src/i18n/navigation";
import type { Teacher } from "../../types";
import Navbar from "@/src/features/landing/components/client/navbar";
import TeacherProfileView from "./teacher-profile-view";
import Footer from "@/src/features/landing/components/server/footer";
import { MotionProvider } from "@/src/components/ui/motion-provider";
import { useDarkMode } from "@/src/lib/use-dark-mode";

const AuthModal = dynamic(
  () => import("@/src/features/landing/components/client/auth-modal"),
  { ssr: false },
);
const ToastNotification = dynamic(() => import("./toast-notification"), {
  ssr: false,
});

export default function TeacherProfileShell({
  teacher,
  locale,
}: {
  teacher: Teacher;
  locale: string;
}) {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signup");
  const [isDarkMode, setIsDarkMode] = useDarkMode();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const router = useRouter();

  const openAuth = (mode: "signin" | "signup") => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  const homeHref = locale === "ar" ? "/" : `/${locale}`;

  return (
    <MotionProvider>
    <div className="min-h-screen bg-page text-ink font-readex">
      <Navbar
        onOpenAuth={openAuth}
        onSearchChange={() => undefined}
        searchQuery=""
        showSearch={false}
        landingBaseHref={homeHref}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode((current) => !current)}
        onGoHome={() => router.push("/")}
      />
      <main>
        <TeacherProfileView
          key={teacher.courses.map((course) => `${course.id}:${course.isSubscribed}`).join("|")}
          teacher={teacher}
          onRequireAuth={() => openAuth("signin")}
        />
      </main>
      <Footer homeHref={homeHref} />
      {authModalOpen && (
        <AuthModal
          isOpen
          initialMode={authMode}
          onClose={() => setAuthModalOpen(false)}
          onSuccess={(name) => {
            setToastMessage(`مرحباً بك يا ${name}!`);
            router.refresh();
          }}
        />
      )}
      {toastMessage && (
        <ToastNotification
          message={toastMessage}
          onClear={() => setToastMessage(null)}
        />
      )}
    </div>
    </MotionProvider>
  );
}
