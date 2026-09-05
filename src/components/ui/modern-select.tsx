"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, type LucideIcon } from "lucide-react";
import { AnimatePresence, m } from "motion/react";
import { cn } from "@/src/lib/cn";

export interface ModernSelectOption {
  value: string;
  label: string;
}

interface ModernSelectProps {
  label: string;
  options: ModernSelectOption[];
  value: string;
  onChange: (value: string) => void;
  icon?: LucideIcon;
  placeholder?: string;
  className?: string;
}

export function ModernSelect({
  label,
  options,
  value,
  onChange,
  icon: Icon,
  className,
}: ModernSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value) || options[0];

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close dropdown on Escape key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className={cn("relative text-start font-readex", className)} ref={containerRef}>
      <label className="mb-1.5 block text-xs font-bold text-slate-500 dark:text-slate-400">
        {label}
      </label>

      {/* Select Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "w-full cursor-pointer flex items-center justify-between gap-2 rounded-2xl border bg-slate-50/80 dark:bg-slate-900/80 py-3 px-4 text-sm font-bold text-[#0F172A] dark:text-white transition-all duration-200 backdrop-blur-sm",
          isOpen
            ? "border-primary ring-2 ring-primary/20 bg-white dark:bg-slate-900 shadow-md"
            : "border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-white dark:hover:bg-slate-900"
        )}
      >
        <div className="flex items-center gap-2.5 truncate">
          {Icon && <Icon className="size-4 text-primary shrink-0 stroke-[2.2]" />}
          <span className="truncate">{selectedOption?.label}</span>
        </div>

        <ChevronDown
          className={cn(
            "size-4 text-slate-400 shrink-0 transition-transform duration-200",
            isOpen && "rotate-180 text-primary"
          )}
        />
      </button>

      {/* Dropdown Menu Popover */}
      <AnimatePresence>
        {isOpen && (
          <m.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute z-50 mt-2 w-full min-w-[200px] overflow-hidden rounded-2xl border border-slate-200/90 dark:border-slate-700/90 bg-white/95 dark:bg-slate-900/95 p-1.5 shadow-xl backdrop-blur-xl max-h-60 overflow-y-auto scrollbar-thin"
          >
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-start cursor-pointer",
                    isSelected
                      ? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-sky-300"
                      : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                  )}
                >
                  <span className="truncate">{option.label}</span>
                  {isSelected && <Check className="size-4 text-primary shrink-0 stroke-[2.5]" />}
                </button>
              );
            })}
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
