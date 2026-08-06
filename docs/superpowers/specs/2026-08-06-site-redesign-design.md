# Pulse — Site-wide Redesign ("signal" language) + Contact + AI enrichment — Design Spec

- **Status:** Approved design (mockup signed off), pending implementation plan
- **Date:** 2026-08-06
- **Scope:** Frontend redesign of the whole site into the "signal" design language the home already uses (so About/Projects/nav/Ask stop looking "old"), a recruiter contact section (Email · LinkedIn · WhatsApp · Calendly), and an AI-assistant content/behavior upgrade (richer, accurate `profile.md` + higher token cap + prompt tuning). One small backend touch (the Ask token cap/prompt); no realtime/deploy change.

---

## 1. Purpose

The home redesign introduced a distinctive dark **"signal"** language (aqua accent `#3AE0C4`, mono for data, immersive dark), but About/Projects/the nav/the Ask widget still use the earlier portfolio look — the site is now visually inconsistent. This unifies **every page** into one language, adds a **contact/proposal** path recruiters can act on, and makes the **AI assistant** actually useful to recruiters (its answers are only as good as `profile.md`, which is currently thin and stale — it still says Kota is current and "I don't know" about availability).

---

## 2. Decisions (locked)

- **One design language everywhere** — the signal system (aqua accent, mono for data/labels, dark treatment, the type/spacing scale) is applied to About, Projects, the nav/`AppShell`, the Ask widget, and the CV/toggle controls. Consolidate the reusable pieces into shared primitives rather than copy-paste.
- **Contact = simple CTAs** (no backend form): **Book a call (Calendly)** · **Email** (`contato@felipealmeida.tech`) · **LinkedIn** (`felipe-allmeida`) · **WhatsApp** (`wa.me/5551983468863`). New-tab, localized, on the About page + a nav "Contact" affordance (anchor/section). Calendly URL is a config value Felipe supplies.
- **AI enrichment:** rewrite `profile.md` — accurate (available now, freelance via Pampa Devs, staff/Head-CTO positioning) and recruiter-oriented (availability + what he's looking for, location + remote/relocation, achievements w/ impact, languages + work authorization). **Real data only** — Felipe fills the `[PREENCHER]` blanks in the branch before merge; anything still blank the assistant answers "ask Felipe directly," never invents. Raise `Ask:MaxOutputTokens` 400 → 800 and tune the system prompt for fuller, structured answers.
- **Preserve invariants:** Projects keep the public/private confidentiality invariant (pulse public with links; `ulbra-atende`/`ulbra-one` private, no links) — structural, test-guarded; the redesign changes only presentation. Exactly one `<h1>` per page; `prefers-reduced-motion` honored; i18n (en/pt-BR) for all new copy.
- **Reuse over rebuild** — the home's signal components (chips, section eyebrow, stat-tile treatment, the `signal` token, `useLocalized`/`useReducedMotion`) are the source; extract shared primitives from them.

---

## 3. Design system (shared primitives)

Consolidate into `web/src/components/ui/` (or `components/signal/`) so every page uses the same pieces:
- **`SectionEyebrow`** — the mono, upper-tracked `/about` `/projects` label.
- **`Chip`** — the mono tech/skill chip (already de-facto in hero/showcase — extract one).
- **`StatusPill`** — the aqua "● Available now · …" pill (pulsing dot, reduced-motion static).
- **`ContactButtons`** — the CTA row (Calendly primary + Email/LinkedIn/WhatsApp), localized, new-tab, `rel="noreferrer"`.
- Card / panel treatment, the timeline node style, and the avatar-initials block become the About/Projects building blocks.
- Tokens: the existing `--color-signal` / `--color-signal-muted` (in `@theme inline`) drive accents; add a `--color-signal-foreground` (dark text on aqua) to kill the raw `text-zinc-950` from the home task. Keep semantic tokens for the rest.

---

## 4. Pages & components

### 4.1 About (`routes/about.tsx` + `components/about/*`)
- **`about-hero.tsx`** — `StatusPill` ("Available now · open to Staff / Principal · Head of Eng / CTO"), the initials avatar in the signal frame, `<h1>` name, mono-aqua role/positioning, bio. (Photo drop-in path preserved.)
- **`experience-timeline.tsx`** — the signal timeline: a left rule with aqua nodes, `role · **org**` (org in aqua), a mono period/meta line, the summary. Data from `profile` (localized).
- **`skill-groups.tsx`** — grouped chip rows (mono group label + `Chip`s).
- **`social-links.tsx` → contact** — replaced/extended by `ContactButtons` (Calendly · Email · LinkedIn · WhatsApp). Add a "Get in touch" block.
- `about-page.tsx` composes them in the signal layout; one `<h1>`.

### 4.2 Projects (`routes/projects.tsx` + `components/projects/project-card.tsx`)
- **`project-card.tsx`** — the signal card: screenshot slot (glow for the featured `pulse`), title + mono-aqua tagline, description, tech `Chip`s, a role/period line, and links **only for public** projects (`visibility:'public'`) / a muted "🔒 Private" indicator for private ones. **The `visibility` gate is unchanged** — private cards render no link in any locale. `pulse` is the featured (wide) card.
- Projects route: `SectionEyebrow` + responsive grid; one `<h1>`.

### 4.3 Nav / AppShell (`components/app-shell.tsx`, `components/nav/*`)
- Refresh the header to the signal nav: the wordmark with the aqua dot, the links (Home · About · Projects · **Contact**), the mono PT/EN + theme toggles, and the "Ask the AI" button (opens the shared Ask store). Keep the live `ConnectionStatus`/`PresenceBadge` (restyled to fit) — this is a live system, the header can show it tastefully. Mobile Sheet menu adopts the same look.
- **`cv-button.tsx`** — restyle to the signal button; keep the download behavior.
- "Contact" nav item scrolls to / routes to the contact block (an anchor on About, or a small section).

### 4.4 Ask widget (`components/ask/ask-widget.tsx`)
- Restyle the floating trigger + panel/sheet to the signal aesthetic (dark, aqua accent, mono affordances) so it matches. Behavior unchanged (streaming, suggested questions, disclaimer, the shared open-store from the home task). Keep a11y (focus, `aria-live`).

### 4.5 AI (`src/Pulse.Api/Assistant/*`)
- **`profile.md`** — replace with the enriched, accurate version (the drafted structure with Felipe's real data filled into the `[PREENCHER]` blanks in the branch; blanks that remain → the FAQ answers "ask Felipe directly").
- **`AskOptions.cs`** — `MaxOutputTokens` 400 → 800.
- **`AskMessageBuilder.cs`** — tune the style instruction for fuller, well-structured answers (concise but substantive; use short lists where useful; cite specifics from the profile; still third-person, grounded, no fabrication, injection-resistant — do NOT weaken the grounding/guardrail/language rules). Backend tests updated (the builder still includes profile + guardrails; the new cap is respected).

---

## 5. Cross-cutting

- **i18n:** all new copy (status pill, contact labels, nav "Contact", any section headings) in en/pt-BR with key parity; content from `profile`. The AI prompt/`profile.md` stays English (the assistant answers in the user's locale via the existing locale instruction).
- **a11y:** exactly one `<h1>` per page; decorative avatars/icons `aria-hidden`; contact/social links new-tab + `rel="noreferrer"`; keyboard-navigable; visible focus; `prefers-reduced-motion` freezes the pill's pulse and any motion.
- **Responsive:** the mockup's breakpoints — nav collapses to the Sheet, About grid stacks, Projects grid single-column, contact CTAs wrap.
- **Config:** the Calendly URL + the WhatsApp number live in the content/config (e.g. `content/profile.ts` social/contact data), not hardcoded in JSX.

---

## 6. Testing

- **vitest + `renderWithI18n`:** About renders the status pill + one h1 + the localized timeline/skills + the four contact CTAs (correct hrefs: `mailto:`, LinkedIn, `wa.me/5551983468863`, the Calendly URL, all new-tab); Projects renders the public `pulse` card WITH links and the private Ulbra cards with NO link + the private indicator (the invariant, in both locales); the nav renders the signal header + Contact + the Ask trigger; the Ask panel opens via the shared store. Reduced-motion assertions where animated.
- **Backend (xUnit):** `AskMessageBuilder` still includes the profile + grounding/guardrail/injection-resistance + language instruction; `MaxOutputTokens` default is 800.
- **Hard gate:** `pnpm -C web build` + `tsc --noEmit` + `pnpm -C web test` green; `dotnet build` + `dotnet test` green (backend touched).

---

## 7. Scope (YAGNI)

**In:** the signal design applied to About/Projects/nav/AppShell/Ask/CV; shared primitives (eyebrow, chip, status pill, contact buttons); the contact CTAs (Calendly/Email/LinkedIn/WhatsApp); the enriched `profile.md` + token-cap + prompt tune; i18n + a11y + reduced-motion; tests. **Out:** a backend contact form / email service, a blog/CMS, new routes beyond an optional contact anchor, changing the realtime backend or the home (already redesigned — only harmonize shared primitives it exports), runtime-editable `profile.md` (still image-embedded — future), and any new AI capability (RAG, tools).

---

## 8. Success criteria

- Every page (Home already, + About, Projects, nav, Ask) reads as **one** product in the signal language — nothing looks left-behind.
- A recruiter can act: **Book a call / Email / LinkedIn / WhatsApp** are one click away, and the AI assistant answers substantive, accurate, recruiter-relevant questions (availability, what he's looking for, location/remote, achievements, languages/authorization) grounded in the corrected `profile.md`.
- The Projects confidentiality invariant is preserved (private cards, no links) in the new visual, both locales.
- One `<h1>` per page, responsive, accessible, reduced-motion honored; i18n en/pt-BR complete.
- All hard-gate checks green.
