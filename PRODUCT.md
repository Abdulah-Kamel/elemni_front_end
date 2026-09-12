# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Egyptian school students across grades and streams, Arabic-first and mobile-heavy.
Parents typically pay for subscriptions.

## Product Purpose

Elemni is a multi-teacher education marketplace. Students browse teachers and published
courses, subscribe through Kashier-hosted checkout (or instant free enrollment), and
study within 30-day enrollments with protected video, documents, and exams. Success is
a student finding a course, paying without friction, and learning inside the portal.

## Positioning

A single portal where discovery, secure payment, and protected study live together:
published outlines are public, but video URLs, documents, and exams unlock only with an
active enrollment, recalculated by the backend on every visit.

## Operating Context

Student surface routes: dashboard, my-courses, my-courses/[courseId], explore,
payment/redirect, onboarding. Authenticated browser traffic goes through Next.js API
routes with cookie-backed sessions; the backend owns authorization, pricing, and
payment verification. Arabic (default) and English via next-intl with RTL layouts.

## Capabilities and Constraints

Confirmed functionality: teacher/course discovery, checkout with pending enrollments,
Kashier redirect flow with a verified return page, 30-day subscriptions, progress
tracking. Technical constraints: Next.js 16 App Router, next-intl ar/en, dark mode
support, httpOnly session cookies, no client-side payment verification. Redesign work
changes no routes, slugs, copy, data-fetching, or payment logic.

## Brand Commitments

Elemni name and blue (`#0284C7`, deep `#0369A1`) stay. Readex Pro stays as the
Arabic-optimized typeface. Replacement visual world keeps the blue accent only.

## Evidence on Hand

Live implementation in `src/` (portal shell, dashboard, courses, onboarding features),
backend contract in `docs/reference/backend-business-flow.md`, ar/en copy in
`src/messages/`. No synthetic testimonials, metrics, or claims to invent.

## Product Principles

1. The backend is the source of truth; the frontend displays and forwards.
2. Arabic-first, mobile-first, readable in both light and dark.
3. Trust before decoration on anything touching payment or access.
4. One accent color; status colors keep their semantic meaning.
5. Accessibility (contrast, focus, reduced motion) is a release gate, not polish.

## Accessibility & Inclusion

WCAG AA contrast minimum, visible focus indicators, semantic headings, reduced-motion
support, logical properties for RTL mirroring.
