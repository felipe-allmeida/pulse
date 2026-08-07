/// <reference types="node" />
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// The app tsconfig only carries browser lib/types (no `node`), and vitest's
// `css: false` stubs `*.css`/`*.css?raw` imports to an empty string, so
// reading the stylesheet's raw source needs Node's `fs` directly rather than
// an import — the triple-slash reference above pulls in just enough of
// `@types/node` (already a devDependency, for vite.config.ts) for this file
// without adding "node" to the app-wide tsconfig.
const currentDir = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(join(currentDir, 'styles.css'), 'utf-8');

/**
 * `--chart-1` feeds `stat-card`'s sparkline, `live-map`'s choropleth +
 * points, and `visits-chart`'s area/stroke — every component reads it via
 * `var(--color-chart-1)` rather than a hardcoded color, so repointing this
 * one token is what fixes the blue everywhere at once. This test locks the
 * token itself (jsdom never resolves CSS custom properties from an external
 * stylesheet, so component tests can't observe it) to the signal-aqua
 * family and guards against the old blue regressing back in.
 */
function extractThemeBlock(source: string, selector: string): string {
  const start = source.indexOf(`${selector} {`);
  if (start === -1) throw new Error(`Could not find "${selector}" block in styles.css`);
  const end = source.indexOf('}', start);
  return source.slice(start, end);
}

function extractToken(block: string, name: string): string {
  const match = block.match(new RegExp(`--${name}:\\s*([^;]+);`));
  if (!match) throw new Error(`Could not find --${name} in block`);
  return match[1].trim();
}

describe('data-viz palette (styles.css)', () => {
  it('does not use the old blue for --chart-1 in the dark theme', () => {
    const darkBlock = extractThemeBlock(css, '.dark');
    const chart1 = extractToken(darkBlock, 'chart-1');
    expect(chart1).not.toBe('220 70% 50%');
  });

  it('points --chart-1 at the signal-aqua hue in the dark theme (~170deg, matching --color-signal)', () => {
    const darkBlock = extractThemeBlock(css, '.dark');
    const chart1 = extractToken(darkBlock, 'chart-1');
    const hue = Number(chart1.split(' ')[0]);
    expect(hue).toBeGreaterThanOrEqual(160);
    expect(hue).toBeLessThanOrEqual(185);
  });

  it('keeps the light theme chart ramp in the same signal-aqua family (~155-190deg) rather than the old unrelated orange/teal/yellow/orange set', () => {
    const rootBlock = extractThemeBlock(css, ':root');
    for (const name of ['chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5']) {
      const value = extractToken(rootBlock, name);
      const hue = Number(value.split(' ')[0]);
      expect(hue).toBeGreaterThanOrEqual(155);
      expect(hue).toBeLessThanOrEqual(190);
    }
  });

  it('keeps --chart-2..5 in the dark theme within the same aqua/neutral family as --chart-1', () => {
    const darkBlock = extractThemeBlock(css, '.dark');
    for (const name of ['chart-2', 'chart-3', 'chart-4', 'chart-5']) {
      const value = extractToken(darkBlock, name);
      const hue = Number(value.split(' ')[0]);
      expect(hue).toBeGreaterThanOrEqual(155);
      expect(hue).toBeLessThanOrEqual(190);
    }
  });
});

/**
 * Every content surface used to pin `className="dark"` unconditionally
 * (app-shell, hero, showcase, about, projects, project-detail, live-page,
 * top-nav, ask-widget, routes/index) — the theme toggle only ever repainted
 * the leftover gutter around them. This walks every non-test `.tsx` source
 * file and fails if any `className` still hardcodes the `dark` token, so a
 * regression here is caught the same way the old bug would have been.
 */
function collectTsxFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stats = statSync(full);
    if (stats.isDirectory()) {
      collectTsxFiles(full, out);
    } else if (entry.endsWith('.tsx') && !entry.endsWith('.test.tsx')) {
      out.push(full);
    }
  }
  return out;
}

function classNameStringsIn(source: string): string[] {
  const found: string[] = [];
  for (const match of source.matchAll(/className="([^"]*)"/g)) {
    found.push(match[1]);
  }
  // Also catch `className={cn('...', ...)}` — the first literal argument to
  // a `cn(...)` call reached via `className={cn(...)}`, single- or
  // double-quoted, which is the other shape pinned classes appear in.
  for (const match of source.matchAll(/className=\{cn\(\s*['"]([^'"]*)['"]/g)) {
    found.push(match[1]);
  }
  return found;
}

describe('no component pins the dark surface (styles.test.ts + component sources)', () => {
  const srcDir = join(currentDir);
  const tsxFiles = collectTsxFiles(srcDir);

  it('found tsx source files to scan (sanity check the walk itself works)', () => {
    expect(tsxFiles.length).toBeGreaterThan(20);
  });

  it('has no className that hardcodes the `dark` token', () => {
    const offenders: string[] = [];
    for (const file of tsxFiles) {
      const source = readFileSync(file, 'utf-8');
      for (const classList of classNameStringsIn(source)) {
        const tokens = classList.split(/\s+/).filter(Boolean);
        if (tokens.includes('dark')) {
          offenders.push(`${file}: "${classList}"`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});

describe('light-theme accent-text contrast (--color-signal-strong on --background)', () => {
  function hslToRgb(h: number, s: number, l: number): [number, number, number] {
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;
    let r = 0;
    let g = 0;
    let b = 0;
    if (h < 60) [r, g, b] = [c, x, 0];
    else if (h < 120) [r, g, b] = [x, c, 0];
    else if (h < 180) [r, g, b] = [0, c, x];
    else if (h < 240) [r, g, b] = [0, x, c];
    else if (h < 300) [r, g, b] = [x, 0, c];
    else [r, g, b] = [c, 0, x];
    return [r + m, g + m, b + m];
  }

  function relativeLuminance([r, g, b]: [number, number, number]): number {
    const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  }

  function contrastRatio(a: number, b: number): number {
    const lighter = Math.max(a, b);
    const darker = Math.min(a, b);
    return (lighter + 0.05) / (darker + 0.05);
  }

  function parseHslToken(value: string): [number, number, number] {
    const [h, sPct, lPct] = value.split(/\s+/);
    return [Number(h), Number(sPct.replace('%', '')) / 100, Number(lPct.replace('%', '')) / 100];
  }

  it('meets WCAG AA (>=4.5:1) for --signal-strong text on the light-theme --background', () => {
    const rootBlock = extractThemeBlock(css, ':root');
    const signalStrong = hslToRgb(...parseHslToken(extractToken(rootBlock, 'signal-strong')));
    const background = hslToRgb(...parseHslToken(extractToken(rootBlock, 'background')));

    const ratio = contrastRatio(relativeLuminance(signalStrong), relativeLuminance(background));
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it('the bright dark-mode --color-signal would NOT pass AA as text on the light --background (documents why --signal-strong exists)', () => {
    // #3ae0c4 == hsl(170, 73%, 55%), the fixed accent-fill/dark-mode value.
    const bright = hslToRgb(170, 0.73, 0.55);
    const rootBlock = extractThemeBlock(css, ':root');
    const background = hslToRgb(...parseHslToken(extractToken(rootBlock, 'background')));

    const ratio = contrastRatio(relativeLuminance(bright), relativeLuminance(background));
    expect(ratio).toBeLessThan(4.5);
  });
});
