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
