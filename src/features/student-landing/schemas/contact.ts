import { z } from "zod";

export const ContactInputSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  subject: z.string().max(120).optional(),
  message: z.string().min(1).max(2000),
  locale: z.enum(["ar", "en"]),
});

export const ContactResponseSchema = z.object({
  data: z.object({
    id: z.string().min(1),
    status: z.enum(["received", "queued"]),
  }),
});

export type ContactInput = z.infer<typeof ContactInputSchema>;
export type ContactResponse = z.infer<typeof ContactResponseSchema>;
