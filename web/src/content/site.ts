/**
 * Site-level identity, used by the AIO (AI-search optimization) build step to
 * generate the static head tags, JSON-LD, sitemap, and the `llms.txt` family.
 *
 * Everything here is *build-time* content: it has to end up in the HTML that
 * a non-JS crawler receives, so it cannot depend on i18next or any React
 * runtime. Route-level copy lives in `@/lib/aio/pages`; this file is only the
 * things that describe the site as a whole.
 */

/**
 * Canonical origin, no trailing slash. Matches the prod hostname Nginx Proxy
 * Manager fronts (see `deploy/compose.prod.yml`). Overridable at build time
 * with `PULSE_SITE_URL=https://example.com pnpm build` so a preview deploy
 * doesn't emit canonicals pointing at prod.
 */
export const DEFAULT_SITE_URL = 'https://pulse.felipealmeida.tech';

export interface SiteConfig {
  url: string;
  /** `<title>` suffix and the `WebSite`/`ProfilePage` name. */
  name: string;
  shortName: string;
  /** Default `<meta name="description">` — overridden per route. */
  description: string;
  locale: string;
  /** Profiles an AI answer can cite as corroboration; feeds `Person.sameAs`. */
  sameAs: string[];
}

export const site: SiteConfig = {
  url: DEFAULT_SITE_URL,
  name: 'Felipe de Almeida — Software Engineer & Architect',
  shortName: 'Felipe de Almeida',
  description:
    'Felipe de Almeida is a software engineer and architect specialising in distributed systems, event-driven architecture, and cloud infrastructure with .NET and React. Pulse is his portfolio: a live, real-time distributed system you can watch running.',
  locale: 'en',
  sameAs: ['https://github.com/felipe-allmeida', 'https://www.linkedin.com/in/felipe-allmeida'],
};

/** Resolve the origin for this build, honouring the `PULSE_SITE_URL` override. */
export function resolveSiteUrl(override?: string): string {
  const raw = (override ?? DEFAULT_SITE_URL).trim();
  return raw.endsWith('/') ? raw.slice(0, -1) : raw;
}
