import type { PublicCourseDto } from "@/src/lib/student-api/contract";

export interface LandingCourseFilters {
  query: string;
  subject: string;
  gradeId: string;
  streamId: string;
}

export function filterLandingCourses(
  courses: PublicCourseDto[],
  filters: LandingCourseFilters,
) {
  const normalizedQuery = filters.query.trim().toLocaleLowerCase("ar");

  return courses.filter((course) => {
    const searchableText = [
      course.title,
      course.description,
      course.subject_name,
      course.teacher_name,
    ]
      .filter(Boolean)
      .join(" ")
      .toLocaleLowerCase("ar");

    return (
      (!normalizedQuery || searchableText.includes(normalizedQuery)) &&
      (filters.subject === "all" || course.subject_name === filters.subject) &&
      (filters.gradeId === "all" || course.grade_id === Number(filters.gradeId)) &&
      (filters.streamId === "all" || course.stream_id === Number(filters.streamId))
    );
  });
}
