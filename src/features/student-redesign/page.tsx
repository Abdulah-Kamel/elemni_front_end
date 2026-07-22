"use client";

import { useState, useEffect } from "react";
import "./redesign.css";

import { TEACHERS_DATA } from "./data/mock-data";
import type { Teacher } from "./types";

import Navbar from "./components/client/navbar";
import Hero from "./components/server/hero";
import TeacherGrid from "./components/server/teacher-grid";
import Features from "./components/server/features";
import SubjectGrid from "./components/server/subject-grid";
import FeaturedLessons from "./components/server/featured-lessons";
import BentoGrid from "./components/server/bento-grid";
import StepsSection from "./components/server/steps-section";
import Comparison from "./components/server/comparison";
import MobileApp from "./components/server/mobile-app";
import InteractiveQuiz from "./components/client/interactive-quiz";
import Testimonials from "./components/server/testimonials";
import FaqSection from "./components/client/faq-section";
import FinalCta from "./components/server/final-cta";
import Footer from "./components/server/footer";
import AuthModal from "./components/client/auth-modal";
import TeacherModal from "./components/client/teacher-modal";
import VideoModal from "./components/client/video-modal";
import ToastNotification from "./components/client/toast-notification";
import WhatsAppButton from "./components/client/whatsapp-button";

export default function StudentLandingPage() {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signup");
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("elemni-dark-mode");
    if (stored === "true") {
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

  useEffect(() => {
    const notifications = [
      "🎉 انضم للتو الطالب يوسف من القاهرة إلى كورس الفيزياء مع د. محمود صبري!",
      "⭐ اشترك 18 طالباً في كورس الرياضيات التطبيقية مع أ. أحمد المنصوري",
      "🔥 تم رفع بنك أسئلة جديد لمادة الأحياء (الصف الثالث الثانوي)",
      "⚡ انضمام أكثر من 200 طالب جديد هذا الأسبوع للكورسات التفاعلية",
    ];
    const timer = setTimeout(() => {
      setToastMessage(notifications[Math.floor(Math.random() * notifications.length)]);
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  const handleOpenAuth = (mode: "signin" | "signup") => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  const handleAuthSuccess = (userName: string) => {
    setToastMessage(`مرحباً بك يا ${userName}! تم إنشاء حسابك بنجاح على منصة إعلمني.`);
  };

  const handleBookTeacher = (teacher: Teacher, courseTitle?: string) => {
    if (courseTitle) {
      setToastMessage(`تم تقديم طلبك للاشتراك في "${courseTitle}" مع المعلم ${teacher.name}! سننتقل معك للتفعيل.`);
    } else {
      setSelectedTeacher(teacher);
    }
  };

  const handleExploreFeature = (featureId: string) => {
    if (featureId === "f2") {
      const quizElement = document.getElementById("quiz");
      quizElement?.scrollIntoView({ behavior: "smooth" });
    } else {
      handleOpenAuth("signup");
    }
  };

  const scrollToTeachers = () => {
    const el = document.getElementById("teachers");
    el?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B132B] text-[#0F172A] dark:text-[#F8FAFC] font-cairo antialiased selection:bg-[#0284C7] selection:text-white dir-rtl">
      <ToastNotification message={toastMessage} onClear={() => setToastMessage(null)} />

      <Navbar
        onOpenAuth={handleOpenAuth}
        onSearchChange={setSearchQuery}
        searchQuery={searchQuery}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode((prev) => !prev)}
      />

      <main>
        <Hero onOpenAuth={handleOpenAuth} onOpenVideoTour={() => setVideoModalOpen(true)} onExploreTeachers={scrollToTeachers} />
        <TeacherGrid teachers={TEACHERS_DATA} onSelectTeacher={(t) => setSelectedTeacher(t)} onBookTeacher={(t) => handleBookTeacher(t)} searchQuery={searchQuery} />
        <Features onExploreFeature={handleExploreFeature} />
        <SubjectGrid />
        <FeaturedLessons />
        <BentoGrid />
        <StepsSection />
        <Comparison />
        <MobileApp />
        <InteractiveQuiz onExploreTeachers={scrollToTeachers} />
        <Testimonials />
        <FaqSection />
        <FinalCta />
      </main>

      <Footer />
      <WhatsAppButton />

      <AuthModal isOpen={authModalOpen} initialMode={authMode} onClose={() => setAuthModalOpen(false)} onSuccess={handleAuthSuccess} />
      <TeacherModal teacher={selectedTeacher} onClose={() => setSelectedTeacher(null)} onBook={handleBookTeacher} />
      <VideoModal isOpen={videoModalOpen} onClose={() => setVideoModalOpen(false)} />
    </div>
  );
}
