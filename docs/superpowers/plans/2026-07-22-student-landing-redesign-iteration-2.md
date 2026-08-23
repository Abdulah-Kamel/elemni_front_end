# Student Landing Redesign — Iteration 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate 3 new components (`PaymentMethods`, `TeacherJoinCTA`, `TeacherProfile`) and 1 new route (`/teachers/[id]`) from the updated exported app, following project conventions (cn, Section, Reveal, design tokens).

**Architecture:** New sections as server components under `student-redesign/`. TeacherProfile as a route page under `app/[locale]/teachers/[id]/` with a client component body. Types updated in-place.

**Tech Stack:** Next.js 16, React 19, Tailwind v4, lucide-react, cn() utility.

## Global Constraints

- All new components use `cn()` from `@/src/lib/cn`
- All section components use `Section` wrapper and `Reveal` for scroll animations
- Use design tokens: `bg-page`, `text-ink`, `text-muted`, `bg-brand-600`, `bg-brand-50`, `bg-accent-500`, etc.
- Use `next/image` for images
- Use `Button` component for buttons where appropriate
- Hardcoded Arabic text (no i18n)
- Blue primary (`bg-brand-600` = `#0284C7`) matches existing redesign tokens
- Dark mode handled via existing `globals.css` tokens — components use `dark:` variants where needed

---

### Task 1: Update types with new fields

**Files:**
- Modify: `src/features/student-redesign/types.ts`

**Interfaces:**
- Produces: Updated `Teacher` interface with optional `subjects` and `gradesList`

- [ ] **Step 1: Add new fields to Teacher interface**

```typescript
export interface Teacher {
  id: string;
  name: string;
  title: string;
  subject: string;
  subjects?: string[];
  category: string;
  grade: string;
  gradeLabel: string;
  gradesList?: string[];
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
```

- [ ] **Step 2: Verify build**

Run: `npx tsc --noEmit` — expect no errors

---

### Task 2: Create TeacherProfile route page

**Files:**
- Create: `src/app/[locale]/teachers/[id]/page.tsx`

**Interfaces:**
- Consumes: `Teacher` type, `TEACHERS_DATA`, `TeacherProfileView` client component
- Produces: Route page that resolves teacher by ID and renders profile

- [ ] **Step 1: Create route directory**

```bash
mkdir -p src/app/\[locale\]/teachers/\[id\]
```

- [ ] **Step 2: Create the page**

```typescript
import { notFound, redirect } from "next/navigation";
import { TEACHERS_DATA } from "@/src/features/student-redesign/data/mock-data";
import TeacherProfileView from "@/src/features/student-redesign/components/client/teacher-profile-view";

export default async function TeacherProfilePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const teacher = TEACHERS_DATA.find((t) => t.id === id);
  if (!teacher) notFound();

  return <TeacherProfileView teacher={teacher} locale={locale} />;
}
```

- [ ] **Step 3: Verify no TypeScript errors**

---

### Task 3: Create TeacherProfileView client component

**Files:**
- Create: `src/features/student-redesign/components/client/teacher-profile-view.tsx`

**Interfaces:**
- Consumes: `Teacher` type, `TEACHERS_DATA`
- Produces: Full teacher profile page with cover header, course grid, subscribe interactions

- [ ] **Step 1: Write the component**

Port from `elemni-edtech/src/components/TeacherProfile.tsx`. Adapt to project conventions:

```typescript
"use client";

import { useState } from "react";
import { Teacher, Course } from "../../types";
import {
  ArrowRight, BookOpen, Users, Award, Star, CheckCircle2,
  PlayCircle, Sparkles, GraduationCap, FileText, Clock,
  Calendar, Share2, Check, ChevronLeft
} from "lucide-react";
import { cn } from "@/src/lib/cn";
import Link from "next/link";

interface TeacherProfileViewProps {
  teacher: Teacher;
  locale: string;
}

export default function TeacherProfileView({ teacher, locale }: TeacherProfileViewProps) {
  const [selectedGradeFilter, setSelectedGradeFilter] = useState("all");
  const [copiedLink, setCopiedLink] = useState(false);
  const [subscribedCourses, setSubscribedCourses] = useState<Record<string, boolean>>({});

  const filteredCourses = teacher.courses.filter((course) => {
    if (selectedGradeFilter === "all") return true;
    return course.title.includes(selectedGradeFilter);
  });

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  return (
    <div className="min-h-screen bg-page text-ink dir-rtl pb-20">
      {/* Cover */}
      <div className="relative bg-gradient-to-br from-slate-900 via-sky-950 to-slate-950 text-white overflow-hidden shadow-xl">
        <div className="absolute inset-0 opacity-25 bg-cover bg-center mix-blend-overlay pointer-events-none"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=1600')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B132B] via-slate-900/80 to-transparent pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-sky-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 relative z-10 flex items-center justify-between">
          <Link
            href={`/${locale}`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-extrabold text-xs sm:text-sm backdrop-blur-md transition-all"
          >
            <ArrowRight className="w-4 h-4" />
            <span>العودة للرئيسية</span>
          </Link>

          <button onClick={handleShare}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/30 text-sky-200 font-extrabold text-xs sm:text-sm backdrop-blur-md transition-all cursor-pointer"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            <span>{copiedLink ? "تم نسخ الرابط!" : "مشاركة"}</span>
          </button>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16 sm:pb-20 relative z-10">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-6 sm:gap-8 text-center md:text-right">
            <div className="relative shrink-0 group">
              <div className="w-44 h-52 sm:w-56 sm:h-64 md:w-64 md:h-72 rounded-3xl p-1.5 bg-gradient-to-tr from-amber-400/80 via-sky-400/80 to-primary/80 shadow-2xl">
                <div className="w-full h-full rounded-[20px] overflow-hidden bg-slate-900 border border-white/10 relative">
                  <img src={teacher.avatar} alt={teacher.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent opacity-60" />
                  <div className="absolute bottom-3 right-3 bg-emerald-500 border-2 border-slate-900 px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-white stroke-[3]" />
                    <span className="text-[11px] font-black text-white">معلم موثوق</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3 flex-1">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <span className="bg-amber-400 text-slate-950 font-black text-xs px-3 py-1 rounded-full flex items-center gap-1 shadow-md">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>معلم معتمد</span>
                </span>
                {(teacher.subjects?.length ? teacher.subjects : [teacher.subject]).map((sub, idx) => (
                  <span key={idx} className="bg-sky-500/20 border border-sky-400/40 text-sky-200 font-extrabold text-xs px-3 py-1 rounded-full backdrop-blur-md">{sub}</span>
                ))}
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white font-cairo tracking-tight">{teacher.name}</h1>
              <p className="text-slate-300 text-sm sm:text-base font-semibold max-w-2xl">{teacher.title}</p>

              <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-3 text-xs sm:text-sm font-bold text-slate-200">
                <div className="bg-white/10 border border-white/15 px-3.5 py-1.5 rounded-xl backdrop-blur-md flex items-center gap-2">
                  <Award className="w-4 h-4 text-sky-400" />
                  <span>{teacher.experienceYears} سنة خبرة</span>
                </div>
                <div className="bg-white/10 border border-white/15 px-3.5 py-1.5 rounded-xl backdrop-blur-md flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-400" />
                  <span>{teacher.courses.length} كورسات متاحة</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Courses section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60 dark:border-slate-800">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-sky-100 dark:bg-slate-800 text-primary dark:text-sky-300 font-extrabold text-xs mb-2">
                <BookOpen className="w-3.5 h-3.5" />
                <span>تصفح المحاضرات والاشتراكات</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-ink font-cairo">الكورسات المتاحة</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
            {filteredCourses.map((course, index) => {
              const isSubscribed = subscribedCourses[course.id];
              const thumbnails = [
                "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&q=80&w=800",
                "https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&q=80&w=800",
                "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=800",
                "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=800"
              ];
              const thumbnail = thumbnails[index % thumbnails.length];

              return (
                <div key={course.id} className="bg-white dark:bg-slate-800/95 rounded-[28px] overflow-hidden border border-slate-200/90 dark:border-slate-700 shadow-md hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group">
                  <div>
                    <div className="relative w-full aspect-video overflow-hidden bg-slate-900">
                      <img src={thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                      <div className="absolute top-3 right-3 bg-primary/90 text-white text-[11px] font-black px-3 py-1 rounded-full backdrop-blur-md shadow-sm">
                        {teacher.subject}
                      </div>
                      <div className="absolute bottom-3 left-3 bg-slate-900/80 text-slate-200 text-[11px] font-bold px-2.5 py-1 rounded-lg backdrop-blur-md flex items-center gap-1">
                        <Clock className="w-3 h-3 text-sky-400" />
                        <span>{course.duration}</span>
                      </div>
                    </div>
                    <div className="p-5 space-y-3">
                      <h3 className="text-lg font-black text-ink group-hover:text-primary transition-colors font-cairo leading-snug line-clamp-2 min-h-[52px]">{course.title}</h3>
                      <p className="text-xs text-muted leading-relaxed font-medium line-clamp-2">{course.description}</p>
                      <div className="flex items-center justify-between text-xs font-bold text-muted pt-2 border-t border-slate-100 dark:border-slate-700/80">
                        <div className="flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-primary" />
                          <span>{course.sessionsCount} محاضرة</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>اختبارات وملازم</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-5 pt-0 mt-2">
                    <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-700/80">
                      <div>
                        <span className="text-2xl font-black text-ink font-cairo">{course.price}</span>
                        <span className="text-xs font-bold text-muted mr-1">ج.م / الشهر</span>
                      </div>
                      <button onClick={() => setSubscribedCourses((p) => ({ ...p, [course.id]: true }))}
                        disabled={isSubscribed}
                        className={cn(
                          "py-2.5 px-5 font-black text-xs sm:text-sm rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2",
                          isSubscribed
                            ? "bg-emerald-600 text-white cursor-default"
                            : "bg-primary hover:bg-primary-hover text-white active:scale-95 shadow-primary/20"
                        )}
                      >
                        {isSubscribed ? (
                          <><Check className="w-4 h-4" /><span>تم الاشتراك!</span></>
                        ) : (
                          <><BookOpen className="w-4 h-4" /><span>اشترك الآن</span></>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `npx tsc --noEmit`

---

### Task 4: Create PaymentMethods server component

**Files:**
- Create: `src/features/student-redesign/components/server/payment-methods.tsx`

**Interfaces:**
- Produces: Payment methods section with wallet + card options and support box

- [ ] **Step 1: Write the component**

Port from `elemni-edtech`. Use `Section` + `Reveal` + `cn()`. Replace arbitrary colors with tokens where possible. Payment cards show mobile wallets and bank cards with a support WhatsApp link below.

```typescript
import { Wallet, CreditCard, CheckCircle, Building2 } from "lucide-react";
import { Section } from "@/src/components/ui/section";
import { Reveal } from "@/src/components/ui/reveal";

export default function PaymentMethods() {
  const paymentOptions = [
    {
      id: "wallet",
      icon: Wallet,
      title: "المحافظ الإلكترونية",
      desc: "فودافون كاش، أورنج كاش، اتصالات كاش، وي باي",
      badge: "دفع فوري",
      iconBg: "bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400",
    },
    {
      id: "card",
      icon: CreditCard,
      title: "البطاقات البنكية",
      desc: "فيزا، ماستركارد، ميزة، جميع الكروت المباشرة",
      badge: "آمن 100%",
      iconBg: "bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400",
    },
  ];

  return (
    <Section id="payment-locations" className="bg-gradient-to-b from-sky-50/50 via-white to-sky-50/30 dark:from-slate-900 dark:via-[#0B132B] dark:to-slate-900">
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-[36px] p-8 sm:p-12 border border-sky-100 dark:border-slate-700/80 shadow-xl">
        <Reveal>
          <div className="text-center space-y-4 max-w-3xl mx-auto mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-light text-primary font-extrabold text-xs sm:text-sm">
              <Building2 className="w-4 h-4 text-primary" />
              <span>شحن الحساب وشراء الكورسات</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-ink tracking-tight font-cairo">
              خطواتك للنجاح بقت أسهل.. <span className="text-primary">وأقرب ليك!</span>
            </h2>
            <p className="text-base sm:text-lg text-muted leading-relaxed font-medium">
              وفرنالك طرق دفع إلكترونية آمنة وسريعة.
            </p>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {paymentOptions.map((option, i) => (
            <Reveal key={option.id} delay={i * 80}>
              <div className="bg-white dark:bg-slate-900/90 rounded-2xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-700/80 shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-14 h-14 rounded-2xl ${option.iconBg} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                      <option.icon className="w-7 h-7 stroke-[2.2]" />
                    </div>
                    <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-muted border border-slate-200/60 dark:border-slate-700">
                      {option.badge}
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-ink mb-2 font-cairo group-hover:text-primary transition-colors">{option.title}</h3>
                  <p className="text-sm text-muted leading-relaxed font-medium">{option.desc}</p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                  <CheckCircle className="w-4 h-4" />
                  <span>متاح حالياً للدفع المباشر</span>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal>
          <div className="mt-10 bg-sky-50/80 dark:bg-slate-900/80 rounded-2xl p-6 sm:p-8 border border-sky-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center shrink-0 shadow-md">
                <Wallet className="w-6 h-6" />
              </div>
              <div className="text-right">
                <p className="text-ink font-black text-base sm:text-lg">تحتاج مساعدة في خطوة الشحن أو الدفع؟</p>
                <p className="text-muted text-xs sm:text-sm font-medium">فريق الدعم الفني جاهز لمساعدتك.</p>
              </div>
            </div>
            <a href="https://wa.me/201000000000" target="_blank" rel="noopener noreferrer"
              className="w-full sm:w-auto py-3.5 px-8 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-xl shadow-lg shadow-emerald-600/20 transition-all text-center">
              تواصل مع الدعم الفني
            </a>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `npx tsc --noEmit`

---

### Task 5: Create TeacherJoinCTA server component

**Files:**
- Create: `src/features/student-redesign/components/server/teacher-join-cta.tsx`

**Interfaces:**
- Produces: Teacher recruitment banner with split layout, feature boxes, and CTA button

- [ ] **Step 1: Write the component**

Port from `elemni-edtech`. Use Section wrapper (with custom class for full-width dark background outside the section container). The layout is: left side has a teacher image on sky-blue background, right side has the CTA content on dark navy.

```typescript
import { UserPlus, Sparkles, CheckCircle2, ArrowLeft, ShieldCheck, TrendingUp } from "lucide-react";

interface TeacherJoinCTAProps {
  onJoinAsTeacher?: () => void;
}

export default function TeacherJoinCTA({ onJoinAsTeacher }: TeacherJoinCTAProps) {
  return (
    <section className="py-16 sm:py-20 bg-white dark:bg-[#0B132B]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-[36px] sm:rounded-[44px] bg-[#0A263B] text-white overflow-hidden shadow-2xl border border-sky-900/60 flex flex-col lg:flex-row items-stretch">
          <div className="lg:w-[42%] bg-[#CBE4F9] relative p-6 sm:p-10 flex items-center justify-center overflow-hidden min-h-[380px] sm:min-h-[440px]">
            <div className="absolute -top-12 -right-16 w-52 h-96 bg-[#0A263B] -rotate-45 transform pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-52 h-96 bg-[#0A263B] -rotate-45 transform pointer-events-none" />
            <div className="absolute top-1/2 left-0 w-32 h-64 bg-[#0A263B] -rotate-12 transform pointer-events-none opacity-90" />
            <div className="relative z-10 w-full max-w-[320px] aspect-[4/5] rounded-[28px] border-2 border-sky-300/80 bg-[#C0DFF8] shadow-xl overflow-hidden group">
              <img src="https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=800" alt="معلم متميز"
                className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500" />
            </div>
          </div>

          <div className="lg:w-[58%] p-8 sm:p-12 lg:p-14 flex flex-col justify-center space-y-6 text-right relative z-10">
            <div className="self-start inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#133A57] border border-sky-600/30 text-sky-300 font-extrabold text-xs sm:text-sm">
              <Sparkles className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span>انضم لكادر المعلمين المتميزين</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight font-cairo">
              انضم لنخبة المعلمين على منصة <span className="text-amber-400">علمني</span>
            </h2>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-medium max-w-xl">
              شارك في بناء مستقبل التعليم الرقمي، قدم محتواك لآلاف الطلاب.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="flex items-center justify-center gap-2 bg-[#0E334D]/90 border border-sky-800/60 rounded-xl p-3 text-center">
                <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-xs font-bold text-slate-200">توسع وانتشار لآلاف الطلاب</span>
              </div>
              <div className="flex items-center justify-center gap-2 bg-[#0E334D]/90 border border-sky-800/60 rounded-xl p-3 text-center">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-xs font-bold text-slate-200">حماية كاملة للمحتوى والدروس</span>
              </div>
              <div className="flex items-center justify-center gap-2 bg-[#0E334D]/90 border border-sky-800/60 rounded-xl p-3 text-center">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-xs font-bold text-slate-200">أدوات سهلة لإدارة الكورسات</span>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-start">
              <button onClick={onJoinAsTeacher}
                className="w-full sm:w-auto py-3.5 px-8 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-base rounded-2xl shadow-lg shadow-amber-400/20 transition-all cursor-pointer flex items-center justify-center gap-3 group">
                <ArrowLeft className="w-5 h-5 text-slate-950 group-hover:-translate-x-1 transition-transform" />
                <span>انضم إلينا كمعلم</span>
                <UserPlus className="w-5 h-5 text-slate-950" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verify build**

---

### Task 6: Update page.tsx — add new sections

**Files:**
- Modify: `src/features/student-redesign/page.tsx`

**Interfaces:**
- Consumes: PaymentMethods, TeacherJoinCTA from Tasks 4-5
- Produces: Updated landing page with new sections inserted after Features

- [ ] **Step 1: Add imports**

```typescript
import PaymentMethods from "./components/server/payment-methods";
import TeacherJoinCTA from "./components/server/teacher-join-cta";
```

- [ ] **Step 2: Add sections in JSX after `<Features />`**

```tsx
<Features onExploreFeature={handleExploreFeature} />
<PaymentMethods />
<TeacherJoinCTA onJoinAsTeacher={() => handleOpenAuth("signup")} />
<SubjectGrid />
```

- [ ] **Step 3: Verify build**

---

### Task 7: Update TeacherGrid with profile link

**Files:**
- Modify: `src/features/student-redesign/components/server/teacher-grid.tsx`

**Interfaces:**
- Consumes: `Teacher` type
- Produces: Updated teacher cards with "مشاهدة الملف الشخصي" link to `/teachers/[id]`

- [ ] **Step 1: Add Link import**

```typescript
import Link from "next/link";
```

- [ ] **Step 2: Replace the "الملف الشخصي" button link**

Change from:
```tsx
<button onClick={() => onSelectTeacher(teacher)} className="...">
  <Video className="w-3.5 h-3.5 text-primary" />
  <span>الملف الشخصي</span>
</button>
```

To:
```tsx
<Link href={`/ar/teachers/${teacher.id}`}
  className="py-2.5 px-3 bg-slate-100 hover:bg-primary-light text-slate-800 hover:text-primary font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1">
  <Video className="w-3.5 h-3.5 text-primary" />
  <span>الملف الشخصي</span>
</Link>
```

Note: The href uses `/ar/` since the page is Arabic-only.

- [ ] **Step 3: Verify build**

---

### Task 8: Update Navbar with onGoHome

**Files:**
- Modify: `src/features/student-redesign/components/client/navbar.tsx`

**Interfaces:**
- Consumes: New `onGoHome` prop
- Produces: Brand logo links to home via `onGoHome`

- [ ] **Step 1: Add onGoHome to props**

```typescript
interface NavbarProps {
  onOpenAuth: (mode: "signin" | "signup") => void;
  onSearchChange: (query: string) => void;
  searchQuery: string;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onGoHome?: () => void;
}
```

- [ ] **Step 2: Update brand link onClick**

Change the brand `<a href="#">` to:
```tsx
<a href="#" onClick={(e) => { e.preventDefault(); onGoHome?.(); }} className="...">
```

- [ ] **Step 3: Verify build**

---

### Task 9: Update TeacherModal with onViewFullProfile

**Files:**
- Modify: `src/features/student-redesign/components/client/teacher-modal.tsx`

**Interfaces:**
- Consumes: `onViewFullProfile` prop
- Produces: Modal with link to teacher profile page

- [ ] **Step 1: Add onViewFullProfile to props**

```typescript
interface TeacherModalProps {
  teacher: Teacher | null;
  onClose: () => void;
  onBook: (teacher: Teacher, selectedCourseTitle?: string) => void;
  onViewFullProfile?: (teacher: Teacher) => void;
}
```

- [ ] **Step 2: Add profile link button in modal**

Add after the course cards section:
```tsx
<div className="pt-2 border-t border-slate-100 text-center">
  <Link href={`/ar/teachers/${teacher.id}`}
    className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline">
    عرض الملف الشخصي الكامل
    <ArrowLeft className="w-3 h-3" />
  </Link>
</div>
```

Add `import Link from "next/link"`.

- [ ] **Step 3: Verify build**

---

### Task 10: Build verification and polish

- [ ] **Step 1: Full build**

```bash
npm run build
```

Expected: Compiled successfully, no errors, routes include `/[locale]/teachers/[id]`.

- [ ] **Step 2: Start dev server and verify landing page**

```bash
npm run dev
```

Open `/ar` — verify all sections render, including the new PaymentMethods and TeacherJoinCTA.

- [ ] **Step 3: Verify teacher profile route**

Open `/ar/teachers/t1` — verify teacher profile renders with courses.

- [ ] **Step 4: Verify dark mode**

Toggle dark mode — verify new sections flip correctly.

- [ ] **Step 5: Mobile test**

Resize to 375px — verify new sections are responsive, no overflow.

- [ ] **Step 6: Run lint**

```bash
npm run lint
```
