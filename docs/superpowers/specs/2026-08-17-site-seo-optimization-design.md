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
- **The 108 KB `countries-110m.json`** and its decode. Neither map puts any of
  that geometry into the prerendered document: `HeroMap` draws to a `<canvas>`
  (`src/components/home/hero-map.tsx:145`), which prerenders as an empty
  element, and `LiveMap` already skips the country paths under SSR by design
  (`src/components/live-map.tsx:57` — its comment explains that ~200 KB of path
  data per document carries nothing a crawler can use). So the geometry
  contributes zero pixels to the first paint and is purely post-swap
  decoration.

  This makes it deferrable with no visual regression at first paint, which is
  a larger and safer win than an earlier draft of this design assumed. The cost
  is structural: `world` is imported at module scope by both maps, and
  `live-map.tsx` builds `projection` and `path` at module scope too, so
  deferring means reshaping those modules to load the geometry lazily.
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

## Result

Verified 2026-08-17, on the current branch, against baseline commit `3bc0965`
(the state right before this plan's implementation tasks began).

### Step 1 — build and run the full stack

All green:

- `pnpm -C web test` — **69 files / 457 tests passed**
- `pnpm -C web exec tsc --noEmit` — clean, no errors
- `pnpm -C web lint` — clean (oxlint exits 0; only pre-existing `react-refresh`/
  `exhaustive-deps`/style warnings, no errors, none touched by this plan)
- `docker build -f deploy/Dockerfile.web -t pulse-web .` — builds successfully
- `docker run` + `deploy/cache-headers.test.sh` — **all cache headers correct**:
  the hashed asset, `/`, `/about`, `/llms.txt`, `/sitemap.xml`, `/favicon.svg`
  and `/og.png` all matched the spec 1.4 matrix. Container stopped after the
  check.

### Static payload measurement (in place of Lighthouse byte data)

Lighthouse itself could not be run in this environment (no Lighthouse tooling,
no browser capable of paint-timing traces). What follows is not a substitute
for LCP/TBT/CLS/filmstrip — it is a real, reproducible measurement of the
eager document weight Lighthouse's network panel would have shown, so the
plan owner's Lighthouse run only needs to fill in the runtime metrics below.

**Method:** for each document, "total eager payload" = the document's own
bytes + its entry `<script type="module">` + every `<link rel="modulepreload">`
it declares (all resources the browser fetches before the app can mount, since
none are hydration-only or lazy). The critical CSS is inlined into the
document in the current build (spec 1.6), so there is no separate stylesheet
to add there; the baseline build still shipped it as a separate
`<link rel="stylesheet">`, which is included in the baseline total. Raw =
bytes on disk; gzip = `gzip -c` (level 6) of each file, summed — a slight
under-estimate of over-the-wire brotli but consistent across both builds, so
the comparison is fair. Baseline was built in a throwaway git worktree at
`3bc0965` with `pnpm install --frozen-lockfile && pnpm build`, measured
identically, then the worktree was removed.

| Document | Total eager payload — baseline (raw / gzip) | Total eager payload — now (raw / gzip) | Change |
|---|---|---|---|
| `index.html` (`/`) | 738,295 B / 227,076 B (721.0 / 221.8 KiB) | 628,817 B / 196,350 B (614.1 / 191.7 KiB) | **−109,478 B raw (−14.8%), −30,726 B gzip (−13.5%)** |
| `pt.html` (`/pt`) | 710,636 B / 222,717 B (694.0 / 217.5 KiB) | 629,181 B / 196,575 B (614.4 / 192.0 KiB) | **−81,455 B raw (−11.5%), −26,142 B gzip (−11.7%)** |
| `projects/dietbox.html` | 736,660 B / 227,623 B (719.4 / 222.3 KiB) | 608,476 B / 188,663 B (594.2 / 184.2 KiB) | **−128,184 B raw (−17.4%), −38,960 B gzip (−17.1%)** |

Document bytes alone, broken out (the number Lighthouse's "Document" row
would show):

| Document | Baseline doc bytes (raw / gzip) | Now doc bytes (raw / gzip) | Note |
|---|---|---|---|
| `index.html` | 35,262 / 6,815 | 93,024 / 17,225 | grew — gained inlined critical CSS |
| `pt.html` | 7,603 / 2,456 | 93,388 / 17,450 | **grew ~12×** — baseline `#root` was **empty** (0 characters); now it carries the same real prerendered markup as `index.html`. This is the fix, not a regression: spec 1.9/Task 3+8's whole point was that `/pt/` stopped being blank to crawlers and to the first paint. |
| `projects/dietbox.html` | 33,627 / 7,362 | 91,399 / 18,054 | grew — same inlined-CSS cause |

Route chunk each document's mount waits on (the one `modulepreload` tag Task 9
adds beyond what Vite emits on its own):

| Document | Baseline: route-specific preload? | Now: route chunk preloaded | Chunk size (raw / gzip) |
|---|---|---|---|
| `index.html` | none — the actual home-route chunk (`routes-*.js`, ~30.3 KB) was not in the preload list at all; the browser only discovered and fetched it after the entry script ran | `routes-DxIvSn9K.js` | 30,398 B / 11,144 B |
| `pt.html` | same as above (same route) | `routes-DxIvSn9K.js` | 30,398 B / 11,144 B |
| `projects/dietbox.html` | none — `projects_.$slug`'s real component chunk (`projects_._slug-CH50S94z.js`, 11.68 KB) was likewise absent from the preload list | `projects_._slug-Cn2fFACC.js` | 11,682 B / 2,628 B |

The chunk sizes themselves are essentially unchanged; what changed is that the
chunk the mount actually depends on is now declared in `<head>` and fetched in
parallel with the entry script, instead of being discovered late. The
baseline's own preload list instead blanket-preloaded a fixed set of chunks
(including a 100.9 KB `ask-widget-store` chunk) on every route regardless of
relevance — narrowing that to the one chunk each route needs is itself most of
the eager-payload reduction above.

### Prerender guard (spec 1.1 / `web/plugins/aio.ts`)

`buildBundle`'s `writeBundle` step throws if any rendered route is under 500
characters — both the current build and the baseline build completed without
that guard firing, on all 22 emitted documents in each. Spot-checked four
documents in the current `web/dist` directly:

| Document | `#root` length | `<h1>` found |
|---|---|---|
| `index.html` | 27,831 chars | "Felipe de Almeida" |
| `pt.html` | 27,978 chars | "Felipe de Almeida" |
| `pt/index.html` | 27,978 chars (identical to `pt.html`, by design — see `aio.ts`) | "Felipe de Almeida" |
| `projects/dietbox.html` | 24,520 chars | "Dietbox" |

All non-empty with real, route-appropriate content — the guard holds and the
spot-check confirms it isn't just passing on whitespace.

### Steps 2–4 — Lighthouse run and visual swap check: NOT PERFORMED

No Lighthouse tooling and no browser capable of capturing paint timing or a
loading filmstrip were available in this environment. Fabricating LCP, TBT,
CLS, Speed Index, or filmstrip numbers, or a verdict on the swap, would be
worse than leaving them blank, so none of the below was estimated or inferred
— it is left for the plan owner to run for real, same profile as the Task 1
baseline (Moto G Power emulated, slow 4G, `/pt/` and a project detail page,
Clarity in the same state as the baseline run per spec 1.9).

| Metric | Baseline | Target | Actual |
|---|---|---|---|
| LCP | 2.9s | < 2.5s | **PENDING — requires a real Lighthouse run; not measured here** |
| TBT | 100ms | ≤ 100ms | **PENDING — requires a real Lighthouse run; not measured here** |
| CLS | 0.003 | < 0.1 | **PENDING — requires a real Lighthouse run; not measured here** |
| Speed Index | 3.9s | improved | **PENDING — requires a real Lighthouse run; not measured here** |
| Blank frames in filmstrip | yes | **none** | **PENDING — requires a real Lighthouse run; not measured here** |

Step 4 (watching the prerendered-to-mounted swap on a throttled connection for
a visible jump or flicker — the one regression spec 1.3 warns this plan could
cause) is likewise **not performed**; it needs a real browser under network
throttling, which was not available here.

### Honest summary

The build/lint/type/test gate is fully green, the Docker image serves the
correct cache headers, and the static payload data above is real and
reproducible: eager payload per document dropped 11–17% (both raw and gzip)
versus the pre-plan baseline, largely because Task 9 replaced a blanket
route-chunk preload with a precise one and the entry bundle itself shrank.
`/pt/` document bytes grew substantially, which is the empty-`#root` bug
being fixed, not a regression. None of this substitutes for the runtime
metrics — LCP, TBT, CLS, Speed Index, and the filmstrip — or for confirming
the prerender-to-mount swap is invisible. Those remain unverified until the
plan owner runs Lighthouse and a throttled visual check on this build.

## Follow-ups this work surfaced but did not fix

Each was found by review, measured, and deliberately left out of scope. None
blocks the merge; all are recorded here because the execution ledger is scratch
and this document is not.

**`/watched` prerenders "Not Found" in both locales.** `src/lib/aio/pages.ts`
defines the page — so it gets a full head, JSON-LD, a markdown mirror, and
`<loc>` entries in both `sitemap.xml` and `llms.txt` — but `src/routes/` has no
matching route file, so its `#root` reads "Not Found". Pre-existing, unrelated
to this work. Worth noting that both guards this work added pass on it: the
build's `app.length < 500` check and the widened prerender test both assert
"not empty", where the invariant that would have caught this is "the route
actually rendered". Either delete the page from `pages.ts` or add the route.

**`/pt/` with a trailing slash serves the English document.** `/pt` is correct;
`/pt/` falls through Caddy's `try_files` to the English `index.html`, with
`lang="en"` and an English title. Byte-identical to the behaviour before this
work. Browsers are unaffected because the SPA reads the locale from the path
and boots in Portuguese, but a crawler that follows a trailing-slash link
receives the wrong document — which is precisely the class of problem the AIO
step exists to prevent. The plugin already writes `dist/pt/index.html` for this
case, so the fix is in the serving rules, not the build.

**Fixed-path files in `public/` still fall through to the SPA.** The blocker
fixed during final review gave `/assets/*` and `/screenshots/*` their own
handlers so a missing file 404s instead of returning HTML cached long-term. The
five fixed-path files — `/favicon.ico`, `/favicon.svg`, `/apple-touch-icon.png`,
`/og.png`, `/cv.pdf` — were deliberately left alone: they carry no content hash,
so there is no stale-URL rollback class, and the cache window is a week rather
than a year with no `immutable`. It is the same shape of bug at much lower
severity, and closing it is a two-line change if desired.

**Two vacuous-test patterns worth auditing more widely.** Both were found in
existing tests, not introduced here. First, an assertion that fires before an
awaited value resolves passes regardless of the production code — this bit four
separate tests across this work. Second, `window.addEventListener('unhandledrejection')`
never fires in jsdom for rejections originating in module code, so any test
asserting on that array always sees it empty; `process.on('unhandledRejection')`
does fire. A sweep of the suite for both patterns would likely find more.
