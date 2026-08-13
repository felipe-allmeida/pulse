/**
 * The AIO (AI-search optimization) build step.
 *
 * Pulse is a client-rendered SPA: the HTML Caddy serves is an empty `#root`
 * plus a script tag. Browsers are fine with that; the crawlers that feed
 * answer engines are not — GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot and
 * CCBot fetch the HTML and never execute the bundle, so without this step they
 * index a blank page and the site can never be cited in an AI answer.
 *
 * So at build time this plugin takes the one `index.html` Vite produced and
 * writes a real document per route from it: correct `<title>`, description,
 * canonical, Open Graph, a Schema.org `@graph`, and a `<noscript>` mirror of
 * the page's text. Alongside them go `robots.txt`, `sitemap.xml`, `llms.txt`,
 * `llms-full.txt`, and a markdown mirror of every route.
 *
 * The app itself is untouched: every emitted document still boots the same SPA
 * from the same asset graph, so a browser landing on `/about.html` gets the
 * React app exactly as before. Caddy's `try_files` is what maps `/about` to
 * `about.html` (see `deploy/Caddyfile`).
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import type { Plugin } from 'vite';
import { resolveSiteUrl, site } from '../src/content/site';
import { buildPages } from '../src/lib/aio/pages';
import { renderHead, renderStaticBody } from '../src/lib/aio/render';
import {
  renderLlmsFullTxt,
  renderLlmsTxt,
  renderPageMarkdown,
  renderRobotsTxt,
  renderSitemap,
} from '../src/lib/aio/files';
import { profile } from '../src/content/profile';

/** Placeholders in `index.html` that every emitted document fills in. */
export const HEAD_MARKER = '<!--aio:head-->';
export const BODY_MARKER = '<!--aio:body-->';

export interface AioOptions {
  /** Canonical origin. Defaults to `PULSE_SITE_URL`, then the prod hostname. */
  siteUrl?: string;
  /** `<lastmod>` value; injectable so the sitemap is testable. */
  lastmod?: string;
}

/** `/projects/pulse` → `projects/pulse`; `/` → `index`. */
function basenameForPath(path: string): string {
  return path === '/' ? 'index' : path.replace(/^\//, '');
}

function write(outDir: string, relativePath: string, contents: string): void {
  const target = join(outDir, relativePath);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, contents, 'utf8');
}

export function aio(options: AioOptions = {}): Plugin {
  const base = resolveSiteUrl(options.siteUrl ?? process.env.PULSE_SITE_URL);

  return {
    name: 'pulse-aio',

    /**
     * Dev only: fill the markers with the home page's tags so `pnpm dev` shows
     * the same title and metadata the built site serves, instead of two
     * stray HTML comments.
     */
    transformIndexHtml(html, ctx) {
      if (!ctx.server) return html;
      const home = buildPages()[0];
      return html
        .replace(HEAD_MARKER, renderHead(home, base, site.name, profile.name))
        .replace(BODY_MARKER, renderStaticBody(home));
    },

    /** Runs once the bundle (including `index.html`) is on disk. */
    writeBundle(outputOptions) {
      const outDir = outputOptions.dir;
      if (!outDir) return;

      const template = readFileSync(join(outDir, 'index.html'), 'utf8');
      if (!template.includes(HEAD_MARKER)) {
        // The markers are the contract between index.html and this plugin. If
        // they are gone the build would silently ship un-optimized documents,
        // which is exactly the failure this plugin exists to prevent.
        throw new Error(
          `[pulse-aio] "${HEAD_MARKER}" not found in the built index.html — restore the marker in web/index.html.`,
        );
      }

      const pages = buildPages();
      const lastmod = options.lastmod ?? new Date().toISOString().slice(0, 10);

      for (const page of pages) {
        const html = template
          .replace(HEAD_MARKER, renderHead(page, base, site.name, profile.name))
          .replace(BODY_MARKER, renderStaticBody(page));
        write(outDir, page.file, html);
        write(outDir, `${basenameForPath(page.path)}.md`, renderPageMarkdown(page, base));
      }

      write(outDir, 'robots.txt', renderRobotsTxt(base));
      write(outDir, 'sitemap.xml', renderSitemap(pages, base, lastmod));
      write(outDir, 'llms.txt', renderLlmsTxt(pages, base));
      write(outDir, 'llms-full.txt', renderLlmsFullTxt(pages, base));

      this.info?.(`[pulse-aio] ${pages.length} documents + markdown mirrors emitted for ${base}`);
    },
  };
}
