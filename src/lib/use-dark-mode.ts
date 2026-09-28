"use client";

import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "elemni-dark-mode";

// The pre-paint script in the locale layout puts `dark` on <html> from the saved
// choice, so the class is the source of truth. Reading it through an external
// store (instead of seeding useState) lets React correct server-rendered light
// markup after hydration, so toggles never show the wrong state.
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
    document.documentElement.classList.toggle("dark", event.newValue === "true");
  };
  window.addEventListener("storage", onStorage);
  return () => {
    observer.disconnect();
    window.removeEventListener("storage", onStorage);
  };
}

const getSnapshot = () => document.documentElement.classList.contains("dark");
const getServerSnapshot = () => false;

export function useDarkMode(): [boolean, (value: boolean | ((prev: boolean) => boolean)) => void] {
  const isDarkMode = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setIsDarkMode = useCallback((value: boolean | ((prev: boolean) => boolean)) => {
    const next = typeof value === "function" ? value(getSnapshot()) : value;
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem(STORAGE_KEY, String(next));
    } catch {}
  }, []);

  return [isDarkMode, setIsDarkMode];
}
