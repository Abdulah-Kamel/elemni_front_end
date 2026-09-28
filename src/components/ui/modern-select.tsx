"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, useSyncExternalStore, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
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

type MenuPosition = { top?: number; bottom?: number; left: number; width: number; maxHeight: number; above: boolean };

const MENU_GAP = 8;
const subscribeNoop = () => () => {};
const MENU_MAX_HEIGHT = 240;

export function ModernSelect({
  label,
  options,
  value,
  onChange,
  icon: Icon,
  className,
}: ModernSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [position, setPosition] = useState<MenuPosition | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const id = useId();
  const labelId = `${id}-label`;
  const listId = `${id}-list`;

  const selectedIndex = Math.max(0, options.findIndex((opt) => opt.value === value));
  const selectedOption = options[selectedIndex];

  // Portals only exist in the browser: false during SSR and hydration, true after.
  const mounted = useSyncExternalStore(subscribeNoop, () => true, () => false);

  // The menu renders in a portal on <body> so no parent's overflow, transform
  // or stacking context (reveal animations, cards below) can clip or cover it.
  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom - MENU_GAP;
    const spaceAbove = rect.top - MENU_GAP;
    const above = spaceBelow < Math.min(MENU_MAX_HEIGHT, 160) && spaceAbove > spaceBelow;
    const maxHeight = Math.max(120, Math.min(MENU_MAX_HEIGHT, (above ? spaceAbove : spaceBelow) - MENU_GAP));
    setPosition({
      ...(above ? { bottom: window.innerHeight - rect.top + MENU_GAP } : { top: rect.bottom + MENU_GAP }),
      left: rect.left,
      width: Math.max(rect.width, 200),
      maxHeight,
      above,
    });
  }, []);

  useLayoutEffect(() => {
    if (!isOpen) return;
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen, updatePosition]);

  // Close on outside click (the menu lives outside the container, so check both).
  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (containerRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Keep the active option in view while navigating with the keyboard.
  useEffect(() => {
    if (!isOpen || activeIndex < 0) return;
    menuRef.current?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`)?.scrollIntoView?.({ block: "nearest" });
  }, [activeIndex, isOpen]);

  const open = () => {
    setActiveIndex(selectedIndex);
    setIsOpen(true);
  };
  const close = (restoreFocus = true) => {
    setIsOpen(false);
    if (restoreFocus) triggerRef.current?.focus();
  };
  const choose = (index: number) => {
    const option = options[index];
    if (option) onChange(option.value);
    close();
  };

  const onTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (!isOpen) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
        event.preventDefault();
        open();
      }
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(options.length - 1, index + 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(0, index - 1));
    } else if (event.key === "Home") {
      event.preventDefault();
      setActiveIndex(0);
    } else if (event.key === "End") {
      event.preventDefault();
      setActiveIndex(options.length - 1);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      choose(activeIndex);
    } else if (event.key === "Escape") {
      event.preventDefault();
      close();
    } else if (event.key === "Tab") {
      close(false);
    }
  };

  const menu = (
    <AnimatePresence>
      {isOpen && position && (
        <m.div
          ref={menuRef}
          id={listId}
          role="listbox"
          aria-labelledby={labelId}
          initial={{ opacity: 0, y: position.above ? -6 : 6, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: position.above ? -4 : 4, scale: 0.98 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          style={{
            position: "fixed",
            top: position.top,
            bottom: position.bottom,
            left: position.left,
            width: position.width,
            maxHeight: position.maxHeight,
          }}
          className="z-[100] overflow-y-auto rounded-2xl border border-slate-200/90 bg-white/95 p-1.5 font-readex shadow-xl backdrop-blur-xl scrollbar-thin dark:border-slate-700/90 dark:bg-slate-900/95"
        >
          {options.map((option, index) => {
            const isSelected = option.value === value;
            const isActive = index === activeIndex;
            return (
              <div
                key={option.value}
                id={`${id}-option-${index}`}
                data-index={index}
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => choose(index)}
                className={cn(
                  "flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl px-3.5 py-2.5 text-start text-xs font-bold transition-colors",
                  isSelected
                    ? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-sky-300"
                    : "text-slate-700 dark:text-slate-200",
                  isActive && !isSelected && "bg-slate-100 dark:bg-slate-800",
                )}
              >
                <span className="truncate">{option.label}</span>
                {isSelected && <Check className="size-4 shrink-0 stroke-[2.5] text-primary" aria-hidden="true" />}
              </div>
            );
          })}
        </m.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className={cn("relative text-start font-readex", className)} ref={containerRef}>
      <span id={labelId} className="mb-1.5 block text-xs font-bold text-slate-500 dark:text-slate-400">
        {label}
      </span>

      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={isOpen ? listId : undefined}
        aria-labelledby={`${labelId} ${id}-value`}
        aria-activedescendant={isOpen && activeIndex >= 0 ? `${id}-option-${activeIndex}` : undefined}
        onClick={() => (isOpen ? close() : open())}
        onKeyDown={onTriggerKeyDown}
        className={cn(
          "flex w-full cursor-pointer items-center justify-between gap-2 rounded-2xl border bg-slate-50/80 px-4 py-3 text-sm font-bold text-[#0F172A] backdrop-blur-sm transition-all duration-200 dark:bg-slate-900/80 dark:text-white",
          isOpen
            ? "border-primary bg-white shadow-md ring-2 ring-primary/20 dark:bg-slate-900"
            : "border-slate-200 hover:border-slate-300 hover:bg-white dark:border-slate-700/80 dark:hover:border-slate-600 dark:hover:bg-slate-900",
        )}
      >
        <div className="flex items-center gap-2.5 truncate">
          {Icon && <Icon className="size-4 shrink-0 stroke-[2.2] text-primary" aria-hidden="true" />}
          <span id={`${id}-value`} className="truncate">{selectedOption?.label}</span>
        </div>

        <ChevronDown
          aria-hidden="true"
          className={cn("size-4 shrink-0 text-slate-400 transition-transform duration-200", isOpen && "rotate-180 text-primary")}
        />
      </button>

      {mounted ? createPortal(menu, document.body) : null}
    </div>
  );
}
