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
  it('runs the theme script before the inlined styles', () => {
    // Synthesised, because the source index.html has no stylesheet link — Vite
    // injects one at build time and this task then inlines it. Reading the
    // source file directly is what made the previous version of this test
    // assert nothing. The link goes in alongside the marker rather than in
    // place of it: Vite injects the tag, it does not consume the aio:head
    // comment, and renderDocument needs that marker intact to fill the head.
    const withLink = template.replace(
      '<!--aio:head-->',
      '<!--aio:head--><link rel="stylesheet" crossorigin href="/assets/index-abc.css">',
    );
    const html = renderDocument({
      template: withLink,
      page: home,
      head: '',
      app: '',
      css: '.x{color:red}',
    });

    expect(html.indexOf('pulse-theme')).toBeLessThan(html.indexOf('<style>'));
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

describe('inlined stylesheet', () => {
  it('inlines the css and drops the blocking link', () => {
    // See the comment above on the marker/link ordering.
    const withLink = template.replace(
      '<!--aio:head-->',
      '<!--aio:head--><link rel="stylesheet" crossorigin href="/assets/index-abc.css">',
    );
    const html = renderDocument({
      template: withLink,
      page: home,
      head: '',
      app: '',
      css: '.x{color:red}',
    });

    expect(html).toContain('<style>.x{color:red}</style>');
    expect(html).not.toContain('rel="stylesheet"');
  });

  it('leaves the document alone when no css is passed', () => {
    const withLink = template.replace(
      '<!--aio:head-->',
      '<!--aio:head--><link rel="stylesheet" crossorigin href="/assets/index-abc.css">',
    );
    expect(renderDocument({ template: withLink, page: home, head: '', app: '' })).toContain(
      'rel="stylesheet"',
    );
  });

  it('escapes a closing style tag in the css so it cannot break out', () => {
    const html = renderDocument({
      template,
      page: home,
      head: '',
      app: '',
      css: 'a{content:"</style><script>x</script>"}',
    });
    // The raw, unescaped breakout sequence must not survive — a literal
    // "<script>x</script>" is still present as inert text inside <style>
    // (HTML treats style/script as raw-text elements: nothing inside is
    // parsed as a tag until the literal closing sequence is seen), but the
    // browser can only be fooled into leaving that raw-text mode early if
    // "</style>" itself appears unescaped, which is exactly what this blocks.
    expect(html).not.toContain('</style><script>x</script>');
  });
});

describe('route chunk preload', () => {
  it('emits a modulepreload for each extra chunk', () => {
    const html = renderDocument({
      template,
      page: home,
      head: '',
      app: '',
      modulePreloads: ['/assets/index-abc.js'],
    });
    expect(html).toContain('<link rel="modulepreload" crossorigin href="/assets/index-abc.js">');
  });

  it('adds nothing when there is nothing to preload', () => {
    const html = renderDocument({ template, page: home, head: '', app: '', modulePreloads: [] });
    expect(html).not.toContain('rel="modulepreload"');
  });

  it('escapes the href so a filename can never break out of the attribute', () => {
    const html = renderDocument({
      template,
      page: home,
      head: '',
      app: '',
      modulePreloads: ['/assets/a".js'],
    });
    expect(html).toContain('&quot;');
  });
});
