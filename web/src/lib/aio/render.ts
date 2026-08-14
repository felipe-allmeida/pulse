/**
 * Renders an `AioPage` into the two chunks the build step splices into the
 * built `index.html`: the `<head>` block and the static body fallback.
 *
 * The body fallback lives in `<noscript>`. That is a deliberate trade: a
 * crawler fetching the raw HTML gets the full text of the route, while a real
 * browser — which runs the SPA — never paints it, so there is no flash of
 * duplicate content and nothing is hidden from users that is shown to
 * crawlers. The markdown mirrors (`/about.md`, linked from `<head>` and from
 * `llms.txt`) cover the extraction pipelines that strip `<noscript>` before
 * chunking.
 */
import type { AioPage } from './pages';
import { jsonLdForPage } from './json-ld';

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

/** Absolute URL for a route path. */
export function absoluteUrl(base: string, path: string): string {
  return path === '/' ? `${base}/` : `${base}${path}`;
}

export function renderHead(page: AioPage, base: string, siteName: string, author: string): string {
  const url = absoluteUrl(base, page.path);
  const markdownPath = page.path === '/' ? '/index.md' : `${page.path}.md`;

  const tags = [
    `<title>${escapeHtml(page.title)}</title>`,
    meta('description', page.description),
    meta('author', author),
    // max-snippet:-1 lifts the snippet length cap — the difference between an
    // AI Overview quoting two lines of this page and quoting the answer.
    meta('robots', 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1'),
    `<link rel="canonical" href="${escapeHtml(url)}" />`,
    // Markdown mirror of this exact route, for agents that prefer it.
    `<link rel="alternate" type="text/markdown" href="${escapeHtml(markdownPath)}" title="Markdown version" />`,
    property('og:type', page.path === '/about' ? 'profile' : 'website'),
    property('og:site_name', siteName),
    property('og:title', page.title),
    property('og:description', page.description),
    property('og:url', url),
    property('og:locale', 'en'),
    // One site-wide card rather than one per route: the image says who this is,
    // which is the same answer on every page. Absolute URL — relative og:image
    // is the single most common reason a preview renders blank.
    property('og:image', `${base}/og.png`),
    property('og:image:width', '1200'),
    property('og:image:height', '630'),
    property('og:image:alt', `${author} — ${siteName}`),
    meta('twitter:card', 'summary_large_image'),
    meta('twitter:title', page.title),
    meta('twitter:description', page.description),
    meta('twitter:image', `${base}/og.png`),
    `<script type="application/ld+json">${serialiseJsonLd(jsonLdForPage(page, base, siteName))}</script>`,
  ];

  return tags.join('\n    ');
}

/** The `<noscript>` mirror of the route's content. */
export function renderStaticBody(page: AioPage): string {
  const parts: string[] = [`<h1>${escapeHtml(page.heading)}</h1>`, `<p>${escapeHtml(page.description)}</p>`];

  for (const section of page.sections) {
    parts.push(`<h2>${escapeHtml(section.heading)}</h2>`);
    for (const paragraph of section.paragraphs ?? []) {
      parts.push(`<p>${escapeHtml(paragraph)}</p>`);
    }
    if (section.bullets?.length) {
      parts.push(`<ul>${section.bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join('')}</ul>`);
    }
  }

  return `<noscript>\n      <article>\n        ${parts.join('\n        ')}\n      </article>\n    </noscript>`;
}
