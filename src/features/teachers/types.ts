import type { ImageProps } from "next/image";

export type ImageSource = ImageProps["src"];

export interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  /** Null when the teacher has not set a duration. */
  durationMinutes: number | null;
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

/** Raw teacher data. Screens format and translate it; nothing here is display copy. */
export interface Teacher {
  id: string;
  name: string;
  subjects: string[];
  /** Grade names, in backend order. */
  grades: string[];
  gradeIds: string[];
  streamIds: string[];
  /** Real photo URL only; null renders the teacher's initials. */
  avatar: string | null;
  /** Empty when the teacher has not written one. */
  bio: string;
  experienceYears: number;
  location?: string;
  courses: Course[];
}

export type TeacherSummary = Pick<Teacher, "id" | "name" | "subjects" | "grades" | "gradeIds" | "streamIds" | "avatar" | "bio">;
