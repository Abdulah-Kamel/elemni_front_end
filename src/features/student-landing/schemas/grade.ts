import { z } from "zod";
import { LocalizedTextSchema } from "./subject";

export const GradeSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  name: LocalizedTextSchema,
  order: z.number().int().nonnegative().default(0),
  subjectIds: z.array(z.string()).default([]),
});

export const GradesResponseSchema = z.object({
  data: z.array(GradeSchema),
});

export type Grade = z.infer<typeof GradeSchema>;
export type GradesResponse = z.infer<typeof GradesResponseSchema>;
