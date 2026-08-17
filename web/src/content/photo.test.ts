/// <reference types="node" />
import { existsSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { profile } from './profile';
import { jsonLdForPage } from '../lib/aio/json-ld';
import { buildPages } from '../lib/aio/pages';

// Reading files off disk needs just enough of @types/node per-file; same
// reason and same shape as favicon.test.ts.
const webRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const paths = [profile.photo.avatar, profile.photo.full];

/**
 * The failure these guard is renaming or dropping a file in public/ and
 * leaving the reference behind. Nothing else catches it: the avatar becomes a
 * broken image in the About hero, and `Person.image` becomes a 404 that only a
 * search engine ever follows — so it would be wrong for a long time before
 * anyone noticed.
 */
describe('author photo', () => {
  it.each(paths)('%s exists in public/', (path) => {
    expect(existsSync(join(webRoot, 'public', path))).toBe(true);
  });

  it('keeps the above-the-fold avatar small', () => {
    // It sits in the About hero and is not lazy-loaded. This is a ceiling, not
    // a target — it exists so a future re-export at full resolution does not
    // quietly land 90 KB above the fold.
    const bytes = statSync(join(webRoot, 'public', profile.photo.avatar)).size;
    expect(bytes).toBeLessThan(30_000);
  });

  it('points Person.image at an absolute URL for the large variant', () => {
    const base = 'https://example.test';
    const page = buildPages('en').find((p) => p.routePath === '/about')!;
    const graph = jsonLdForPage(page, base, 'Test Site')['@graph'] as Record<string, unknown>[];
    const person = graph.find((n) => n['@type'] === 'Person')!;

    // Relative here is the classic reason an entity card renders with no
    // image, so absolute is the property worth pinning — not the exact path.
    expect(person.image).toBe(`${base}${profile.photo.full}`);
    expect(String(person.image)).toMatch(/^https:\/\//);
  });

  it('gives the large variant to crawlers and the small one to the page', () => {
    expect(profile.photo.avatar).not.toBe(profile.photo.full);
    const avatar = statSync(join(webRoot, 'public', profile.photo.avatar)).size;
    const full = statSync(join(webRoot, 'public', profile.photo.full)).size;
    expect(full).toBeGreaterThan(avatar);
  });
});
