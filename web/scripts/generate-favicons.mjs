/**
 * Generates public/favicon.svg, public/favicon.ico and
 * public/apple-touch-icon.png from one 32-unit geometry definition.
 *
 * Run by hand after editing the geometry, and commit the results:
 *
 *   node scripts/generate-favicons.mjs
 *
 * Kept out of `pnpm build` for the same reason as generate-og.mjs: the files
 * in public/ are the artifact, and this script is only how they are made.
 * Unlike generate-og.mjs it needs no browser — the mark is four rectangles,
 * so this rasterises them directly and encodes the PNG with node:zlib.
 * Rasterising here rather than handing the SVG to Chromium is also what lets
 * each size snap to whole pixels; see snapRects.
 */
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// --color-signal and --color-signal-foreground in src/styles.css, which
// documents them as a fixed fill+foreground pair whose contrast comes from
// the pairing rather than from the page surface. That is exactly a favicon's
// situation: it sits on browser chrome we do not control.
const BADGE = [0x3a, 0xe0, 0xc4];
const GLYPH = [0x05, 0x20, 0x1b];

const GRID = 32;
const RADIUS = 7;

// Edges of the F on the 32 grid; everything else derives from these. The
// glyph box is 14.6 x 22, so margins are 8.7 either side and 5 top and
// bottom — centred on the bounding box, not on the stem.
const E = { x0: 8.7, x1: 13.4, x2: 18.9, x3: 23.3, y0: 5, y1: 9.7, y2: 13.7, y3: 18.4, y4: 27 };

/** The F as three overlapping rects, [x, y, w, h]. Used for rasterising. */
function bars({ x0, x1, x2, x3, y0, y1, y2, y3, y4 }) {
  return [
    [x0, y0, x1 - x0, y4 - y0],
    [x0, y0, x3 - x0, y1 - y0],
    [x0, y2, x2 - x0, y3 - y2],
  ];
}

/**
 * The F as one non-overlapping outline. The rects above would be wrong in a
 * path: three overlapping subpaths flip the stem/arm junctions back to badge
 * colour under either fill rule, notching the corner of the F.
 */
function glyphOutline({ x0, x1, x2, x3, y0, y1, y2, y3, y4 }) {
  return `M${x0} ${y0}H${x3}V${y1}H${x1}V${y2}H${x2}V${y3}H${x1}V${y4}H${x0}Z`;
}

function svg() {
  const r = RADIUS;
  const span = GRID - 2 * r;
  const badge =
    `M${r} 0h${span}a${r} ${r} 0 0 1 ${r} ${r}v${span}a${r} ${r} 0 0 1-${r} ${r}` +
    `H${r}a${r} ${r} 0 0 1-${r}-${r}V${r}a${r} ${r} 0 0 1 ${r}-${r}z`;
  const fill = `#${BADGE.map((c) => c.toString(16).padStart(2, '0')).join('')}`;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${GRID} ${GRID}">` +
    `<path fill="${fill}" fill-rule="evenodd" d="${badge}${glyphOutline(E)}"/></svg>\n`
  );
}

const here = dirname(fileURLToPath(import.meta.url));
const publicDir = join(here, '..', 'public');

writeFileSync(join(publicDir, 'favicon.svg'), svg());
console.log('wrote public/favicon.svg');
