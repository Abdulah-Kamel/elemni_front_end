"use client";

import { useEffect, useState } from "react";

export function useDarkMode(): [boolean, (value: boolean | ((prev: boolean) => boolean)) => void] {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      const stored = localStorage.getItem("elemni-dark-mode");
      if (stored === "true") return true;
      if (stored === "false") return false;
    } catch {}
    return document.documentElement.classList.contains("dark");
  });

  useEffect(() => {
    const root = document.documentElement;
    const shouldBeDark = isDarkMode;
    if (root.classList.contains("dark") !== shouldBeDark) {
      root.classList.toggle("dark", shouldBeDark);
    }
    try {
      localStorage.setItem("elemni-dark-mode", String(shouldBeDark));
    } catch {}
  }, [isDarkMode]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === "elemni-dark-mode") {
        setIsDarkMode(event.newValue === "true");
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return [isDarkMode, setIsDarkMode] as const;
}
