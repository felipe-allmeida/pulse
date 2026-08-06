# Site-wide "signal" Redesign + Contact + AI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax. Visual execution follows the signed-off mockup + the frontend-design skill; this plan locks structure, data, i18n keys, invariants, and tests.

**Goal:** Unify the whole site (About, Projects, nav/AppShell, Ask widget, CV/toggles) into the home's "signal" design language, add recruiter contact CTAs (Calendly · Email · LinkedIn · WhatsApp), and upgrade the AI assistant (enriched/accurate `profile.md` + higher token cap + prompt tuning).

**Architecture:** Extract shared "signal" primitives from the home work; re-skin the About/Projects/nav/Ask components using them; add a contact-CTA component fed by config in `content/profile.ts`; touch the backend Ask for the token cap + prompt. Everything localized (en/pt-BR), a11y + reduced-motion, invariants preserved.

**Tech Stack:** React 19 + Vite + TanStack Router + shadcn + Tailwind v4 + react-i18next + vitest; .NET 10 Ask endpoint + xUnit.

## Global Constraints

- **pnpm; TS strict, no `any`.** Signal accent via the existing `@theme inline` tokens (add `--color-signal-foreground`). English + pt-BR for all new copy (key parity); content from `profile`/config; proper nouns/tech names untranslated.
- **Projects confidentiality invariant is STRUCTURAL and unchanged** — `pulse` public (links), `ulbra-atende`/`ulbra-one` private (NO link, in either locale); keep `content.test.ts` + the card's visibility gate; the redesign changes only presentation.
- **a11y:** exactly one `<h1>` per page; decorative avatars/icons `aria-hidden`; contact/social links new-tab + `rel="noreferrer"`; `prefers-reduced-motion` freezes motion (reuse `useReducedMotion`); visible focus.
- **AI:** real data only — Felipe fills `profile.md` blanks in the branch before merge; unfilled → "ask Felipe directly", never invented. Do NOT weaken the grounding/guardrail/injection-resistance/language rules.
- **Hard gate every task:** `pnpm -C web build` + `pnpm -C web exec tsc --noEmit` + `pnpm -C web test` green; backend-touching tasks also `dotnet build` + `dotnet test` (check `pgrep -f "dotnet test"` first — shared machine). TDD where practical.

---

### Task 1: Signal design-system primitives + contact config

**Files:**
- Create: `web/src/components/signal/{section-eyebrow,chip,status-pill,contact-buttons}.tsx` (or `components/ui/`), `web/src/i18n/locales/{en,pt-BR}/contact.json` (or reuse `common`)
- Modify: `web/src/styles.css` (add `--color-signal-foreground`), `web/src/content/profile.ts` (add `contact` config: calendly URL [blank/placeholder], whatsapp, email, linkedin), `web/src/i18n/index.ts` (register any new ns)
- Test: `web/src/components/signal/*.test.tsx`

**Interfaces:**
- Produces: `SectionEyebrow`, `Chip`, `StatusPill`, `ContactButtons`; `profile.contact`.

- [ ] **Step 1: token** — add `--color-signal-foreground` (dark, e.g. `#05201b`) to the `@theme inline` map; a `text-signal-foreground`/`bg-signal` utility pair is usable (replaces the raw `text-zinc-950` from the home hero — update that usage too).
- [ ] **Step 2: contact config** — in `content/profile.ts` add `contact: { calendly: string; email: string; linkedin: string; whatsapp: string }` (email `contato@felipealmeida.tech`, linkedin `https://www.linkedin.com/in/felipe-allmeida`, whatsapp `https://wa.me/5551983468863`, calendly `''` placeholder — Felipe fills). Add i18n keys: `contact.bookCall`/`email`/`linkedin`/`whatsapp`/`heading`/`statusOpen` (en + pt-BR).
- [ ] **Step 3: failing tests** — `contact-buttons.test.tsx`: renders 4 links with the right hrefs (`mailto:contato@…`, the LinkedIn/WhatsApp URLs, the Calendly URL), all `target="_blank" rel="noreferrer"`; a Calendly-blank case hides/disables that button gracefully. `status-pill.test.tsx`: renders the localized "Available now" text and is `data-motion` reduced-motion aware.
- [ ] **Step 4: run** → FAIL.
- [ ] **Step 5: implement** the 4 primitives (signal styling from the mockup — mono eyebrow, mono chip, aqua pulsing status pill w/ `useReducedMotion`, contact CTA row with Calendly primary). No `any`.
- [ ] **Step 6: run** → PASS; build + tsc clean.
- [ ] **Step 7: commit** — `feat(web): signal design-system primitives + contact config`

---

### Task 2: About page in the signal language

**Files:**
- Modify: `web/src/components/about/{about-hero,experience-timeline,skill-groups,social-links,about-page}.tsx`
- Test: `web/src/routes/about.test.tsx` (extend)

**Interfaces:** Consumes `StatusPill`/`Chip`/`ContactButtons`/`SectionEyebrow` (Task 1), `profile` (localized), `useLocalized`.

- [ ] **Step 1: failing test** — About renders (via `renderWithI18n`): the status pill text, exactly one `<h1>` (name), a localized experience org (e.g. `Kota.io`), a localized skill chip, and the 4 contact CTAs with correct hrefs; pt-BR variant shows a pt-BR string.
- [ ] **Step 2: run** → FAIL.
- [ ] **Step 3: implement** — re-skin per the mockup: `about-hero` (StatusPill + initials-avatar signal frame + h1 + mono-aqua role + bio + `CvButton`), `experience-timeline` (left-rule aqua-node timeline, `role · **org**`, mono meta, summary), `skill-groups` (mono group label + `Chip` rows), `social-links` → the "Get in touch" `ContactButtons` block. `about-page` composes in the signal layout; keep one `<h1>`, `aria-hidden` avatar, reduced-motion.
- [ ] **Step 4: run** → PASS; build + tsc clean.
- [ ] **Step 5: commit** — `feat(web): redesign About in the signal language + contact`

---

### Task 3: Projects page in the signal language (invariant preserved)

**Files:**
- Modify: `web/src/components/projects/project-card.tsx`, `web/src/routes/projects.tsx`, `web/src/content/projects.ts` (extend `Project` with detail content)
- Create: `web/src/routes/projects.$slug.tsx` (dedicated per-project page), `web/src/components/projects/project-detail.tsx`
- Test: `web/src/components/projects/project-card.test.tsx` (extend), `web/src/routes/project-detail.test.tsx` (new)

**Interfaces:** Consumes `Chip`/`SectionEyebrow`, `projects` (localized), `useLocalized`. Produces the `/projects/$slug` route.

**Project content extension:** add to `Project` a `detail` block for the dedicated page — e.g. `highlights: LocalizedString[]` (2–5 bullet points) and/or a longer `overview: LocalizedString`. Draft en + pt-BR: for `pulse` from public facts; for `ulbra-atende`/`ulbra-one` **high-level only** (product/role/stack — no proprietary/internal detail, same confidentiality bar as the description). Mark the Ulbra detail copy for Felipe's review in the report.

- [ ] **Step 1: failing tests** —
  - `project-card.test.tsx`: each card is a **link to `/projects/<slug>`** (the whole card navigates to its detail page); public `pulse` shows its external links (GitHub/live) AND the detail link; a private card (`ulbra-atende`) shows the detail link + the "Private" indicator but **NO external/repo link** (`queryByRole('link')` for a repo/github href absent), in BOTH locales; a tech `Chip` renders; `pulse` is the featured card.
  - `project-detail.test.tsx`: rendering the `/projects/$slug` component for `pulse` shows name, overview/highlights, tech chips, and the external links; for `ulbra-atende` (private) shows the high-level detail + "Private" indicator and **NO external/repo link** (invariant on the detail page too), in both locales; an unknown slug renders a not-found state (no crash). One `<h1>` (the project name) per detail page.
- [ ] **Step 2: run** → FAIL.
- [ ] **Step 3: implement** —
  - Extend `projects.ts` with the `detail` content (en/pt-BR; Ulbra high-level).
  - Signal `project-card`: screenshot slot (glow for featured `pulse`), title + mono-aqua tagline, description, tech `Chip`s, role/period line; **the whole card links to `/projects/<slug>`**; external links (GitHub/live) shown only under `visibility === 'public'`, else the muted "🔒 Private" indicator — **the visibility gate is unchanged**.
  - `projects.tsx`: `SectionEyebrow` + responsive grid, `pulse` featured (wide); one `<h1>`.
  - `routes/projects.$slug.tsx` + `project-detail.tsx`: look up the project by `slug` from `projects`; render the signal detail page (hero with name/tagline/tech/role/period, overview + highlights, screenshot area, and — **only for `visibility:'public'`** — the external links; private → "Private" indicator, no link). Unknown slug → a localized not-found (link back to `/projects`). One `<h1>`.
- [ ] **Step 4: run** → PASS (incl. `content.test.ts` invariant untouched); `pnpm -C web build` (routeTree regenerates the new route) + tsc clean.
- [ ] **Step 5: commit** — `feat(web): redesign Projects + dedicated per-project pages`

---

### Task 4: Nav / AppShell + CV button + Contact nav

**Files:**
- Modify: `web/src/components/app-shell.tsx`, `web/src/components/nav/{top-nav,cv-button}.tsx`
- Test: `web/src/components/nav/top-nav.test.tsx` (extend), `app-shell.test.tsx`

- [ ] **Step 1: failing test** — the nav renders the signal header (wordmark + Home/About/Projects/**Contact** links, active highlight, PT/EN + theme toggles, the "Ask the AI" trigger that opens the shared store); the mobile Sheet lists the same incl. Contact + CV; `top-nav` still one nav landmark set. Contact link points to the contact anchor/route.
- [ ] **Step 2: run** → FAIL.
- [ ] **Step 3: implement** — re-skin `app-shell` header + `top-nav` (signal look, the aqua-dot wordmark, mono toggles, Ask CTA via `useAskWidgetStore`), add the **Contact** nav item (anchor to the About contact block — e.g. `/about#contact`, or a scroll), restyle `cv-button` to the signal button (keep download). Keep `ConnectionStatus`/`PresenceBadge` (restyled to fit). Mobile Sheet adopts the look. Add `contact.nav` i18n key (en/pt-BR).
- [ ] **Step 4: run** → PASS; build + tsc clean.
- [ ] **Step 5: commit** — `feat(web): signal nav/app-shell + CV button + Contact`

---

### Task 5: Ask widget restyle

**Files:**
- Modify: `web/src/components/ask/ask-widget.tsx`
- Test: `web/src/components/ask/ask-widget.test.tsx` (keep green; add a style-agnostic assertion if useful)

- [ ] **Step 1:** confirm the existing behavior tests (open via shared store, streamed chunks, suggested questions, disclaimer, mobile sheet) still describe the intended behavior; adjust selectors only if the restyle renames text.
- [ ] **Step 2: implement** — restyle the floating trigger + panel/sheet to the signal aesthetic (dark, aqua accent, mono affordances, `Chip`-style suggested questions) matching the mockup. Behavior unchanged (streaming, abort, `aria-live`, focus management, the shared open-store). No `any`.
- [ ] **Step 3: run** → PASS; build + tsc clean.
- [ ] **Step 4: commit** — `feat(web): restyle Ask widget to the signal language`

---

### Task 6: AI enrichment — profile.md + token cap + prompt

**Files:**
- Modify: `src/Pulse.Api/Assistant/profile.md`, `src/Pulse.Api/Assistant/AskOptions.cs`, `src/Pulse.Api/Assistant/AskMessageBuilder.cs`
- Test: the existing ask/AskMessageBuilder tests (extend)

- [ ] **Step 1:** replace `profile.md` with the enriched, accurate version (structure: Status/open-to, Location & remote, Languages & work authorization, Experience with per-role impact, Skills, Projects, Contact, FAQ). Keep the `[PREENCHER]` blanks that need Felipe's real data (availability specifics, target roles, achievements/metrics, tenure, EN level, work auth, Calendly) — **flag in the report that Felipe fills these before merge**; the FAQ answers "ask Felipe directly" for anything blank. Correct the stale facts (NOT "Kota current"; available now; freelance via Pampa Devs).
- [ ] **Step 2: failing backend test** — `AskMessageBuilder` still includes the profile text + grounding + guardrail + injection-resistance + the language instruction (unchanged); the style instruction now asks for fuller/structured answers (assert the new phrasing present). `AskOptions.MaxOutputTokens` default is `800`.
- [ ] **Step 3: run** → FAIL.
- [ ] **Step 4: implement** — bump `AskOptions.MaxOutputTokens` 400 → 800; in `AskMessageBuilder` extend the style line to request substantive, well-structured answers (concise but specific; short lists where useful; cite specifics from the profile) WITHOUT weakening grounding/guardrail/language rules (append/adjust the style clause only).
- [ ] **Step 5: run** → PASS; `dotnet build` + `dotnet test` (pgrep check first) + the web gate green.
- [ ] **Step 6: commit** — `feat(api): enrich assistant profile + raise answer cap + tune prompt`

---

### Task 7: Cross-page polish + responsive/a11y + full verification

**Files:** any of the above for polish.

- [ ] **Step 1:** verify the whole site reads as one language (spot the pages); the home's shared primitives (chips/eyebrow) now come from Task 1's extracted versions with no duplication/drift — dedupe if the home still has local copies.
- [ ] **Step 2: responsive** — nav → Sheet on mobile; About grid stacks; Projects single-column; contact CTAs wrap; the featured project card behaves.
- [ ] **Step 3: a11y** — exactly one `<h1>` per page (Home/About/Projects); `aria-hidden` on decorative avatars/icons; new-tab links `rel="noreferrer"`; keyboard nav + visible focus; `prefers-reduced-motion` freezes the status-pill pulse + any motion.
- [ ] **Step 4: full gate** — `pnpm -C web build` + `tsc --noEmit` + `pnpm -C web test`; `dotnet build` + `dotnet test`.
- [ ] **Step 5: commit** — `chore(web): site-redesign responsive + a11y polish`

---

## Self-Review

**Spec coverage:** signal primitives + `--color-signal-foreground` + contact config ✓(T1) · About redesigned + contact ✓(T2) · Projects redesigned, invariant preserved ✓(T3) · nav/AppShell/CV + Contact ✓(T4) · Ask restyle ✓(T5) · AI enrichment (profile.md + cap 800 + prompt) ✓(T6) · one-language coherence + responsive + a11y + reduced-motion ✓(T7) · i18n en/pt-BR throughout · real-data-only for AI (blanks → "ask Felipe") ✓(T6, constraint).

**Placeholder scan:** the `[PREENCHER]` blanks are intentional content Felipe fills before merge (flagged), not code placeholders; component contracts, hrefs, i18n keys, and tests are concrete. Visual execution follows the approved mockup + frontend-design.

**Type consistency:** the T1 primitives (`SectionEyebrow`/`Chip`/`StatusPill`/`ContactButtons`) + `profile.contact` are consumed by T2–T5; the confidentiality gate keys on `visibility` (unchanged); `MaxOutputTokens` default changes once (T6, 800) — backend tests updated in the same task.
