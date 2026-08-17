# Site SEO optimization — design

**Date:** 2026-08-17
**Status:** approved

## Problem

The site paints blank on first load, then flashes black, before any content
appears. A Lighthouse run (Moto G Power, slow 4G, `/pt/`) puts LCP at 2.9s and
Speed Index at 3.9s against an FCP of 1.1s — the gap is the app throwing away
markup that was already on screen and correct.

Three findings from Lighthouse, all unaddressed:

- 382 KiB of hashed assets served with no `Cache-Control` at all.
- 107 KiB of unused JavaScript; `routes-*.js` alone costs 2,057ms of script
  evaluation and 3,201ms of CPU.
- 10.3 KiB of render-blocking CSS costing 450ms.

The classic SEO surface — per-route `<title>`, description, canonical,
`hreflang`, Open Graph, Schema.org `@graph`, `sitemap.xml`, `robots.txt`,
`llms.txt`, markdown mirrors — is already built and shipping via
`web/plugins/aio.ts`. The gap is Core Web Vitals (a ranking factor) plus two
suspected content/markup drifts described in Phase 2 and Phase 3.

## Root cause of the blank paint

Not `createRoot` on its own. Three things compounding:

1. **The router loads the route chunk after the root is cleared.**
   `vite.config.ts` sets `autoCodeSplitting: true`, so each route component
   lives in its own chunk. `web/src/main.tsx:57` calls
   `createRoot(...).render(...)` immediately: React discards the prerendered
   markup and has nothing to put in its place until `routes-*.js` downloads and
   evaluates — 2s on the audited profile. That is the black frame, and it lasts
   as long as that chunk takes.

2. **Theme applied only once JS runs.** `web/src/main.tsx:19` toggles the `dark`
   class from module scope. The served document is `<html lang="en">` with no
   class while the store's default is `dark`
   (`web/src/stores/theme-store.ts:11`), so the page paints light, then turns
   dark.

3. **Render-blocking CSS** delays first paint by 450ms — on slow 4G that is
   round-trip latency, not parse time.

The consequence that matters: today's LCP *is* the React app mounting. If the
prerendered markup simply stays on screen, LCP becomes that markup — near the
current 1.1s FCP.

## Scope

Three phases, one spec. Phase 1 is the visible bug and the ranking factor;
Phases 2 and 3 are audits over the same code (`src/lib/aio/*`, `src/content/*`)
producing targeted fixes, not redesign. If a phase turns out to be larger than
this framing assumes, it splits into its own spec rather than expanding here.

For Phases 2 and 3 the agreed output is **audit plus applied corrections** for
anything objective (a heading out of order, a truncated description, a missing
JSON-LD field), with anything that is editorial judgement listed separately for
the author to decide. Copy is not rewritten for keywords.

---

## Phase 1 — first paint and Core Web Vitals

### 1.1 Mount only when the app can render

`web/src/main.tsx`: `await router.load()` before `createRoot`. The build-time
markup stays visible until the swap can be instant.

Wrapped in `try/catch`: if `load()` rejects, mount anyway. Otherwise a failed
route-chunk fetch turns a recoverable degradation into a permanently frozen
page — strictly worse than today's behaviour.

`createRoot` is kept deliberately. `web/src/entry-prerender.tsx` documents why
hydration was rejected: this app's first paint is full of live values (presence
counts, the visitor's city, event feeds) that cannot match a build-time render,
and hydration mismatches on that content produce drifting bugs. Nothing in this
work changes that trade-off. `hydrateRoot` would still require the same
`await router.load()`, so it buys one avoided re-render at the cost of that
whole bug class.

### 1.2 Resolve the theme before the first paint

Two layers, so the common case does not depend on JavaScript:

- `web/plugins/aio.ts` stamps `class="dark"` on `<html>` in every emitted
  document, matching the store's default. This alone removes the flash for
  every visitor who has never switched themes. It extends the existing
  `<html lang="en">` replacement the plugin already performs to set each
  document's locale, so the two stay one substitution rather than two
  competing ones.
- A synchronous inline `<script>` in `web/index.html`'s `<head>` corrects the
  case where the visitor chose light, reading `localStorage['pulse-theme']` —
  which `zustand/persist` writes as `{"state":{"theme":"light"},"version":0}`.
  It must be synchronous and before the stylesheet, or it cannot beat the first
  paint.

The inline script parses the persisted value defensively: a malformed or absent
entry falls back to the stamped default rather than throwing, since a throw in
a blocking head script would block the document.

### 1.3 Keep the swap invisible

With the markup staying on screen for longer, a mismatch between the build
render and the client's first render stops being a brief flash and becomes a
late visible jump — worse than the current behaviour. `entry-prerender.test`
already guards that the tree renders without `window`; it is extended to assert
the two renders agree on visible structure.

### 1.4 Cache headers

`deploy/Caddyfile` has no `header` block, which is why 382 KiB is refetched on
every visit.

| Path | `Cache-Control` |
|---|---|
| `/assets/*` (Vite hashed filenames) | `public, max-age=31536000, immutable` |
| HTML documents, `.md`, `sitemap.xml`, `robots.txt`, `llms*.txt` | `no-cache` |
| `/favicon.*`, `/apple-touch-icon.png`, `/og.png`, `/screenshots/*`, `/cv.pdf` | `public, max-age=604800` |

`no-cache` on the documents is mandatory: each one carries the hashed asset
names, so a cached document pins a released build in place.

The third row exists because files in `public/` keep their authored names —
Vite does not hash them — so `immutable` would be wrong for them and the
`/assets/*` rule does not cover them.

### 1.5 Take weight off the critical path

There is no `lazy()` anywhere in the project; every import is static. Three
targets, none of them needed for the first paint:

- **`@microsoft/signalr`** — dynamic import inside `src/realtime/hub.ts`. It
  contributes nothing before the swap.
- **`LiveMap`** (below the fold, `src/routes/index.tsx:89`) and the client-side
  decode of the 108 KB `countries-110m.json`. `HeroMap` is pure geometry with no
  `window` access, so it is already inlined as SVG in the prerendered document —
  the topojson only has to arrive before the swap, not before the paint.
- **`recharts`** via `VisitsChart`, which appears only on `/live` and in the
  widget stack.

Together these are the 140 KiB `use-visit` chunk and a large part of the
`routes-*.js` evaluation cost.

### 1.6 Inline the critical CSS

10.3 KiB costing 450ms of round-trip. The `aio` plugin already assembles every
document, so it inlines the built stylesheet into each one, removing the
request entirely. Compression is already handled (`encode zstd gzip` in the
Caddyfile) and the documents are served `no-cache` regardless, so no
cacheability is lost.

Explicitly rejected: `vite-plugin-css-injected-by-js` (used by the pampadevs
project). It moves CSS into the JS bundle, which delays styling until the
bundle executes — the opposite of what this site needs, where prerendered HTML
must paint before any JavaScript runs.

### 1.7 Preload the entry and route chunks

Borrowed from `pampadevs-client/index.html`. With `await router.load()` gating
the swap, the route chunk is on the critical path to interactivity, so the
`aio` plugin emits `<link rel="modulepreload">` for the entry chunk and for
that route's chunk, reading the real hashed filenames from the bundle.

The pampadevs approach of forcing stable chunk filenames is **not** adopted:
hashed names are what make `immutable` caching correct, and the plugin has
access to the true names at emit time anyway.

### 1.8 Compress the project screenshots

`public/screenshots/` holds ~1.6 MB of raw PNG — `dietbox.png` alone is 856 KB,
`pulse.png` 272 KB, `ulbra-atende.png` 240 KB. On `/projects` all six render;
on a project detail page the screenshot is above the fold and is therefore the
LCP element. The audit in the problem statement missed this because it ran
against `/pt/`.

Converted to WebP, no PNG fallback: WebP has been supported by every current
browser since 2020, and keeping both formats would mean shipping a
`<picture>` element for a case that no longer occurs. `ProjectScreenshot`
already does the rest correctly (`loading="lazy"`, `decoding="async"`,
`aspect-video` reserving the box, so no CLS).

### 1.9 Microsoft Clarity (landing in parallel)

Clarity is being added in a separate session, which introduces this site's
first external origin and invalidates the original reason for skipping
resource hints. Two things follow, both to be applied once that work lands:

- `<link rel="preconnect" href="https://www.clarity.ms" crossorigin />` plus a
  `dns-prefetch` fallback in `web/index.html`.
- The tag loads deferred, on `window`'s `load` event behind a `setTimeout`,
  following `pampadevs-client/index.html`. A synchronous third-party tag in
  `<head>` would undo section 1.5 outright: it competes with the route chunk
  that section 1.1 now makes the swap wait on.

Two coordination notes. First, both changes touch `web/index.html`, which
sections 1.2 and 1.7 also modify — expect to reconcile. Second, and more
important for measurement: **Clarity must be held constant across the
before/after Lighthouse runs.** Otherwise a third-party script landing
mid-flight gets attributed to this work, in either direction, and the TBT
criterion below becomes meaningless.

### Not adopted from pampadevs

- The `initial-loader` element — real prerendered content is strictly better
  than a spinner.
- `<meta name="keywords">` — ignored by Google since 2009.
- Forced stable chunk filenames — see 1.7.

---

## Phase 2 — content and meta tags

`renderHead` (`src/lib/aio/render.ts`) is already comprehensive. This phase is
verification, and the durable form for this repository is rules encoded as
tests alongside the existing `aio.test.ts` and `content.test.ts` — not a
one-off report.

- **Length bounds.** Titles Google truncates (~60 chars) and truncated
  descriptions (~155). Nothing currently stops a new description being born
  too long.
- **Uniqueness.** No description or title repeated across routes or locales.
- **Exactly one `<h1>` per emitted document.** The highest-risk item.
  `src/lib/aio/pages.ts:39` describes `heading` as "the single `<h1>` of the
  static shell", but the static shell was replaced by the real React tree. The
  `<h1>` that ships now comes from the component, so the two can have drifted
  unnoticed.
- **Per-document sanity.** Non-empty `#root`, `lang` matching the locale,
  self-referential canonical, `/og.png` actually present in `public/` (it is —
  164 KB).

## Phase 3 — AI crawler surface

- **`robots.txt`** — confirm GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot
  and CCBot are allowed and the `Sitemap:` line is present.
- **FAQ JSON-LD against visible content.** Same root cause as the `<h1>` item.
  `src/lib/aio/pages.ts:47` states the `FAQPage` markup "is only legitimate
  while it mirrors visible content", but the JSON-LD comes from `pages.ts`
  while the visible body comes from the React component. If those drifted this
  is a Google structured-data violation — a penalty, not merely waste. A test
  compares the two.
- **`@graph` coverage** — `Person`, `WebSite`, `BreadcrumbList` on deep routes,
  `SoftwareSourceCode` / `CreativeWork` on projects.
- **`llms.txt` / `llms-full.txt`** — format conformance, and that the markdown
  mirrors cover every route in the sitemap.

The pampadevs project is not a reference for this phase; it has no AIO surface,
and this site's is further along.

### Expected findings

The `<h1>` and FAQ drifts are both predicted to be real, because they share one
cause: the body moved to the component tree and the `pages.ts` fields were left
describing a shell that no longer exists. The rest is expected to be clean.

---

## Verification

Local build → Docker container (to exercise the real Caddy, where the cache
headers and `try_files` behaviour live) → Lighthouse on the same profile as the
original audit (Moto G Power, slow 4G). Before and after, on `/pt/` **and** on
a project detail page, since 1.8 was invisible to the original run.

Acceptance criteria:

- **LCP < 2.5s** (expected ~1.3s once the prerendered markup is the LCP
  element)
- **TBT does not regress** from the current 100ms, measured with Clarity held
  constant across both runs (see 1.9)
- **CLS < 0.1** (currently 0.003 — the screenshot work must not disturb it)
- **Zero blank frames in the filmstrip**
- Phase 2 and 3 rules land as passing tests, so the audit cannot silently rot

## Risks

- **The swap becomes a visible jump.** Mitigated by 1.3. This is the one change
  that can make the perceived experience worse rather than better, so it gates
  on that test.
- **A stale document pinning a released build.** Mitigated by `no-cache` on
  documents in 1.4; worth verifying against the real container rather than
  assuming.
- **Lazy boundaries introducing layout shift** as chunks land. CLS is in the
  acceptance criteria specifically to catch this.
