# Legal & Contact Pages Design

**Date:** 2026-09-03
**Status:** Reviewed and revised
**Author:** Elemni frontend team

## Overview

Create two localized, indexable pages required for payment gateway approval:
1. A single legal page combining Terms & Conditions and the Refund/Cancellation Policy
2. A contact page with the published support phone number

## Requirements

- Legal and contact information must be directly reachable from the public landing pages
- 14-day refund window
- Phone: `01098324898`
- All content in Arabic and English via `next-intl`
- Arabic pages use RTL and Arabic typography; English pages use LTR and English typography
- Do not publish unsupported payment, processing-time, jurisdiction, email, or address claims

## Approach: Localized server-rendered pages

Two new routes using Server Components with i18n translations.

## Page 1: Legal (`/legal`)

### Structure
- Terms & Conditions section
- Refund/Cancellation Policy section (14-day window)
- An accessible accordion keeps the long policy readable while exposing every section to crawlers and keyboard users

### Technical
- **Route:** `/[locale]/legal`
- **Component type:** Server Component (no `"use client"`)
- **File:** `src/app/[locale]/legal/page.tsx`

### Content Sections

#### Terms & Conditions
1. Acceptance of Terms
2. User Registration & Account
3. Course Enrollment & Access
4. Payment & Pricing
5. Intellectual Property
6. User Conduct
7. Limitation of Liability
8. Governing Law

#### Refund/Cancellation Policy
1. Eligibility (14-day window from purchase)
2. Non-Refundable Items
3. How to Request a Refund
4. Contact for Refund Requests

## Page 2: Contact (`/contact`)

### Structure
- Contact information section with a clearly labeled, clickable phone number
- No simulated contact form: a form without a server action would falsely imply that a message was delivered

### Technical
- **Route:** `/[locale]/contact`
- **Component type:** Server page with the shared localized chrome
- **Files:**
  - `src/app/[locale]/contact/page.tsx` (Server)
  - `src/features/contact/contact-details.ts` (shared phone constants)

### Contact Info
- Phone: `01098324898`
- The number is rendered as a `tel:` link so it is usable on mobile and verifiable by reviewers

## Footer Updates

### Files to Update
1. `src/features/landing/components/server/footer.tsx` (Student landing footer)
2. `src/features/marketing/components/footer.tsx` (Teacher marketing footer)

### Changes
- Legal link → `/legal`
- Contact link → `/contact`
- Use `next-intl` `Link` for locale-aware navigation
- Remove placeholder social and form actions until real destinations/actions exist

## i18n Translations

Legal, refund, contact, navigation, and footer copy live in both
`src/messages/ar.json` and `src/messages/en.json`. Shared UI reads these
namespaces at render time; no visible legal or contact copy is hard-coded.

## File Structure

```
src/
├── app/
│   └── [locale]/
│       ├── legal/
│       │   └── page.tsx          # Legal page (Server Component)
│       └── contact/
│           └── page.tsx          # Contact page (Server Component)
├── features/
│   └── contact/
│       └── contact-details.ts   # Shared support phone constants
├── messages/
│   ├── ar.json                   # Add legal & contact translations
│   └── en.json                   # Add legal & contact translations
└── features/
    ├── landing/
    │   └── components/
    │       └── server/
    │           └── footer.tsx    # Update links
    └── marketing/
        └── components/
            └── footer.tsx        # Update links
```

## Acceptance Criteria

1. ✅ `/legal` page renders Terms & Conditions and Refund Policy
2. ✅ `/contact` page renders the verified support phone number
3. ✅ Phone link uses `tel:01098324898`
4. ✅ No UI claims that a message was sent without a backend action
5. ✅ Both pages work in Arabic and English
6. ✅ Both pages work in RTL (Arabic) and LTR (English)
7. ✅ Footer links navigate to correct pages
8. ✅ No hardcoded strings — all through i18n
9. ✅ Server-rendered pages by default, with client components only for interactive accordions/chrome
10. ✅ Bank gateway can index both pages
