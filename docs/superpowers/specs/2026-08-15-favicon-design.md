# Favicon — design

## Problem

`web/index.html` declares a single icon, `/favicon.svg`. That file is a Figma
export of a purple lightning bolt: 8 KB of nested gaussian-blur filters, and
`#863bff` — a colour that appears nowhere else in the site. The site's accent is
the aqua `--color-signal` `#3ae0c4` (`web/src/styles.css`). There is no
`favicon.ico` and no `apple-touch-icon.png`, so legacy browsers, some crawlers,
and iOS home-screen bookmarks have no icon to fall back to.

## Decision

A new mark: the monogram F, knocked out of a solid aqua badge.

Alternatives considered and rejected:

- **Redrawing the lightning bolt.** Continuous with today's mark, but the bolt
  reads as the Pulse product, and the tab represents `Felipe de Almeida`
  (`site.shortName`).
- **A heartbeat/ECG line.** Carries the site's thesis — a live distributed
  system — but it is stroke, not mass. At 16 px the stroke lands near 1.7 px and
  the form is the first thing to break. It also reads as a generic health icon.
- **A node-and-ring "live signal" mark.** The most robust shape at 16 px, but it
  reads as a record button or an RSS glyph.
- **Solid F on a dark badge, and F with a detached middle bar.** The dark badge
  disappears among other dark icons in a tab strip. The detached bar leaves a
  1.5-unit gap on a 32 grid, which is 0.75 px at 16 px — the browser fills it in,
  so the detail costs legibility and buys nothing at the size that matters.

## Colour

Two existing tokens, no new values:

| Role | Token | Value |
| --- | --- | --- |
| Badge | `--color-signal` | `#3ae0c4` |
| Knocked-out F | `--color-signal-foreground` | `#05201b` |

`web/src/styles.css` documents these two as a fixed fill+foreground pair whose
contrast comes from the pairing rather than from the page surface, specifically
so they read as a filled chip on either a light or a dark background. A favicon
sits on browser chrome we do not control, which is the same constraint.

## Geometry

Authoritative grid: 32×32 (`viewBox="0 0 32 32"`). All other sizes derive from
it.

- Badge: full-bleed rounded rect `0,0,32,32`, corner radius `7` (≈22%).
- F, a single `fill-rule="evenodd"` path subtracting three rects from the badge:
  - stem: `x=8.7 y=5 w=4.7 h=22`
  - top arm: `x=8.7 y=5 w=14.6 h=4.7`
  - middle arm: `x=8.7 y=13.7 w=10.2 h=4.7`

The bars have square corners. Rounding them is invisible at 96 px and turns to
mush at 16 px. The F's bounding box is 14.6 × 22, leaving margins of 8.7 left and
right and 5 top and bottom: the glyph is centred on its bounding box, not on its
stem.

### Small sizes are snapped, not scaled

Scaling the 32-grid geometry to 16 px puts every edge on a half pixel, which
antialiases the F into grey mush. The generator instead rounds each rect to whole
pixels per target size. At 16 px the F becomes stem `x=4 y=3 w=2 h=11`, top arm
`x=4 y=3 w=7 h=2`, middle arm `x=4 y=7 w=5 h=2`.

## Deliverables

| File | Purpose |
| --- | --- |
| `web/public/favicon.svg` | Rewritten by hand. Modern browsers use this one. |
| `web/public/favicon.ico` | 16/32/48 embedded. Legacy browsers, Google's crawler. |
| `web/public/apple-touch-icon.png` | 180×180, **opaque**. iOS discards alpha and composites onto black. |
| `web/scripts/generate-favicons.mjs` | Generator for the two raster artifacts. |
| `web/index.html` | Three `<link>` tags. |
| A vitest test | Asserts every icon `index.html` references exists in `public/`. |

Explicitly out of scope: `site.webmanifest` and 192/512 icons. They serve
Android's add-to-home-screen; without a manifest Chrome falls back to the 180 px
`apple-touch-icon` anyway, and nobody installs a portfolio.

Also out of scope: `web/public/og.png`, which still carries the old purple
bolt. Regenerating it is a separate change with its own script
(`web/scripts/generate-og.mjs`) and its own Chromium dependency.

## The generator

`web/scripts/generate-favicons.mjs` follows the policy `generate-og.mjs` already
establishes for this repo: run by hand, commit the output, stay out of
`pnpm build`. The header comment says so, and says how to run it.

It does **not** use Playwright. The mark is four rectangles, so the script
rasterises them itself and encodes the PNG with the built-in `node:zlib` — no
dependencies, no Chromium download. Rasterising by hand is also what makes the
pixel snapping above possible; handing an SVG to a browser gives up that control.

The `.ico` is assembled in the same script: an ICO is a 6-byte header, a 16-byte
directory entry per image, and the PNG bytes themselves, which every browser that
matters accepts inside an ICO container.

The 32-grid geometry is defined once, at the top of the script, and drives both
the emitted `favicon.svg` and the rasterised PNGs. The SVG is not maintained
separately — that is what would let the two drift apart.

## Test

One vitest test at `web/src/favicon.test.ts`, colocated the way `styles.test.ts`
and `entry-prerender.test.ts` already are: read `web/index.html`, extract every
`<link rel="...icon...">` href, and assert the corresponding file exists under
`web/public/`. This catches renaming an asset without updating the
link, which is the failure this set of files is actually prone to.

Rendering fidelity is not unit-tested. The generator is deterministic and its
output is committed, so a bad render is caught by looking at the committed PNG in
review, not by an assertion.

## Verification

- `pnpm lint` and `pnpm test` pass in `web/`.
- `node scripts/generate-favicons.mjs` run twice produces byte-identical files.
- The dev server serves all three icons with 200s, and the tab shows the new mark.
