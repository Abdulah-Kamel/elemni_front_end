import type { FAQItem, QuizQuestion } from "../types";

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  { id: 1, subjectKey: "subject1", questionKey: "q1", optionKeys: ["q1o1", "q1o2", "q1o3", "q1o4"], correctAnswer: 0, explanationKey: "q1e" },
  { id: 2, subjectKey: "subject2", questionKey: "q2", optionKeys: ["q2o1", "q2o2", "q2o3", "q2o4"], correctAnswer: 1, explanationKey: "q2e" },
  { id: 3, subjectKey: "subject3", questionKey: "q3", optionKeys: ["q3o1", "q3o2", "q3o3", "q3o4"], correctAnswer: 1, explanationKey: "q3e" },
];

export const FAQ_ITEMS: FAQItem[] = [
  { id: "faq1", questionKey: "q1", answerKey: "a1", category: "general" },
  { id: "faq2", questionKey: "q2", answerKey: "a2", category: "classes" },
  { id: "faq3", questionKey: "q3", answerKey: "a3", category: "payment" },
  { id: "faq4", questionKey: "q4", answerKey: "a4", category: "payment" },
];
