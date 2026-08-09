export interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  duration: string;
  sessionsCount: number;
  image?: ImageSource;
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
  avatar: ImageSource;
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

export interface Feature {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  description: string;
  bullets: string[];
  color: string;
}

export interface Testimonial {
  id: string;
  name: string;
  grade: string;
  school: string;
  score: string;
  avatar: ImageSource;
  comment: string;
  teacherName: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export interface QuizQuestion {
  id: number;
  subject: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}
import type { ImageProps } from "next/image";

export type ImageSource = ImageProps["src"];
