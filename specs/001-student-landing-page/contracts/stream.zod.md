# Contract: GET /v1/streams

**Branch**: `001-student-landing-page` | **Date**: 2026-07-17

Rationale / Decision: see `../research.md` R8. Named endpoint raised to the
backend team.

## Request

- Method: `GET`
- Path: `/v1/streams`
- Query (optional): `?gradeId=<uuid>`
- Headers: `Accept-Language: ar|en`, `X-Request-Id: <correlationId>`
- Auth: public
- Cache: `revalidate: 3600`, `next: { tags: ["curriculum"] }`

## Success Response (200)

```json
{
  "data": [
    {
      "id": "770e8400-...",
      "slug": "scientific",
      "name": { "ar": "علمي", "en": "Scientific" },
      "gradeId": "660e8400-...",
      "subjectIds": ["550e8400-..."]
    }
  ]
}
```

## zod schema (planned: `src/features/student-landing/schemas/stream.ts`)

```ts
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
```

**Notes**:
- `gradeId` is required — a stream without a grade is nonsensical; the parse
  fails loudly at the boundary if it is missing (Article II).