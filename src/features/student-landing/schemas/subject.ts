import { z } from "zod";

export const LocalizedTextSchema = z.object({
  ar: z.string().min(1),
  en: z.string().min(1),
});

export const SubjectSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  name: LocalizedTextSchema,
  icon: z.string().nullable().optional(),
  gradeIds: z.array(z.string()).default([]),
  streamIds: z.array(z.string()).default([]),
  lessonsCount: z.number().int().nonnegative().nullable(),
  featured: z.boolean().default(false),
});

export const SubjectsResponseSchema = z.object({
  data: z.array(SubjectSchema),
});

export type Subject = z.infer<typeof SubjectSchema>;
export type SubjectsResponse = z.infer<typeof SubjectsResponseSchema>;
