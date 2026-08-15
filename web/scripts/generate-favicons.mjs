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
import { deflateSync } from 'node:zlib';

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

/**
 * Round each rect's origin and size independently rather than rounding its
 * edges. At 16px, rounding edges lands the stem on 3px — 18.75% of the icon,
 * where the design is 4.7/32 = 14.7%. Rounding the width lands it on 2px.
 */
function snapRects(size) {
  const s = size / GRID;
  return bars(E).map(([x, y, w, h]) => [
    Math.round(x * s),
    Math.round(y * s),
    Math.round(w * s),
    Math.round(h * s),
  ]);
}

function inRoundRect(px, py, size, r) {
  if (px < 0 || py < 0 || px > size || py > size) return false;
  if (r <= 0) return true;
  const cx = Math.min(Math.max(px, r), size - r);
  const cy = Math.min(Math.max(py, r), size - r);
  const dx = px - cx;
  const dy = py - cy;
  return dx * dx + dy * dy <= r * r;
}

const SUB = 4;

/**
 * RGBA buffer, 4x4 supersampled. Colour is averaged over covered samples
 * only and alpha carries the coverage, which is the unpremultiplied result —
 * averaging straight RGB against transparent samples would darken the badge
 * edge. Pass `radius` 0 for the square, full-bleed variant iOS wants: it
 * applies its own mask, so shipping rounded corners gets them rounded twice.
 */
function render(size, radius) {
  const rects = snapRects(size);
  const out = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let ar = 0;
      let ag = 0;
      let ab = 0;
      let covered = 0;
      for (let j = 0; j < SUB; j++) {
        for (let i = 0; i < SUB; i++) {
          const px = x + (i + 0.5) / SUB;
          const py = y + (j + 0.5) / SUB;
          if (!inRoundRect(px, py, size, radius)) continue;
          const hit = rects.some(
            ([rx, ry, rw, rh]) => px >= rx && px < rx + rw && py >= ry && py < ry + rh,
          );
          const [r, g, b] = hit ? GLYPH : BADGE;
          ar += r;
          ag += g;
          ab += b;
          covered += 1;
        }
      }
      if (covered === 0) continue;
      const o = (y * size + x) * 4;
      out[o] = Math.round(ar / covered);
      out[o + 1] = Math.round(ag / covered);
      out[o + 2] = Math.round(ab / covered);
      out[o + 3] = Math.round((covered / (SUB * SUB)) * 255);
    }
  }
  return out;
}

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, 'latin1'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([length, body, crc]);
}

/** Square 8-bit RGBA PNG, filter type 0 on every scanline. */
function png(size, rgba) {
  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
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
writeFileSync(join(publicDir, 'apple-touch-icon.png'), png(180, render(180, 0)));
console.log('wrote public/favicon.svg, public/apple-touch-icon.png');
