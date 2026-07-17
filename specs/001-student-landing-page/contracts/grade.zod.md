# Contract: GET /v1/grades

**Branch**: `001-student-landing-page` | **Date**: 2026-07-17

Rationale / Decision: see `../research.md` R8. Named endpoint raised to the
backend team.

## Request

- Method: `GET`
- Path: `/v1/grades`
- Headers: `Accept-Language: ar|en`, `X-Request-Id: <correlationId>`
- Auth: public
- Cache: `revalidate: 3600`, `next: { tags: ["curriculum"] }`

## Success Response (200)

```json
{
  "data": [
    {
      "id": "660e8400-...",
      "slug": "grade-3-secondary",
      "name": { "ar": "الثالث الثانوي", "en": "Grade 3 Secondary" },
      "order": 3,
      "subjectIds": ["550e8400-..."]
    }
  ]
}
```

## zod schema (planned: `src/features/student-landing/schemas/grade.ts`)

```ts
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
```

**Notes**:
- `order` defaults to 0 when absent so the frontend can sort without null checks.
- `subjectIds` is the read-side projection of the N↔N relationship; the
  frontend never edits it (Article I).