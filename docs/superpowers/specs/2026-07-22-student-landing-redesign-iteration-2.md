# Student Landing Page — Second Design Iteration

**Date:** 2026-07-22
**Status:** Design — approved for implementation

## Overview

Integrate the second iteration of the Stitch + Google AI Studio design into the Next.js app. Three new components to port (`PaymentMethods`, `TeacherJoinCTA`, `TeacherProfile`), one new route (`/teachers/[id]`), and minor type/prop updates.

## Changes

| Change | Type | Source |
|--------|------|--------|
| `PaymentMethods` | New component | `elemni-edtech/src/components/PaymentMethods.tsx` |
| `TeacherJoinCTA` | New component | `elemni-edtech/src/components/TeacherJoinCTA.tsx` |
| `TeacherProfile` | New route page | `elemni-edtech/src/components/TeacherProfile.tsx` |
| `subjects`, `gradesList` fields | Type update | Added to `Teacher` in `types.ts` |
| TeacherGrid | Prop update | Add "مشاهدة الملف الشخصي" button → `/teachers/[id]` |
| TeacherModal | Prop update | Add `onViewFullProfile` → links to profile |
| Navbar | Prop update | Add `onGoHome` for back button on teacher profile |

## Page Flow (unchanged sections, 3 new sections added)

```
Navbar → Hero → TeacherGrid → Features → [PaymentMethods] → [TeacherJoinCTA] →
SubjectGrid → FeaturedLessons → BentoGrid → StepsSection → Comparison →
MobileApp → InteractiveQuiz → Testimonials → FaqSection → FinalCta → Footer
```

## Route Structure

- `/[locale]/(student)/page.tsx` — existing landing page, add new sections
- `/[locale]/teachers/[id]/page.tsx` — new TeacherProfile route
  - Reads teacher ID from params, looks up in `TEACHERS_DATA`
  - Server component shell with client-interactive body

## Architecture

**TeacherProfile page (`/teachers/[id]`):**
- Server component that reads `params.id`, finds the matching teacher from `TEACHERS_DATA`
- Returns 404 redirect if teacher not found
- Renders a client component `TeacherProfileView` imported from `student-redesign/components/client/`
- Has a back button linking to `/[locale]` (passes `onGoHome` to Navbar)

**New sections (server components):**
| Component | File |
|-----------|------|
| PaymentMethods | `src/features/student-redesign/components/server/payment-methods.tsx` |
| TeacherJoinCTA | `src/features/student-redesign/components/server/teacher-join-cta.tsx` |

## Data Flow

- `types.ts` — add `subjects?: string[]` and `gradesList?: string[]` to `Teacher`
- `mock-data.ts` — teachers already have most fields, optional ones handle undefined gracefully
- TeacherGrid's "الملف الشخصي" button → `next/link` to `/${locale}/teachers/${teacher.id}`
- TeacherModal "عرض الكورسات" → still opens modal; add "عرض الملف الشخصي" button → link

## Implementation Order

1. Update types.ts with new fields
2. Create TeacherProfile route page + client component
3. Create PaymentMethods component
4. Create TeacherJoinCTA component
5. Update page.tsx to add the two new sections
6. Update TeacherGrid with profile link
7. Update TeacherModal with profile link
8. Update Navbar with onGoHome
9. Build verification
