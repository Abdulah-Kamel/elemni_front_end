import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { TeacherGrid } from './components/TeacherGrid';
import { Features } from './components/Features';
import { TeacherJoinCTA } from './components/TeacherJoinCTA';
import { PaymentMethods } from './components/PaymentMethods';
import { Footer } from './components/Footer';
import { WhatsAppButton } from './components/WhatsAppButton';
import { AuthModal } from './components/AuthModal';
import { TeacherModal } from './components/TeacherModal';
import { VideoModal } from './components/VideoModal';
import { ToastNotification } from './components/ToastNotification';
import { TeacherProfile } from './components/TeacherProfile';

import { TEACHERS_DATA } from './data/mockData';
import { Teacher } from './types';

export default function App() {
  // Modal States
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signup');
  
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [activeProfileTeacher, setActiveProfileTeacher] = useState<Teacher | null>(null);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  
  // Search state across navbar and teacher section
  const [searchQuery, setSearchQuery] = useState('');

  // Dark Mode State
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Toast Notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Periodic random engagement toast simulation
  useEffect(() => {
    const notifications = [
      '🎉 انضم للتو الطالب يوسف من القاهرة إلى كورس الفيزياء مع د. محمود صبري!',
      '⭐ اشترك 18 طالباً في كورس الرياضيات التطبيقية مع أ. أحمد المنصوري',
      '🔥 تم رفع بنك أسئلة جديد لمادة الأحياء (الصف الثالث الثانوي)',
      '⚡ انضمام أكثر من 200 طالب جديد هذا الأسبوع للكورسات التفاعلية'
    ];

    const timer = setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * notifications.length);
      setToastMessage(notifications[randomIndex]);
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  const handleOpenAuth = (mode: 'signin' | 'signup') => {
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
    if (featureId === 'f2') {
      const quizElement = document.getElementById('quiz');
      if (quizElement) quizElement.scrollIntoView({ behavior: 'smooth' });
    } else {
      handleOpenAuth('signup');
    }
  };

  const scrollToTeachers = () => {
    const el = document.getElementById('teachers');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B132B] text-[#0F172A] dark:text-[#F8FAFC] font-cairo antialiased selection:bg-[#0284C7] selection:text-white dir-rtl">
      
      {/* Toast Notification */}
      <ToastNotification
        message={toastMessage}
        onClear={() => setToastMessage(null)}
      />

      {/* Header Navbar */}
      <Navbar
        onOpenAuth={handleOpenAuth}
        onSearchChange={setSearchQuery}
        searchQuery={searchQuery}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(prev => !prev)}
        onGoHome={() => {
          setActiveProfileTeacher(null);
          setSearchQuery('');
        }}
      />

      {/* Main Content Sections or Full Teacher Profile View */}
      {activeProfileTeacher ? (
        <TeacherProfile
          teacher={activeProfileTeacher}
          onBack={() => setActiveProfileTeacher(null)}
          onSubscribeCourse={(course, teacherName) => {
            setToastMessage(`تم تقديم طلبك للاشتراك في "${course.title}" مع المعلم ${teacherName}!`);
          }}
          onOpenVideo={() => setVideoModalOpen(true)}
        />
      ) : (
        <main>
          {/* 1. Hero Section */}
          <Hero
            onOpenAuth={handleOpenAuth}
            onOpenVideoTour={() => setVideoModalOpen(true)}
            onExploreTeachers={scrollToTeachers}
          />

          {/* 2. Featured Teachers Grid & Courses */}
          <TeacherGrid
            teachers={TEACHERS_DATA}
            onSelectTeacher={(teacher) => setSelectedTeacher(teacher)}
            onBookTeacher={(teacher) => handleBookTeacher(teacher)}
            onViewFullProfile={(teacher) => setActiveProfileTeacher(teacher)}
            searchQuery={searchQuery}
          />

          {/* 3. Features Section */}
          <Features
            onExploreFeature={handleExploreFeature}
          />

          {/* 4. Payment Methods & Code Sales Outlets */}
          <PaymentMethods />

          {/* 5. Teacher Join Call-To-Action Banner */}
          <TeacherJoinCTA
            onJoinAsTeacher={() => handleOpenAuth('signup')}
          />
        </main>
      )}

      {/* Footer */}
      <Footer />

      {/* Floating WhatsApp Button */}
      <WhatsAppButton />

      {/* Modals */}
      <AuthModal
        isOpen={authModalOpen}
        initialMode={authMode}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />

      <TeacherModal
        teacher={selectedTeacher}
        onClose={() => setSelectedTeacher(null)}
        onBook={handleBookTeacher}
        onViewFullProfile={(teacher) => setActiveProfileTeacher(teacher)}
      />

      <VideoModal
        isOpen={videoModalOpen}
        onClose={() => setVideoModalOpen(false)}
      />

    </div>
  );
}
