export const studentQueryKeys = {
  all: ["student"] as const,
  me: () => [...studentQueryKeys.all, "me"] as const,
  myCourses: () => [...studentQueryKeys.all, "my-courses"] as const,
  course: (courseId: number, teacherSlug?: string) =>
    [...studentQueryKeys.all, "course", courseId, teacherSlug ?? null] as const,
};
