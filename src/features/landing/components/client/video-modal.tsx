"use client";

import { X, GraduationCap } from "lucide-react";

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function VideoModal({ isOpen, onClose }: VideoModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-md animate-fade-in">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-4 sm:p-6 shadow-2xl relative border border-slate-100 text-right">
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2 text-slate-400 hover:text-[#0F172A] hover:bg-slate-100 rounded-full transition-all cursor-pointer z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-4 pr-2">
          <GraduationCap className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-black text-[#0F172A] font-cairo">جولة توضيحية: كيف تعمل منصة علمني؟</h3>
        </div>

        <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-900 shadow-inner">
          <iframe
            className="w-full h-full"
            src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1"
            title="جولة في منصة علمني"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>

        <p className="text-xs text-slate-500 mt-3 text-center">
          تعرف في دقيقتين على كيفية دخول الحصص المباشرة، التفاعل مع الأستاذ، وحل بنوك الأسئلة الذكية.
        </p>
      </div>
    </div>
  );
}
