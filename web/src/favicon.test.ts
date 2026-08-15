/// <reference types="node" />
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// The triple-slash reference is here for the same reason as in
// styles.test.ts: the app tsconfig carries browser lib/types only, so reading
// a file off disk needs just enough of @types/node pulled in per-file.
const webRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(webRoot, 'index.html'), 'utf-8');

const iconHrefs = [...html.matchAll(/<link[^>]*\srel="[^"]*icon[^"]*"[^>]*>/g)]
  .map(([tag]) => /\shref="([^"]+)"/.exec(tag)?.[1])
  .filter((href): href is string => href !== undefined);

/**
 * The failure this guards is renaming or dropping an artifact in public/ and
 * leaving the link behind — a favicon 404s silently, so nothing else catches
 * it. Rendering fidelity is deliberately not asserted: the generator is
 * deterministic and its output is committed, so a bad render is a review
 * question, not a test failure.
 */
describe('favicon links', () => {
  it('declares the ico, the svg, and the apple-touch icon', () => {
    expect(iconHrefs).toEqual(['/favicon.ico', '/favicon.svg', '/apple-touch-icon.png']);
  });

  it.each(iconHrefs)('%s exists in public/', (href) => {
    expect(existsSync(join(webRoot, 'public', href))).toBe(true);
  });
});
