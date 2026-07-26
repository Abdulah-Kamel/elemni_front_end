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
  subjects?: string[]; // Multiple subjects e.g. ["الأحياء", "العلوم المتكاملة"]
  category: string; // e.g. 'math', 'science', 'languages', 'humanities'
  grade: string; // e.g. 'sec3', 'sec2', 'sec1'
  gradeLabel: string; // 'الصف الثالث الثانوي'
  gradesList?: string[]; // Multiple grades e.g. ["الصف الأول الثانوي", "الصف الثاني الثانوي", "الصف الثالث الثانوي"]
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
  icon: string; // Lucide icon name
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
