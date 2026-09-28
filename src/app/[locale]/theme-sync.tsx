"use client";

import { useLayoutEffect } from "react";

/**
 * Switching language mounts a new <html> (it is rendered by this locale
 * layout), and the pre-paint theme script in <head> does not run again on a
 * client navigation. Re-apply the saved theme before paint so the language
 * switch never changes light/dark.
 */
export function ThemeSync({ locale }: { locale: string }) {
  useLayoutEffect(() => {
    try {
      const saved = localStorage.getItem("elemni-dark-mode");
      if (saved === "true") document.documentElement.classList.add("dark");
      else if (saved === "false") document.documentElement.classList.remove("dark");
    } catch {}
  }, [locale]);
  return null;
}
