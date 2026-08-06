# Pulse — Home Redesign (immersive portfolio landing) — Design Spec

- **Status:** Approved design (mockup signed off), pending implementation plan
- **Date:** 2026-08-06
- **Scope:** Frontend only. Redesign the `/` route from an ops dashboard into an immersive portfolio landing that sells Felipe as a senior/staff engineer & engineering leader, using the live real-time system as the proof ("the demo is the résumé"). Reuses existing data hooks; no backend change (metrics stay real — nothing fabricated). Fully localized (en/pt-BR, i18n already in place).

---

## 1. Purpose

Today `/` is an admin-style dashboard (KPIs, map, chart, table, feed) — functional but it neither introduces nor sells Felipe. This redesign reframes the same live system as an **immersive landing**: a full-bleed hero with the live world-map of visitor presence as its animated background, overlaid with Felipe's name/positioning + a "you're one of N people here right now — this page is a live distributed system" hook + CTAs; then an **engineering-showcase** band that makes the distributed system visible (real live stats, a streaming event feed, a compact architecture diagram); then the existing live dashboard below as the deep detail. Signed-off mockup: the "signal" dark treatment, single aqua accent, mono for data.

---

## 2. Decisions (locked)

- **Immersive hero** — the live presence/world-map is the hero's animated background (dimmed, veiled for legibility), text + CTAs over it. Below: engineering showcase, then the existing dashboard.
- **"Signal" visual treatment** — dark, a single **aqua accent `#3AE0C4`** (semantic colors stay separate), **monospace for all data/labels/ticker** to sell the engineering feel. The home commits to the dark theme (the app is dark-themed). Respect `prefers-reduced-motion`.
- **Real metrics only.** Showcase stats use existing data (`/api/metrics` → `ActiveConnections`, `TotalVisits`; `/api/map` → derive distinct countries/cities). The mockup's "p95 latency" is **dropped** (not collected). No fabricated numbers on a professional site.
- **Content is data-driven + localized.** Name/title/tagline/hook pull from `content/profile.ts` (already `LocalizedString`) + new i18n keys; CTAs link to `/projects`, `/about`, `/cv.pdf`, and open the existing Ask-AI widget. Stack strip from a small list.
- **Reuse, don't rebuild.** The hero background reuses the existing map projection/data (`LiveMap` uses d3-geo + topojson + presence); the event stream reuses the structured `PulseEvent` feed; stats reuse the metrics/map hooks. The existing dashboard widgets stay below, unchanged.

---

## 3. Structure & components

```
/  (routes/index.tsx)
├─ <Hero>                       full-bleed, ~90vh, dark
│   ├─ <HeroMap>                ambient live world-map bg (presence points, veil)
│   └─ overlay: live pill (online) · name · title/tagline · hook · CTAs · stack strip
├─ <EngineeringShowcase>        "what you're looking at · live"
│   ├─ <StatTiles>              real live metrics (online, events/visits, countries, cities)
│   ├─ <EventStream>            live structured-event ticker (reuses PulseEvent feed)
│   └─ <ArchitectureDiagram>    Web → API/SignalR·Redis → RabbitMQ → Worker → Postgres (localized)
└─ <LiveDashboard>              the EXISTING widgets (KpiRow, LiveMap, VisitsChart, RecentVisitsTable, EventFeed) under a heading, + the floating Reactions card (unchanged)
```

| Component | Path | Responsibility |
|---|---|---|
| `Hero` | `web/src/components/home/hero.tsx` | Layout + overlay content; reads `profile` (localized) + online count |
| `HeroMap` | `web/src/components/home/hero-map.tsx` | Ambient animated world-map background (real projection + presence points), dimmed + veiled, `aria-hidden`, reduced-motion aware |
| `EngineeringShowcase` | `web/src/components/home/engineering-showcase.tsx` | Section wrapper + the three sub-blocks |
| `StatTiles` | `web/src/components/home/stat-tiles.tsx` | Real-metric tiles (mono, tabular-nums, live-updating) |
| `EventStream` | `web/src/components/home/event-stream.tsx` | Live event ticker from the structured `PulseEvent` feed (localized labels) |
| `ArchitectureDiagram` | `web/src/components/home/architecture-diagram.tsx` | Static flow with an animated "signal" traveling the edges (localized node labels) |
| `routes/index.tsx` | (modify) | Compose Hero → Showcase → existing dashboard |

### Hero copy (localized, from `profile` + new `home` namespace)
- Live pill: `home:live.online` with `{count}` (plural) — "{{count}} online now" / "{{count}} online agora".
- Name: `profile.name`; title/tagline: `profile.title` / a hook line. Hook: `home:hero.hook` — "You're one of {{count}} people here right now — and this page is a live distributed system, streaming presence, geolocation, and events in real time." (pt-BR mirrored). Uses the live online count.
- CTAs: `home:cta.projects` (→ `/projects`, primary), `home:cta.about` (→ `/about`), `home:cta.cv` (→ `/cv.pdf` download), `home:cta.ask` (opens the Ask widget). Reuse `CvButton` for the CV one.
- Stack strip: a `HOME_STACK` const (`.NET 10`, `SignalR`, `RabbitMQ`, `Redis`, `PostgreSQL`, `OpenTelemetry`, `React 19`, `Docker`, `Terraform`) — proper nouns, not translated.

### Stat tiles (real data)
Online now (`ActiveConnections`, live via presence), events processed (`TotalVisits` — each visit is an event through the outbox→worker→Postgres path; label it truthfully e.g. "events processed"/"visits"), countries + cities (distinct from `/api/map` recent points, labelled "recent" to stay honest). All mono, `tabular-nums`, `Intl.NumberFormat(i18n.language)`. No latency tile unless a real source is added later.

### Architecture diagram
A compact horizontal flow (the mockup's), node labels localized via `home:arch.*`, an aqua "signal" pulse animating along the edges (reduced-motion: static). Caption: "event-driven · transactional outbox · OpenTelemetry" (localized).

---

## 4. Theme / tokens

- Add a **signal accent** token (aqua `#3AE0C4`) to the web theme (the Tailwind v4 `@theme inline` token map — follow the existing pattern; do NOT bare-`:root` it, that was the earlier Tailwind bug) as e.g. `--color-signal` + a muted variant, plus a hero-veil helper. Semantic colors unchanged.
- The hero/showcase use the signal accent for the live pill, primary CTA, arch pulse, and data highlights; everything else stays quiet (the "spend boldness in one place" rule).
- The existing dashboard below keeps its current tokens.

---

## 5. Responsive & a11y

- Hero: fluid; on mobile the name scale drops, CTAs wrap, the map stays as a (calmer) background. Exactly one `<h1>` on the page (the name) — the existing dashboard uses no competing h1.
- `HeroMap` canvas is decorative → `aria-hidden`, and the overlay text has a solid enough veil for contrast (WCAG AA on the aqua/muted text over the map).
- Keyboard: all CTAs are real links/buttons with visible focus; the Ask CTA moves focus into the widget.
- `prefers-reduced-motion`: map pulsing, event-stream slide-in, and the arch signal all freeze to a static state.
- Live regions: the online count / event stream update politely (`aria-live="polite"` where it makes sense, not spammy).

---

## 6. Testing

- **vitest + testing-library** (via `renderWithI18n`): Hero renders the name + a CTA to `/projects` and the online-count pill; the hook shows the localized string (en + pt-BR); StatTiles render real metric values from mocked hooks (and never a hardcoded/fake latency); EventStream renders structured events localized (pt-BR "Visita de …"); ArchitectureDiagram renders localized node labels; one `<h1>`; CTAs are links/buttons.
- Reduced-motion: assert the animated pieces render a static fallback when the media query matches (mock `matchMedia`).
- **Hard gate:** `pnpm -C web build` + `pnpm -C web exec tsc --noEmit` + `pnpm -C web test` green. (No backend change → no dotnet.)

---

## 7. Scope (YAGNI)

**In:** the hero (immersive live-map bg + overlay + CTAs + stack), the engineering showcase (real-metric tiles + live event stream + architecture diagram), the signal token, localization, reduced-motion/a11y, tests; the existing dashboard kept below. **Out:** new backend metrics (latency/p95, visitors-today as a stored aggregate — future add-ons), a WebGL globe, scroll-jacking, a full router-level page transition, removing/curating the existing dashboard widgets (can trim later), and any change to the realtime backend.

---

## 8. Success criteria

- Landing on `/` leads with an immersive hero that introduces + sells Felipe, with the live world-map of real visitor presence as its background and clear CTAs (Projects/About/CV/Ask-AI).
- The engineering showcase makes the distributed system visible with **real** live stats, a streaming event feed, and the architecture — nothing fabricated.
- Fully localized (en/pt-BR), responsive, accessible (one h1, decorative map hidden, keyboard-navigable, reduced-motion honored).
- The existing live dashboard remains available below; no backend/realtime change.
- All hard-gate checks green.
