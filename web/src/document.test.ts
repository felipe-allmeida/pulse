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

describe('substitution patterns in the substituted content', () => {
  /*
    `$&`, `` $` ``, `$'` and `$$` are special in a `String.replace`
    *replacement*, so anything spliced into a document that happens to contain
    them would be rewritten on the way in — and quietly: the output is a valid
    document, just the wrong one. The values here are a prerendered component
    tree, a whole stylesheet, a head block of arbitrary prose and JSON-LD, and
    bundler filenames. `$&` is the worst of them: it expands to the marker's own
    text, so `<!--aio:app-->` would reappear in the finished document.
  */
  it('keeps a dollar sequence in the app markup literal', () => {
    const html = renderDocument({
      template,
      page: home,
      head: '',
      app: '<p>Rates from $&amp;up — 100$$ a seat</p>',
    });

    expect(html).toContain('<p>Rates from $&amp;up — 100$$ a seat</p>');
    expect(html).not.toContain('<!--aio:app-->');
  });

  it('keeps a dollar sequence in the head literal', () => {
    const html = renderDocument({
      template,
      page: home,
      head: `<meta name="description" content="$\` and $' and $&" />`,
      app: '',
    });

    expect(html).toContain(`content="$\` and $' and $&"`);
    expect(html).not.toContain('<!--aio:head-->');
  });

  it('keeps a dollar sequence in the css literal', () => {
    const html = renderDocument({
      template,
      page: home,
      head: '',
      app: '',
      css: '.price::after{content:"$&"}',
    });

    expect(html).toContain('<style>.price::after{content:"$&"}</style>');
    // `$&` in a replacement expands to the matched text — here `</head>`, which
    // would put a second one into the document.
    expect(html.match(/<\/head>/g)).toHaveLength(1);
  });

  it('keeps a dollar sequence in a preloaded filename literal', () => {
    const html = renderDocument({
      template,
      page: home,
      head: '',
      app: '',
      // `$$` rather than `$&`: escapeHtml would turn the `&` into `&amp;`
      // first, which hides what is being tested. `$$` collapses to a single
      // `$` in a replacement string and is left alone by escapeHtml.
      modulePreloads: ['/assets/route-$$-abc.js'],
    });

    expect(html).toContain('href="/assets/route-$$-abc.js"');
    expect(html.match(/<\/head>/g)).toHaveLength(1);
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

  it('emits the preloads and the inlined css together, preloads first', () => {
    // Every real emitted document has both, and they are the two things that
    // rewrite `</head>` — the only place in this file where two substitutions
    // target the same anchor. Tested apart, each one passes while their
    // interaction (one of them eating the other's anchor, or landing after the
    // head closes) goes unchecked. This is the pairing the build actually
    // produces; see web/plugins/aio.ts.
    const withLink = template.replace(
      '<!--aio:head-->',
      '<!--aio:head--><link rel="stylesheet" crossorigin href="/assets/index-abc.css">',
    );
    const html = renderDocument({
      template: withLink,
      page: home,
      head: '<title>t</title>',
      app: '<p>a</p>',
      css: '.x{color:red}',
      modulePreloads: ['/assets/about-abc.js'],
    });

    const preload = html.indexOf('<link rel="modulepreload" crossorigin href="/assets/about-abc.js">');
    const style = html.indexOf('<style>.x{color:red}</style>');
    const headClose = html.indexOf('</head>');

    expect(preload).toBeGreaterThan(-1);
    expect(style).toBeGreaterThan(-1);
    // Both inside the head, and the preloads ahead of the stylesheet: those
    // fetches should start before the parser walks 10 KB of inlined CSS.
    expect(preload).toBeLessThan(style);
    expect(style).toBeLessThan(headClose);
    // The blocking link is still gone — the css path did not lose its own
    // effect by running second.
    expect(html).not.toContain('rel="stylesheet"');
    // And exactly one head close survived both rewrites.
    expect(html.match(/<\/head>/g)).toHaveLength(1);
  });
});
