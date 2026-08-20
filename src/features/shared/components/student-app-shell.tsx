"use client";

import { useState, type ReactNode } from "react";
import {
  Bell,
  BookOpen,
  CalendarDays,
  Compass,
  GraduationCap,
  Home,
  LogOut,
  Menu,
  Settings,
  X,
} from "lucide-react";
import { Link, useRouter } from "@/src/i18n/navigation";
import { MotionProvider } from "@/src/components/ui/motion-provider";
import type { UserDto } from "@/src/lib/student-api/contract";
import "../styles/student-app-shell.css";

const enabledNav = [
  { label: "الرئيسية", href: "/dashboard", icon: Home, id: "dashboard" },
  { label: "دوراتي", href: "/my-courses", icon: GraduationCap, id: "courses" },
  { label: "استكشف", href: "/explore", icon: Compass, id: "discover" },
];

const futureNav = [
  { label: "الاختبارات", icon: BookOpen },
  { label: "الجدول", icon: CalendarDays },
  { label: "الإعدادات", icon: Settings },
];

function StudentIdentity({ user }: { user: UserDto | null }) {
  const initials = user?.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("") || "ط";

  return (
    <div className="flex items-center gap-2.5">
      <span className="flex size-9 items-center justify-center rounded-full bg-[#E0F2FE] text-xs font-black text-[#0369A1]">{initials}</span>
      {user && <span className="hidden max-w-40 truncate text-sm font-bold text-[#464555] sm:block">{user.name}</span>}
    </div>
  );
}

function SidebarContent({ active, close, logout }: { active: string; close?: () => void; logout: () => void }) {
  return (
    <>
      <Link href="/dashboard" onClick={close} className="mx-5 mb-8 flex items-center gap-3">
        <span className="flex size-11 items-center justify-center rounded-xl bg-[#0284C7] text-white"><GraduationCap className="size-6" /></span>
        <span><strong className="block text-2xl font-black text-[#0369A1]">علمني</strong><span className="text-xs text-[#777587]">منصة التعليم الذكي</span></span>
      </Link>

      <nav aria-label="بوابة الطالب" className="space-y-1">
        {enabledNav.map(({ label, href, icon: Icon, id }) => (
          <Link key={id} href={href} onClick={close} className={`flex h-12 items-center gap-3 border-s-4 px-6 text-sm font-bold transition ${active === id ? "border-[#0284C7] bg-[#0284C7]/5 text-[#0369A1]" : "border-transparent text-[#464555] hover:bg-[#E0F2FE]"}`}>
            <Icon className="size-5" /><span>{label}</span>
          </Link>
        ))}
        {futureNav.map(({ label, icon: Icon }) => (
          <span key={label} aria-disabled="true" title={`${label} - قريباً`} className="flex h-12 cursor-not-allowed items-center gap-3 border-s-4 border-transparent px-6 text-sm font-bold text-[#A6A3B5]">
            <Icon className="size-5" /><span>{label}</span>
          </span>
        ))}
      </nav>

      <button onClick={logout} className="mx-5 mt-auto flex h-11 cursor-pointer items-center gap-2 rounded-lg px-3 text-sm font-bold text-red-700 hover:bg-red-50">
        <LogOut className="size-5" /><span>تسجيل الخروج</span>
      </button>
    </>
  );
}

export default function StudentPortalShell({ children, user, active = "dashboard" }: { children: ReactNode; user: UserDto | null; active?: string }) {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const logout = async () => {
    await fetch("/api/student/auth/logout", { method: "POST" }).catch(() => null);
    window.dispatchEvent(new Event("student-session-changed"));
    router.replace("/login");
  };

  return (
    <div dir="rtl" className="min-h-screen bg-[#FCFCFE] font-cairo text-[#1B1B24]">
      <aside className="student-portal-sidebar fixed inset-y-0 z-40 hidden w-64 flex-col border-s border-[#E2E0EF] bg-white py-7 md:flex">
        <SidebarContent active={active} logout={() => void logout()} />
      </aside>

      <header className="student-portal-header fixed top-0 z-30 flex h-16 items-center justify-between border-b border-[#E2E0EF] bg-white/95 px-4 backdrop-blur-md md:px-8">
        <div className="flex items-center gap-2">
          <button onClick={() => setMobileOpen(true)} aria-label="فتح قائمة بوابة الطالب" className="flex size-10 cursor-pointer items-center justify-center rounded-lg text-[#464555] hover:bg-[#E0F2FE] md:hidden"><Menu className="size-6" /></button>
          <Link href="/dashboard" className="flex items-center gap-2 font-black text-[#0369A1] md:hidden"><GraduationCap className="size-5" />علمني</Link>
        </div>
        <div className="flex items-center gap-3">
          <button disabled title="التنبيهات قريباً" aria-label="التنبيهات غير متاحة حالياً" className="flex size-9 cursor-not-allowed items-center justify-center rounded-full text-[#A6A3B5]"><Bell className="size-5" /></button>
          <StudentIdentity user={user} />
        </div>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button aria-label="إغلاق القائمة" onClick={() => setMobileOpen(false)} className="absolute inset-0 cursor-default bg-slate-950/40" />
          <aside className="student-portal-drawer absolute inset-y-0 flex w-[min(82vw,19rem)] flex-col bg-white py-6 shadow-2xl">
            <button onClick={() => setMobileOpen(false)} aria-label="إغلاق القائمة" className="student-portal-drawer-close absolute top-4 flex size-9 cursor-pointer items-center justify-center rounded-lg text-[#777587] hover:bg-[#E0F2FE]"><X className="size-5" /></button>
            <SidebarContent active={active} close={() => setMobileOpen(false)} logout={() => void logout()} />
          </aside>
        </div>
      )}

      <main className="student-portal-main min-h-screen pt-16"><MotionProvider>{children}</MotionProvider></main>
    </div>
  );
}
