import {
  ClipboardCheck,
  Smartphone,
  Banknote,
  Folder,
  GraduationCap,
  LineChart,
  TrendingUp,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

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
  { key: "drm", icon: GraduationCap as LucideIcon, tint: "pink" },
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
  leak: { elemni: true, whatsapp: false, youtube: "partial", others: "leaked" },
  pay: { elemni: true, whatsapp: false, youtube: false, others: "partial" },
  organize: { elemni: true, whatsapp: false, youtube: false, others: true },
  reports: { elemni: true, whatsapp: false, youtube: false, others: "partial" },
  setup: {
    elemni: "setupElemni",
    whatsapp: "setupWhatsapp",
    youtube: "setupYoutube",
    others: "setupOthers",
  },
} as const;

// --- Student landing static data ---

export const STUDENT_FEATURES: {
  key: string;
  icon: LucideIcon;
  chipClass: string;
}[] = [
  { key: "organize", icon: Folder, chipClass: "bg-accent-400/10 text-accent-600" },
  { key: "mobile", icon: Smartphone, chipClass: "bg-blue-100 text-blue-600" },
  { key: "payments", icon: Banknote, chipClass: "bg-orange-100 text-orange-600" },
  { key: "exams", icon: ClipboardCheck, chipClass: "bg-success-500/15 text-success-700" },
  { key: "pricing", icon: TrendingUp, chipClass: "bg-pink-100 text-pink-600" },
  { key: "progress", icon: LineChart, chipClass: "bg-brand-100 text-brand-700" },
];

export const STUDENT_STEPS = [
  { num: 1, circleClass: "bg-accent-500" },
  { num: 2, circleClass: "bg-brand-600" },
  { num: 3, circleClass: "bg-success-500" },
] as const;

export const STUDENT_TESTIMONIALS = [
  { key: "1", avatar: "/placeholders/avatar-1.svg" },
  { key: "2", avatar: "/placeholders/avatar-2.svg" },
  { key: "3", avatar: "/placeholders/avatar-3.svg" },
] as const;

export const STUDENT_TEACHERS: {
  key: string;
  avatar: string;
  tagClass: string;
}[] = [
  { key: "card1", avatar: "/placeholders/avatar-1.svg", tagClass: "bg-ink/5 text-muted" },
  { key: "card2", avatar: "/placeholders/avatar-2.svg", tagClass: "bg-brand-100 text-brand-600" },
  { key: "card3", avatar: "/placeholders/avatar-3.svg", tagClass: "bg-success-500/15 text-success-700" },
];

export const STUDENT_COMPARISON_MATRIX = {
  price: { elemni: true, youtube: "partial", tutor: false, books: false },
  quality: { elemni: true, youtube: "partial", tutor: true, books: false },
  organize: { elemni: true, youtube: false, tutor: false, books: true },
  mobile: { elemni: true, youtube: true, tutor: false, books: false },
  repeat: { elemni: true, youtube: true, tutor: false, books: false },
  tracking: { elemni: true, youtube: false, tutor: false, books: false },
} as const;
