"use client";

import { useState } from "react";
import { Teacher, Course } from "../../types";
import { X, Play, Clock, ArrowLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

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
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl relative border border-slate-100 text-start mt-4 mb-8">
        <button
          onClick={onClose}
          className="absolute top-4 end-4 p-1.5 text-slate-400 hover:text-[#0F172A] hover:bg-slate-100 rounded-full transition-all cursor-pointer z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
          <Image
            src={teacher.avatar}
            alt={teacher.name}
            width={64}
            height={64}
            sizes="64px"
            className="size-16 shrink-0 rounded-2xl border-2 border-primary-light object-cover"
          />
          <div className="text-start flex-1 min-w-0">
            <span className="bg-primary-light text-primary font-bold text-[11px] px-2 py-0.5 rounded-md inline-block mb-1">
              {teacher.gradeLabel}
            </span>
            <h3 className="text-lg font-black text-[#0F172A] font-cairo leading-tight">{teacher.name}</h3>
            <p className="text-xs font-semibold text-primary truncate">{teacher.title}</p>
          </div>
        </div>

        <div className="my-4 rounded-2xl overflow-hidden bg-slate-900 relative aspect-video shadow-md">
          {!isPlayingVideo ? (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 text-center">
              <Image
                src={teacher.avatar}
                alt=""
                fill
                sizes="(max-width: 672px) calc(100vw - 2rem), 672px"
                className="object-cover opacity-40"
              />
              <div className="relative z-10">
                <button onClick={() => setIsPlayingVideo(true)} className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all mx-auto">
                  <Play className="w-6 h-6 fill-current" />
                </button>
                <p className="text-white font-bold text-xs mt-2">شاهد فيديو تعريفي</p>
              </div>
            </div>
          ) : (
            <iframe className="w-full h-full" src={`${teacher.videoUrl}?autoplay=1`} title="فيديو تعريفي" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
          )}
        </div>

        <p className="text-xs text-[#334155] leading-relaxed bg-[#F8FAFC] p-3 rounded-2xl border border-slate-100 mb-3">
          {teacher.bio}
        </p>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {teacher.specialties.map((spec, idx) => (
            <span key={idx} className="bg-primary-light text-primary font-bold text-[11px] px-2 py-1 rounded-xl">{spec}</span>
          ))}
        </div>

        <div className="grid gap-2 mb-4">
          {teacher.courses && teacher.courses.length > 0 ? (
            teacher.courses.map((course) => (
              <div key={course.id} className="p-3 rounded-2xl bg-[#F8FAFC] border border-slate-200 flex items-center justify-between gap-3">
                <div className="text-start flex-1 min-w-0">
                  <h5 className="font-extrabold text-sm text-[#0F172A]">{course.title}</h5>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                    <span>{course.duration}</span>
                    <span>·</span>
                    <span>{course.sessionsCount} حصص</span>
                  </div>
                </div>
                <div className="text-end shrink-0">
                  <span className="text-lg font-black text-primary font-cairo">{course.price}</span>
                  <span className="text-[11px] text-slate-500"> ج.م</span>
                  <button onClick={() => handleEnrollClick(course)} className="block w-full mt-1 px-3 py-1 bg-primary hover:bg-primary-hover text-white font-bold text-[11px] rounded-lg transition-all cursor-pointer">
                    اشتراك
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-500 bg-[#F8FAFC] p-4 rounded-xl text-center">لا توجد كورسات معروضة حالياً.</p>
          )}
        </div>

        <div className="pt-2 border-t border-slate-100 text-center mb-2">
          <Link href={`/ar/teachers/${teacher.id}`}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline">
            <span>عرض الملف الشخصي الكامل</span>
            <ArrowLeft className="w-3 h-3" />
          </Link>
        </div>

        <div className="flex flex-wrap gap-1.5 text-xs text-slate-600 pt-3 border-t border-slate-100">
          <Clock className="w-3.5 h-3.5 text-primary" />
          {teacher.schedule.map((slot, idx) => (
            <span key={idx} className="bg-slate-100 px-2.5 py-1 rounded-lg">{slot}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
