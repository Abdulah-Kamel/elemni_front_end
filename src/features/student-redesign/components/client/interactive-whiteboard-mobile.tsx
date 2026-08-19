"use client";

import React, { useRef, useState, useEffect } from "react";
import { m } from "motion/react";
import { Hand } from "lucide-react";
import { MarkerHighlight } from "@/src/components/ui/marker-highlight";

interface MobileNoteData {
  id: string;
  numberDisplay: string;
  title: string;
  content: string;
  highlightWords: string[];
  color: string; // Background paper color
  headerColor: string; // Top accent bar
  textColor: string;
  highlighterColor: "yellow" | "sky" | "pink" | "purple" | "emerald" | "orange";
  pinColor: string; // Pushpin color
  defaultX: number; // Percentage or px position relative to container
  defaultY: number;
  rotation: number;
}

const MOBILE_NOTES: MobileNoteData[] = [
  {
    id: "m-step-1",
    numberDisplay: "١",
    title: "إنشاء حساب",
    content: "سجّل مجاناً باستخدام هاتفك في أقل من دقيقة وابدأ رحلتك.",
    highlightWords: ["أقل من دقيقة", "مجاناً"],
    color: "bg-amber-100/95 dark:bg-amber-950/80 border-amber-300",
    headerColor: "bg-amber-500",
    textColor: "text-amber-950 dark:text-amber-100",
    highlighterColor: "yellow",
    pinColor: "#EF4444",
    defaultX: 4,
    defaultY: 10,
    rotation: -2,
  },
  {
    id: "m-step-2",
    numberDisplay: "٢",
    title: "اختر المدرس والكورس",
    content: "تصفح المدرسين المتخصصين واختر الكورس المناسب لمادتك.",
    highlightWords: ["المدرسين المتخصصين", "الكورس المناسب"],
    color: "bg-sky-100/95 dark:bg-sky-950/80 border-sky-300",
    headerColor: "bg-sky-500",
    textColor: "text-sky-950 dark:text-sky-100",
    highlighterColor: "sky",
    pinColor: "#EF4444",
    defaultX: 48,
    defaultY: 20,
    rotation: 2,
  },
  {
    id: "m-step-3",
    numberDisplay: "٣",
    title: "ابدأ التعلم المباشر",
    content: "احضر الحصص المباشرة، حل الأسئلة، وتابع تقدمك أولاً بأول.",
    highlightWords: ["الحصص المباشرة", "تابع تقدمك"],
    color: "bg-emerald-100/95 dark:bg-emerald-950/80 border-emerald-300",
    headerColor: "bg-emerald-500",
    textColor: "text-emerald-950 dark:text-emerald-100",
    highlighterColor: "emerald",
    pinColor: "#EF4444",
    defaultX: 4,
    defaultY: 190,
    rotation: -1.5,
  },
  {
    id: "m-feature-1",
    numberDisplay: "٤",
    title: "افهم صح",
    content: "دروس تفاعلية وبث مباشر مع نخبة من أذكى المدرسين.",
    highlightWords: ["دروس تفاعلية", "أذكى المدرسين"],
    color: "bg-purple-100/95 dark:bg-purple-950/80 border-purple-300",
    headerColor: "bg-purple-500",
    textColor: "text-purple-950 dark:text-purple-100",
    highlighterColor: "purple",
    pinColor: "#8B5CF6",
    defaultX: 48,
    defaultY: 200,
    rotation: 2.5,
  },
  {
    id: "m-feature-2",
    numberDisplay: "٥",
    title: "اتدرب كتير",
    content: "امتحانات مستمرة وبنوك أسئلة شاملة عشان تثبت المعلومة.",
    highlightWords: ["بنوك أسئلة", "تثبت المعلومة"],
    color: "bg-pink-100/95 dark:bg-pink-950/80 border-pink-300",
    headerColor: "bg-pink-500",
    textColor: "text-pink-950 dark:text-pink-100",
    highlighterColor: "pink",
    pinColor: "#8B5CF6",
    defaultX: 4,
    defaultY: 370,
    rotation: -2,
  },
  {
    id: "m-feature-3",
    numberDisplay: "٦",
    title: "تفوق بجدارة",
    content: "تقارير أداء ودعم مستمر معاك لحد باب اللجان.",
    highlightWords: ["تقارير أداء", "باب اللجان"],
    color: "bg-orange-100/95 dark:bg-orange-950/80 border-orange-300",
    headerColor: "bg-orange-500",
    textColor: "text-orange-950 dark:text-orange-100",
    highlighterColor: "orange",
    pinColor: "#8B5CF6",
    defaultX: 48,
    defaultY: 380,
    rotation: 1.5,
  },
];

export default function InteractiveWhiteboardMobile() {
  const boardRef = useRef<HTMLDivElement>(null);
  const [positions, setPositions] = useState<{ [key: string]: { x: number; y: number } }>({});
  const [activeTab, setActiveTab] = useState<"board" | "list">("board");

  // Track coordinates of pins for connecting threads
  const pinRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const updatePinCoordinates = () => {
    if (!boardRef.current) return;
    const boardRect = boardRef.current.getBoundingClientRect();

    const newPos: { [key: string]: { x: number; y: number } } = {};
    MOBILE_NOTES.forEach((note) => {
      const pinEl = pinRefs.current[note.id];
      if (pinEl) {
        const pinRect = pinEl.getBoundingClientRect();
        newPos[note.id] = {
          x: pinRect.left + pinRect.width / 2 - boardRect.left,
          y: pinRect.top + pinRect.height / 2 - boardRect.top,
        };
      }
    });
    setPositions(newPos);
  };

  useEffect(() => {
    updatePinCoordinates();
    window.addEventListener("resize", updatePinCoordinates);
    const timer = setTimeout(updatePinCoordinates, 300);
    return () => {
      window.removeEventListener("resize", updatePinCoordinates);
      clearTimeout(timer);
    };
  }, []);

  // Generate SVG curve path between two pin positions
  const renderRopePath = (startId: string, endId: string) => {
    const p1 = positions[startId];
    const p2 = positions[endId];
    if (!p1 || !p2) return "";

    const midX = (p1.x + p2.x) / 2;
    const midY = (p1.y + p2.y) / 2 + 35; // Sag downward

    return `M ${p1.x} ${p1.y} Q ${midX} ${midY} ${p2.x} ${p2.y}`;
  };

  return (
    <div className="w-full space-y-4">
      {/* Mobile Toggle Mode (Interactive Board vs Readable List) */}
      <div className="flex justify-center mb-2">
        <div className="inline-flex bg-slate-200/80 dark:bg-slate-800 p-1 rounded-2xl border border-slate-300/60 dark:border-slate-700 font-cairo text-xs font-extrabold">
          <button
            onClick={() => {
              setActiveTab("board");
              setTimeout(updatePinCoordinates, 50);
            }}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${activeTab === "board"
                ? "bg-primary text-white shadow-md"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
              }`}
          >
            <Hand className="w-3.5 h-3.5" />
            <span>السبورة التفاعلية 📌</span>
          </button>
          <button
            onClick={() => setActiveTab("list")}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${activeTab === "list"
                ? "bg-primary text-white shadow-md"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
              }`}
          >
            <span>عرض القائمة 📝</span>
          </button>
        </div>
      </div>

      {activeTab === "board" ? (
        <div
          ref={boardRef}
          className="relative w-full min-h-155 rounded-3xl border-4 border-slate-300 dark:border-slate-700 bg-[#FAF8FF] dark:bg-slate-900 shadow-xl overflow-hidden touch-none p-3 select-none"
          style={{
            backgroundImage: "radial-gradient(rgba(100, 116, 139, 0.25) 1.5px, transparent 1.5px)",
            backgroundSize: "24px 24px",
          }}
        >
          {/* SVG Thread Lines Connecting Sticky Notes */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
            {/* Step 1 -> Step 2 -> Step 3 (Red Thread) */}
            <path
              d={renderRopePath("m-step-1", "m-step-2")}
              stroke="#EF4444"
              strokeWidth="3.5"
              fill="none"
              strokeLinecap="round"
              className="drop-shadow-sm"
            />
            <path
              d={renderRopePath("m-step-2", "m-step-3")}
              stroke="#EF4444"
              strokeWidth="3.5"
              fill="none"
              strokeLinecap="round"
              className="drop-shadow-sm"
            />
            {/* Step 3 -> Feature 1 Bridge (Amber Thread) */}
            <path
              d={renderRopePath("m-step-3", "m-feature-1")}
              stroke="#F59E0B"
              strokeWidth="3.5"
              fill="none"
              strokeDasharray="6 4"
              strokeLinecap="round"
              className="drop-shadow-sm"
            />
            {/* Feature 1 -> Feature 2 -> Feature 3 (Violet Thread) */}
            <path
              d={renderRopePath("m-feature-1", "m-feature-2")}
              stroke="#8B5CF6"
              strokeWidth="3.5"
              fill="none"
              strokeLinecap="round"
              className="drop-shadow-sm"
            />
            <path
              d={renderRopePath("m-feature-2", "m-feature-3")}
              stroke="#8B5CF6"
              strokeWidth="3.5"
              fill="none"
              strokeLinecap="round"
              className="drop-shadow-sm"
            />
          </svg>

          {/* Interactive Mobile Draggable Sticky Notes Grid */}
          <div className="grid grid-cols-2 gap-3 relative z-20 pb-12">
            {MOBILE_NOTES.map((note) => (
              <m.div
                key={note.id}
                drag
                dragConstraints={boardRef}
                dragElastic={0.08}
                dragMomentum={false}
                onDrag={updatePinCoordinates}
                onDragEnd={updatePinCoordinates}
                whileDrag={{ scale: 1.05, zIndex: 50, rotate: 0 }}
                style={{ rotate: note.rotation }}
                className={`relative p-3.5 rounded-2xl border-2 shadow-lg cursor-grab active:cursor-grabbing font-cairo transition-shadow ${note.color}`}
              >
                {/* Top Accent Header Bar */}
                <div className={`absolute top-0 inset-x-0 h-2.5 rounded-t-2xl ${note.headerColor}`} />

                {/* Top Pin Hole & Pushpin Visual */}
                <div
                  ref={(el) => {
                    pinRefs.current[note.id] = el;
                  }}
                  className="absolute -top-2 left-1/2 -translate-x-1/2 flex flex-col items-center z-30"
                >
                  <div
                    className="w-4 h-4 rounded-full border-2 border-white shadow-md flex items-center justify-center"
                    style={{ backgroundColor: note.pinColor }}
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-white/80" />
                  </div>
                </div>

                {/* Number Badge (Top-Left for Arabic RTL) */}
                <div className="flex items-center justify-between mt-1 mb-2">
                  <div className="w-7 h-7 rounded-full bg-white dark:bg-slate-800 border-2 border-current flex items-center justify-center font-black text-xs shadow-xs text-slate-900 dark:text-white">
                    {note.numberDisplay}
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    خطوة {note.numberDisplay}
                  </span>
                </div>

                {/* Sticky Note Title */}
                <h3 className={`text-base font-black mb-1.5 leading-tight ${note.textColor}`}>
                  <MarkerHighlight color={note.highlighterColor} variant={1}>
                    {note.title}
                  </MarkerHighlight>
                </h3>

                {/* Sticky Note Content */}
                <p className={`text-xs font-extrabold leading-relaxed ${note.textColor} opacity-90`}>
                  {note.content}
                </p>
              </m.div>
            ))}
          </div>

          {/* Bottom Pen Tray Stand Visual on Mobile */}
          <div className="absolute bottom-0 inset-x-0 h-10 bg-slate-300 dark:bg-slate-800 border-t-2 border-slate-400 dark:border-slate-700 flex items-center justify-between px-6 z-30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-2 rounded-full bg-red-500 shadow-xs" />
              <div className="w-10 h-2 rounded-full bg-blue-500 shadow-xs" />
              <div className="w-10 h-2 rounded-full bg-emerald-500 shadow-xs" />
            </div>
            <div className="w-12 h-3 bg-slate-700 dark:bg-slate-900 rounded-sm border border-slate-500 shadow-inner" />
          </div>
        </div>
      ) : (
        /* Readable Mobile List View */
        <div className="space-y-3 font-cairo">
          {MOBILE_NOTES.map((note) => (
            <div
              key={note.id}
              className={`p-4 rounded-2xl border-2 shadow-sm relative overflow-hidden ${note.color}`}
            >
              <div className={`absolute top-0 inset-s-0 bottom-0 w-2 ${note.headerColor}`} />
              <div className="ps-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-6 h-6 rounded-full bg-white dark:bg-slate-800 border border-slate-300 font-black text-xs flex items-center justify-center text-slate-900 dark:text-white">
                    {note.numberDisplay}
                  </span>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    {note.title}
                  </h3>
                </div>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200 leading-relaxed">
                  {note.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
