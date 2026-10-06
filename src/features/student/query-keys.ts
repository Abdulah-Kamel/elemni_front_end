export const studentQueryKeys = {
  all: ["student"] as const,
  me: () => [...studentQueryKeys.all, "me"] as const,
  myCourses: () => [...studentQueryKeys.all, "my-courses"] as const,
  coursePrefix: (courseId: number) => [...studentQueryKeys.all, "course", courseId] as const,
  course: (courseId: number, teacherSlug?: string) =>
    [...studentQueryKeys.all, "course", courseId, teacherSlug ?? null] as const,
  lastWatched: () => [...studentQueryKeys.all, "last-watched"] as const,
  videoProgress: (itemId: number) => [...studentQueryKeys.all, "video-progress", itemId] as const,
};
