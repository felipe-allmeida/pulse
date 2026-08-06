# Home Redesign (immersive portfolio landing) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. The visual execution follows the signed-off mockup and the frontend-design skill; this plan locks structure, data contracts, i18n keys, and tests.

**Goal:** Turn `/` into an immersive portfolio landing — a full-bleed hero with the live world-map of visitor presence as its animated background + Felipe's positioning + CTAs, then an engineering-showcase (real live stats, event stream, architecture diagram), with the existing dashboard kept below.

**Architecture:** New `web/src/components/home/*` components composed by `routes/index.tsx`; reuses existing data (`useMetrics`/`/api/metrics`, the `/api/map` points, the structured `PulseEvent` feed, the map projection) and `profile` content; a single aqua "signal" accent token; fully localized via a new `home` i18n namespace; reduced-motion + a11y throughout.

**Tech Stack:** React 19 + Vite + TanStack Router + shadcn + Tailwind v4 + react-i18next + Canvas/d3-geo + vitest.

## Global Constraints

- **pnpm; TS strict, no `any`.** Signal accent added via the Tailwind v4 `@theme inline` token map (NOT bare `:root` — that was a prior bug). English + pt-BR for all new copy (new `home` namespace, en/pt-BR key parity); content from `profile` (already `LocalizedString`); proper nouns/stack names untranslated.
- **Real metrics only** — no fabricated numbers (no p95 latency tile). Use `ActiveConnections`/`TotalVisits` + distinct countries/cities derived from the `/api/map` points.
- **a11y:** exactly one `<h1>` (the name); `HeroMap` canvas `aria-hidden`; keyboard-navigable CTAs with visible focus; `prefers-reduced-motion` freezes all animation to a static state; live updates polite.
- **Reuse, don't rebuild** the realtime backend or the existing dashboard widgets (kept below).
- **Hard gate every task:** `pnpm -C web build` + `pnpm -C web exec tsc --noEmit` + `pnpm -C web test` green. TDD where practical.

---

### Task 1: Signal token + Hero shell (content, CTAs, stack) — localized

**Files:**
- Create: `web/src/components/home/hero.tsx`, `web/src/i18n/locales/{en,pt-BR}/home.json`
- Modify: the web theme/token file (add the signal accent via `@theme inline`), `web/src/i18n/index.ts` (register `home` ns)
- Test: `web/src/components/home/hero.test.tsx`

**Interfaces:**
- Consumes: `profile` (`content/profile.ts`, localized via `useLocalized`), `useTranslation('home')`, `useMetrics()` (or the existing hook that exposes `activeConnections` — grep for how `KpiRow` gets it), `CvButton` (`components/nav/cv-button.tsx`), TanStack `Link`.
- Produces: `Hero`.

- [ ] **Step 1: signal token** — add `--color-signal` (`#3AE0C4`) + a muted variant to the Tailwind `@theme inline` map (find the existing token file; mirror how existing colors are declared). Verify a `text-signal`/`bg-signal` utility emits.
- [ ] **Step 2: home namespace** — create `locales/{en,pt-BR}/home.json` with keys: `live.online_one`/`_other` ("{{count}} online now" / "{{count}} online agora"), `hero.hook` ("You're one of {{count}} people here right now — and this page is a live distributed system, streaming presence, geolocation, and events in real time." / pt-BR mirror), `cta.projects`/`about`/`cv`/`ask`, and register `home` in `i18n/index.ts` (`ns` + `resources`).
- [ ] **Step 3: failing test** — `hero.test.tsx` via `renderWithI18n`: asserts the name (`profile.name`), the online pill text (mock the metrics hook → e.g. 7 → "7 online now"), a link to `/projects`, and (pt-BR) the pt-BR hook fragment.
- [ ] **Step 4: run** → FAIL.
- [ ] **Step 5: implement `hero.tsx`** — a full-bleed `<section>` (dark, `min-h-[85vh]`, relative), NO map yet (Task 2 adds the bg): the live pill (`home:live.online` with the live count), `<h1>` name, the title/tagline (localized `profile`), the hook (`home:hero.hook` with count), a CTA row — primary `Link` to `/projects` (signal bg), `Link` to `/about`, the reused `CvButton`, and an "Ask the AI about me" button that triggers the existing Ask widget (wire via the widget's open mechanism — grep `ask-widget.tsx` for how it opens; if it's self-contained, expose/trigger it; acceptable to scroll/focus it for now and note it), and the `HOME_STACK` chips. Semantic tokens + the signal accent; mono for pill/stack.
- [ ] **Step 6: run** → PASS; build + tsc clean.
- [ ] **Step 7: commit** — `feat(web): home hero shell (positioning + CTAs + stack), signal token`

---

### Task 2: HeroMap — ambient live world-map background

**Files:**
- Create: `web/src/components/home/hero-map.tsx`
- Modify: `web/src/components/home/hero.tsx` (mount `<HeroMap>` as the bg + veil)
- Test: `web/src/components/home/hero-map.test.tsx`

**Interfaces:**
- Consumes: the same map data/projection the existing `LiveMap` uses (read `web/src/components/live-map.tsx` — d3-geo/topojson world + presence/visit points; reuse its data hook or the `/api/map` points), `prefers-reduced-motion`.
- Produces: `HeroMap`.

- [ ] **Step 1: failing test** — `hero-map.test.tsx`: renders without crashing given mocked points, the container is `aria-hidden`, and under a mocked reduced-motion match it does not start the animation loop (assert a static render path — e.g. no `requestAnimationFrame` scheduled, or a `data-motion="static"` marker).
- [ ] **Step 2: run** → FAIL.
- [ ] **Step 3: implement `hero-map.tsx`** — an ambient, dimmed world map behind the hero text: reuse `LiveMap`'s projection + world topology to draw faint landmasses/graticule, plus glowing presence/visit points (the "you are here" origin emphasized with a pulsing halo) and a few sweeping arcs, at low opacity; a radial veil (`radial-gradient`) ensures text contrast. `aria-hidden`, `position:absolute inset-0`, pointer-events-none. `prefers-reduced-motion` → render a single static frame (no rAF loop). Prefer Canvas for the particle/arc animation (per frontend-design: Canvas over hand-authored SVG for generative/decorative motion).
- [ ] **Step 4: mount** in `hero.tsx` behind the overlay (z-index), keep the overlay legible.
- [ ] **Step 5: run** → PASS; build + tsc clean.
- [ ] **Step 6: commit** — `feat(web): ambient live world-map hero background`

---

### Task 3: Engineering showcase (stat tiles + event stream + architecture)

**Files:**
- Create: `web/src/components/home/engineering-showcase.tsx`, `web/src/components/home/stat-tiles.tsx`, `web/src/components/home/event-stream.tsx`, `web/src/components/home/architecture-diagram.tsx`
- Modify: `web/src/i18n/locales/{en,pt-BR}/home.json` (showcase + arch keys)
- Test: `web/src/components/home/engineering-showcase.test.tsx` (+ per-block asserts)

**Interfaces:**
- Consumes: the metrics hook (`ActiveConnections`, `TotalVisits`), the `/api/map` points (derive distinct countries + cities), the structured `PulseEvent` feed (`use-visit-feed`/the event store — reuse, don't refetch), `useTranslation('home')`, `useLocalized` where needed.
- Produces: `EngineeringShowcase` + sub-components.

- [ ] **Step 1: failing test** — via `renderWithI18n`: StatTiles render real values from mocked hooks (online, events/visits, countries, cities) formatted with `Intl` — and assert there is NO latency/fabricated tile; EventStream renders structured events with localized labels (pt-BR "Visita de {city}, {country}"); ArchitectureDiagram renders localized node labels (e.g. "API"/"Worker"); the section eyebrow is localized.
- [ ] **Step 2: run** → FAIL.
- [ ] **Step 3: implement**:
  - `stat-tiles.tsx` — 4 tiles (mono, `tabular-nums`, `Intl.NumberFormat(i18n.language)`): `home:stats.online` (ActiveConnections, live), `home:stats.events` (TotalVisits — truthful label), `home:stats.countries` + `home:stats.cities` (distinct from `/api/map`, labelled "recent"). No latency.
  - `event-stream.tsx` — reuse the structured `PulseEvent` feed; render the last ~5 with localized `t('home:event.visit'/'event.reaction', {...})` (or reuse the existing `dashboard:eventFeed.*` keys if identical — prefer reuse), newest-first, slide-in animation (reduced-motion static), a "● live" marker.
  - `architecture-diagram.tsx` — the horizontal flow (Web → API/SignalR·Redis → RabbitMQ → Worker → Postgres) with localized `home:arch.*` node labels + caption; an aqua signal pulse travels the edges (reduced-motion static). Horizontal scroll on overflow.
  - `engineering-showcase.tsx` — composes them under a localized eyebrow (`home:showcase.eyebrow`), responsive grid (stats + stream side-by-side on `lg`, arch full-width below).
- [ ] **Step 4: run** → PASS; build + tsc clean.
- [ ] **Step 5: commit** — `feat(web): engineering showcase (real stats, event stream, architecture)`

---

### Task 4: Compose the home route + responsive/a11y polish + verify

**Files:**
- Modify: `web/src/routes/index.tsx`
- Test: `web/src/routes/index.test.tsx` (extend)

- [ ] **Step 1: failing test** — `index.test.tsx` via `renderWithI18n`: the home renders the Hero (name + `/projects` CTA), the EngineeringShowcase eyebrow, AND the existing dashboard (e.g. a KPI/`LiveMap` marker still present); exactly one `<h1>`; under pt-BR a pt-BR string from the hero shows.
- [ ] **Step 2: run** → FAIL (home not composed yet).
- [ ] **Step 3: implement** — `routes/index.tsx`: `<Hero/>` → `<EngineeringShowcase/>` → a localized "Live dashboard" (`home:dashboard.heading`) section wrapping the EXISTING widgets (`KpiRow`, the `LiveMap`+`RecentVisitsTable` grid, `VisitsChart`+`EventFeed`) unchanged, and keep the floating `Reactions` card. Keep `useVisitFeed()` mounted (the hero/showcase + dashboard all consume the feed). Ensure exactly one `<h1>` (the hero name) — demote any competing heading to `<h2>`.
- [ ] **Step 4: responsive/a11y sweep** — hero scales on mobile (name smaller, CTAs wrap, map calmer); one h1; `HeroMap` aria-hidden; visible focus on CTAs; `prefers-reduced-motion` freezes hero map + event-stream + arch pulse; verify AA contrast of overlay text over the veiled map. Fix only genuine gaps.
- [ ] **Step 5: run** → PASS; **full gate** `pnpm -C web build` + `tsc` + `pnpm -C web test`.
- [ ] **Step 6: commit** — `feat(web): compose immersive home (hero + showcase + live dashboard)`

---

## Self-Review

**Spec coverage:** immersive hero + live-map bg ✓(T1 shell, T2 map) · positioning/hook/CTAs/stack, localized ✓(T1) · engineering showcase: real-metric tiles + event stream + architecture ✓(T3) · signal token via `@theme inline` ✓(T1) · existing dashboard kept below ✓(T4) · reduced-motion + one-h1 + aria-hidden map + keyboard ✓(T2/T4) · real metrics only, no fabricated latency ✓(T3, constraint) · i18n `home` namespace en/pt-BR ✓(T1/T3).

**Placeholder scan:** the exact visual/pixel treatment follows the approved mockup + frontend-design (latitude by design, not hand-waving); data sources, i18n keys, component contracts, and test targets are all concrete. The Ask-CTA wiring depends on how `ask-widget.tsx` exposes "open" — T1 greps and wires it (or focuses it) rather than inventing an API.

**Type consistency:** `Hero`/`HeroMap`/`EngineeringShowcase`/`StatTiles`/`EventStream`/`ArchitectureDiagram` consumed only by `routes/index.tsx`; `home` namespace keys shared T1↔T3 (single source in `home.json`); metrics/feed hooks reused from the existing dashboard (same shapes), not re-created.
