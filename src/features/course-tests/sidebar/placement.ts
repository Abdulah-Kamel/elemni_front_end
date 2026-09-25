// Places course tests inside the curriculum: each test goes into its lesson's
// item list at `position` (an index among that lesson's content items), and
// `inside_item` tests hang under their parent content item as a compact row.
import type { PublicChapterDto } from "@/src/lib/student-api/contract";
import type { SidebarTestItem } from "../types";

export type LessonTests = {
  /** Standalone tests rendered before the content item at `index` (index ≥ items.length → after the last item). */
  rows: { index: number; test: SidebarTestItem }[];
  /** Compact sub-rows keyed by the parent content item id. */
  subRows: Map<number, SidebarTestItem[]>;
};

export function placeTestsInLessons(chapters: PublicChapterDto[], tests: SidebarTestItem[]) {
  const lessons = chapters.flatMap((chapter) => chapter.lessons);
  const placed = new Map<number, LessonTests>();
  const lastLesson = lessons.at(-1);
  if (!lastLesson) return placed;

  const sorted = [...tests].sort((a, b) => a.position - b.position || a.id - b.id);
  for (const test of sorted) {
    // Tests without a (known) lesson land in the last lesson.
    const lesson = lessons.find((candidate) => candidate.id === test.lesson_id) ?? lastLesson;
    const entry = placed.get(lesson.id) ?? { rows: [], subRows: new Map<number, SidebarTestItem[]>() };
    placed.set(lesson.id, entry);

    const parent = test.placement === "inside_item"
      ? lesson.items.find((item) => item.id === test.parent_item_id) ?? lesson.items[0]
      : undefined;
    if (parent) {
      entry.subRows.set(parent.id, [...(entry.subRows.get(parent.id) ?? []), test]);
    } else {
      entry.rows.push({ index: Math.max(0, Math.min(test.position, lesson.items.length)), test });
    }
  }
  return placed;
}

/** The lesson (and chapter) a test is shown in, for auto-expanding the curriculum. */
export function findTestLocation(chapters: PublicChapterDto[], tests: SidebarTestItem[], testId: number) {
  const placed = placeTestsInLessons(chapters, tests);
  for (const chapter of chapters) {
    for (const lesson of chapter.lessons) {
      const entry = placed.get(lesson.id);
      if (!entry) continue;
      const inRows = entry.rows.some((row) => row.test.id === testId);
      const inSubRows = [...entry.subRows.values()].some((list) => list.some((test) => test.id === testId));
      if (inRows || inSubRows) return { chapterId: chapter.id, lessonId: lesson.id };
    }
  }
  return null;
}
