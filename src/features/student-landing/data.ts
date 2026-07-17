import type { Subject } from "@/src/features/student-landing/schemas/subject";
import type { Grade } from "@/src/features/student-landing/schemas/grade";
import type { Stream } from "@/src/features/student-landing/schemas/stream";
import type { FeaturedContent } from "@/src/features/student-landing/schemas/featured-content";

export const fallbackSubjects: Subject[] = [
  {
    id: "sub-fallback-1",
    slug: "physics",
    name: { ar: "فيزياء", en: "Physics" },
    icon: "atom",
    gradeIds: ["g-fallback-1", "g-fallback-2"],
    streamIds: ["st-fallback-1", "st-fallback-2"],
    lessonsCount: null,
    featured: true,
  },
  {
    id: "sub-fallback-2",
    slug: "mathematics",
    name: { ar: "رياضيات", en: "Mathematics" },
    icon: "sigma",
    gradeIds: ["g-fallback-1", "g-fallback-2"],
    streamIds: ["st-fallback-1", "st-fallback-2"],
    lessonsCount: null,
    featured: true,
  },
  {
    id: "sub-fallback-3",
    slug: "chemistry",
    name: { ar: "كيمياء", en: "Chemistry" },
    icon: "flask",
    gradeIds: ["g-fallback-1"],
    streamIds: ["st-fallback-1"],
    lessonsCount: null,
    featured: false,
  },
  {
    id: "sub-fallback-4",
    slug: "biology",
    name: { ar: "أحياء", en: "Biology" },
    icon: "dna",
    gradeIds: ["g-fallback-1"],
    streamIds: ["st-fallback-2"],
    lessonsCount: null,
    featured: false,
  },
];

export const fallbackGrades: Grade[] = [
  {
    id: "g-fallback-1",
    slug: "grade-3-secondary",
    name: { ar: "الثالث الثانوي", en: "Grade 12" },
    order: 3,
    subjectIds: ["sub-fallback-1", "sub-fallback-2", "sub-fallback-3", "sub-fallback-4"],
  },
  {
    id: "g-fallback-2",
    slug: "grade-2-secondary",
    name: { ar: "الثاني الثانوي", en: "Grade 11" },
    order: 2,
    subjectIds: ["sub-fallback-1", "sub-fallback-2"],
  },
];

export const fallbackStreams: Stream[] = [
  {
    id: "st-fallback-1",
    slug: "scientific",
    name: { ar: "علمي علوم", en: "Science — Bio" },
    gradeId: "g-fallback-1",
    subjectIds: ["sub-fallback-1", "sub-fallback-2", "sub-fallback-3"],
  },
  {
    id: "st-fallback-2",
    slug: "scientific-math",
    name: { ar: "علمي رياضة", en: "Science — Math" },
    gradeId: "g-fallback-1",
    subjectIds: ["sub-fallback-1", "sub-fallback-2", "sub-fallback-4"],
  },
];

export const fallbackFeatured: FeaturedContent[] = [
  {
    id: "fc-fallback-1",
    title: { ar: "أقوى شرح للتفاضل والتكامل", en: "Best Calculus Explainer" },
    description: { ar: "شرح مبسط مع أمثلة محلولة", en: "Simplified with solved examples" },
    thumbnailUrl: null,
    linkType: "subject",
    linkTarget: "mathematics",
    subjectId: "sub-fallback-2",
    displayOrder: 1,
  },
  {
    id: "fc-fallback-2",
    title: { ar: "فيزياء — الكهربية", en: "Physics — Electricity" },
    description: { ar: "أساسيات الكهربية والتيار", en: "Basics of electricity and current" },
    thumbnailUrl: null,
    linkType: "subject",
    linkTarget: "physics",
    subjectId: "sub-fallback-1",
    displayOrder: 2,
  },
];
