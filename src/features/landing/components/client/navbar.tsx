"use client";

import { useState, useEffect } from "react";
import { Search, User, GraduationCap, Sun, Moon, UserPlus, X, Menu, BookOpen, Sparkles, Route, CircleHelp, BookMarked, LayoutDashboard, LogOut } from "lucide-react";
import { cn } from "@/src/lib/cn";
import { AnimatePresence, m } from "motion/react";
import { Link } from "@/src/i18n/navigation";
import { notifyStudentSessionChanged } from "@/src/lib/student-api/session-events";
import { useCurrentStudent } from "@/src/features/student/hooks/use-student-queries";
import { useTranslations } from "next-intl";

interface NavbarProps {
  onOpenAuth: (mode: "signin" | "signup") => void;
  onSearchChange: (query: string) => void;
  searchQuery: string;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onGoHome?: () => void;
  showSearch?: boolean;
  landingBaseHref?: string;
}

const navItems = [
  { hash: "#courses", key: "courses", icon: BookOpen },
  { hash: "#features", key: "features", icon: Sparkles },
  { hash: "#how", key: "how", icon: Route },
  { hash: "#faq", key: "faq", icon: CircleHelp },
] as const;

const pageLinks = [
  { href: "/legal", key: "legal" },
  { href: "/contact", key: "contact" },
] as const;

export default function Navbar({ onSearchChange, searchQuery, isDarkMode, onToggleDarkMode, onGoHome, showSearch = true, landingBaseHref = "" }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSearchInput, setShowSearchInput] = useState(false);
  const { data: currentUser } = useCurrentStudent();
  const tNav = useTranslations("studentLanding.nav");
  const tGlobalNav = useTranslations("nav");
  const tFooter = useTranslations("footer");
  const tBrand = useTranslations("brand");

  const logout = async () => {
    await fetch("/api/student/auth/logout", { method: "POST" }).catch(() => null);
    setMobileMenuOpen(false);
    notifyStudentSessionChanged("logout");
  };

  useEffect(() => {
    let frameId: number | null = null;
    const handleScroll = () => {
      if (frameId !== null) return;
      frameId = window.requestAnimationFrame(() => {
        setIsScrolled(window.scrollY > 20);
        frameId = null;
      });
    };
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (frameId !== null) window.cancelAnimationFrame(frameId);
    };
  }, []);

  return (
    <header className={cn(
      "fixed inset-x-0 top-0 z-50 transition-all duration-300",
      isScrolled
        ? "bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-sm border-b border-slate-100 dark:border-slate-800 py-3"
        : "bg-white dark:bg-slate-900 py-4"
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <a href={`${landingBaseHref}#hero`} onClick={(e) => { if (onGoHome) { e.preventDefault(); onGoHome(); } }} className="flex items-center gap-2.5 group focus:outline-none shrink-0 cursor-pointer">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-md shadow-primary/20 group-hover:scale-105 transition-transform">
                <GraduationCap className="w-6 h-6 stroke-[2.2]" />
              </div>
              <span className="text-2xl font-black tracking-tight text-[#0F172A] dark:text-white">
                {tBrand("name")}
              </span>
            </a>

            <button
              type="button"
              onClick={onToggleDarkMode}
              className={cn(
                "relative flex items-center justify-between w-16 h-8 px-1.5 rounded-full border transition-all cursor-pointer",
                isDarkMode
                  ? "bg-slate-800 border-slate-700 text-slate-100"
                  : "bg-sky-100/90 border-sky-200 text-slate-900"
              )}
              title={isDarkMode ? tNav("lightMode") : tNav("darkMode")}
            >
              <div className={cn(
                "w-5 h-5 rounded-full flex items-center justify-center transition-all",
                !isDarkMode ? "bg-white text-amber-500 shadow-md" : "text-slate-400"
              )}>
                <Sun className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
              <div className={cn(
                "w-5 h-5 rounded-full flex items-center justify-center transition-all",
                isDarkMode ? "bg-primary text-white shadow-md" : "text-slate-400"
              )}>
                <Moon className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
            </button>
          </div>

          <nav aria-label={tNav("mainNavigation")} className="hidden items-center gap-1 lg:flex">
            {navItems.map((item) => (
              <a
                key={item.hash}
                href={`${landingBaseHref}${item.hash}`}
                className="rounded-lg px-3 py-2 text-xs font-bold text-slate-700 transition-colors hover:bg-sky-50 hover:text-primary dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-sky-300"
              >
                {tNav(item.key)}
              </a>
            ))}
            {pageLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-2 text-xs font-bold text-slate-700 transition-colors hover:bg-sky-50 hover:text-primary dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-sky-300"
              >
                {tFooter(item.key)}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3 sm:gap-5">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="sm:hidden p-2 text-slate-700 dark:text-slate-300 hover:text-primary rounded-lg focus:outline-none cursor-pointer"
              aria-label={tNav("menu")}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {showSearch && <div className="hidden sm:flex relative items-center">
              <AnimatePresence mode="wait" initial={false}>
              {showSearchInput ? (
                <m.div
                  key="search-input"
                  initial={{ opacity: 0, width: 40 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 40 }}
                  className="flex items-center overflow-hidden rounded-full border border-slate-200 bg-[#F8FAFC] px-3 py-1.5 shadow-inner dark:border-slate-700 dark:bg-slate-800"
                >
                  <Search className="me-2 size-4 shrink-0 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder={tNav("searchPlaceholder")}
                    className="bg-transparent text-xs text-[#0F172A] dark:text-slate-100 focus:outline-none w-28 sm:w-44"
                    autoFocus
                  />
                  <button
                    onClick={() => {
                      setShowSearchInput(false);
                      onSearchChange("");
                    }}
                    className="ms-1 cursor-pointer text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    aria-label={tNav("closeSearch")}
                  >
                    ✕
                  </button>
                </m.div>
              ) : (
                <m.button
                  key="search-button"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={() => setShowSearchInput(true)}
                  className="p-2 text-slate-700 dark:text-slate-300 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
                  title={tNav("search")}
                >
                  <Search className="w-5 h-5" />
                </m.button>
              )}
              </AnimatePresence>
            </div>}

            {currentUser ? (
              <div className="hidden items-center gap-2 sm:flex">
                <Link href="/dashboard" className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-extrabold text-primary hover:bg-sky-50 dark:hover:bg-slate-800">
                  <LayoutDashboard className="size-4" />
                  <span>{tNav("dashboard")}</span>
                </Link>
                <Link href="/my-courses" className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-extrabold text-primary hover:bg-sky-50 dark:hover:bg-slate-800">
                  <BookMarked className="size-4" />
                  <span>{tNav("myCourses")}</span>
                </Link>
                <span className="max-w-28 truncate text-xs font-bold text-slate-700 dark:text-slate-200">{currentUser.name}</span>
                <button onClick={logout} title={tNav("logout")} aria-label={tNav("logout")} className="cursor-pointer rounded-lg p-2 text-red-700 hover:bg-red-50 hover:text-red-800 dark:text-red-300 dark:hover:bg-slate-800">
                  <LogOut className="size-4" />
                </button>
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden sm:flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 hover:text-primary transition-colors cursor-pointer shrink-0"
                >
                  <span>{tGlobalNav("login")}</span>
                  <User className="w-4 h-4 text-primary" />
                </Link>

                <Link
                  href="/register"
                  className="hidden sm:inline-flex px-4 sm:px-5 py-2.5 bg-primary hover:bg-primary-hover active:scale-95 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md shadow-primary/25 transition-all cursor-pointer items-center gap-2 shrink-0"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{tGlobalNav("cta")}</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence initial={false}>
      {mobileMenuOpen && (
        <m.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-3 space-y-3 overflow-hidden border-b border-slate-200 bg-white px-4 pb-6 pt-3 shadow-xl dark:border-slate-800 dark:bg-slate-900 sm:hidden"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onToggleDarkMode}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                isDarkMode ? "bg-slate-800 text-sky-400 border border-slate-700" : "bg-sky-50 text-slate-900 border border-sky-100"
              )}
            >
              {isDarkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-500" />}
              <span>{isDarkMode ? tNav("lightMode") : tNav("darkMode")}</span>
            </button>
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{tNav("appearance")}</span>
          </div>

          {showSearch && <div className="relative pt-2">
            <Search className="absolute end-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={tNav("searchPlaceholder")}
              className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] py-2.5 pe-4 ps-10 text-sm text-[#0F172A] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>}

          <nav aria-label={tNav("mobileNavigation")} className="grid grid-cols-2 gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
            {navItems.map(({ hash, key, icon: Icon }) => (
              <a
                key={hash}
                href={`${landingBaseHref}${hash}`}
                onClick={() => setMobileMenuOpen(false)}
                className="flex min-h-11 items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 dark:bg-slate-800 dark:text-slate-100"
              >
                <Icon className="size-4 text-primary" />
                <span>{tNav(key)}</span>
              </a>
            ))}
            {pageLinks.map(({ href, key }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex min-h-11 items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 dark:bg-slate-800 dark:text-slate-100"
              >
                <span>{tFooter(key)}</span>
              </Link>
            ))}
          </nav>

          <div className="flex flex-col gap-2">
            {currentUser ? (
              <>
                <div className="rounded-xl bg-slate-50 px-3 py-2 text-sm font-bold text-ink dark:bg-slate-800">{currentUser.name}</div>
                <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} className="flex w-full items-center justify-center gap-2 rounded-xl border border-sky-200 bg-sky-50 py-3 text-sm font-bold text-primary dark:border-slate-700 dark:bg-slate-800">
                  <LayoutDashboard className="size-4" />
                  <span>{tNav("dashboard")}</span>
                </Link>
                <Link href="/my-courses" onClick={() => setMobileMenuOpen(false)} className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-white">
                  <BookMarked className="size-4" />
                  <span>{tNav("myCourses")}</span>
                </Link>
                <button onClick={logout} className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-red-50 py-3 text-sm font-bold text-red-700 dark:bg-red-950/30 dark:text-red-300">
                  <LogOut className="size-4" />
                  <span>{tNav("logout")}</span>
                </button>
              </>
            ) : (
              <>
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-3 text-center text-sm font-semibold text-[#0F172A] dark:text-white bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center gap-2 cursor-pointer"
            >
              <User className="w-4 h-4 text-primary" />
              <span>{tGlobalNav("login")}</span>
            </Link>
            <Link
              href="/register"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-3 text-center text-sm font-bold text-white bg-primary hover:bg-primary-hover rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>{tGlobalNav("cta")}</span>
            </Link>
              </>
            )}
          </div>
        </m.div>
      )}
      </AnimatePresence>
    </header>
  );
}
