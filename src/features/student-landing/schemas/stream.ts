import { z } from "zod";
import { LocalizedTextSchema } from "./subject";

export const StreamSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  name: LocalizedTextSchema,
  gradeId: z.string().min(1),
  subjectIds: z.array(z.string()).default([]),
});

export const StreamsResponseSchema = z.object({
  data: z.array(StreamSchema),
});

export type Stream = z.infer<typeof StreamSchema>;
export type StreamsResponse = z.infer<typeof StreamsResponseSchema>;
