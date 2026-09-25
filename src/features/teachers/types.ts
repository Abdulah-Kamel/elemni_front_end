import type { ImageProps } from "next/image";

export type ImageSource = ImageProps["src"];

export interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  duration: string;
  sessionsCount: number;
  /** Real cover only; screens draw a subject cover when it is missing. */
  image?: ImageSource;
  subject?: string | null;
  isSubscribed?: boolean;
  chapters?: CourseChapter[];
}

export interface CourseItem {
  id: number;
  title: string;
  hasVideo: boolean;
  hasDocument: boolean;
  hasExam: boolean;
  videoUrl?: string;
  documentPath?: string;
}

export interface CourseLesson {
  id: number;
  title: string;
  description?: string;
  durationMinutes?: number;
  items: CourseItem[];
}

export interface CourseChapter {
  id: number;
  title: string;
  lessons: CourseLesson[];
}

export interface Teacher {
  id: string;
  name: string;
  title: string;
  subject: string;
  subjects?: string[];
  category: string;
  grade: string;
  gradeLabel: string;
  gradesList?: string[];
  gradeIds?: string[];
  streamIds?: string[];
  /** Real photo URL only; null renders the teacher's initials. */
  avatar: string | null;
  studentCount: number;
  experienceYears: number;
  pricePerSession: number;
  bio: string;
  videoUrl?: string;
  featured?: boolean;
  specialties: string[];
  schedule: string[];
  courses: Course[];
  location?: string;
}

export type TeacherSummary = Pick<
  Teacher,
  | "id"
  | "name"
  | "title"
  | "subject"
  | "subjects"
  | "category"
  | "grade"
  | "gradeLabel"
  | "gradesList"
  | "gradeIds"
  | "streamIds"
  | "avatar"
  | "bio"
>;
