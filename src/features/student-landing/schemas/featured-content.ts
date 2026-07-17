import { z } from "zod";
import { LocalizedTextSchema } from "./subject";

export const LinkTypeSchema = z.enum(["lesson", "subject", "external"]);

export const FeaturedContentSchema = z.object({
  id: z.string().min(1),
  title: LocalizedTextSchema,
  description: LocalizedTextSchema,
  thumbnailUrl: z.string().url().nullable(),
  linkType: LinkTypeSchema,
  linkTarget: z.string().min(1),
  subjectId: z.string().nullable(),
  displayOrder: z.number().int().nonnegative().default(0),
}).refine(
  (v) => v.linkType !== "subject" || (v.subjectId !== null && v.subjectId.length > 0),
  { message: "subjectId is required when linkType === 'subject'", path: ["subjectId"] }
);

export const FeaturedContentResponseSchema = z.object({
  data: z.array(FeaturedContentSchema),
});

export type FeaturedContent = z.infer<typeof FeaturedContentSchema>;
export type FeaturedContentResponse = z.infer<typeof FeaturedContentResponseSchema>;
