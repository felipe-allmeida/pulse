/// <reference types="node" />
import { readFileSync } from 'node:fs';
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
