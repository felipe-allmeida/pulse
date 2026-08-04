# Pulse — Live Ops Console (Frontend Overhaul) — Design Spec

- **Status:** Approved design, pending implementation plan
- **Date:** 2026-08-04
- **Scope:** Frontend only. No backend/API changes.

---

## 1. Purpose

The current `web/` is a thin readout (a count, raw SVG map, plain metric numbers) that shows the *results* of the system but hides the *machinery* and reads as a toy. This overhaul rebuilds it as a **live operations console** — a real, dark, monitoring-style admin dashboard — so the real-time system looks like the production-grade product it is, with the **location view as the hero panel**.

This is a pure visual/UX rebuild on the **same API contract**. It intentionally excludes new features (chat, event-pipeline visualization, new endpoints) — those remain later phases. This brings the previously-planned "visual polish" forward and upgrades the frontend stack to a real dashboard toolkit.

---

## 2. Stack

Match the stack already used in the team's other web app, so it reads as a real product and is familiar to maintain:

- **React 19 + Vite** (keep)
- **TanStack Router** (file-based routing via `@tanstack/router-plugin`) — one route (`/`) now, structured for extension
- **TanStack Query v5** — REST reads with caching/refetch
- **shadcn/ui** (Radix primitives + **Tailwind CSS 4** + `class-variance-authority` + `clsx` + `tailwind-merge`) — component system + theming
- **lucide-react** — icons
- **Recharts** — sparklines + time charts
- **react-simple-maps** — the world map (self-contained topojson, D3-based)
- **@microsoft/signalr** (keep) — the realtime hub client
- **vitest + @testing-library/react** — tests
- Optional: **zustand** for the local event-feed store (as in the reference app)

**No external map tiles / map API** — `react-simple-maps` renders bundled local topojson, preserving the privacy stance (no third-party requests, no API key).

---

## 3. Layout

Single dashboard page (routable shell for future pages):

- **Top bar:** `Pulse` wordmark · live **connection-status pill** (connected / reconnecting / offline) · **`● N online`** live presence badge · **theme toggle** (dark default).
- **KPI row:** shadcn stat cards with lucide icons + Recharts sparklines — **Active connections**, **Total visits** (layout leaves room for *Messages/sec*, *Uptime* later).
- **Hero — Location view:** a `react-simple-maps` world map, **choropleth** (countries shaded by visit volume, sequential scale) with **animated pulsing pings** for recent visits and hover tooltips (country + count). Beside it, a **TanStack Table** "Recent visits" (city, country, relative time).
- **Secondary panels:** a live **Event feed** (recent visits/reactions streaming in) and a **visits-over-time** Recharts area chart.
- **Reactions:** the allow-listed emoji reactions remain (float on the dashboard), driven by the hub.

---

## 4. Data flow

Two sources, cleanly separated:

- **REST reads via TanStack Query:**
  - `useMetrics()` → `GET /api/metrics`, `refetchInterval` ~3s.
  - `useVisits()` → `GET /api/map` (last 100 points w/ `lat,lon,city,country,at`), `refetchInterval` + invalidated on realtime events.
- **Realtime via SignalR** (thin provider/hook):
  - Subscribes to `PresenceUpdated` (live count), `ReactionReceived` (float reactions).
  - Keeps the **Heartbeat** interval (15s, half the 30s TTL).
  - On relevant events, **invalidates** the `metrics`/`visits` queries (and/or pushes into a local event-feed store) so the dashboard stays live.
- **Derived, client-side (no new endpoint):**
  - **Choropleth counts** = aggregate `/api/map` points by `country`.
  - **Visits-over-time** = bucket the points' `at` timestamps client-side (e.g., per hour). Note: `/api/map` returns only the **last 100** points, so this chart reflects *recent* activity, not full history — frame it that way ("recent visits") rather than as an all-time trend. A dedicated time-series endpoint is a later-phase item, not part of this frontend-only overhaul.

**Country matching caveat (design risk):** `/api/map` returns GeoLite2 country *names* (e.g., "Portugal"); topojson features key on their own names/ISO codes. The choropleth needs a **name→feature normalization** (a small country-name/ISO lookup, or match on ISO if we enrich the audit later). The MVP handles unmatched names gracefully (uncounted, logged) rather than crashing. `Unknown` stays filtered (already excluded server-side from `/api/map`).

---

## 5. Design system

- **Dark-first** theme via Tailwind 4 + shadcn CSS-variable tokens; light theme available through the toggle (both themed).
- shadcn conventions: `components.json`, the `cn()` util, generated primitives (card, table, badge, tooltip, button, dropdown).
- Motion kept **CSS-based** (ping pulse via keyframes, subtle card transitions) — no heavy animation dependency.
- Cohesive, restrained palette; the map + KPIs are the focal points.

---

## 6. Routing, dev, deploy

- **TanStack Router** file-based, single `/` route now; shell ready for `/architecture`, `/events` later.
- **Vite dev proxy** for `/api` and `/hub` (`ws: true`) stays — same-origin relative URLs in prod behind Caddy, unchanged.
- **Deploy unchanged:** `deploy/Dockerfile.web` still `pnpm build` → served by Caddy. New deps (Recharts, react-simple-maps/d3, TanStack) increase bundle size; acceptable for a dashboard. Note lazy-loading heavy panels via router later if size matters.

---

## 7. Testing

- **vitest + testing-library** (mirrors the reference app). Cover: the choropleth aggregation (points → per-country counts), the time-bucketing, the table rendering, and the realtime→query invalidation bridge (mock the hub + query client). Keep SignalR mocked in unit tests.
- **Hard gate:** `pnpm build` MUST pass (not just `tsc --noEmit`) — the build catches errors typecheck misses. Strict TypeScript throughout.

---

## 8. Scope (YAGNI)

**In:** full rebuild of `web/` into the dashboard on the stack above; same three data sources; reactions kept.
**Out (later phases):** real-time chat; live event-**pipeline** visualization (Redis/RabbitMQ/outbox/worker made visible); any new backend endpoint (queue depth, span stream, time-series). This overhaul is the visual foundation those build on.

---

## 9. Success criteria

- Reads as a genuine live ops dashboard (on par with the team's other web app), not a toy demo.
- The **location view is the hero**: choropleth by volume + live pulsing pings + recent-visits table.
- Realtime still works (presence count, reactions, live refresh) and heartbeat keeps presence honest.
- **No external map tiles / API keys** — privacy stance preserved.
- `pnpm build` green, strict TS, component tests pass.
