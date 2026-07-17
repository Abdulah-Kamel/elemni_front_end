# Contract: GET /v1/featured-content

**Branch**: `001-student-landing-page` | **Date**: 2026-07-17

Rationale / Decision: see `../research.md` R8. Named endpoint raised to the
backend team. Rendered in the "Featured Content" carousel on the student landing.

## Request

- Method: `GET`
- Path: `/v1/featured-content`
- Query (optional): `?limit=<int>`
- Headers: `Accept-Language: ar|en`, `X-Request-Id: <correlationId>`
- Auth: public
- Cache: `revalidate: 3600`, `next: { tags: ["curriculum"] }`

## Success Response (200)

```json
{
  "data": [
    {
      "id": "880e8400-...",
      "title": { "ar": "أقوى شرح للتفاضل", "en": "Best Calculus Explainer" },
      "description": { "ar": "...", "en": "..." },
      "thumbnailUrl": "https://cdn.example.com/img.jpg",
      "linkType": "lesson",
      "linkTarget": "calculus-001",
      "subjectId": "550e8400-...",
      "displayOrder": 1
    }
  ]
}
```

## zod schema (planned: `src/features/student-landing/schemas/featured-content.ts`)

```ts
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
```

**Notes**:
- `thumbnailUrl` is nullable; when `null`, render a placeholder via `next/image`
  with explicit dimensions (constitution: no CLS).
- The `subjectId` cross-reference uses a `refine` to enforce the
  `linkType === "subject"` invariant at parse time. This is a contract-shape
  invariant, NOT a client-side business rule (Article II).
- Display order is rendered as-is; the frontend never re-sorts featured content
  by popularity or any other rule (Article I: curation is the backend's rule).