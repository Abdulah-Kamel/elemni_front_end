"use client";

import { m } from "motion/react";
import { BookOpen, ChevronLeft, ChevronRight, GraduationCap } from "lucide-react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { Link } from "@/src/i18n/navigation";
import { TeacherAvatar } from "./teacher-avatar";
import "@/src/features/portal/styles/sticker.css";

const VISIBLE_SUBJECTS = 2;
const VISIBLE_GRADES = 3;
const popSpring = { type: "spring", stiffness: 260, damping: 22 } as const;

export type TeacherCardData = {
  href: string;
  name: string;
  avatar: string | null;
  subjects: string[];
  grades: string[];
  description?: string | null;
  /** Unknown on the public page; the stat is omitted when undefined. */
  courseCount?: number;
};

/** Teacher directory card shared by the public teachers page and the student portal. */
export function TeacherCard({ teacher, index }: { teacher: TeacherCardData; index: number }) {
  const t = useTranslations("teacherDirectory.card");
  const locale = useLocale();
  const format = useFormatter();
  const Chevron = locale === "ar" ? ChevronLeft : ChevronRight;
  const subjects = teacher.subjects.slice(0, VISIBLE_SUBJECTS);
  const hiddenSubjects = teacher.subjects.length - subjects.length;
  const grades = teacher.grades.slice(0, VISIBLE_GRADES);
  const hiddenGrades = teacher.grades.length - grades.length;
  const titleId = `teacher-${teacher.href.replace(/\W+/g, "-")}`;

  return (
    <m.article
      aria-labelledby={titleId}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ ...popSpring, delay: 0.035 * index }}
      whileHover={{ y: -4 }}
      className="sticker-tile group relative flex h-full flex-col gap-4 p-4 transition-colors focus-within:bg-brand-50/60 hover:bg-brand-50/60 sm:p-5 dark:focus-within:bg-slate-900 dark:hover:bg-slate-900"
    >
      <div className="flex min-w-0 items-start gap-4">
        <TeacherAvatar
          name={teacher.name}
          src={teacher.avatar}
          sizes="96px"
          className="size-20 rounded-[1.25rem] shadow-[3px_3px_0_0_var(--color-ink)] transition-transform duration-300 group-hover:-rotate-3 motion-reduce:group-hover:rotate-0 sm:size-24 dark:shadow-[3px_3px_0_0_#020617]"
          initialsClassName="text-2xl sm:text-3xl"
        />
        <div className="min-w-0 flex-1 pt-0.5">
          <h3 id={titleId} className="text-lg font-black leading-snug text-ink sm:text-xl dark:text-slate-50">
            {/* The whole card is the link target; the visible button below is decorative. */}
            <Link
              href={teacher.href}
              prefetch={false}
              className="line-clamp-2 break-words outline-none after:absolute after:inset-0 after:rounded-[1.25rem] after:content-[''] focus-visible:after:outline-3 focus-visible:after:outline-offset-4 focus-visible:after:outline-brand-600"
            >
              {teacher.name}
            </Link>
          </h3>
          {subjects.length > 0 && (
            <ul className="mt-2 flex flex-wrap gap-1.5" aria-label={format.list(teacher.subjects, { type: "conjunction" })}>
              {subjects.map((subject) => (
                <li key={subject} className="sticker-badge bg-brand-100 px-2.5 py-1 text-[11px] font-black text-brand-700 dark:bg-slate-800 dark:text-brand-300">
                  {subject}
                </li>
              ))}
              {hiddenSubjects > 0 && (
                <li aria-hidden="true" dir="ltr" className="sticker-badge bg-surface px-2 py-1 text-[11px] font-black text-muted tabular-nums dark:text-slate-300">
                  {t("moreSubjects", { count: hiddenSubjects })}
                </li>
              )}
            </ul>
          )}
        </div>
      </div>

      <p className="line-clamp-2 min-h-10 text-[13px] leading-5 font-medium text-muted dark:text-slate-400">
        {teacher.description?.trim() || t("noBio")}
      </p>

      {grades.length > 0 && (
        <p className="flex items-start gap-2 text-xs font-bold text-ink/80 dark:text-slate-300">
          <GraduationCap className="mt-px size-4 shrink-0 text-brand-600 dark:text-brand-300" aria-hidden="true" />
          <span dir="auto" className="min-w-0">
            {grades.join(" · ")}
            {hiddenGrades > 0 && <span className="text-muted dark:text-slate-400"> · <bdi dir="ltr">+{hiddenGrades}</bdi></span>}
          </span>
        </p>
      )}

      <div className="mt-auto flex items-center justify-between gap-3 border-t-2 border-dashed border-ink/10 pt-3 dark:border-slate-700">
        <span className="inline-flex items-center gap-1.5 text-xs font-black text-muted tabular-nums dark:text-slate-400">
          {teacher.courseCount !== undefined ? (
            <>
              <BookOpen className="size-4 text-brand-600 dark:text-brand-300" aria-hidden="true" />
              {t("courseCount", { count: teacher.courseCount })}
            </>
          ) : (
            <>
              <GraduationCap className="size-4 text-brand-600 dark:text-brand-300" aria-hidden="true" />
              {t("gradeCount", { count: teacher.grades.length })}
            </>
          )}
        </span>
        <span
          aria-hidden="true"
          className="sticker-btn-outline inline-flex min-h-10 shrink-0 items-center gap-1.5 px-4 text-xs font-black text-brand-700 transition-transform group-hover:-translate-x-0.5 dark:text-brand-300 ltr:group-hover:translate-x-0.5"
        >
          {t("viewProfile")}
          <Chevron className="size-3.5" />
        </span>
      </div>
    </m.article>
  );
}
