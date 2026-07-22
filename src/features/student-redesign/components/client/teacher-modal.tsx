"use client";

import { useState } from "react";
import { Teacher, Course } from "../../types";
import { X, Users, Briefcase, Calendar, CheckCircle2, Play, BookOpen, Clock, ArrowLeft, Sparkles } from "lucide-react";

interface TeacherModalProps {
  teacher: Teacher | null;
  onClose: () => void;
  onBook: (teacher: Teacher, selectedCourseTitle?: string) => void;
}

export default function TeacherModal({ teacher, onClose, onBook }: TeacherModalProps) {
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);

  if (!teacher) return null;

  const handleEnrollClick = (course: Course) => {
    onBook(teacher, course.title);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative border border-slate-100 text-right my-8">
        <button
          onClick={onClose}
          className="absolute top-5 left-5 p-2 text-slate-400 hover:text-[#0F172A] hover:bg-slate-100 rounded-full transition-all cursor-pointer z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 pb-6 border-b border-slate-100">
          <img
            src={teacher.avatar}
            alt={teacher.name}
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-4 border-primary-light shadow-md shrink-0"
          />
          <div className="space-y-2 text-center sm:text-right flex-1">
            <span className="bg-primary-light text-primary font-bold text-xs px-3 py-1 rounded-md inline-block">
              {teacher.gradeLabel}
            </span>
            <h3 className="text-2xl font-black text-[#0F172A] font-cairo">{teacher.name}</h3>
            <p className="text-sm font-semibold text-primary">{teacher.title}</p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-[#334155] pt-1">
              <div className="flex items-center gap-1 font-semibold">
                <Users className="w-3.5 h-3.5 text-primary" />
                <span>{teacher.studentCount.toLocaleString("ar-EG")} طالب</span>
              </div>
              <div className="flex items-center gap-1 font-semibold">
                <Briefcase className="w-3.5 h-3.5 text-primary" />
                <span>{teacher.experienceYears} سنوات خبرة</span>
              </div>
              <div className="flex items-center gap-1 font-semibold text-primary">
                <BookOpen className="w-3.5 h-3.5" />
                <span>{teacher.courses ? teacher.courses.length : 0} كورسات مخصصة</span>
              </div>
            </div>
          </div>
        </div>

        <div className="my-6 rounded-2xl overflow-hidden bg-slate-900 relative aspect-video shadow-md">
          {!isPlayingVideo ? (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 text-center">
              <img
                src={teacher.avatar}
                alt="preview"
                className="absolute inset-0 w-full h-full object-cover opacity-40"
              />
              <div className="relative z-10 space-y-3">
                <button
                  onClick={() => setIsPlayingVideo(true)}
                  className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all mx-auto cursor-pointer"
                >
                  <Play className="w-7 h-7 fill-current mr-0.5" />
                </button>
                <p className="text-white font-bold text-sm">
                  شاهد فيديو تعريفي ونموذج من أسلوب شرح {teacher.name.split(" ")[1]}
                </p>
              </div>
            </div>
          ) : (
            <iframe
              className="w-full h-full"
              src={`${teacher.videoUrl}?autoplay=1`}
              title="فيديو تعريفي"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          )}
        </div>

        <div className="space-y-4 mb-6">
          <h4 className="font-extrabold text-sm text-[#0F172A]">عن المعلم وطريقة التدريس:</h4>
          <p className="text-xs text-[#334155] leading-relaxed bg-[#F8FAFC] p-4 rounded-2xl border border-slate-100">
            {teacher.bio}
          </p>

          <h4 className="font-extrabold text-sm text-[#0F172A]">أبرز المحاور والتخصصات:</h4>
          <div className="flex flex-wrap gap-2">
            {teacher.specialties.map((spec, idx) => (
              <span key={idx} className="bg-primary-light text-primary font-bold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{spec}</span>
              </span>
            ))}
          </div>
        </div>

        <div className="space-y-4 mb-6 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <h4 className="font-extrabold text-base text-[#0F172A] flex items-center gap-2 font-cairo">
              <BookOpen className="w-5 h-5 text-primary" />
              <span>كورسات {teacher.name}:</span>
            </h4>
            <span className="text-xs text-slate-500 font-bold">اختر الكورس للبدء</span>
          </div>

          <div className="space-y-3">
            {teacher.courses && teacher.courses.length > 0 ? (
              teacher.courses.map((course) => (
                <div key={course.id} className="p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200 hover:border-primary transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-primary bg-primary-light px-2.5 py-0.5 rounded-md">{course.duration}</span>
                      <span className="text-xs text-slate-500 font-medium">{course.sessionsCount} حصص مباشرة</span>
                    </div>
                    <h5 className="font-extrabold text-sm text-[#0F172A]">{course.title}</h5>
                    <p className="text-xs text-[#334155]">{course.description}</p>
                  </div>
                  <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200">
                    <div className="text-right">
                      <span className="text-xl font-black text-primary font-cairo">{course.price}</span>
                      <span className="text-xs text-slate-500 font-bold"> ج.م</span>
                    </div>
                    <button
                      onClick={() => handleEnrollClick(course)}
                      className="px-4 py-2 bg-primary hover:bg-primary-hover text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                    >
                      <span>الاشتراك بالكورس</span>
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 bg-[#F8FAFC] p-4 rounded-xl text-center">
                لا توجد كورسات معروضة حالياً لهذا المعلم.
              </p>
            )}
          </div>
        </div>

        <div className="space-y-2 mb-6 pt-2 border-t border-slate-100">
          <h4 className="font-extrabold text-xs text-slate-700 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-primary" />
            <span>مواعيد البث المباشر المتاحة:</span>
          </h4>
          <div className="flex flex-wrap gap-2 text-xs text-slate-600">
            {teacher.schedule.map((slot, idx) => (
              <span key={idx} className="bg-slate-100 px-3 py-1 rounded-lg font-medium">{slot}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
