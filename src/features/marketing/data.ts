import {
  ClipboardCheck,
  Folder,
  ShieldCheck,
  Smartphone,
  Banknote,
  LineChart,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * Counted up by <Counter> and formatted per-locale via Intl.
 * The unit/suffix ("مليون" / "M") is a localized string in messages/*.json.
 */
export const STATS = [
  { key: "earnings", value: 12 },
  { key: "students", value: 180000 },
  { key: "teachers", value: 3000 },
] as const;

export const LESSONS = [
  {
    key: "light",
    priceKey: "free",
    duration: "١٥:٠٠",
    durationEn: "15:00",
    image: "/placeholders/lesson-light.svg",
  },
  {
    key: "current",
    price: "٥٠",
    priceEn: "50",
    duration: "٣٨:١٥",
    durationEn: "38:15",
    image: "/placeholders/lesson-current.svg",
  },
  {
    key: "ohm",
    price: "٩٠",
    priceEn: "90",
    duration: "٤٤:٢٠",
    durationEn: "44:20",
    image: "/placeholders/lesson-ohm.svg",
  },
] as const;

export const FEATURE_ICONS = [
  { key: "exams", icon: ClipboardCheck as LucideIcon, tint: "success" },
  { key: "organize", icon: Folder as LucideIcon, tint: "amber" },
  { key: "drm", icon: ShieldCheck as LucideIcon, tint: "pink" },
  { key: "mobile", icon: Smartphone as LucideIcon, tint: "blue" },
  { key: "payments", icon: Banknote as LucideIcon, tint: "orange" },
  { key: "reports", icon: LineChart as LucideIcon, tint: "violet" },
] as const;

export const TESTIMONIALS = [
  { key: "1", avatar: "/placeholders/avatar-1.svg" },
  { key: "2", avatar: "/placeholders/avatar-2.svg" },
  { key: "3", avatar: "/placeholders/avatar-3.svg" },
] as const;

export const STEPS = [
  { num: 1, circleClass: "bg-accent-500", image: "/placeholders/step-1.svg" },
  { num: 2, circleClass: "bg-brand-600", image: "/placeholders/step-2.svg" },
  { num: 3, circleClass: "bg-teal-500", image: "/placeholders/step-3.svg" },
] as const;

export const COMPARISON_MATRIX = {
  leak: { elemni: true, whatsapp: false, youtube: "partial", others: true },
  pay: { elemni: true, whatsapp: false, youtube: false, others: "partial" },
  organize: { elemni: true, whatsapp: false, youtube: false, others: true },
  reports: { elemni: true, whatsapp: false, youtube: false, others: "partial" },
  app: { elemni: true, whatsapp: false, youtube: false, others: false },
  setup: {
    elemni: "setupElemni",
    whatsapp: "setupWhatsapp",
    youtube: "setupYoutube",
    others: "setupOthers",
  },
} as const;
