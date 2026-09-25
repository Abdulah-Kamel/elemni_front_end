export type TestView = "intro" | "attempt" | "result" | "review";

export function parseTestView(value: string | undefined): TestView {
  return value === "attempt" || value === "result" || value === "review" ? value : "intro";
}

export function testHref(courseId: number, testId: number, options: { attempt?: number; view?: TestView } = {}) {
  const query = new URLSearchParams();
  if (options.attempt) query.set("attempt", String(options.attempt));
  if (options.view && options.view !== "intro") query.set("view", options.view);
  const suffix = query.size ? `?${query}` : "";
  return `/my-courses/${courseId}/tests/${testId}${suffix}`;
}

/** Course content item link (videos/files are opened by the course page). */
export function courseItemHref(courseId: number, item: { id: number; kind: string }) {
  return item.kind === "test" ? testHref(courseId, item.id) : `/my-courses/${courseId}?item=${item.id}`;
}
