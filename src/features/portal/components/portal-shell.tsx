"use client";

import Image from "next/image";
import { useState, useSyncExternalStore, type ReactNode } from "react";
import {
  Compass,
  GraduationCap,
  Home,
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
];

const shellSpring = { type: "spring", stiffness: 320, damping: 28 } as const;

function StudentIdentity({ user }: { user: UserDto | null }) {
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
      {user && <span className="hidden max-w-40 truncate text-sm font-black text-ink sm:block dark:text-slate-100">{user.name}</span>}
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
          const label = tNav(translationKey);
          return (
            <m.div
              key={id}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ ...shellSpring, delay: 0.05 * index }}
            >
              <Link href={href} onClick={close} title={collapsed ? label : undefined} className={cn("relative flex h-12 items-center gap-3 rounded-2xl text-sm font-black transition", collapsed ? "mx-auto size-12 justify-center px-0" : "px-4", isActive ? "text-white" : "text-ink hover:bg-brand-100 dark:text-slate-200 dark:hover:bg-slate-800")}>
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

      <m.button
        onClick={logout}
        title={collapsed ? tNav("logout") : undefined}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...shellSpring, delay: 0.2 }}
        whileTap={{ x: 2, y: 2 }}
        className={cn("mt-auto flex h-11 cursor-pointer items-center gap-2 rounded-2xl border-2 border-ink bg-red-600 text-sm font-black text-white shadow-[3px_3px_0_0_var(--color-ink)] transition hover:bg-red-700 dark:border-brand-300 dark:shadow-[3px_3px_0_0_#020617]", collapsed ? "mx-auto size-11 justify-center px-0" : "mx-4 px-3")}
      >
        <LogOut className="size-5 shrink-0" /><span className={collapsed ? "sr-only" : undefined}>{tNav("logout")}</span>
      </m.button>
    </>
  );
}

export default function StudentPortalShell({ children, user, active = "dashboard" }: { children: ReactNode; user: UserDto | null; active?: string }) {
  const locale = useLocale();
  const tBrand = useTranslations("brand");
  const tPortal = useTranslations("studentPortal");
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
      <div dir={locale === "ar" ? "rtl" : "ltr"} data-sidebar-collapsed={sidebarCollapsed} className="student-portal-shell min-h-screen font-readex text-ink dark:text-slate-100">
        <aside aria-label={tPortal("sidebarLabel")} data-sidebar-collapsed={sidebarCollapsed} className="student-portal-sidebar fixed inset-y-0 z-40 hidden flex-col overflow-hidden border-e-2 border-ink bg-surface py-7 md:flex dark:border-brand-300 dark:bg-[#0A1826]">
          <SidebarContent
            active={active}
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setStudentSidebarCollapsed(!sidebarCollapsed)}
            logout={() => void logout()}
          />
        </aside>

        <header className="student-portal-header fixed top-0 z-30 flex h-16 items-center justify-between border-b-2 border-ink bg-surface/95 px-4 backdrop-blur-md md:px-8 dark:border-brand-300 dark:bg-[#0A1826]/95">
          <div className="flex items-center gap-2">
            <button onClick={() => setMobileOpen(true)} aria-label={tPortal("openMenu")} className="flex size-10 cursor-pointer items-center justify-center rounded-xl border-2 border-ink text-ink hover:bg-brand-100 md:hidden dark:border-brand-300 dark:text-slate-200"><Menu className="size-6" /></button>
            <Link href="/dashboard" className="flex items-center gap-2 font-black text-brand-700 md:hidden dark:text-brand-300"><span className="sticker-badge block -rotate-3 bg-white p-0.5"><Image src={logo} alt={tBrand("name")} width={28} height={28} className="size-7 rounded-lg object-contain" /></span>{tBrand("name")}</Link>
          </div>
          <div className="flex items-center gap-3">
            <StudentIdentity user={user} />
          </div>
        </header>

        {mobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <button aria-label={tPortal("closeMenu")} onClick={() => setMobileOpen(false)} className="absolute inset-0 cursor-default bg-slate-950/40" />
            <m.aside
              className="student-portal-drawer absolute inset-y-0 flex w-[min(82vw,19rem)] flex-col border-e-2 border-ink bg-surface py-6 shadow-2xl dark:border-brand-300 dark:bg-[#0A1826]"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              transition={shellSpring}
            >
              <button onClick={() => setMobileOpen(false)} aria-label={tPortal("closeMenu")} className="student-portal-drawer-close absolute top-4 flex size-9 cursor-pointer items-center justify-center rounded-xl border-2 border-ink text-muted hover:bg-brand-100 dark:border-brand-300 dark:text-slate-300"><X className="size-5" /></button>
              <SidebarContent active={active} close={() => setMobileOpen(false)} logout={() => void logout()} />
            </m.aside>
          </div>
        )}

        <main className="student-portal-main min-h-screen pt-16">{children}</main>
      </div>
    </MotionProvider>
  );
}
