"use client";

import Image from "next/image";
import { useState, useSyncExternalStore, type ReactNode } from "react";
import {
  Bell,
  Compass,
  GraduationCap,
  Home,
  CalendarDays,
  Search,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from "lucide-react";
import { m } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { Link, useRouter } from "@/src/i18n/navigation";
import { MotionProvider } from "@/src/components/ui/motion-provider";
import { cn } from "@/src/lib/cn";
import { notifyStudentSessionChanged } from "@/src/lib/student-api/session-events";
import type { UserDto } from "@/src/lib/student-api/contract";
import logo from "@/src/assets/logo-icon.png";
import "../styles/portal-shell.css";
import "../styles/sticker.css";

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
  { href: "/dashboard", icon: Home, id: "dashboard", translationKey: "dashboard" },
  { href: "/my-courses", icon: GraduationCap, id: "courses", translationKey: "myCourses" },
  { href: "/explore", icon: Compass, id: "discover", translationKey: "courses" },
  { href: "/dashboard#upcoming", icon: CalendarDays, id: "upcoming", translationKey: "upcomingLabel" },
];

const shellSpring = { type: "spring", stiffness: 320, damping: 28 } as const;

function StudentIdentity({ user, collapsed = false }: { user: UserDto | null; collapsed?: boolean }) {
  const locale = useLocale();
  const initials = user?.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("") || (locale === "ar" ? "ع" : "E");

  return (
    <div className="flex items-center gap-2.5">
      <m.span
        className="sticker-badge flex size-10 items-center justify-center bg-brand-600 text-sm font-black text-white"
        initial={{ rotate: -8, scale: 0.8, opacity: 0 }}
        animate={{ rotate: -3, scale: 1, opacity: 1 }}
        transition={shellSpring}
      >
        {initials}
      </m.span>
      {user && <span dir="auto" className={cn("max-w-40 truncate text-sm font-black text-ink dark:text-slate-100", collapsed && "sr-only")}>{user.name}</span>}
    </div>
  );
}

type SidebarContentProps = {
  active: string;
  close?: () => void;
  logout: () => void;
  user: UserDto | null;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
};

function SidebarContent({
  active,
  close,
  logout,
  user,
  collapsed = false,
  onToggleCollapse,
}: SidebarContentProps) {
  const tBrand = useTranslations("brand");
  const tNav = useTranslations("studentLanding.nav");
  const tPortal = useTranslations("studentPortal");
  const collapseLabel = collapsed
    ? tPortal("expandSidebar")
    : tPortal("collapseSidebar");

  return (
    <>
      <m.div
        className={cn("mb-8 flex flex-col", collapsed ? "items-center" : "items-stretch")}
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={shellSpring}
      >
        <Link
          href="/dashboard"
          onClick={close}
          title={collapsed ? tBrand("name") : undefined}
          className={cn("flex items-center gap-3", collapsed ? "justify-center" : "mx-4")}
        >
          <m.span
            className="sticker-badge block bg-white p-1"
            whileHover={{ rotate: 3, scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={shellSpring}
          >
            <Image
              src={logo}
              alt={tBrand("name")}
              width={44}
              height={44}
              className="size-11 rounded-xl object-contain"
              priority
            />
          </m.span>
          <span className={collapsed ? "sr-only" : undefined}><strong className="block text-2xl font-black tracking-tight text-brand-700 dark:text-brand-300">{tBrand("name")}</strong><span className="text-xs font-bold text-muted dark:text-slate-400">{tBrand("tagline")}</span></span>
        </Link>

        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={collapseLabel}
            aria-expanded={!collapsed}
            title={collapseLabel}
            className={cn(
              "mt-4 flex h-10 cursor-pointer items-center justify-center rounded-xl border-2 border-ink text-muted transition hover:bg-brand-100 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 dark:border-brand-300 dark:text-slate-300 dark:hover:bg-slate-800",
              collapsed ? "mx-auto w-10" : "mx-4",
            )}
          >
            {collapsed ? <PanelLeftOpen className="size-5" /> : <PanelLeftClose className="size-5" />}
          </button>
        )}
      </m.div>

      <nav aria-label={tPortal("sidebarLabel")} className={cn("space-y-2", collapsed ? "px-2" : "px-3")}>
        {enabledNav.map(({ href, icon: Icon, id, translationKey }, index) => {
          const isActive = active === id;
          const label = id === "upcoming" ? tPortal("upcomingLabel") : tNav(translationKey);
          const destination = id === "upcoming" && active === "dashboard" ? "#upcoming" : href;
          return (
            <m.div
              key={id}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ ...shellSpring, delay: 0.05 * index }}
            >
              <Link href={destination} onClick={close} title={collapsed ? label : undefined} aria-current={isActive ? "page" : undefined} className={cn("relative flex h-12 items-center gap-3 rounded-2xl text-sm font-black transition", collapsed ? "mx-auto size-12 justify-center px-0" : "px-4", isActive ? "text-white" : "text-ink hover:bg-brand-100 dark:text-slate-200 dark:hover:bg-slate-800")}>
                {isActive && (
                  <m.span
                    layoutId="portal-nav-active"
                    className="absolute inset-0 rounded-2xl border-2 border-ink bg-brand-600 shadow-[3px_3px_0_0_var(--color-ink)] dark:border-brand-300 dark:shadow-[3px_3px_0_0_#020617]"
                    transition={shellSpring}
                  />
                )}
                <Icon className="relative size-5 shrink-0" /><span className={collapsed ? "sr-only" : "relative"}>{label}</span>
              </Link>
            </m.div>
          );
        })}
      </nav>

      <div className={cn("mt-auto flex flex-col gap-4 border-t-2 border-ink/10 pt-5 dark:border-white/10", collapsed ? "mx-2 items-center" : "mx-4")}>
        <div className={cn("min-w-0", collapsed && "flex justify-center")}><StudentIdentity user={user} collapsed={collapsed} /></div>
        <m.button onClick={logout} title={tNav("logout")} aria-label={tNav("logout")} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ ...shellSpring, delay: 0.2 }} whileTap={{ x: 2, y: 2 }} className={cn("flex h-11 cursor-pointer items-center gap-2 rounded-2xl border-2 border-ink bg-red-600 text-sm font-black text-white shadow-[3px_3px_0_0_var(--color-ink)] transition hover:bg-red-700 dark:border-brand-300 dark:shadow-[3px_3px_0_0_#020617]", collapsed ? "w-11 justify-center" : "w-full justify-center px-3")}>
          <LogOut className="size-5 shrink-0" /><span className={collapsed ? "sr-only" : undefined}>{tNav("logout")}</span>
        </m.button>
      </div>
    </>
  );
}

export default function StudentPortalShell({ children, user, active = "dashboard", title }: { children: ReactNode; user: UserDto | null; active?: string; title?: string }) {
  const locale = useLocale();
  const tPortal = useTranslations("studentPortal");
  const tNav = useTranslations("studentLanding.nav");
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const sidebarCollapsed = useStudentSidebarCollapsed();

  const logout = async () => {
    await fetch("/api/student/auth/logout", { method: "POST" }).catch(() => null);
    notifyStudentSessionChanged("logout");
    router.replace("/login");
  };

  return (
    <MotionProvider>
      <div dir={locale === "ar" ? "rtl" : "ltr"} data-sidebar-collapsed={sidebarCollapsed} data-active={active} className={cn("student-portal-shell min-h-screen font-readex text-ink dark:text-slate-100", active === "dashboard" && "bg-[#f3f4f6] dark:bg-[#0A1826]")}>
        <aside aria-label={tPortal("sidebarLabel")} data-sidebar-collapsed={sidebarCollapsed} className="student-portal-sidebar fixed inset-y-0 z-40 hidden flex-col overflow-hidden border-e border-slate-200 bg-white py-6 md:flex dark:border-slate-700 dark:bg-[#0A1826]">
          <SidebarContent
            active={active}
            user={user}
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setStudentSidebarCollapsed(!sidebarCollapsed)}
            logout={() => void logout()}
          />
        </aside>

        <header className="student-portal-header fixed top-0 z-30 flex h-[72px] items-center gap-3 border-b border-slate-200 bg-white px-4 md:px-8 dark:border-slate-700 dark:bg-[#0A1826]">
          <button onClick={() => setMobileOpen(true)} aria-label={tPortal("openMenu")} className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 md:hidden dark:text-slate-200 dark:hover:bg-slate-800"><Menu className="size-5" /></button>
          {title && <p title={title} className="hidden max-w-64 truncate text-sm font-bold text-slate-900 lg:block dark:text-slate-100">{title}</p>}
          <form action={locale === "ar" ? "/explore" : `/${locale}/explore`} method="get" role="search" className="flex min-w-0 flex-1 items-center">
            <label className="sr-only" htmlFor="portal-course-search">{tPortal("searchCourses")}</label>
            <div className="flex h-11 w-full max-w-[440px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-slate-500 focus-within:border-brand-600 focus-within:ring-2 focus-within:ring-brand-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:focus-within:ring-sky-900">
              <Search className="size-4 shrink-0" aria-hidden="true" />
              <input id="portal-course-search" type="search" name="q" placeholder={tNav("searchPlaceholder")} className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-500 dark:text-white dark:placeholder:text-slate-400" />
            </div>
          </form>
          <Link href={active === "dashboard" ? "#upcoming" : "/dashboard#upcoming"} aria-label={tPortal("upcomingLabel")} className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"><Bell className="size-5" /></Link>
        </header>

        {mobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <button aria-label={tPortal("closeMenu")} onClick={() => setMobileOpen(false)} className="absolute inset-0 cursor-default bg-slate-950/40" />
            <m.aside
              className="student-portal-drawer absolute inset-y-0 flex w-[min(82vw,19rem)] flex-col border-e border-slate-200 bg-white py-6 shadow-2xl dark:border-slate-700 dark:bg-[#0A1826]"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              transition={shellSpring}
            >
              <button onClick={() => setMobileOpen(false)} aria-label={tPortal("closeMenu")} className="student-portal-drawer-close absolute top-4 flex size-9 cursor-pointer items-center justify-center rounded-xl border-2 border-ink text-muted hover:bg-brand-100 dark:border-brand-300 dark:text-slate-300"><X className="size-5" /></button>
              <SidebarContent active={active} user={user} close={() => setMobileOpen(false)} logout={() => void logout()} />
            </m.aside>
          </div>
        )}

        <nav aria-label={tPortal("mobileNavigation")} className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-slate-200 bg-white px-2 pb-[env(safe-area-inset-bottom)] pt-2 md:hidden dark:border-slate-700 dark:bg-[#0A1826]">
          {[
            { href: "/dashboard", id: "dashboard", icon: Home, label: tNav("dashboard") },
            { href: "/my-courses", id: "courses", icon: GraduationCap, label: tNav("myCourses") },
            { href: "/explore", id: "discover", icon: Compass, label: tNav("courses") },
            { href: active === "dashboard" ? "#upcoming" : "/dashboard#upcoming", id: "upcoming", icon: CalendarDays, label: tPortal("upcomingLabel") },
          ].map(({ href, id, icon: Icon, label }) => (
            <Link key={id} href={href} className={cn("flex min-h-12 flex-col items-center justify-center gap-1 rounded-lg text-[10px] font-semibold transition", active === id ? "text-brand-700 dark:text-brand-300" : "text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white")}>
              <Icon className="size-5" aria-hidden="true" /><span className="max-w-full truncate">{label}</span>
            </Link>
          ))}
        </nav>

        <main className="student-portal-main min-h-screen pt-[72px]">{children}</main>
      </div>
    </MotionProvider>
  );
}
