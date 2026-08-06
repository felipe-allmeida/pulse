# Visual Coherence Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax. Apply the **frontend-design** skill for visual work.

**Goal:** Make the whole site read as ONE product and serve its actual job — a personal portfolio and social proof — by killing the second visual system (the old blue dashboard), disciplining typography/accent use, decluttering the header, and giving the live system a compact "proof" role instead of half the home page.

**Context (diagnosed on the live site):** the home is 4068px; the first ~1800px are the "signal" language (dark, aqua, mono) and the next 2126px ("Painel ao vivo") are still the OLD design — grey `bg-card` cards, **blue** sparklines/choropleth/area chart, sans labels. Plus: the floating Reactions card covers hero content; prose is set in monospace green; the header carries 4 competing green elements and 3 separate "Ask the AI" entry points; the Projects page is dominated by 3 giant empty "screenshot coming" boxes; the featured card has an oversized neon glow.

**Architecture:** Reuse the existing `components/signal/*` primitives and signal tokens. The single highest-leverage fix: `--chart-1` in dark mode is `220 70% 50%` (blue) and feeds `stat-card`, `live-map`, `visits-chart` — repointing the data-viz palette at the signal aqua fixes the blue everywhere at once.

## Global Constraints

- **pnpm; TS strict, no `any`.** Reuse `components/signal/*` (Pill/StatusPill/Chip/SectionEyebrow/SubsectionHeading/ContactButtons) — do not create parallel variants.
- **Typography rule (site-wide):** monospace is for DATA, labels, eyebrows, counters, code-ish affordances. **Prose that is meant to be read** (hero hook, taglines, bios, project descriptions, section body copy) is sans. Fix violations as you touch each area.
- **Accent rule:** aqua (`signal`) is an accent, not a body color — at most ~2 aqua emphases per viewport. Semantic colors (success/warn/error) stay separate from the accent.
- **Do NOT change:** the Projects public/private confidentiality invariant, the realtime backend, the AI prompt/profile, or i18n copy meaning. en/pt-BR key parity for any new key.
- **a11y:** exactly one `<h1>` per page; decorative elements `aria-hidden`; `prefers-reduced-motion` honored (reuse `useReducedMotion`); contrast AA on dark; keyboard-navigable, visible focus.
- **Hard gate every task:** `pnpm -C web build` (0) + `pnpm -C web exec tsc --noEmit` (clean) + `pnpm -C web test` (all green). TDD where practical.

---

### Task 1: Data-viz + dashboard widgets → signal (kill the blue)

**Files:**
- Modify: `web/src/styles.css` (data-viz palette in the dark theme), `web/src/components/{stat-card,kpi-row,live-map,visits-chart,recent-visits-table,event-feed,reactions,connection-status,presence-badge}.tsx`
- Test: the affected component tests (keep green; add an assertion that the chart color token is the signal-based one, not the old blue)

- [ ] **Step 1: repoint the data-viz palette** — in `web/src/styles.css`, the dark-theme `--chart-1: 220 70% 50%` (blue) is the source of every blue in the app (`stat-card` sparkline, `live-map` choropleth + points, `visits-chart` area). Repoint the data-viz ramp to the signal family (e.g. `--chart-1` = the signal aqua in HSL, `--chart-2..5` = supporting muted steps of the same family / neutral tints) so charts read as one system. Keep the light theme coherent too. Do NOT hardcode hex in components — they already use `var(--color-chart-1)`.
- [ ] **Step 2: re-skin the widget shells** — the dashboard cards still use the default `bg-card`/`rounded-xl border` look while the rest of the site uses the signal panel treatment. Bring them in line: panel background/border consistent with `signal` surfaces, **mono for numbers/labels/axis ticks** (`tabular-nums` where digits align), sans for any sentence-length copy, section titles via `SubsectionHeading`/`SectionEyebrow` where they're acting as headings.
- [ ] **Step 3:** `live-map` choropleth + points, `visits-chart` area/stroke, `stat-card` sparkline all read from the repointed tokens (verify no leftover blue anywhere: grep for `chart-1` usages and for any hardcoded blue).
- [ ] **Step 4:** run the gate → PASS. **Commit** — `feat(web): repoint data-viz palette + re-skin dashboard widgets to signal`

---

### Task 2: Home structure — live proof, not an ops console

**Files:**
- Modify: `web/src/routes/index.tsx`; create `web/src/routes/live.tsx` (the full panel) + i18n keys
- Test: `web/src/routes/index.test.tsx` (update), a small test for the new route

- [ ] **Step 1: failing test** — the home renders the hero + showcase + a COMPACT live-proof block (online + map + recent activity) and a link to the full panel; it no longer renders the full widget stack (assert e.g. the visits chart / recent-visits table are NOT on the home); `/live` renders the full panel with one `<h1>`.
- [ ] **Step 2: run** → FAIL.
- [ ] **Step 3: implement** — move the full dashboard (KpiRow + LiveMap + RecentVisitsTable + VisitsChart + EventFeed) to a new `/live` route (localized heading, one `<h1>`, `SectionEyebrow`); on the home keep a compact, portfolio-grade proof block: the live map (or a smaller version) + 2–3 real stats + the event stream, plus a "see the full panel" link to `/live`. Add `/live` to the nav (or link it from the showcase — pick one and keep the header from growing; if nav, replace nothing else). `useVisitFeed()` stays mounted where the feed is consumed.
- [ ] **Step 4: Reactions placement** — the floating Reactions card currently overlaps hero content at desktop widths (bottom-left sits on top of the hero CTAs since the hero is full-height). Move it so it can never cover hero/primary content: dock it inside the live-proof block (preferred — it's part of the live demo, not chrome), or keep it floating but only on `/live`. Keep the Ask trigger as the only bottom-right floating element.
- [ ] **Step 5:** gate → PASS. **Commit** — `feat(web): compact live proof on home, full panel at /live`

---

### Task 3: Typography & accent discipline

**Files:**
- Modify: `web/src/components/home/{hero,engineering-showcase}.tsx`, `web/src/components/about/{about-hero,experience-timeline}.tsx`, `web/src/components/projects/{project-card,project-detail}.tsx` (and any other prose set in mono)
- Test: keep existing tests green (adjust selectors only if text nodes move)

- [ ] **Step 1: audit** — list every place prose is set in monospace and/or aqua: the hero hook, the About tagline, project taglines, any body copy. (Mono/aqua stay for: eyebrows, chips, counters, stat labels, axis ticks, the status pill, event-stream rows, arch-diagram labels.)
- [ ] **Step 2: implement** — set prose in sans with a proper reading measure (~65ch) and normal weight/leading; keep ONE aqua emphasis per block at most (e.g. the role line OR the tagline, not both). In the About hero specifically, collapse the current 4-way stack (sans name → mono aqua role → mono green tagline → sans grey bio) into a clear hierarchy: name (display sans), role (sans, muted or a single aqua), bio (sans, readable measure).
- [ ] **Step 3:** gate → PASS. **Commit** — `feat(web): typography + accent discipline (mono for data, sans for prose)`

---

### Task 4: Header declutter

**Files:**
- Modify: `web/src/components/app-shell.tsx`, `web/src/components/nav/top-nav.tsx`, `web/src/components/{connection-status,presence-badge}.tsx`
- Test: `top-nav.test.tsx` / `app-shell.test.tsx` (update)

- [ ] **Step 1: failing test** — the header renders ONE live indicator (connection + online count combined) and the Ask entry point appears once in the header; the nav links + toggles remain; the mobile Sheet still works.
- [ ] **Step 2: run** → FAIL.
- [ ] **Step 3: implement** — merge `ConnectionStatus` + `PresenceBadge` into a single compact live indicator (e.g. one pill: a status dot + "N online", with the connection state expressed by the dot/tooltip rather than a second badge). Keep exactly one "Ask the AI" affordance in the header (the floating trigger + the hero CTA remain elsewhere — that's 2 total on the home, down from 3; if the floating trigger and the header button feel redundant, keep the floating one and drop the header button — decide and note it). Reduce competing aqua in the header to at most 2 elements.
- [ ] **Step 4:** gate → PASS. **Commit** — `feat(web): declutter header (single live indicator, single Ask entry)`

---

### Task 5: Projects — no empty-placeholder dominance

**Files:**
- Modify: `web/src/components/projects/{project-card,project-screenshot,project-detail}.tsx`
- Test: `project-card.test.tsx` / `project-detail.test.tsx` (update; keep the confidentiality assertions intact)

- [ ] **Step 1: failing test** — a project WITHOUT a `screenshot` renders no giant empty media box (assert the placeholder box is absent or replaced by the compact treatment); a project WITH a `screenshot` renders the image with meaningful `alt`. The private/public link invariant assertions stay green.
- [ ] **Step 2: run** → FAIL.
- [ ] **Step 3: implement** — when there's no screenshot, drop the big empty box: use a compact card (content-led: name, tagline, description, chips, role) optionally with a subtle signal texture/gradient strip instead of a 300px void. Wire the existing `screenshot?` field so dropping in a real image "just works". Tame the featured glow (subtle, not a neon halo).
- [ ] **Step 4:** gate → PASS. **Commit** — `feat(web): content-led project cards (no empty placeholder boxes)`

---

### Task 6: Cross-page polish + full verification

- [ ] **Step 1:** walk every page (Home, /live, About, Projects, a project detail) and confirm ONE visual system: no blue left, panels/typography consistent, aqua used as an accent only.
- [ ] **Step 2: responsive** — 375 / 768 / 1280: nav Sheet, home proof block, /live panel, About stack, Projects grid, project detail; no floating element covers content at any width.
- [ ] **Step 3: a11y** — one `<h1>` per page (incl. the new `/live`), decorative `aria-hidden`, reduced-motion, contrast AA, keyboard + visible focus.
- [ ] **Step 4: full gate** — `pnpm -C web build` + `tsc --noEmit` + `pnpm -C web test`; paste output tails into the report.
- [ ] **Step 5: Commit** — `chore(web): visual coherence polish + verification`

---

## Self-Review

**Coverage of the diagnosis:** blue/second-system in the dashboard ✓(T1) · dashboard dominating the home + Reactions covering the hero ✓(T2) · mono prose + aqua overload ✓(T3) · header clutter + 3 Ask entry points ✓(T4) · empty-placeholder dominance + neon glow ✓(T5) · one-system verification + responsive/a11y ✓(T6).

**Placeholder scan:** the visual execution follows the established signal language + frontend-design (deliberate latitude); the token repoint, file lists, structural moves, and test targets are concrete.

**Type consistency:** no new content types; `/live` is a new route consuming the existing widgets unchanged; the signal primitives are reused, not forked.
