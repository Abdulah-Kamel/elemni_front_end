# Student Landing Page Redesign

**Date:** 2026-07-22
**Status:** Design — approved for implementation

## Overview

Replace the existing Next.js student landing page with the design generated via Stitch + Google AI Studio, ported from the exported React app at `elemni-edtech/`. The new page blends the exported app's components with select existing components from the current page, restyled to match the new blue-primary design language.

## Architecture

```
src/features/student-redesign/
├── page.tsx                        # Server component — orchestrates sections
├── components/
│   ├── client/                     # Interactive widgets ("use client")
│   │   ├── navbar.tsx
│   │   ├── auth-modal.tsx
│   │   ├── teacher-modal.tsx
│   │   ├── video-modal.tsx
│   │   ├── interactive-quiz.tsx
│   │   ├── faq-section.tsx
│   │   ├── toast-notification.tsx
│   │   └── whatsapp-button.tsx
│   └── server/                     # Static/server-friendly sections
│       ├── hero.tsx
│       ├── teacher-grid.tsx
│       ├── features.tsx
│       ├── testimonials.tsx
│       ├── pricing.tsx
│       ├── subject-grid.tsx
│       ├── featured-lessons.tsx
│       ├── bento-grid.tsx
│       ├── steps-section.tsx
│       ├── comparison.tsx
│       ├── before-after.tsx
│       ├── mobile-app.tsx
│       └── footer.tsx
├── data/
│   └── mock-data.ts
└── types.ts
```

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Primary color | Blue #0284C7 | Preserve Stitch/AI Studio design output |
| Language | Arabic-only (hardcoded) | User confirmed no i18n needed for this page |
| Dark mode | `.dark` class toggle with localStorage | Preserved from exported app |
| Assets | External URLs only (Unsplash) | No local images in exported app |
| Component pattern | Hybrid — server shell + client widgets | Interactive pieces need `use client`, static sections stay server |
| State | React state lifted to page.tsx | No external state library needed |

## Page Flow

```
Navbar → Hero → TeacherGrid → Features → SubjectGrid → FeaturedLessons →
BentoGrid → Steps → Comparison → BeforeAfter → MobileApp →
InteractiveQuiz → Pricing → Testimonials → FAQ → FinalCta → Footer
+ WhatsAppButton (floating bottom-left)
+ ToastNotification (floating top-right)
```

## Component Mapping

| Exported App Component | Target File | Notes |
|------------------------|-------------|-------|
| Navbar | `client/navbar.tsx` | Port as-is, add link anchors for other sections |
| Hero | `server/hero.tsx` | Port as-is, make server-safe (no interactivity) |
| TeacherGrid | `server/teacher-grid.tsx` | Port as-is; merge GradeStreamFilter UX into filters |
| Features | `server/features.tsx` | Port as-is |
| Testimonials | `server/testimonials.tsx` | Port as-is |
| FaqSection | `client/faq-section.tsx` | Needs accordion state → client component |
| Footer | `server/footer.tsx` | Port as-is |
| AuthModal | `client/auth-modal.tsx` | Port as-is |
| TeacherModal | `client/teacher-modal.tsx` | Port as-is |
| VideoModal | `client/video-modal.tsx` | Port as-is |
| InteractiveQuiz | `client/interactive-quiz.tsx` | Port as-is |
| Pricing | `server/pricing.tsx` | Port as-is |
| WhatsAppButton | `client/whatsapp-button.tsx` | Port as-is |
| ToastNotification | `client/toast-notification.tsx` | Port as-is |

| Existing Component | Target File | Notes |
|-------------------|-------------|-------|
| GradeStreamFilter | Merged into `teacher-grid.tsx` | Filter dropdowns already exist in TeacherGrid |
| SubjectGrid | `server/subject-grid.tsx` | Port from existing, restyle to blue theme |
| FeaturedLessons | `server/featured-lessons.tsx` | Port from existing, restyle to blue theme |
| StudentBentoGrid | `server/bento-grid.tsx` | Port from existing, restyle to blue theme |
| StudentStepsSection | `server/steps-section.tsx` | Port from existing, restyle to blue theme |
| StudentComparison | `server/comparison.tsx` | Port from existing, restyle to blue theme |
| StudentBeforeAfter | `server/before-after.tsx` | Port from existing, restyle to blue theme |
| StudentMobileApp | `server/mobile-app.tsx` | Port from existing, restyle to blue theme |
| StudentFinalCta | `server/final-cta.tsx` | Port from existing, restyle to blue theme |

## State Management

All state lifted to `page.tsx`:

```typescript
// Modal states
authModalOpen: boolean
authMode: 'signin' | 'signup'

// Selection states
selectedTeacher: Teacher | null
videoModalOpen: boolean

// Search
searchQuery: string

// Theme
isDarkMode: boolean  // persisted to localStorage

// Toast
toastMessage: string | null
```

## Color Tokens

```
--color-primary: #0284C7
--color-primary-hover: #0369A1
--color-primary-light: #F0F9FF
--color-accent: #F97316
--color-success: #22C55E
--color-error: #EF4444
--color-warning: #F59E0B
Dark backgrounds: #0B132B, #1C2541, #1E293B
Dark text: #F8FAFC, #CBD5E1, #94A3B8
```

## Dark Mode

- `.dark` class on `<html>` element
- Toggle persisted to `localStorage`
- `@custom-variant dark (&:where(.dark, .dark *));` in globals.css
- Same pattern as exported app's `index.css`

## What's NOT Included

- No i18n (Arabic-only page, confirmed)
- No server-side data fetching (static mock data)
- No routing changes (page stays at `/[locale]/(student)/`)
- No backend integration (modals are UI-only placeholders)

## Success Criteria

1. New page renders all sections in the specified order on desktop and mobile
2. Dark mode toggle works and persists across page reloads
3. All modals (auth, teacher, video) open/close correctly
4. Teacher search + filters return correct filtered results
5. Interactive Quiz shows questions, accepts answers, and displays score
6. Accordion FAQ opens/closes items independently
7. WhatsApp button links to correct URL
8. Toast notification appears and auto-dismisses
9. Existing page at `/[locale]/(student)/` routes to the new design
