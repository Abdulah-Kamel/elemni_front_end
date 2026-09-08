"use client";

import Image from "next/image";
import { useState, useSyncExternalStore, type ReactNode } from "react";
import {
  Bell,
  BookOpen,
  CalendarDays,
  Compass,
  GraduationCap,
  Home,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  X,
} from "lucide-react";
import { Link, useRouter } from "@/src/i18n/navigation";
import { MotionProvider } from "@/src/components/ui/motion-provider";
import { cn } from "@/src/lib/cn";
import { notifyStudentSessionChanged } from "@/src/lib/student-api/session-events";
import type { UserDto } from "@/src/lib/student-api/contract";
import logo from "@/src/assets/logo-icon.png";
import "../styles/portal-shell.css";

const STUDENT_SIDEBAR_STORAGE_KEY = "student-sidebar-collapsed";
const STUDENT_SIDEBAR_CHANGE_EVENT = "elemni:student-sidebar-collapse-change";

function readStudentSidebarCollapsed() {
  if (typeof window === "undefined") return false;

  try {
    return window.localStorage.getItem(STUDENT_SIDEBAR_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function subscribeToStudentSidebarPreference(onChange: () => void) {
  if (typeof window === "undefined") return () => undefined;

  const handleStorageChange = (event: StorageEvent) => {
    if (event.key === STUDENT_SIDEBAR_STORAGE_KEY) onChange();
  };

  window.addEventListener("storage", handleStorageChange);
  window.addEventListener(STUDENT_SIDEBAR_CHANGE_EVENT, onChange);

  return () => {
    window.removeEventListener("storage", handleStorageChange);
    window.removeEventListener(STUDENT_SIDEBAR_CHANGE_EVENT, onChange);
  };
}

function useStudentSidebarCollapsed() {
  return useSyncExternalStore(
    subscribeToStudentSidebarPreference,
    readStudentSidebarCollapsed,
    () => false,
  );
}

function setStudentSidebarCollapsed(collapsed: boolean) {
  try {
    window.localStorage.setItem(STUDENT_SIDEBAR_STORAGE_KEY, String(collapsed));
  } catch {
    // The visual state still updates through the custom event when storage is unavailable.
  }

  window.dispatchEvent(new Event(STUDENT_SIDEBAR_CHANGE_EVENT));
}

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

type SidebarContentProps = {
  active: string;
  close?: () => void;
  logout: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
};

function SidebarContent({
  active,
  close,
  logout,
  collapsed = false,
  onToggleCollapse,
}: SidebarContentProps) {
  const collapseLabel = collapsed ? "توسيع القائمة الجانبية" : "تصغير القائمة الجانبية";

  return (
    <>
      <div className={cn("mb-8 flex flex-col", collapsed ? "items-center" : "items-stretch")}>
        <Link
          href="/dashboard"
          onClick={close}
          title={collapsed ? "علمني" : undefined}
          className={cn("flex items-center gap-3", collapsed ? "justify-center" : "mx-5")}
        >
          <Image
            src={logo}
            alt="علمني"
            width={44}
            height={44}
            className="size-11 rounded-xl bg-white object-contain p-1 shadow-sm ring-1 ring-[#E2E0EF]"
            priority
          />
          <span className={collapsed ? "sr-only" : undefined}><strong className="block text-2xl font-black text-[#0369A1]">علمني</strong><span className="text-xs text-[#777587]">منصة التعليم الذكي</span></span>
        </Link>

        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={collapseLabel}
            aria-expanded={!collapsed}
            title={collapseLabel}
            className={cn(
              "mt-4 flex h-10 cursor-pointer items-center justify-center rounded-lg text-[#777587] transition hover:bg-[#E0F2FE] hover:text-[#0369A1] focus-visible:ring-2 focus-visible:ring-[#0284C7] focus-visible:ring-offset-2 focus-visible:outline-none",
              collapsed ? "mx-auto w-10" : "mx-5",
            )}
          >
            {collapsed ? <PanelLeftOpen className="size-5" /> : <PanelLeftClose className="size-5" />}
          </button>
        )}
      </div>

      <nav aria-label="بوابة الطالب" className={cn("space-y-1", collapsed ? "px-2" : undefined)}>
        {enabledNav.map(({ label, href, icon: Icon, id }) => (
          <Link key={id} href={href} onClick={close} title={collapsed ? label : undefined} className={cn("flex h-12 items-center gap-3 border-s-4 text-sm font-bold transition", collapsed ? "justify-center px-0" : "px-6", active === id ? "border-[#0284C7] bg-[#0284C7]/5 text-[#0369A1]" : "border-transparent text-[#464555] hover:bg-[#E0F2FE]")}>
            <Icon className="size-5 shrink-0" /><span className={collapsed ? "sr-only" : undefined}>{label}</span>
          </Link>
        ))}
        {futureNav.map(({ label, icon: Icon }) => (
          <span key={label} aria-disabled="true" title={collapsed ? label : `${label} - قريباً`} className={cn("flex h-12 cursor-not-allowed items-center gap-3 border-s-4 border-transparent text-sm font-bold text-[#A6A3B5]", collapsed ? "justify-center px-0" : "px-6")}>
            <Icon className="size-5 shrink-0" /><span className={collapsed ? "sr-only" : undefined}>{label}</span>
          </span>
        ))}
      </nav>

      <button onClick={logout} title={collapsed ? "تسجيل الخروج" : undefined} className={cn("mt-auto flex h-11 cursor-pointer items-center gap-2 rounded-lg text-sm font-bold text-red-700 hover:bg-red-50", collapsed ? "mx-auto size-11 justify-center px-0" : "mx-5 px-3")}>
        <LogOut className="size-5 shrink-0" /><span className={collapsed ? "sr-only" : undefined}>تسجيل الخروج</span>
      </button>
    </>
  );
}

export default function StudentPortalShell({ children, user, active = "dashboard" }: { children: ReactNode; user: UserDto | null; active?: string }) {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const sidebarCollapsed = useStudentSidebarCollapsed();

  const logout = async () => {
    await fetch("/api/student/auth/logout", { method: "POST" }).catch(() => null);
    notifyStudentSessionChanged("logout");
    router.replace("/login");
  };

  return (
    <div dir="rtl" data-sidebar-collapsed={sidebarCollapsed} className="student-portal-shell min-h-screen bg-[#FCFCFE] font-readex text-[#1B1B24]">
      <aside aria-label="القائمة الجانبية" data-sidebar-collapsed={sidebarCollapsed} className="student-portal-sidebar fixed inset-y-0 z-40 hidden flex-col overflow-hidden border-s border-[#E2E0EF] bg-white py-7 md:flex">
        <SidebarContent
          active={active}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setStudentSidebarCollapsed(!sidebarCollapsed)}
          logout={() => void logout()}
        />
      </aside>

      <header className="student-portal-header fixed top-0 z-30 flex h-16 items-center justify-between border-b border-[#E2E0EF] bg-white/95 px-4 backdrop-blur-md md:px-8">
        <div className="flex items-center gap-2">
          <button onClick={() => setMobileOpen(true)} aria-label="فتح قائمة بوابة الطالب" className="flex size-10 cursor-pointer items-center justify-center rounded-lg text-[#464555] hover:bg-[#E0F2FE] md:hidden"><Menu className="size-6" /></button>
          <Link href="/dashboard" className="flex items-center gap-2 font-black text-[#0369A1] md:hidden"><Image src={logo} alt="علمني" width={28} height={28} className="size-7 rounded-lg object-contain bg-white" />علمني</Link>
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
