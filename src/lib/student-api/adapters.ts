import { resolveAssetUrl } from "@/src/lib/asset-url";
import type { Course, Teacher, TeacherSummary } from "@/src/features/teachers/types";
import type {
  PublicCourseDto,
  PublicTeacherDetailDto,
  PublicTeacherDto,
} from "./contract";

export function toTeacherSummary(teacher: PublicTeacherDto | PublicTeacherDetailDto): TeacherSummary {
  return {
    id: teacher.slug,
    name: teacher.name,
    subjects: teacher.subjects.map((subject) => subject.name),
    grades: teacher.grades.map((grade) => grade.name),
    gradeIds: teacher.grades.map((grade) => String(grade.id)),
    streamIds: [...new Set(teacher.subjects.flatMap((subject) => subject.streams.map((stream) => String(stream.id))))],
    avatar: resolveAssetUrl(teacher.img, "") || null,
    bio: teacher.description?.trim() ?? "",
  };
}

export function toCourse(course: PublicCourseDto): Course {
  return {
    id: String(course.id),
    title: course.title,
    description: course.description ?? "",
    price: Number(course.price),
    durationMinutes: course.total_duration_minutes,
    sessionsCount: course.lesson_count,
    image: resolveAssetUrl(course.img, "") || undefined,
    subject: course.subject_name,
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
  return {
    ...toTeacherSummary(teacher),
    experienceYears: "experience" in teacher ? teacher.experience ?? 0 : 0,
    courses: courses.map(toCourse),
    location: "location" in teacher ? teacher.location ?? undefined : undefined,
  };
}
