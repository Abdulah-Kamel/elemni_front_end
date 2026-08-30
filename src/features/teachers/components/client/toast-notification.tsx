"use client";

import { useState, useEffect, useRef } from "react";
import { Bell } from "lucide-react";
import { cn } from "@/src/lib/cn";

interface ToastProps {
  message: string | null;
  onClear: () => void;
}

export default function ToastNotification({ message, onClear }: ToastProps) {
  const [show, setShow] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onClearRef = useRef(onClear);

  useEffect(() => {
    onClearRef.current = onClear;
  });

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (message) {
      const id = requestAnimationFrame(() => {
        setShow(true);
      });
      timerRef.current = setTimeout(() => {
        setShow(false);
        setTimeout(() => onClearRef.current(), 300);
      }, 4000);
      return () => {
        cancelAnimationFrame(id);
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    } else {
      const id = requestAnimationFrame(() => setShow(false));
      return () => cancelAnimationFrame(id);
    }
  }, [message]);

  if (!show && !message) return null;

  return (
    <div className={cn(
      "fixed top-20 end-6 z-50 transition-all duration-300 transform",
      show ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0"
    )}>
      <div className="bg-[#0F172A] text-white text-xs sm:text-sm font-bold px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 dir-rtl max-w-sm">
        <div className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center shrink-0">
          <Bell className="w-4 h-4 animate-bounce" />
        </div>
        <p className="flex-1 text-end leading-snug">{message}</p>
        <button onClick={() => { requestAnimationFrame(() => setShow(false)); setTimeout(() => onClearRef.current(), 300); }} className="text-slate-400 hover:text-white me-1">✕</button>
      </div>
    </div>
  );
}
