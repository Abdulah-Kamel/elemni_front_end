# Student Landing Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the existing Next.js student landing page with the Stitch + Google AI Studio design, ported from `elemni-edtech/`. Blend in unique existing components restyled to the new blue-primary theme.

**Architecture:** Hybrid server/client split under `src/features/student-redesign/`. Server components render static sections (hero, features, grids, footer). Client components handle interactivity (modals, search, dark toggle, quiz, FAQ accordion, toast, WhatsApp). State lifted to page.tsx.

**Tech Stack:** Next.js 16.2, React 19, Tailwind v4, lucide-react. No i18n (Arabic-only). No external state library.

## Global Constraints

- Primary color: `#0284C7` (blue from exported app), not existing indigo `#5145E5`
- All text hardcoded in Arabic (no i18n)
- Dark mode via `.dark` class + localStorage
- All images via external URLs (Unsplash) — no local assets
- Use `cn()` from `@/src/lib/cn` for class merging
- Use `"use client"` directive for interactive components
- Use `Section` wrapper from `@/src/components/ui/section` for sections
- Use `Reveal` from `@/src/components/ui/reveal` for scroll animations (where not conflicting with exported design)
- Max-width `6xl` for section containers
- All component props use inline types with `React.ComponentPropsWithoutRef` spread + `className?: string`
- Static data uses `as const` for type safety

---

### Task 1: Create types and mock data

**Files:**
- Create: `src/features/student-redesign/types.ts`
- Create: `src/features/student-redesign/data/mock-data.ts`

**Interfaces:**
- Produces: `Teacher`, `Course`, `Feature`, `Testimonial`, `FAQItem`, `QuizQuestion` types + all mock data arrays

- [ ] **Step 1: Create types.ts**

Copy from `elemni-edtech/src/types.ts`. Exact content:

```typescript
export interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  duration: string;
  sessionsCount: number;
}

export interface Teacher {
  id: string;
  name: string;
  title: string;
  subject: string;
  category: string;
  grade: string;
  gradeLabel: string;
  avatar: string;
  studentCount: number;
  experienceYears: number;
  pricePerSession: number;
  bio: string;
  videoUrl?: string;
  featured?: boolean;
  specialties: string[];
  schedule: string[];
  courses: Course[];
}

export interface Feature {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  description: string;
  bullets: string[];
  color: string;
}

export interface Testimonial {
  id: string;
  name: string;
  grade: string;
  school: string;
  score: string;
  avatar: string;
  comment: string;
  teacherName: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export interface QuizQuestion {
  id: number;
  subject: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}
```

- [ ] **Step 2: Create data/mock-data.ts**

Copy from `elemni-edtech/src/data/mockData.ts`. Import types from `../types`. Export all arrays: `TEACHERS_DATA`, `FEATURES_DATA`, `TESTIMONIALS`, `QUIZ_QUESTIONS`, `FAQ_ITEMS`. Use `as const` where applicable. The full content is ~430 lines from the exported app — copy verbatim.

- [ ] **Step 3: Create directory structure**

```bash
mkdir -p src/features/student-redesign/components/client
mkdir -p src/features/student-redesign/components/server
mkdir -p src/features/student-redesign/data
```

---

### Task 2: Create page-level CSS with blue theme tokens

**Files:**
- Create: `src/features/student-redesign/redesign.css`

**Interfaces:**
- Produces: Custom CSS file with `@theme` block (blue primary) + dark mode utilities

- [ ] **Step 1: Write redesign.css**

```css
@layer theme {
  @theme {
    --color-primary: #0284C7;
    --color-primary-hover: #0369A1;
    --color-primary-light: #F0F9FF;
    --color-primary-light-hover: #E0F2FE;
    --color-accent: #F97316;
    --color-accent-hover: #EA580C;
    --color-accent-light: #FFF7ED;
    --color-success: #22C55E;
    --color-error: #EF4444;
    --color-warning: #F59E0B;
  }
}

@layer utilities {
  .font-cairo {
    font-family: 'Cairo', 'Almarai', system-ui, sans-serif;
  }
}

html {
  scroll-behavior: smooth;
}

@keyframes float-slow {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-8px) rotate(1deg); }
}

.animate-float {
  animation: float-slow 4s ease-in-out infinite;
}

@keyframes pulse-subtle {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.85; transform: scale(1.05); }
}

.animate-pulse-subtle {
  animation: pulse-subtle 2s ease-in-out infinite;
}

@keyframes fade-in {
  from { opacity: 0; transform: scale(0.96); }
  to { opacity: 1; transform: scale(1); }
}

.animate-fade-in {
  animation: fade-in 0.2s ease-out;
}

/* Custom scrollbar for RTL experience */
::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-track { background: #f1f5f9; }
::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 9999px; }
::-webkit-scrollbar-thumb:hover { background: #0369a1; }
```

---

### Task 3: Create page.tsx orchestrator

**Files:**
- Create: `src/features/student-redesign/page.tsx`

**Interfaces:**
- Consumes: All components from Tasks 4-9
- Produces: Full page with state management, dark mode persistence, all sections

- [ ] **Step 1: Write page.tsx**

```tsx
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
import BeforeAfter from "./components/server/before-after";
import MobileApp from "./components/server/mobile-app";
import InteractiveQuiz from "./components/client/interactive-quiz";
import Pricing from "./components/server/pricing";
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
        <BeforeAfter />
        <MobileApp />
        <InteractiveQuiz onExploreTeachers={scrollToTeachers} />
        <Pricing />
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
```

- [ ] **Step 2: Verify no missing imports**

Run: `npx tsc --noEmit` and confirm no errors for Task 3. (Expected: errors from unimplemented components in later tasks — that's fine.)

---

### Task 4: Port client components — Navbar, AuthModal, TeacherModal, VideoModal

**Files:**
- Create: `src/features/student-redesign/components/client/navbar.tsx`
- Create: `src/features/student-redesign/components/client/auth-modal.tsx`
- Create: `src/features/student-redesign/components/client/teacher-modal.tsx`
- Create: `src/features/student-redesign/components/client/video-modal.tsx`

**Interfaces:**
- Consumes: `Teacher` type from Task 1
- Produces: Four interactive client components with `"use client"` directive

- [ ] **Step 1: Create client/navbar.tsx**

Copy from `elemni-edtech/src/components/Navbar.tsx`. Add `"use client"` at the top. Replace all icons (Search, User, GraduationCap, Sun, Moon, UserPlus, X, Menu) with lucide-react imports. Keep all styling, RTL layout, dark mode, scroll effect, mobile menu, expandable search. Interface:

```typescript
interface NavbarProps {
  onOpenAuth: (mode: "signin" | "signup") => void;
  onSearchChange: (query: string) => void;
  searchQuery: string;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}
```

- [ ] **Step 2: Create client/auth-modal.tsx**

Copy from `elemni-edtech/src/components/AuthModal.tsx`. Add `"use client"`. Convert inline `React.FC` to named export default function. Keep same interface:

```typescript
interface AuthModalProps {
  isOpen: boolean;
  initialMode: "signin" | "signup";
  onClose: () => void;
  onSuccess: (userName: string) => void;
}
```

- [ ] **Step 3: Create client/teacher-modal.tsx**

Copy from `elemni-edtech/src/components/TeacherModal.tsx`. Add `"use client"`. Import `Teacher`, `Course` from `../../types`. Same interface:

```typescript
interface TeacherModalProps {
  teacher: Teacher | null;
  onClose: () => void;
  onBook: (teacher: Teacher, selectedCourseTitle?: string) => void;
}
```

- [ ] **Step 4: Create client/video-modal.tsx**

Copy from `elemni-edtech/src/components/VideoModal.tsx`. Add `"use client"`. Interface:

```typescript
interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
}
```

---

### Task 5: Port remaining client components — Quiz, FAQ, Toast, WhatsApp

**Files:**
- Create: `src/features/student-redesign/components/client/interactive-quiz.tsx`
- Create: `src/features/student-redesign/components/client/faq-section.tsx`
- Create: `src/features/student-redesign/components/client/toast-notification.tsx`
- Create: `src/features/student-redesign/components/client/whatsapp-button.tsx`

**Interfaces:**
- Consumes: `QuizQuestion`, `FAQItem` types + `QUIZ_QUESTIONS`, `FAQ_ITEMS` data from Task 1

- [ ] **Step 1: Create client/interactive-quiz.tsx**

Copy from `elemni-edtech/src/components/InteractiveQuiz.tsx`. Add `"use client"`. Import `QUIZ_QUESTIONS` from `../../data/mock-data`. Interface:

```typescript
interface InteractiveQuizProps {
  onExploreTeachers: () => void;
}
```

- [ ] **Step 2: Create client/faq-section.tsx**

Copy from `elemni-edtech/src/components/FaqSection.tsx`. Add `"use client"`. Import `FAQ_ITEMS` from `../../data/mock-data`. No props needed — self-contained accordion.

- [ ] **Step 3: Create client/toast-notification.tsx**

Copy from `elemni-edtech/src/components/ToastNotification.tsx`. Add `"use client"`. Interface:

```typescript
interface ToastProps {
  message: string | null;
  onClear: () => void;
}
```

- [ ] **Step 4: Create client/whatsapp-button.tsx**

Copy from `elemni-edtech/src/components/WhatsAppButton.tsx`. Add `"use client"`. No props — self-contained floating button.

---

### Task 6: Port server components — Hero, TeacherGrid, Features, Testimonials, Pricing

**Files:**
- Create: `src/features/student-redesign/components/server/hero.tsx`
- Create: `src/features/student-redesign/components/server/teacher-grid.tsx`
- Create: `src/features/student-redesign/components/server/features.tsx`
- Create: `src/features/student-redesign/components/server/testimonials.tsx`
- Create: `src/features/student-redesign/components/server/pricing.tsx`

**Interfaces:**
- Consumes: `Teacher`, `Feature`, `Testimonial` types + data arrays
- Produces: Static server-friendly sections (no `"use client"` — interactivity passed via props from parent)

- [ ] **Step 1: Create server/hero.tsx**

Copy from `elemni-edtech/src/components/Hero.tsx`. Remove `React.FC` typing. Remove `"use client"`. Keep all JSX and styling. Interface:

```typescript
interface HeroProps {
  onOpenAuth: (mode: "signup" | "signin") => void;
  onOpenVideoTour: () => void;
  onExploreTeachers: () => void;
}
```

- [ ] **Step 2: Create server/teacher-grid.tsx**

Copy from `elemni-edtech/src/components/TeacherGrid.tsx`. THIS component uses `useState` and `useMemo` (filtering, pagination) — it MUST be `"use client"`. Add `"use client"` at the top. Interface:

```typescript
interface TeacherGridProps {
  teachers: Teacher[];
  onSelectTeacher: (teacher: Teacher) => void;
  onBookTeacher: (teacher: Teacher) => void;
  searchQuery: string;
}
```

Keep all filter dropdowns (grade, stream), search, teacher cards with featured badges, course count, bio, experience, price, action buttons, "show more" pagination.

- [ ] **Step 3: Create server/features.tsx**

Copy from `elemni-edtech/src/components/Features.tsx`. Keep as non-client (no internal state). The `onExploreFeature` prop handles interactivity. Interface:

```typescript
interface FeaturesProps {
  onExploreFeature: (featureId: string) => void;
}
```

- [ ] **Step 4: Create server/testimonials.tsx**

Copy from `elemni-edtech/src/components/Testimonials.tsx`. Pure presentational — no props needed, no `"use client"`.

- [ ] **Step 5: Create server/pricing.tsx**

Copy from `elemni-edtech/src/components/Pricing.tsx`. Uses `onSelectPlan` callback. No `"use client"` needed. Interface:

```typescript
interface PricingProps {
  onSelectPlan?: (planName: string) => void;
}
```

---

### Task 7: Port Footer server component

**Files:**
- Create: `src/features/student-redesign/components/server/footer.tsx`

- [ ] **Step 1: Create server/footer.tsx**

Copy from `elemni-edtech/src/components/Footer.tsx`. Pure presentational. No `"use client"`. No props.

---

### Task 8: Port/restyle existing Next.js components (5 components)

**Files:**
- Create: `src/features/student-redesign/components/server/subject-grid.tsx`
- Create: `src/features/student-redesign/components/server/featured-lessons.tsx`
- Create: `src/features/student-redesign/components/server/bento-grid.tsx`
- Create: `src/features/student-redesign/components/server/steps-section.tsx`

**Interfaces:**
- Consumes: Existing patterns from `src/features/student-landing/components/`
- Produces: Restyled versions matching blue-primary theme

- [ ] **Step 1: Create server/subject-grid.tsx**

Port from `src/features/student-landing/components/subject-grid.tsx`. Replace:
- `getTranslations` calls → hardcoded Arabic text
- `brand-*` tokens → blue equivalents (`bg-brand-100` → `bg-primary-light`, `text-brand-600` → `text-primary`)
- `Section` wrapper → keep using it
- `Reveal` → keep for scroll animations
- `Link` from `@/src/i18n/navigation` → standard `<a>` tags or `next/link`

Hardcode Arabic text directly. Copy data from existing `data.ts` `fallbackSubjects` array inline.

- [ ] **Step 2: Create server/featured-lessons.tsx**

Port from `src/features/student-landing/components/featured-lessons.tsx`. Same restyling approach:
- Remove i18n → hardcoded Arabic
- Replace `brand-*` → blue tokens
- Keep `Section`, `Reveal`
- Copy `fallbackFeatured` data inline

- [ ] **Step 3: Create server/bento-grid.tsx**

Port from `src/features/student-landing/components/student-bento.tsx`. Same restyling:
- Hardcode Arabic text (the `BENTO_CARDS` translations)
- Replace `bg-brand-600` → `bg-primary`, `bg-brand-100/50` → `bg-primary-light`
- Keep `Section`, `Reveal`

- [ ] **Step 4: Create server/steps-section.tsx**

Port from `src/features/student-landing/components/student-steps.tsx`:
- Hardcode Arabic text
- Replace brand tokens → blue
- Keep `Section`, `Reveal`, `Button`
- Copy `STUDENT_STEPS` data inline

---

### Task 9: Port remaining existing components (4 components)

**Files:**
- Create: `src/features/student-redesign/components/server/comparison.tsx`
- Create: `src/features/student-redesign/components/server/before-after.tsx`
- Create: `src/features/student-redesign/components/server/mobile-app.tsx`
- Create: `src/features/student-redesign/components/server/final-cta.tsx`

- [ ] **Step 1: Create server/comparison.tsx**

Port from `src/features/student-landing/components/student-comparison.tsx`:
- Hardcode Arabic text for all translation keys
- Replace `brand-*` → blue tokens, `accent-*` → orange accent tokens
- Keep `Section`, `Reveal`, `cn()`
- Copy `STUDENT_COMPARISON_MATRIX` data inline (use `STUDENT_COMPARISON_MATRIX` or create equivalent)

- [ ] **Step 2: Create server/before-after.tsx**

Port from `src/features/student-landing/components/student-before-after.tsx`:
- Hardcode Arabic text
- Replace brand/accent tokens → blue/orange
- Keep `Section`, `Reveal`, `Button`, `cn()`

- [ ] **Step 3: Create server/mobile-app.tsx**

Port from `src/features/student-landing/components/student-mobile.tsx`:
- Hardcode Arabic text (and the `greeting`/`ready` string)
- Replace brand tokens → blue
- Keep `Section`, `Reveal`

- [ ] **Step 4: Create server/final-cta.tsx**

Port from `src/features/student-landing/components/student-final-cta.tsx`:
- Hardcode Arabic text
- Replace `bg-cta-gradient` → new gradient using blue primary

  The CTA gradient should use: `bg-gradient-to-r from-[#0284C7] to-[#0F172A]`
  Replace `bg-cta-gradient` class with this inline gradient.

- Keep `Section` wrapper instead of raw `<section>`
- Use standard `<button>` instead of `Button` component (to keep consistent with exported app's blue theme)

---

### Task 10: Wire up routing — update student page

**Files:**
- Modify: `src/app/[locale]/(student)/page.tsx`

**Interfaces:**
- Consumes: New `StudentLandingPage` from Task 3
- Produces: Updated route pointing to new design

- [ ] **Step 1: Replace existing page content**

```tsx
import { setRequestLocale } from "next-intl/server";
import StudentLandingPage from "@/src/features/student-redesign/page";

export async function generateMetadata() {
  return {
    title: "علمني | منصة التعلم الذكي",
    description: "علمني .. بوابتك للتعلم الذكي — المنصة الأولى للتعلم التفاعلي وكورسات المدرسين 2026",
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <StudentLandingPage />;
}
```

---

### Task 11: Build verification and polish

- [ ] **Step 1: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: No errors. If errors, fix them.

- [ ] **Step 2: Run dev server and verify page renders**

```bash
npm run dev
```

Open http://localhost:3000/ar — verify all sections render.

- [ ] **Step 3: Verify dark mode toggle**

Click the sun/moon toggle — page should switch to dark mode. Refresh — mode should persist.

- [ ] **Step 4: Verify modals**

Click "اعمل حساب جديد !" — auth modal should open. Click teacher "الملف الشخصي" — teacher modal should open. Close each.

- [ ] **Step 5: Verify teacher search/filters**

Type in search, select grade/stream dropdowns — results should filter.

- [ ] **Step 6: Verify quiz**

Scroll to quiz, select an answer, confirm, see explanation, advance through all questions, see results screen.

- [ ] **Step 7: Verify FAQ accordion**

Click FAQ items — only one should open at a time. Click again to close.

- [ ] **Step 8: Verify WhatsApp button**

Floating green button visible at bottom-left. Hover shows tooltip. Click opens `wa.me` link.

- [ ] **Step 9: Verify toast notification**

After page load, toast appears at top-right with engagement message. Auto-dismisses after ~4s.

- [ ] **Step 10: Mobile responsiveness**

Resize browser to mobile width. Navbar hamburger should appear. All sections should stack vertically. Touch interactions work (modals, quiz, FAQ).

- [ ] **Step 11: Run lint**

```bash
npm run lint
```

Expected: No errors.

---

## Self-Review Checklist

1. **Spec coverage:** Every section from the design doc maps to a task:
   - Types/data → Task 1
   - CSS theme → Task 2
   - Page orchestrator → Task 3
   - Navbar, AuthModal, TeacherModal, VideoModal → Task 4
   - Quiz, FAQ, Toast, WhatsApp → Task 5
   - Hero, TeacherGrid, Features, Testimonials, Pricing → Task 6
   - Footer → Task 7
   - SubjectGrid, FeaturedLessons, BentoGrid, Steps → Task 8
   - Comparison, BeforeAfter, MobileApp, FinalCta → Task 9
   - Routing → Task 10
   - Verification → Task 11

2. **Placeholder scan:** No TBD, TODO, or "implement later" in any step. Every file has exact source (copy from where) and exact content.

3. **Type consistency:** `Teacher`, `Course` types defined in Task 1, consumed by TeacherGrid (Task 6) and TeacherModal (Task 4). `Feature` consumed by Features (Task 6). `QuizQuestion` consumed by InteractiveQuiz (Task 5). All consistent.
