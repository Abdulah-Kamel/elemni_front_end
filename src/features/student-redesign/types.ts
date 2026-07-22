export interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  duration: string;
  sessionsCount: number;
}

export interface Teacher {
  id: string;
  name: string;
  title: string;
  subject: string;
  category: string;
  grade: string;
  gradeLabel: string;
  avatar: string;
  studentCount: number;
  experienceYears: number;
  pricePerSession: number;
  bio: string;
  videoUrl?: string;
  featured?: boolean;
  specialties: string[];
  schedule: string[];
  courses: Course[];
}

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
  avatar: string;
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
