"use client";

import { useState } from "react";
import { QUIZ_QUESTIONS } from "../../data/mock-data";
import { HelpCircle, CheckCircle, XCircle, RotateCcw, Award, ArrowLeft } from "lucide-react";
import { cn } from "@/src/lib/cn";
import { Reveal } from "@/src/components/ui/reveal";

interface InteractiveQuizProps {
  onExploreTeachers: () => void;
}

export default function InteractiveQuiz({ onExploreTeachers }: InteractiveQuizProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  const currentQ = QUIZ_QUESTIONS[currentQuestionIndex];

  const handleSelectOption = (index: number) => {
    if (isAnswered) return;
    setSelectedOption(index);
  };

  const handleConfirmAnswer = () => {
    if (selectedOption === null) return;
    setIsAnswered(true);
    if (selectedOption === currentQ.correctAnswer) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex + 1 < QUIZ_QUESTIONS.length) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setQuizFinished(true);
    }
  };

  const handleRestart = () => {
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setQuizFinished(false);
  };

  return (
    <section id="quiz" className="py-20 bg-white relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="text-center space-y-3 mb-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-light text-primary font-bold text-xs sm:text-sm">
              <HelpCircle className="w-4 h-4" />
              <span>تجربة تفاعلية حية على المنصة</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-[#0F172A] font-cairo">اختبر مستواك الآن</h2>
            <p className="text-sm sm:text-base text-[#334155]">
              جرب نموذجاً مصغراً لااختبارات منصة علمني واكتشف أسلوب التصحيح الذكي والتفسير الفوري للحلول.
            </p>
          </div>
        </Reveal>

        <Reveal>
          <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-lg border border-slate-200/80 relative">
          {!quizFinished ? (
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                <div className="flex items-center gap-2">
                  <span className="bg-primary-light text-primary font-extrabold text-xs px-3 py-1 rounded-full">مادة: {currentQ.subject}</span>
                  <span className="text-xs font-bold text-slate-500">السؤال {currentQuestionIndex + 1} من {QUIZ_QUESTIONS.length}</span>
                </div>
                <div className="text-xs font-bold text-primary">النقاط: {score}</div>
              </div>

              <div className="w-full bg-slate-100 h-2 rounded-full mb-6 overflow-hidden">
                <div className="bg-primary h-full transition-all duration-300" style={{ width: `${((currentQuestionIndex + 1) / QUIZ_QUESTIONS.length) * 100}%` }} />
              </div>

              <h3 className="text-lg sm:text-xl font-black text-[#0F172A] leading-relaxed mb-6 text-right font-cairo">{currentQ.question}</h3>

              <div className="space-y-3 mb-6">
                {currentQ.options.map((option, idx) => {
                  let buttonStyle = "bg-[#F8FAFC] border-slate-200 text-[#0F172A] hover:bg-slate-100";
                  if (isAnswered) {
                    if (idx === currentQ.correctAnswer) {
                      buttonStyle = "bg-emerald-50 border-emerald-500 text-emerald-900 font-bold";
                    } else if (idx === selectedOption) {
                      buttonStyle = "bg-rose-50 border-rose-500 text-rose-900 font-bold";
                    }
                  } else if (selectedOption === idx) {
                    buttonStyle = "bg-primary-light border-primary text-primary font-bold";
                  }
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelectOption(idx)}
                      disabled={isAnswered}
                      className={cn(
                        "w-full p-4 text-right rounded-2xl border text-sm transition-all cursor-pointer flex items-center justify-between gap-3",
                        buttonStyle
                      )}
                    >
                      <span className="flex-1">{option}</span>
                      {isAnswered && idx === currentQ.correctAnswer && <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />}
                      {isAnswered && idx === selectedOption && idx !== currentQ.correctAnswer && <XCircle className="w-5 h-5 text-rose-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {isAnswered && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 mb-6 text-right text-xs leading-relaxed text-[#334155]">
                  <span className="font-extrabold text-primary block mb-1">💡 الشرح والتوضيح العلمي:</span>
                  <p>{currentQ.explanation}</p>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                {!isAnswered ? (
                  <button
                    onClick={handleConfirmAnswer}
                    disabled={selectedOption === null}
                    className={cn(
                      "px-6 py-3 rounded-xl font-bold text-sm text-white transition-all",
                      selectedOption !== null ? "bg-primary hover:bg-primary-hover shadow-md cursor-pointer" : "bg-slate-300 cursor-not-allowed"
                    )}
                  >
                    تأكيد الإجابة
                  </button>
                ) : (
                  <button
                    onClick={handleNextQuestion}
                    className="px-6 py-3 bg-primary hover:bg-primary-hover text-white font-bold text-sm rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2"
                  >
                    <span>{currentQuestionIndex + 1 < QUIZ_QUESTIONS.length ? "السؤال التالي" : "إنهاء الاختبار"}</span>
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-6 space-y-6">
              <div className="w-20 h-20 bg-primary-light text-primary rounded-full flex items-center justify-center mx-auto shadow-inner">
                <Award className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-[#0F172A]">ممتاز! أكملت التقييم بنجاح 🎉</h3>
                <p className="text-base font-bold text-primary">حصلت على {score} من {QUIZ_QUESTIONS.length} إجابات صحيحة</p>
                <p className="text-xs text-slate-600 max-w-md mx-auto">
                  هذا النموذج المصغر هو مجرد زاوية بسيطة من بنك الأسئلة الشامل على منصة علمني والذي يحتوي على أكثر من 50,000 سؤال محلول بالفيديو!
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
                <button onClick={onExploreTeachers} className="px-6 py-3 bg-primary hover:bg-primary-hover text-white font-bold text-sm rounded-xl shadow-md transition-all cursor-pointer">
                  انضم لأفضل المعلمين وحل المزيد
                </button>
                <button onClick={handleRestart} className="px-5 py-3 bg-slate-100 text-slate-800 font-bold text-sm rounded-xl hover:bg-slate-200 transition-all cursor-pointer flex items-center gap-2">
                  <RotateCcw className="w-4 h-4" />
                  <span>إعادة الاختبار</span>
                </button>
              </div>
            </div>
          )}
        </div>
        </Reveal>
      </div>
    </section>
  );
}
