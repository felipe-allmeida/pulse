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
 * writes a real document per route per locale from it: correct `<title>`,
 * description, canonical, `hreflang`, Open Graph, a Schema.org `@graph`, and —
 * inside `#root` — that route's actual markup, rendered from the real
 * component tree by `src/entry-prerender.tsx`. Alongside them go `robots.txt`,
 * `sitemap.xml`, `llms.txt`, `llms-full.txt`, and a markdown mirror of every
 * route.
 *
 * The app itself is untouched: every emitted document still boots the same SPA
 * from the same asset graph, and the client mounts with `createRoot` over the
 * prerendered markup rather than hydrating it (see entry-prerender for why).
 * Caddy's `try_files` is what maps `/about` to `about.html` (see
 * `deploy/Caddyfile`).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { Plugin } from 'vite';
import type { Locale } from '../src/content/types';
import { resolveSiteUrl, site } from '../src/content/site';
import { buildAllPages, basenameForPath } from '../src/lib/aio/pages';
import { renderHead, renderDocument } from '../src/lib/aio/render';
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
export const APP_MARKER = '<!--aio:app-->';

/** Built by `vite build --ssr` in the step before the client build. */
const PRERENDER_BUNDLE = 'dist-prerender/entry-prerender.js';

export interface AioOptions {
  /** Canonical origin. Defaults to `PULSE_SITE_URL`, then the prod hostname. */
  siteUrl?: string;
  /** `<lastmod>` value; injectable so the sitemap is testable. */
  lastmod?: string;
}

interface PrerenderModule {
  renderRoute(routePath: string, locale: Locale): Promise<string>;
}

/**
 * Loads the prerender bundle. Its absence is fatal rather than a warning: a
 * build that quietly shipped empty `#root`s would look completely normal in a
 * browser and be invisible to every crawler — the exact failure this plugin
 * exists to prevent.
 */
async function loadPrerenderer(root: string): Promise<PrerenderModule> {
  const bundle = join(root, PRERENDER_BUNDLE);
  if (!existsSync(bundle)) {
    throw new Error(
      `[pulse-aio] ${PRERENDER_BUNDLE} is missing — run the prerender build first (\`pnpm build\` does both steps).`,
    );
  }
  return (await import(pathToFileURL(bundle).href)) as PrerenderModule;
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
     * Dev only: fill the head marker with the home page's tags so `pnpm dev`
     * shows the same title and metadata the built site serves, instead of a
     * stray HTML comment. The app marker stays empty — in dev the SPA mounts
     * into it as it always did.
     */
    transformIndexHtml(html, ctx) {
      if (!ctx.server) return html;
      const home = buildAllPages()[0];
      return html.replace(HEAD_MARKER, renderHead(home, base, site.name, profile.name));
    },

    /** Runs once the bundle (including `index.html`) is on disk. */
    async writeBundle(outputOptions, bundle) {
      const outDir = outputOptions.dir;
      if (!outDir) return;

      // Only the client build produces an index.html to fan out. An SSR build
      // (`vite build --ssr`) writes a JS bundle into its own outDir and has
      // nothing for this plugin to do.
      const templatePath = join(outDir, 'index.html');
      if (!existsSync(templatePath)) return;

      const template = readFileSync(templatePath, 'utf8');

      // The one stylesheet Vite emitted for the client build. Read from the
      // bundle rather than globbed off disk so it always matches this build's
      // hash.
      const cssFile = Object.keys(bundle).find((name) => name.endsWith('.css'));
      const css = cssFile ? readFileSync(join(outDir, cssFile), 'utf8') : undefined;

      const pages = buildAllPages();
      const lastmod = options.lastmod ?? new Date().toISOString().slice(0, 10);
      const { renderRoute } = await loadPrerenderer(process.cwd());

      /**
       * The chunk holding a route's component.
       *
       * The route path is NOT the route filename: `/projects/pulse` is served
       * by `routes/projects_.$slug.tsx`, and deriving one from the other by
       * string surgery gets that case wrong and silently emits no preload.
       * The mapping is small and explicit instead.
       */
      const ROUTE_FILES: Record<string, string> = {
        '/': 'routes/index',
        '/about': 'routes/about',
        '/projects': 'routes/projects',
        '/live': 'routes/live',
      };

      const chunkForRoute = (routePath: string): string | undefined => {
        // Every /projects/<slug> shares one dynamic route file.
        const routeFile = routePath.startsWith('/projects/')
          ? 'routes/projects_.$slug'
          : ROUTE_FILES[routePath];
        if (!routeFile) return undefined;

        for (const [fileName, chunk] of Object.entries(bundle)) {
          if (chunk.type !== 'chunk') continue;
          // facadeModuleId, not the chunk name — rolldown prefixes and dedupes
          // names, but the facade points at the real source module.
          if (chunk.facadeModuleId?.includes(routeFile)) return `/${fileName}`;
        }
        return undefined;
      };

      for (const page of pages) {
        const app = await renderRoute(page.routePath, page.locale);
        if (app.length < 500) {
          // Same reasoning as loadPrerenderer's throw: a document with an empty
          // #root renders fine for every human and is worthless to every
          // crawler, so nothing downstream would ever surface this.
          throw new Error(
            `[pulse-aio] ${page.path} prerendered to ${app.length} characters — expected a full document. ` +
              `Check renderRoute() for this route/locale pair.`,
          );
        }
        const routeChunk = chunkForRoute(page.routePath);
        const html = renderDocument({
          template,
          page,
          head: renderHead(page, base, site.name, profile.name),
          app,
          css,
          modulePreloads: routeChunk ? [routeChunk] : [],
        });
        write(outDir, page.file, html);
        write(outDir, `${basenameForPath(page.path)}.md`, renderPageMarkdown(page, base));

        // A locale root needs both spellings. The router, given basepath
        // `/pt`, renders its home link as `/pt/` — and `/pt/` would otherwise
        // hit the directory holding that locale's other documents, find no
        // index, and fall through to the English SPA shell. Both files carry
        // the same canonical (`/pt`), which is exactly what canonical is for.
        if (page.routePath === '/' && page.path !== '/') {
          write(outDir, `${basenameForPath(page.path)}/index.html`, html);
        }
      }

      write(outDir, 'robots.txt', renderRobotsTxt(base));
      write(outDir, 'sitemap.xml', renderSitemap(pages, base, lastmod));
      write(outDir, 'llms.txt', renderLlmsTxt(pages, base));
      write(outDir, 'llms-full.txt', renderLlmsFullTxt(pages, base));

      this.info?.(`[pulse-aio] ${pages.length} documents + markdown mirrors emitted for ${base}`);
    },
  };
}
