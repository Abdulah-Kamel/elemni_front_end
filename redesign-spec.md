# Landing Page Redesign — Visual Specification

**For a model that cannot see images.** Every visual fact in this document is
written out. There is no reference image to consult. If a detail is not in this
file, ask — do not invent it.

This is a **restyle and re-section** of the existing landing page. The token
system, Cairo font, RTL discipline, `Reveal` component, and `motion-safe:`
rules from BUILD_PLAN.md all still apply unless explicitly overridden below.

**Audience note:** this page addresses **students**, not teachers. Copy is
second person to a student ("اتعلم", "ذاكر", "حصصك"). Do not carry over
teacher-facing copy from the previous version.

---

## PART 1 — What changes globally

The previous page was heavy: dark violet sections, strong shadows, gradient
mesh backgrounds, floating decorative shapes. **This design is light, airy, and
flat.** Read these six changes before writing anything.

### 1. There are no dark sections

The previous page had a `bg-violet-deep` DRM section. **Delete that section
entirely.** In the new design, exactly one element has a violet background: the
final CTA card. Everything else is white or very light lavender.

### 2. Shadows are nearly gone; borders replace them

Replace `shadow-soft` / `shadow-lift` on cards with:

```
border border-violet-tint/70 shadow-[0_2px_12px_rgba(123,44,191,0.04)]
```

Cards are defined by a **thin light border**, not by a shadow. Hover may add a
very slight shadow, never a heavy lift.

### 3. Headings use gradient text

All `<h2>` section headings and the hero `<h1>` use a violet-to-magenta
gradient running from the **start (right) to the end (left)** in RTL.

Add this utility to `globals.css`:

```css
@layer utilities {
  .text-gradient {
    background-image: linear-gradient(to left, #7B2CBF 0%, #C77DFF 100%);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }
}
```

Note `to left` — in RTL the gradient must start at the right edge where the
text starts. Do not use `to right`.

### 4. Page background

`#FAF8FF` throughout. Sections alternate between this and pure white. There is
no gradient mesh anywhere on the page. Delete `.gradient-mesh` usage.

### 5. Buttons

- **Primary:** amber `#FFB020` pill, dark ink text, bold, with an arrow icon
  `ArrowLeft` at the **end** of the label. In RTL an arrow pointing left means
  "forward". Use `ArrowLeft`, not `ArrowRight`.
- **Secondary:** white background, `border border-violet-tint`, ink text, pill.
  This is a real bordered button, not a transparent ghost.
- Both: `rounded-full px-6 py-3 text-sm font-bold`.

Amber remains the ONLY primary action color.

### 6. Decoration is removed

No floating blurred circles. No `animate-float` on cards. No `animate-pulse-ring`.
The only remaining ambient motion is inside the final CTA card. `Reveal` on
scroll stays.

---

## PART 2 — Section order

Render in exactly this order. This is a **shorter page** than the previous
build.

```
1. Navbar
2. Hero
3. Teachers directory
4. Why EduStream (bento grid)
5. Mobile app
6. Final CTA
7. Footer
```

**Sections to DELETE from the existing build:** Stats, DRM, Curriculum,
HowItWorks, Features (replaced by the bento grid), Pricing, FAQ.

Delete the component files. Do not leave them unimported.

---

## PART 3 — Section specifications

### 1. Navbar

- Transparent background over the page background. Not sticky-blurred, not
  bordered. Height ~72px.
- **Start side (right):** logo — the text "EduStream" in bold ink, preceded at
  its start by a small violet `GraduationCap` icon at 20px.
- **Center:** four nav links, horizontally centered in the viewport. **These
  links are in English:** `Features`, `Courses`, `Teachers`, `Pricing`. Order in
  the DOM: Features, Courses, Teachers, Pricing. In RTL they will render right
  to left, which is correct.
  - Size `text-sm`, color `text-ink-muted`, weight medium.
  - The active link (`Teachers`) is `text-violet font-semibold` with a thin
    violet underline ~2px directly beneath it.
- **End side (left):** one amber pill button, label `Start Learning` in
  English, `text-sm font-bold`. No arrow icon on this one.

Note the mixed language: nav is English, page body is Arabic. This is
intentional. Do not translate the nav.

### 2. Hero

Two-column, `md:grid-cols-2`, generous vertical padding (~80px top). Text
column on the **start (right)**, image column on the **end (left)**.

**Text column, top to bottom:**

1. `<h1>`, `text-4xl md:text-5xl font-black leading-[1.3]`, `text-start`.
   Three lines, forced with `<br />`:
   ```
   اتعلم من أشطر
   المدرسين..
   في أي وقت وفي أي مكان.
   ```
   Apply `.text-gradient` to the **first two lines only**. The third line
   ("في أي وقت وفي أي مكان.") is solid `text-violet-deep`. This split is the
   point — do not gradient the whole heading.

2. `<p>`, `text-base text-ink-muted leading-relaxed max-w-md`, `text-start`:
   ```
   منصة تعليمية متكاملة تقدملك دروس فيديو عالية الجودة ومحتوى منظم لكل صف
   دراسي، وطرق دفع سهلة، عشان تركز في مذاكرتك ومستقبلك.
   ```

3. Button row, `flex gap-3`:
   - Amber primary: `ابدأ رحلة التعلم` + `ArrowLeft` icon at the end.
   - White bordered secondary: `تصفح المدرسين`. No icon.

4. **Social proof pill** — a distinct element, ~24px below the buttons.
   A white pill, `rounded-full border border-violet-tint px-4 py-2.5`,
   `inline-flex items-center gap-3`, sized to content (not full width).
   - At its **start (right)**: an avatar stack — four `h-8 w-8 rounded-full`
     circles overlapping with `-space-x-3 space-x-reverse`, each with
     `border-2 border-white`. Fill each with a different flat color:
     violet, magenta, amber, teal. **No photos — solid color circles.**
   - Then a text block, two lines, `text-start`:
     - Line 1: `١٨٠,٠٠٠+ طالب` — `text-sm font-bold text-ink`
     - Line 2: `بيذاكروا معانا دلوقتي` — `text-xs text-ink-muted`

**Image column:**

- A single card, `rounded-3xl overflow-hidden`, aspect ratio roughly 4:3.
- **This design uses a real photograph** — a student at home with a tablet.
  You do not have this asset. Render a placeholder: a `rounded-3xl` div filled
  with `bg-gradient-to-br from-violet-tint to-violet-magenta/25`, with a
  centered `ImageIcon` from lucide at 48px in `text-violet/30`. Leave a
  comment: `{/* TODO: replace with hero photograph */}`.
- **Overlaid pill**, absolutely positioned at the card's **top-start corner**
  (`top-4 start-4`): a white pill, `rounded-full ps-1.5 pe-4 py-1.5
  inline-flex items-center gap-2 shadow-sm`.
  - At its start: an amber `h-8 w-8 rounded-full grid place-items-center` with
    a white `Play` icon at 14px, filled.
  - Then two lines of text, `text-start`:
    - `حصة الفيزياء` — `text-xs font-bold text-ink`
    - `جاري التشغيل` — `text-[10px] text-ink-muted`

### 3. Teachers directory

White background. Centered content.

**Header block, centered:**
1. A small pill badge: `bg-violet-tint text-violet text-xs font-bold
   rounded-full px-4 py-1.5`, label `نخبة المعلمين`.
2. `<h2>`, `text-3xl md:text-4xl font-black`, `.text-gradient`:
   `مدرسينك المفضلين في مكان واحد`
3. `<p>`, `text-ink-muted text-sm`:
   `اختار من بين أفضل المدرسين على مستوى الجمهورية وابدأ تذاكر بطريقة تانية.`

**Three cards**, `md:grid-cols-3 gap-5`.

Each card: white, `rounded-2xl border border-violet-tint/70 p-5`.

Card internals, top to bottom:

1. **A row**, `flex items-start justify-between`:
   - At the **start (right)**: a `h-14 w-14 rounded-full` avatar. No photos —
     use a solid `bg-violet-tint` circle with a `User` icon in `text-violet`
     centered. Comment: `{/* TODO: teacher photo */}`.
   - At the **end (left)**: a subject tag pill, `text-[11px] font-bold
     rounded-full px-3 py-1`. Each card gets a different color:
     - Card 1: `لغة عربية` — `bg-ink/5 text-ink-muted`
     - Card 2: `رياضيات` — `bg-violet-tint text-violet`
     - Card 3: `أحياء` — `bg-teal/15 text-teal`

2. Teacher name, `text-base font-bold text-ink`, `text-start`:
   - Card 1: `أ. محمود السعيد`
   - Card 2: `م. سارة جمال`
   - Card 3: `أ. حسن علي`

3. Role line, `text-xs text-ink-muted`, `text-start`:
   - Card 1: `نجم مادة اللغة العربية للثانوية العامة`
   - Card 2: `مدرّس الرياضيات لطلاب الثانوي`
   - Card 3: `خبرة ١٥ سنة في تدريس الأحياء`

4. **Rating row**, `flex items-center gap-2`, `text-start`:
   - Five `Star` icons at 12px, `fill-amber text-amber`.
   - Rating number, `text-xs font-bold text-ink`: `٤٫٩` / `٤٫٨` / `٤٫٩`
   - A `·` separator in `text-ink-muted`.
   - Student count, `text-xs text-ink-muted`: `١٢ ألف طالب` / `٨ آلاف طالب` /
     `١٥ ألف طالب`

5. **Full-width bordered button**, `w-full rounded-full border
   border-violet-tint py-2.5 text-sm font-bold text-ink`, label
   `عرض الكورسات`. Hover: `bg-violet-tint/40`.

**Below the grid, centered:** a text link, `text-violet text-sm font-bold`,
label `عرض كل المدرسين` followed by a `ChevronLeft` icon at 14px. Left chevron
= "forward" in RTL.

Wrap each card in `<Reveal delay={i * 80}>`.

### 4. Why EduStream — bento grid

Background `#FAF8FF`.

**Header block, centered:**
1. `<h2>`, `.text-gradient`: `ليه تذاكر على إديو ستريم؟`
2. `<p>`, `text-ink-muted text-sm`:
   `وفّرنا لك كل الأدوات اللي محتاجها عشان تركز في المذاكرة وتحقق أهدافك.`

**This is an asymmetric bento grid, not a uniform 3×2.** Use
`grid md:grid-cols-3 gap-4 auto-rows-[minmax(150px,auto)]`.

Four cards. Placement in DOM order (RTL will mirror horizontally):

| # | Title | Span | Background | Icon | Icon tile |
|---|---|---|---|---|---|
| 1 | `دفع سهل وسريع` | `md:col-span-1` | white | `Wallet` | violet filled circle, white icon |
| 2 | `جودة فيديو Full HD` | `md:col-span-2` | white | `MonitorPlay` | violet filled circle, white icon |
| 3 | `مراجعات وامتحانات أوتوماتيك` | `md:col-span-2` | `bg-violet-tint/50` | `FileCheck` | amber filled circle, white icon |
| 4 | `تنظيم ذكي للمواد` | `md:col-span-1` | white | `LayoutGrid` | violet filled circle, white icon |

Every card: `rounded-2xl border border-violet-tint/70 p-6`.

Card internals:
- Icon tile at the **top of the card, aligned to the end (left)**:
  `h-10 w-10 rounded-full grid place-items-center`, icon at 18px in white.
  Note: the tile sits at the **end**, not the start. This is what gives the
  design its asymmetric feel — do not move it to the start.
- Title below, `text-lg font-bold text-ink`, `text-start`.
- Body, `text-sm text-ink-muted leading-relaxed`, `text-start`:
  1. `ادفع بالطريقة اللي تناسبك — فودافون كاش، فوري، أو انستاباي.`
  2. `تابع دروسك بجودة عالية وصوت نقي، وقفّل الحصة وارجعلها أي وقت.`
  3. `امتحن نفسك بعد كل حصة، والنتيجة تظهرلك فوراً عشان تعرف نقط ضعفك.`
  4. `محتوى منظّم بالمادة والصف والشعبة، توصل لأي درس في ثانية.`

Card 3 additionally contains, at its **start (right)** side, a decorative
document illustration: a `w-24 h-28 rounded-lg bg-white border
border-violet-tint` with three horizontal `bg-violet-tint` bars inside
suggesting text lines, and a small amber circle with a white `Check` at its
corner. Lay card 3 out as `flex items-center gap-5` with the illustration at
the start and the text block filling the rest.

Wrap each in `<Reveal delay={i * 70}>`.

### 5. Mobile app

White background. Two columns. Text on the **start (right)**, phone on the
**end (left)**.

**Text column:**
1. `<h2>`, `.text-gradient`, two lines with `<br />`:
   ```
   ذاكر من موبايلك بسهولة
   في أي مكان
   ```
2. `<p>`, `text-sm text-ink-muted leading-relaxed max-w-md`:
   `نزّل تطبيق إديو ستريم وخلي كورساتك في جيبك. تقدر تتابع حصصك، تحل واجباتك،
   وتذاكر أوفلاين في أي وقت.`
3. **Three checklist rows**, `flex flex-col gap-3`. Each row: `flex items-center
   gap-2.5`, with a `h-5 w-5 rounded-full bg-teal/15` circle containing a teal
   `Check` at 12px at the **start**, then `text-sm text-ink`:
   - `مشاهدة أوفلاين لحفظ الدروس وذاكر بدون نت`
   - `إشعارات بمواعيد الحصص الجديدة والامتحانات`
   - `واجهة بسيطة وسريعة مخصصة للموبايل`
4. **Two store badges**, `flex gap-3`. Each: white pill, `rounded-xl border
   border-violet-tint px-4 py-2.5 inline-flex items-center gap-2`, an
   `Apple`-substitute icon (`lucide-react` has no Apple logo — use `Smartphone`)
   at 16px, then `text-xs font-bold` reading `App Store`, and the second
   `Google Play`. English labels, do not translate.

**Phone column:**

Build entirely with divs. No image.

- Outer frame: `w-[260px] mx-auto rounded-[36px] border-[6px] border-ink
  overflow-hidden bg-white`, aspect ratio ~1:2.
- Inside, top: a violet header block, `bg-violet p-4 rounded-b-2xl`:
  - A row, `flex items-center justify-between`: at the start, a text block —
    `أهلاً يا أحمد 👋` in `text-sm font-bold text-white`, and beneath it
    `جاهز تذاكر النهاردة؟` in `text-[10px] text-white/70`. At the end, a
    `Bell` icon at 16px in `text-white/80`.
- Below the header, a content area with `p-3 flex flex-col gap-2.5`
  containing placeholder cards:
  - One `h-16 rounded-xl bg-violet-tint`
  - A row of two: `h-14 rounded-xl bg-teal/20` and `h-14 rounded-xl bg-amber/20`
  - One `h-16 rounded-xl bg-violet-tint`
  These are deliberately contentless — they represent app UI without claiming
  specific features.
- **A floating pill**, absolutely positioned at the phone's **bottom-end
  (left)** corner, overlapping the frame edge: white pill, `rounded-full
  border border-violet-tint px-3 py-2 shadow-sm inline-flex items-center
  gap-2`, containing a `h-5 w-5 rounded-full bg-teal` circle with a white
  `Check` at 12px, then `text-[11px] font-bold text-ink` reading
  `تم تحميل الحصة بنجاح`.

### 6. Final CTA

The **only** violet element on the page.

- A card inside the page container (not full-bleed): `rounded-3xl
  gradient-violet px-8 py-14 text-center relative overflow-hidden`.
- **Decoration:** two large outlined rings, `absolute rounded-full border
  border-white/15`, sized ~280px, one positioned off the start edge
  (`-start-16 -top-16`) and one off the end edge (`-end-20 -bottom-20`).
  Outlines only — no fill, no blur.
- `<h2>`, `text-3xl md:text-4xl font-black text-white`: `جاهز تقفّل المادة؟`
- `<p>`, `text-sm text-white/75 max-w-lg mx-auto`:
  `انضم لآلاف الطلاب اللي غيّروا طريقة مذاكرتهم مع إديو ستريم. ابدأ دلوقتي وخد
  خطوة لقدام ناحية حلمك.`
- Amber pill button, centered: `سجّل حسابك مجاناً` + `ArrowLeft` icon at the end.

**No email input.** The previous build had one — remove it. This is a single
button.

### 7. Footer

**Important: the footer is LIGHT, not dark violet.** Override the previous
build.

- `bg-violet-tint/40 border-t border-violet-tint py-8`.
- One row, `flex items-center justify-between`, wrapping to two rows on mobile.
- **Start (right):** a block, `text-start`:
  - `EduStream` in `text-base font-bold text-ink`
  - Beneath: `© ٢٠٢٦ EduStream Egypt. All rights reserved` in
    `text-[11px] text-ink-muted`
- **End (left):** a row of five links, `flex gap-5 text-xs text-ink-muted`,
  **in English**, DOM order: `About Us`, `Contact`, `Privacy Policy`,
  `Terms of Service`, `Help Center`.
  Hover: `text-violet`.

That is the entire footer. No four-column link grid. No social icons. No
language toggle. No "صُنع في مصر" line. Delete all of it from the previous
build.

---

## PART 4 — Acceptance checklist

- [ ] `npm run build` passes, zero TS errors.
- [ ] Zero occurrences of `ml-`, `mr-`, `pl-`, `pr-`, `text-left`,
      `text-right`, `left-`, `right-` in `src/`. Grep and paste output.
- [ ] The gradient on `.text-gradient` runs `to left`, not `to right`.
- [ ] Forward arrows are `ArrowLeft` / `ChevronLeft`, never Right.
- [ ] Exactly ONE violet-background element exists: the final CTA card.
- [ ] The footer is light lavender, not `bg-violet-deep`.
- [ ] The old sections (Stats, DRM, Curriculum, HowItWorks, Features, Pricing,
      FAQ) are deleted, not orphaned.
- [ ] Every animation is `motion-safe:` prefixed.
- [ ] No `animate-float`, no `animate-pulse-ring`, no blurred decorative
      circles anywhere.
- [ ] Every photo placeholder carries a `{/* TODO */}` comment.
- [ ] Bento icon tiles sit at the card **end**, not the start.
- [ ] Arabic-Indic numerals throughout (١٨٠,٠٠٠ not 180,000).
- [ ] Nav links and footer links remain in English; body copy is Arabic.

---

## PART 5 — Never do these

- Never gradient an entire `<h1>` — the hero's third line stays solid.
- Never use `ArrowRight` or `ChevronRight` for forward motion in RTL.
- Never reintroduce heavy shadows. Borders define cards now.
- Never add a dark section. There are none besides the CTA.
- Never translate the English nav or footer links.
- Never invent a photograph URL. Placeholders with TODO comments only.
- Never make the teacher cards a uniform grid of identical tag colors — the
  three tag colors differ on purpose.
- Never carry teacher-facing copy ("بطّل تبيع دروسك") into this page. This
  page speaks to students.
