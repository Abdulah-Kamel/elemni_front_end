import type { ImageProps } from "next/image";

export type ImageSource = ImageProps["src"];

export interface TeacherSummary {
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
  bio: string;
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
