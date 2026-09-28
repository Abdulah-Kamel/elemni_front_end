import teacherFallback from "@/src/assets/images/student-redesign/teacher-ahmad.webp";
import { resolveAssetUrl } from "@/src/lib/asset-url";
import type { Course, Teacher, TeacherSummary } from "@/src/features/teachers/types";
import type {
  PublicCourseDto,
  PublicTeacherDetailDto,
  PublicTeacherDto,
} from "./contract";

type TeacherDataKey = "teacherFallback" | "variedSubjects" | "allGrades" | "durationUnknown" | "minutes" | "hours" | "and" | "noBio";
type TranslateTeacherData = (key: TeacherDataKey, values?: { count?: number }) => string;

function subjectCategory(teacher: PublicTeacherDto | PublicTeacherDetailDto) {
  return teacher.subjects[0]?.slug ?? "general";
}

export function toTeacherSummary(teacher: PublicTeacherDto, t: TranslateTeacherData, locale: string): TeacherSummary {
  const subjects = teacher.subjects.map((subject) => subject.name);
  const grades = teacher.grades.map((grade) => grade.name);
  return {
    id: teacher.slug,
    name: teacher.name,
    title: new Intl.ListFormat(locale).format(subjects) || t("teacherFallback"),
    subject: subjects[0] ?? t("variedSubjects"),
    subjects,
    category: subjectCategory(teacher),
    grade: teacher.grades[0] ? String(teacher.grades[0].id) : "all",
    gradeLabel: grades[0] ?? t("allGrades"),
    gradesList: grades,
    gradeIds: teacher.grades.map((grade) => String(grade.id)),
    streamIds: [...new Set(teacher.subjects.flatMap((subject) => subject.streams.map((stream) => String(stream.id))))],
    avatar: resolveAssetUrl(teacher.img, teacherFallback.src),
    bio: teacher.description ?? "",
  };
}

function formatDuration(minutes: number | null, t: TranslateTeacherData) {
  if (!minutes) return t("durationUnknown");
  if (minutes < 60) return t("minutes", { count: minutes });
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${t("hours", { count: hours })}${t("and")}${t("minutes", { count: rest })}` : t("hours", { count: hours });
}

export function toCourse(course: PublicCourseDto, t: TranslateTeacherData): Course {
  return {
    id: String(course.id),
    title: course.title,
    description: course.description ?? "",
    price: Number(course.price),
    duration: formatDuration(course.total_duration_minutes, t),
    sessionsCount: course.lesson_count,
    image: resolveAssetUrl(course.img, teacherFallback.src),
    isSubscribed: course.is_subscribed,
    chapters: course.chapters.map((chapter) => ({
      id: chapter.id,
      title: chapter.title,
      lessons: chapter.lessons.map((lesson) => ({
        id: lesson.id,
        title: lesson.title,
        description: lesson.description ?? undefined,
        durationMinutes: lesson.duration_minutes ?? undefined,
        items: lesson.items.map((item) => ({
          id: item.id,
          title: item.title,
          hasVideo: item.has_video,
          hasDocument: item.has_document,
          hasExam: item.has_exam,
          videoUrl: item.bunny_stream_embed_url ?? undefined,
          documentPath:
            item.document_path?.startsWith("https://") || item.document_path?.startsWith("http://")
              ? item.document_path
              : undefined,
        })),
      })),
    })),
  };
}

export function toTeacher(
  teacher: PublicTeacherDetailDto | PublicTeacherDto,
  courses: PublicCourseDto[],
  t: TranslateTeacherData,
  locale: string,
): Teacher {
  const subjects = teacher.subjects.map((subject) => subject.name);
  const grades = teacher.grades.map((grade) => grade.name);
  const normalizedCourses = courses.map((course) => toCourse(course, t));
  return {
    id: teacher.slug,
    name: teacher.name,
    title: new Intl.ListFormat(locale).format(subjects) || t("teacherFallback"),
    subject: subjects[0] ?? t("variedSubjects"),
    subjects,
    category: subjectCategory(teacher),
    grade: teacher.grades[0] ? String(teacher.grades[0].id) : "all",
    gradeLabel: grades[0] ?? t("allGrades"),
    gradesList: grades,
    gradeIds: teacher.grades.map((grade) => String(grade.id)),
    streamIds: [...new Set(teacher.subjects.flatMap((subject) => subject.streams.map((stream) => String(stream.id))))],
    avatar: resolveAssetUrl(teacher.img, teacherFallback.src),
    studentCount: 0,
    experienceYears: "experience" in teacher ? teacher.experience ?? 0 : 0,
    pricePerSession: normalizedCourses.length
      ? Math.min(...normalizedCourses.map((course) => course.price))
      : 0,
    bio: teacher.description ?? t("noBio"),
    specialties: subjects,
    schedule: [],
    courses: normalizedCourses,
    location: "location" in teacher ? teacher.location ?? undefined : undefined,
  };
}
