/**
 * Renders an `AioPage` into the `<head>` block the build step splices into
 * every emitted document.
 *
 * The body no longer comes from here: each document carries the route's real
 * markup, rendered from the component tree by `src/entry-prerender.tsx`. This
 * file owns the part a crawler reads before it reads anything else — title,
 * description, canonical, the `hreflang` set, the social card, and the
 * Schema.org graph.
 */
import type { Locale } from '../../content/types';
import { DEFAULT_LOCALE } from '../../i18n/locale-url';
import { alternatesFor, basenameForPath } from './pages';
import type { AioPage } from './pages';
import { jsonLdForPage } from './json-ld';

/** Open Graph wants underscored territory codes, not BCP-47 tags. */
const OG_LOCALE: Record<Locale, string> = { en: 'en_US', 'pt-BR': 'pt_BR' };

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Serialise JSON-LD for inlining. Escaping `<` is what stops a `</script>` in
 * any content field from closing the tag early — the classic JSON-LD XSS.
 */
export function serialiseJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

const meta = (name: string, content: string) =>
  `<meta name="${name}" content="${escapeHtml(content)}" />`;
const property = (name: string, content: string) =>
  `<meta property="${name}" content="${escapeHtml(content)}" />`;

/** Absolute URL for a public path. */
export function absoluteUrl(base: string, path: string): string {
  return path === '/' ? `${base}/` : `${base}${path}`;
}

/** `/pt/about` → `/pt/about.md`; `/` → `/index.md`; `/pt` → `/pt.md`. */
export function markdownPathFor(path: string): string {
  return `/${basenameForPath(path)}.md`;
}

export function renderHead(page: AioPage, base: string, siteName: string, author: string): string {
  const url = absoluteUrl(base, page.path);
  const alternates = alternatesFor(page.routePath);
  const ogImage = `${base}/og.png`;

  const tags = [
    `<title>${escapeHtml(page.title)}</title>`,
    meta('description', page.description),
    meta('author', author),
    // max-snippet:-1 lifts the snippet length cap — the difference between an
    // AI Overview quoting two lines of this page and quoting the answer.
    meta('robots', 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1'),
    `<link rel="canonical" href="${escapeHtml(url)}" />`,
    // Every locale of this route, plus x-default pointing at the unprefixed
    // English URL — the version to serve anyone the others do not match.
    ...alternates.map(
      (alternate) =>
        `<link rel="alternate" hreflang="${alternate.locale}" href="${escapeHtml(absoluteUrl(base, alternate.path))}" />`,
    ),
    `<link rel="alternate" hreflang="x-default" href="${escapeHtml(
      absoluteUrl(base, alternates.find((a) => a.locale === DEFAULT_LOCALE)!.path),
    )}" />`,
    // Markdown mirror of this exact route, for agents that prefer it.
    `<link rel="alternate" type="text/markdown" href="${escapeHtml(markdownPathFor(page.path))}" title="Markdown version" />`,
    property('og:type', page.routePath === '/about' ? 'profile' : 'website'),
    property('og:site_name', siteName),
    property('og:title', page.title),
    property('og:description', page.description),
    property('og:url', url),
    property('og:locale', OG_LOCALE[page.locale]),
    ...alternates
      .filter((alternate) => alternate.locale !== page.locale)
      .map((alternate) => property('og:locale:alternate', OG_LOCALE[alternate.locale])),
    // One site-wide card rather than one per route: the image says who this is,
    // which is the same answer on every page. Absolute URL — relative og:image
    // is the single most common reason a preview renders blank.
    property('og:image', ogImage),
    property('og:image:width', '1200'),
    property('og:image:height', '630'),
    property('og:image:alt', `${author} — ${siteName}`),
    meta('twitter:card', 'summary_large_image'),
    meta('twitter:title', page.title),
    meta('twitter:description', page.description),
    meta('twitter:image', ogImage),
    `<script type="application/ld+json">${serialiseJsonLd(jsonLdForPage(page, base, siteName))}</script>`,
  ];

  return tags.join('\n    ');
}

/** Placeholders in index.html that every emitted document fills in. */
const HEAD_MARKER = '<!--aio:head-->';
const APP_MARKER = '<!--aio:app-->';

export interface DocumentOptions {
  /** The built index.html, with both markers still in place. */
  template: string;
  page: AioPage;
  /** Output of `renderHead()`. */
  head: string;
  /** Prerendered markup for `#root`. */
  app: string;
  /**
   * Built stylesheet source. Inlined into a <style> and the blocking <link>
   * removed — 450ms of round trip on the audited profile, for 10 KB gzipped
   * that these documents cannot cache anyway (they are served no-cache, since
   * each embeds the hashed asset names).
   */
  css?: string;
}

/**
 * Assembles one emitted document.
 *
 * This exists so there is a single place a document is put together. It used
 * to be a chain of `.replace()` calls inside the build plugin, which meant
 * every new thing a document needed — the theme class here, the inlined CSS
 * and route preload later — added another link to that chain, untested,
 * inside a Vite hook.
 *
 * The `dark` class is stamped in the same substitution as `lang`, rather than
 * a second one: they both rewrite the opening `<html>` tag, and two
 * independent replacements over the same tag is how you end up with one of
 * them silently winning.
 */
export function renderDocument({ template, page, head, app, css }: DocumentOptions): string {
  if (!template.includes(HEAD_MARKER) || !template.includes(APP_MARKER)) {
    throw new Error(
      `[pulse-aio] "${HEAD_MARKER}" / "${APP_MARKER}" not found in the built index.html — restore the markers in web/index.html.`,
    );
  }

  let html = template
    .replace('<html lang="en">', `<html lang="${page.locale}" class="dark">`)
    .replace(HEAD_MARKER, head)
    .replace(APP_MARKER, app);

  if (css) {
    // `</style>` inside a string literal in the CSS would close the tag early
    // and hand the rest of the sheet to the HTML parser — the stylesheet
    // equivalent of the JSON-LD escape in serialiseJsonLd above.
    const safe = css.replace(/<\/style/gi, '<\\/style');
    html = html
      .replace(/<link[^>]+rel="stylesheet"[^>]*>/g, '')
      .replace('</head>', `<style>${safe}</style></head>`);
  }

  return html;
}
