/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { buildPages } from './lib/aio/pages';
import { renderDocument } from './lib/aio/render';

// Reading index.html off disk follows favicon.test.ts / styles.test.ts.
const webRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const template = readFileSync(join(webRoot, 'index.html'), 'utf-8');

const home = buildPages('en')[0];
const ptHome = buildPages('pt-BR')[0];

describe('theme resolution before first paint', () => {
  it('runs the theme script before any stylesheet, so it beats the paint', () => {
    const script = template.indexOf('pulse-theme');
    expect(script).toBeGreaterThan(-1);

    const stylesheet = template.search(/<link[^>]+rel="stylesheet"/);
    // -1 means Vite injects it at build time, i.e. after everything authored
    // here — which also satisfies the ordering requirement.
    if (stylesheet !== -1) expect(script).toBeLessThan(stylesheet);
  });

  it('uses no async attribute, since a deferred script cannot beat the paint', () => {
    const tag = /<script(?![^>]*\ssrc=)[^>]*>/.exec(template)?.[0] ?? '';
    expect(tag).not.toContain('async');
    expect(tag).not.toContain('defer');
    expect(tag).not.toContain('type="module"');
  });
});

describe('renderDocument', () => {
  const doc = (page = home) =>
    renderDocument({ template, page, head: '<title>t</title>', app: '<p>a</p>' });

  it('stamps the dark class, so the document matches the store default', () => {
    expect(doc()).toContain('class="dark"');
  });

  it('stamps the locale and the class in one <html> tag, not two', () => {
    const html = doc(ptHome);
    const openTags = html.match(/<html[^>]*>/g) ?? [];
    expect(openTags).toHaveLength(1);
    expect(openTags[0]).toContain('lang="pt-BR"');
    expect(openTags[0]).toContain('class="dark"');
  });

  it('fills both markers and leaves neither behind', () => {
    const html = doc();
    expect(html).toContain('<title>t</title>');
    expect(html).toContain('<p>a</p>');
    expect(html).not.toContain('<!--aio:head-->');
    expect(html).not.toContain('<!--aio:app-->');
  });

  it('refuses a template missing a marker rather than shipping a blank document', () => {
    expect(() =>
      renderDocument({ template: '<html lang="en"></html>', page: home, head: '', app: '' }),
    ).toThrow(/marker/i);
  });
});
