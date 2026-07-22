"use client";

import { useState, useEffect } from "react";
import { Search, User, GraduationCap, Sun, Moon, UserPlus, X, Menu } from "lucide-react";
import { cn } from "@/src/lib/cn";

interface NavbarProps {
  onOpenAuth: (mode: "signin" | "signup") => void;
  onSearchChange: (query: string) => void;
  searchQuery: string;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export default function Navbar({ onOpenAuth, onSearchChange, searchQuery, isDarkMode, onToggleDarkMode }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSearchInput, setShowSearchInput] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className={cn(
      "fixed top-0 right-0 left-0 z-50 transition-all duration-300",
      isScrolled
        ? "bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-sm border-b border-slate-100 dark:border-slate-800 py-3"
        : "bg-white dark:bg-slate-900 py-4"
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <a href="#" className="flex items-center gap-2.5 group focus:outline-none shrink-0">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-md shadow-primary/20 group-hover:scale-105 transition-transform">
                <GraduationCap className="w-6 h-6 stroke-[2.2]" />
              </div>
              <span className="text-2xl font-black tracking-tight text-[#0F172A] dark:text-white font-cairo">
                علمني
              </span>
            </a>

            <button
              type="button"
              onClick={onToggleDarkMode}
              className={cn(
                "relative flex items-center justify-between w-16 h-8 px-1.5 rounded-full border transition-all cursor-pointer",
                isDarkMode
                  ? "bg-slate-800 border-slate-700 text-slate-100"
                  : "bg-sky-100/90 border-sky-200 text-slate-800"
              )}
              title={isDarkMode ? "التبديل إلى الوضع المضيء" : "التبديل إلى الوضع الداكن"}
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

          <div className="flex items-center gap-3 sm:gap-5">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="sm:hidden p-2 text-slate-700 dark:text-slate-300 hover:text-primary rounded-lg focus:outline-none cursor-pointer"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            <div className="relative flex items-center">
              {showSearchInput ? (
                <div className="flex items-center bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full px-3 py-1.5 shadow-inner transition-all">
                  <Search className="w-4 h-4 text-slate-400 ml-2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="ابحث عن معلم..."
                    className="bg-transparent text-xs text-[#0F172A] dark:text-slate-100 focus:outline-none w-28 sm:w-44"
                    autoFocus
                  />
                  <button
                    onClick={() => {
                      setShowSearchInput(false);
                      onSearchChange("");
                    }}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 mr-1 text-xs cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowSearchInput(true)}
                  className="p-2 text-slate-700 dark:text-slate-300 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
                  title="بحث"
                >
                  <Search className="w-5 h-5" />
                </button>
              )}
            </div>

            <button
              onClick={() => onOpenAuth("signin")}
              className="hidden sm:flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 hover:text-primary transition-colors cursor-pointer font-cairo shrink-0"
            >
              <span>سجل دخولك</span>
              <User className="w-4 h-4 text-primary" />
            </button>

            <button
              onClick={() => onOpenAuth("signup")}
              className="px-4 sm:px-5 py-2.5 bg-primary hover:bg-primary-hover active:scale-95 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md shadow-primary/25 transition-all cursor-pointer flex items-center gap-2 font-cairo shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              <span>اعمل حساب جديد !</span>
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="sm:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 pt-3 pb-6 space-y-3 shadow-xl mt-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onToggleDarkMode}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                isDarkMode ? "bg-slate-800 text-sky-400 border border-slate-700" : "bg-sky-50 text-slate-700 border border-sky-100"
              )}
            >
              {isDarkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-500" />}
              <span>{isDarkMode ? "الوضع الداكن" : "الوضع المضيء"}</span>
            </button>
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300 font-cairo">مظهر المنصة</span>
          </div>

          <div className="pt-2 flex flex-col gap-2 font-cairo">
            <button
              onClick={() => { setMobileMenuOpen(false); onOpenAuth("signin"); }}
              className="w-full py-3 text-center text-sm font-semibold text-[#0F172A] dark:text-white bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center gap-2 cursor-pointer"
            >
              <User className="w-4 h-4 text-primary" />
              <span>سجل دخولك</span>
            </button>
            <button
              onClick={() => { setMobileMenuOpen(false); onOpenAuth("signup"); }}
              className="w-full py-3 text-center text-sm font-bold text-white bg-primary hover:bg-primary-hover rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>اعمل حساب جديد !</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
