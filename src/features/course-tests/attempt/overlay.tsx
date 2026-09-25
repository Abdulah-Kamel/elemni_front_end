"use client";

import { useEffect, useRef, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";
import { m } from "motion/react";
import { cn } from "@/src/lib/cn";

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

/**
 * Modal surface used by Submit-Confirm, Time-Up, the image viewer and the
 * mobile navigator sheet. Traps focus, closes on Escape (when closable) and
 * returns focus on unmount. Render it inside <AnimatePresence>.
 */
export function Overlay({
  labelledBy,
  role = "dialog",
  variant = "center",
  onClose,
  initialFocus,
  restoreFocus,
  className,
  children,
}: {
  labelledBy: string;
  role?: "dialog" | "alertdialog";
  variant?: "center" | "sheet";
  /** Omit to make the overlay non-dismissable (Time-Up). */
  onClose?: () => void;
  initialFocus?: RefObject<HTMLElement | null>;
  /** Set to false before closing to skip restoring focus (the caller moves it). */
  restoreFocus?: RefObject<boolean>;
  className?: string;
  children: ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const restore = restoreFocus;
    const panel = panelRef.current;
    (initialFocus?.current ?? panel?.querySelector<HTMLElement>(FOCUSABLE) ?? panel)?.focus();
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && onCloseRef.current) {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab" || !panel) return;
      const items = [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((node) => node.offsetParent !== null || node === document.activeElement);
      if (!items.length) {
        event.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && (document.activeElement === first || !panel.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !panel.contains(document.activeElement))) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflow;
      if (restore?.current !== false && previous?.isConnected) previous.focus({ preventScroll: true });
    };
    // Mount/unmount only: the overlay's lifetime is its open state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sheet = variant === "sheet";
  return createPortal(
    <div className={cn("fixed inset-0 z-[60] flex justify-center", sheet ? "items-end" : "items-center p-4")}>
      <m.div
        aria-hidden="true"
        className="absolute inset-0 bg-slate-900/55 backdrop-blur-[2px] dark:bg-black/65"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={() => onCloseRef.current?.()}
      />
      <m.div
        ref={panelRef}
        role={role}
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        className={cn(
          "relative flex max-h-[calc(100dvh-2rem)] w-full flex-col overflow-y-auto border-2 border-slate-900 bg-white text-slate-900 outline-none dark:border-sky-300 dark:bg-slate-900 dark:text-slate-100",
          sheet
            ? "max-h-[85dvh] rounded-t-3xl border-b-0 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-[0_-6px_0_#0F172A] dark:shadow-[0_-6px_0_#020617]"
            : "max-w-[520px] rounded-3xl shadow-[6px_6px_0_#0F172A] dark:shadow-[6px_6px_0_#020617]",
          className,
        )}
        initial={sheet ? { y: "100%" } : { opacity: 0, scale: 0.94, y: 12 }}
        animate={sheet ? { y: 0 } : { opacity: 1, scale: 1, y: 0 }}
        exit={sheet ? { y: "100%" } : { opacity: 0, scale: 0.96, y: 8 }}
        transition={sheet ? { type: "spring", stiffness: 380, damping: 36 } : { type: "spring", stiffness: 420, damping: 32 }}
      >
        {children}
      </m.div>
    </div>,
    document.body,
  );
}
