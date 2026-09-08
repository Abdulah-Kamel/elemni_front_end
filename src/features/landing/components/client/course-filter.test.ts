import { describe, expect, it } from "vitest";
import type { PublicCourseDto } from "@/src/lib/student-api/contract";
import { filterLandingCourses } from "./course-filter";

const courses: PublicCourseDto[] = [
  {
    id: 1,
    title: "أساسيات الفيزياء",
    description: "شرح مبسط للحركة والطاقة",
    img: null,
    price: "250",
    subject_name: "الفيزياء",
    grade_id: 3,
    stream_id: 2,
    total_duration_minutes: 420,
    lesson_count: 18,
    use_chapters: true,
    chapters: [],
    is_subscribed: false,
    created_at: "2026-09-01T00:00:00Z",
    teacher_name: "أحمد حسن",
    teacher_slug: "ahmed-hassan",
  },
  {
    id: 2,
    title: "مراجعة الكيمياء",
    description: "تدريب عملي قبل الامتحان",
    img: null,
    price: 0,
    subject_name: "الكيمياء",
    grade_id: 2,
    stream_id: 1,
    total_duration_minutes: 90,
    lesson_count: 6,
    use_chapters: false,
    chapters: [],
    is_subscribed: false,
    created_at: "2026-08-28T00:00:00Z",
    teacher_name: "سارة علي",
    teacher_slug: "sara-ali",
  },
];

describe("filterLandingCourses", () => {
  it("filters by search text across course and teacher details", () => {
    expect(
      filterLandingCourses(courses, {
        query: "أحمد",
        subject: "all",
        gradeId: "all",
        streamId: "all",
      }),
    ).toEqual([courses[0]]);
  });

  it("applies subject, grade, and stream filters together", () => {
    expect(
      filterLandingCourses(courses, {
        query: "",
        subject: "الفيزياء",
        gradeId: "3",
        streamId: "2",
      }),
    ).toEqual([courses[0]]);
  });

  it("returns every course when all filters are reset", () => {
    expect(
      filterLandingCourses(courses, {
        query: "",
        subject: "all",
        gradeId: "all",
        streamId: "all",
      }),
    ).toEqual(courses);
  });
});
