# Contract: GET /v1/subjects

**Branch**: `001-student-landing-page` | **Date**: 2026-07-17

Rationale / Decision: see `../research.md` R8. This is a named endpoint raised
to the backend team; the frontend student landing renders static fallback when
the endpoint is absent.

## Request

- Method: `GET`
- Path: `/v1/subjects`
- Query (optional): `?gradeId=<uuid>&streamId=<uuid>&featured=true`
- Headers: `Accept-Language: ar|en`, `X-Request-Id: <correlationId>`
- Auth: public (browse, no session)
- Cache: `revalidate: 3600`, `next: { tags: ["curriculum"] }`

## Success Response (200)

```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "slug": "physics",
      "name": { "ar": "فيزياء", "en": "Physics" },
      "icon": "atoms",
      "gradeIds": ["551e8400-..."],
      "streamIds": ["552e8400-..."],
      "lessonsCount": 42,
      "featured": true
    }
  ]
}
```

## zod schema (planned: `src/features/student-landing/schemas/subject.ts`)

```ts
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
```

**Notes**:
- `lessonsCount` is `nullable`; `null` is rendered as a skeleton, `0` is a valid
  count (Article II — distinguish missing from zero).
- `icon` is nullable; icons are rendered from a static client-side mapping
  (e.g., lucide-react key → component), so a missing `icon` falls back to a
  default lucide icon rather than fetching remote imagery.
- TS types inferred via `z.infer` only — never declared separately (Article II).