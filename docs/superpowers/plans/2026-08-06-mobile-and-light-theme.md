# Mobile fixes + a real light theme — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Apply the **frontend-design** skill. Every task ends with a REAL check at 375px and 1280px in **both themes** — this plan exists because a previous pass shipped mobile/theme problems that unit tests didn't catch.

**Goal:** Fix six concrete defects the owner hit on a real phone, and make the light theme genuinely work instead of being a button that lies.

**The defects (measured, not guessed):**
1. Hero CTAs: 4 buttons at **40px** tall (under the 44px touch target) wrapping into two ragged rows; "Ask the AI" ends up orphaned at the bottom.
2. Dead space, and **"Send a pulse" sits at y=1421** — buried at the end of a 612px section, below the whole diagram.
3. The pulse button is misaligned with the rest of its block (fixed 176px, not aligned to the section rhythm).
4. The mobile menu opens a **right-side sidebar** (`SheetContent side="right"`); on a phone it should be a **bottom sheet** with large rows.
5. The language toggle opens a dropdown whose labels are hardcoded `'EN'` / `'Português'` — inconsistent, unlocalized, and `EN` **wrapped to two lines ("E"/"N")** in the narrow popover.
6. The theme button "only changes the background": **every content surface pins `className="dark"`** (`app-shell`, `hero`, `engineering-showcase`, `about-page`, `projects`, `project-detail`, `live-page`, `top-nav`, `ask-widget`, `routes/index`), so the toggle can't do anything meaningful.

**Owner's decision:** make the **light theme actually work** (not dark-only).

## Global Constraints

- **pnpm; TS strict, no `any`.** Reuse `components/signal/*`; en/pt-BR parity for all copy.
- **Both themes are first-class.** Nothing may pin `dark`. Every surface must be legible and on-brand in light AND dark, including: panels (`bg-signal-muted/*` appears in 13 files), the aqua accent on white, the hero map canvas, the choropleth/charts, chips, the status pill, and the Ask sheet.
- **Accent contrast:** `#3ae0c4` fails AA as text on white. Light theme must use a darker signal variant for text/accents (a token, e.g. `--color-signal-strong` ≈ `hsl(170 80% 32%)`, which the data-viz ramp already uses in light) while keeping the bright aqua for dark. **Never** aqua-on-white text.
- **Touch targets ≥44px** for every interactive control on mobile; no ragged CTA wrapping.
- **a11y:** one `<h1>` per page; keyboard + visible focus in both themes; `prefers-reduced-motion` honored; the theme/lang controls announce state.
- **Hard gate per task:** `pnpm -C web build` + `pnpm -C web exec tsc --noEmit` + `pnpm -C web test`, all green — **plus** a real browser check at 375px and 1280px in both themes (screenshot or measured DOM), reported.

---

### Task 1: A real light theme (remove every pinned `dark`)

**Files:** `web/src/styles.css`; every file that pins `dark`: `components/app-shell.tsx`, `components/nav/top-nav.tsx`, `components/ask/ask-widget.tsx`, `components/home/{hero,engineering-showcase}.tsx`, `components/about/about-page.tsx`, `components/projects/project-detail.tsx`, `components/live/live-page.tsx`, `routes/{index,projects}.tsx`; plus surfaces using `bg-signal-muted/*`, `border-signal/*`, `text-signal` (13 files); `components/home/hero-map.tsx` (canvas colors); `live-map.tsx` (choropleth).
**Test:** a theme test asserting no component pins `dark`, and a light-mode contrast smoke test for the accent-on-surface pairs.

- [ ] **Step 1: tokens** — add the light-theme signal variants (e.g. `--color-signal-strong` for text/accents on light, keep `--color-signal` as the bright dark-mode accent; a panel tint that reads as a subtle card on white instead of a dark wash). Both themes get: surface, panel, border, accent-text, accent-fill, and an on-accent foreground.
- [ ] **Step 2: failing test** — assert (a) no `className` in `web/src` contains a pinned `dark` surface token, (b) the light theme's accent-text token meets ≥4.5:1 on the light surface (compute from the token values, like the existing `styles.test.ts` does).
- [ ] **Step 3: run** → FAIL.
- [ ] **Step 4: implement** — remove every pinned `dark`; make each surface theme-driven. Where a component relied on the dark wash (`bg-signal-muted/10`), give it a token that resolves per theme. Hero/map canvas: derive stroke/fill from the resolved CSS variables (read them at draw time) instead of hardcoding `#3ae0c4`, so the ambient map works on white. Charts/choropleth already read `--color-chart-*` (both ramps exist) — verify they're legible in light.
- [ ] **Step 5:** browser check at 1280px AND 375px, **light and dark**: every page (home, /live, about, projects, project detail) legible, on-brand, no aqua-on-white text, no invisible map. Report with evidence.
- [ ] **Step 6:** gate → PASS. **Commit** — `feat(web): a real light theme (drop every pinned dark)`

---

### Task 2: Mobile nav = bottom sheet; language toggle fixed

**Files:** `components/nav/top-nav.tsx`, `components/i18n/language-toggle.tsx`, `components/theme-toggle.tsx` (consistency), `i18n/locales/{en,pt-BR}/nav.json`
**Test:** `top-nav.test.tsx`, `language-toggle.test.tsx`

- [ ] **Step 1: failing test** — the mobile menu renders as a **bottom** sheet (`side="bottom"`) with rows ≥44px; the language control offers **localized, non-truncating** labels ("English" / "Português") and switching updates `i18n.language` + `<html lang>`.
- [ ] **Step 2: run** → FAIL.
- [ ] **Step 3: implement** —
  - `top-nav.tsx`: `SheetContent side="bottom"` with a rounded top, a grab affordance, and full-width rows (≥44px, generous spacing) for Home/About/Projects/Live/Contact + CV. Keyboard + focus preserved.
  - `language-toggle.tsx`: replace the hardcoded `'EN'`/`'Português'` with **localized, consistent** labels (new `nav:languageEn` / `nav:languagePt` keys, en+pt-BR parity), `whitespace-nowrap` so nothing splits into "E"/"N", a visible check/`aria-current` on the active one, and a ≥44px row. On mobile, prefer the same bottom-sheet treatment as the menu (consistency) or a properly sized popover — pick one and justify.
- [ ] **Step 4:** browser check at 375px (both themes): open the menu, open the language control, switch language. Report.
- [ ] **Step 5:** gate → PASS. **Commit** — `fix(web): bottom-sheet mobile menu + localized language toggle`

---

### Task 3: Hero CTAs, pulse placement, mobile rhythm

**Files:** `components/home/hero.tsx`, `components/home/{engineering-showcase,send-pulse}.tsx`, `routes/index.tsx`
**Test:** `hero.test.tsx`, `send-pulse.test.tsx`

- [ ] **Step 1: failing test** — every hero CTA is ≥44px tall; the hero exposes at most 2 primary CTAs on mobile (the rest demoted/secondary) so they don't wrap raggedly; `SendPulse` sits **above the fold of its own section** (assert its position relative to the section start, or that it precedes the diagram in DOM order).
- [ ] **Step 2: run** → FAIL.
- [ ] **Step 3: implement** —
  - Hero: keep **2 primary actions** prominent on mobile ("Ver os projetos" + "Pergunte à IA"); demote CV/About to a quieter row or a text link. All ≥44px; full-width or evenly-sized on mobile so there's no ragged wrap.
  - Pulse: move it **up** — it should read as the section's call to action next to the heading (before/above the diagram on mobile), not buried after it. Align it to the section's content rhythm (same left edge/width behavior as neighbors; full-width on mobile is fine).
  - Tighten the vertical rhythm on mobile (the dead space the owner hit): consistent section padding, no orphan gaps.
- [ ] **Step 4:** browser check at 375px (both themes) of the hero + showcase. Report.
- [ ] **Step 5:** gate → PASS. **Commit** — `fix(web): hero CTA hierarchy, pulse placement, mobile rhythm`

---

### Task 4: Full verification sweep

- [ ] **Step 1:** 375px and 1280px, **light and dark**, every page: home, /live, about, projects, a project detail. Check: no pinned-dark leftovers, no aqua-on-white text, no ragged CTA wrap, menu = bottom sheet, language labels correct, pulse visible without hunting, no element overlapping content, floating Ask trigger compact.
- [ ] **Step 2:** touch targets ≥44px on every interactive control (measure, don't assume).
- [ ] **Step 3:** a11y — one `<h1>` per page, focus visible in both themes, reduced-motion, controls announce state.
- [ ] **Step 4:** full gate (build + tsc + test) with output tails in the report.
- [ ] **Step 5: Commit** — `chore(web): mobile + light-theme verification sweep`

---

## Self-Review

**Coverage:** CTA wrap/size ✓(T3) · dead space + buried pulse + alignment ✓(T3) · bottom-sheet menu ✓(T2) · language labels/truncation ✓(T2) · theme actually working ✓(T1) · verification that this time it's checked on a real viewport ✓(every task + T4).

**Placeholder scan:** token names, file lists, the `side="bottom"` change, the label keys, and the measurable assertions (44px, contrast ratios, DOM order) are all concrete.

**Type consistency:** the new signal tokens are CSS variables consumed via Tailwind utilities; `nav:languageEn|languagePt` are new i18n keys used only by the toggle; no new TS types.
