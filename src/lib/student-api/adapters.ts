import teacherFallback from "@/src/assets/images/student-redesign/teacher-ahmad.webp";
import type { Course, Teacher, TeacherSummary } from "@/src/features/student-redesign/types";
import type {
  PublicCourseDto,
  PublicTeacherDetailDto,
  PublicTeacherDto,
} from "./contract";

function usableImage(src: string | null) {
  return src && (src.startsWith("https://") || src.startsWith("http://") || src.startsWith("/"))
    ? src
    : teacherFallback;
}

function subjectCategory(teacher: PublicTeacherDto | PublicTeacherDetailDto) {
  return teacher.subjects[0]?.slug ?? "general";
}

export function toTeacherSummary(teacher: PublicTeacherDto): TeacherSummary {
  const subjects = teacher.subjects.map((subject) => subject.name);
  const grades = teacher.grades.map((grade) => grade.name);
  return {
    id: teacher.slug,
    name: teacher.name,
    title: subjects.join("، ") || "مدرس على منصة علمني",
    subject: subjects[0] ?? "مواد متنوعة",
    subjects,
    category: subjectCategory(teacher),
    grade: teacher.grades[0] ? String(teacher.grades[0].id) : "all",
    gradeLabel: grades[0] ?? "كل الصفوف",
    gradesList: grades,
    gradeIds: teacher.grades.map((grade) => String(grade.id)),
    streamIds: [...new Set(teacher.subjects.flatMap((subject) => subject.streams.map((stream) => String(stream.id))))],
    avatar: usableImage(teacher.img),
    bio: teacher.description ?? "",
  };
}

function formatDuration(minutes: number | null) {
  if (!minutes) return "المدة غير محددة";
  if (minutes < 60) return `${minutes} دقيقة`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} ساعة و${rest} دقيقة` : `${hours} ساعة`;
}

export function toCourse(course: PublicCourseDto): Course {
  return {
    id: String(course.id),
    title: course.title,
    description: course.description ?? "",
    price: Number(course.price),
    duration: formatDuration(course.total_duration_minutes),
    sessionsCount: course.lesson_count,
    image: usableImage(course.img),
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
): Teacher {
  const subjects = teacher.subjects.map((subject) => subject.name);
  const grades = teacher.grades.map((grade) => grade.name);
  const normalizedCourses = courses.map(toCourse);
  return {
    id: teacher.slug,
    name: teacher.name,
    title: subjects.join("، ") || "مدرس على منصة علمني",
    subject: subjects[0] ?? "مواد متنوعة",
    subjects,
    category: subjectCategory(teacher),
    grade: teacher.grades[0] ? String(teacher.grades[0].id) : "all",
    gradeLabel: grades[0] ?? "كل الصفوف",
    gradesList: grades,
    gradeIds: teacher.grades.map((grade) => String(grade.id)),
    streamIds: [...new Set(teacher.subjects.flatMap((subject) => subject.streams.map((stream) => String(stream.id))))],
    avatar: usableImage(teacher.img),
    studentCount: 0,
    experienceYears: "experience" in teacher ? teacher.experience ?? 0 : 0,
    pricePerSession: normalizedCourses.length
      ? Math.min(...normalizedCourses.map((course) => course.price))
      : 0,
    bio: teacher.description ?? "لا توجد نبذة مضافة حتى الآن.",
    specialties: subjects,
    schedule: [],
    courses: normalizedCourses,
    location: "location" in teacher ? teacher.location ?? undefined : undefined,
  };
}
