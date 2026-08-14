import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { projects } from '../../content/projects';
import { profile } from '../../content/profile';
import { buildPages, pageForPath } from './pages';
import { jsonLdForPage } from './json-ld';
import { renderHead, renderStaticBody, serialiseJsonLd } from './render';
import {
  AI_USER_AGENTS,
  renderLlmsFullTxt,
  renderLlmsTxt,
  renderPageMarkdown,
  renderRobotsTxt,
  renderSitemap,
} from './files';

const BASE = 'https://example.test';
const SITE_NAME = 'Test Site';
const pages = buildPages();
const page = (path: string) => {
  const found = pages.find((p) => p.path === path);
  if (!found) throw new Error(`no AIO page for ${path}`);
  return found;
};

/** The `@graph` nodes of a page, by `@type`. */
function nodesOfType(path: string, type: string): Record<string, unknown>[] {
  const graph = jsonLdForPage(page(path), BASE, SITE_NAME)['@graph'] as Record<string, unknown>[];
  return graph.filter((n) => n['@type'] === type);
}

describe('pages', () => {
  it('covers every public route, each with a title and description', () => {
    const paths = pages.map((p) => p.path);
    expect(paths).toEqual(
      expect.arrayContaining(['/', '/about', '/projects', '/live', '/watched', ...projects.map((p) => `/projects/${p.slug}`)]),
    );
    expect(new Set(paths).size).toBe(paths.length);
    for (const p of pages) {
      expect(p.title.length).toBeGreaterThan(10);
      // Long enough to be a real answer, short enough that Google does not
      // truncate it in a snippet.
      expect(p.description.length).toBeGreaterThan(50);
      expect(p.sections.length).toBeGreaterThan(0);
    }
  });

  it('emits nested project routes into a matching file path', () => {
    expect(page('/projects/pulse').file).toBe('projects/pulse.html');
    expect(page('/').file).toBe('index.html');
  });

  it('resolves a live pathname, trailing slash and all, and nothing for unknown routes', () => {
    expect(pageForPath('/about')?.path).toBe('/about');
    expect(pageForPath('/about/')?.path).toBe('/about');
    expect(pageForPath('/')?.path).toBe('/');
    expect(pageForPath('/nope')).toBeUndefined();
  });
});

describe('head', () => {
  const head = renderHead(page('/about'), BASE, SITE_NAME, profile.name);

  it('carries canonical, description, Open Graph and a snippet-uncapped robots tag', () => {
    expect(head).toContain(`<link rel="canonical" href="${BASE}/about" />`);
    expect(head).toContain('<meta name="description"');
    expect(head).toContain(`<meta property="og:url" content="${BASE}/about" />`);
    // Without max-snippet:-1 an AI Overview may only quote a two-line excerpt.
    expect(head).toContain('max-snippet:-1');
  });

  it('points the social card at an absolute image URL', () => {
    // A relative og:image is the most common reason a link preview renders blank.
    expect(head).toContain(`<meta property="og:image" content="${BASE}/og.png" />`);
    expect(head).toContain('<meta name="twitter:card" content="summary_large_image" />');
    expect(head).toContain(`<meta name="twitter:image" content="${BASE}/og.png" />`);
  });

  it('points at the markdown mirror of the same route', () => {
    expect(head).toContain('<link rel="alternate" type="text/markdown" href="/about.md"');
    expect(renderHead(page('/'), BASE, SITE_NAME, profile.name)).toContain('href="/index.md"');
  });

  it('escapes JSON-LD so content can never close the script tag', () => {
    expect(serialiseJsonLd({ a: '</script><img>' })).not.toContain('</script>');
    expect(serialiseJsonLd({ a: '</script>' })).toContain('\\u003c/script>');
  });

  it('embeds parseable JSON-LD', () => {
    const raw = head.match(/<script type="application\/ld\+json">(.*)<\/script>/s)?.[1];
    expect(raw).toBeTruthy();
    expect(() => JSON.parse(raw!.replace(/\\u003c/g, '<'))).not.toThrow();
  });
});

describe('json-ld', () => {
  it('describes the person identically on every page, under one @id', () => {
    for (const p of pages) {
      const [person] = nodesOfType(p.path, 'Person');
      expect(person['@id']).toBe(`${BASE}/#person`);
      expect(person.name).toBe(profile.name);
      expect(person.sameAs).toContain('https://github.com/felipe-allmeida');
      expect(person.knowsAbout).toContain('.NET / ASP.NET Core');
    }
  });

  it('marks /about as a ProfilePage whose main entity is that person', () => {
    const [profilePage] = nodesOfType('/about', 'ProfilePage');
    expect(profilePage.mainEntity).toEqual({ '@id': `${BASE}/#person` });
  });

  it('types public work as source code with a repo, private work as CreativeWork', () => {
    const [pulse] = nodesOfType('/projects/pulse', 'SoftwareSourceCode');
    expect(pulse.codeRepository).toMatch(/github\.com/);
    expect(nodesOfType('/projects/ulbra-one', 'SoftwareSourceCode')).toHaveLength(0);
    const [ulbra] = nodesOfType('/projects/ulbra-one', 'CreativeWork');
    expect(ulbra.name).toBe('Ulbra One');
    expect(ulbra.codeRepository).toBeUndefined();
  });

  it('lists every project on the projects index', () => {
    const [collection] = nodesOfType('/projects', 'CollectionPage');
    const list = collection.mainEntity as { itemListElement: { url: string }[] };
    expect(list.itemListElement.map((i) => i.url)).toEqual(projects.map((p) => `${BASE}/projects/${p.slug}`));
  });

  it('gives nested routes a breadcrumb trail and the home page none', () => {
    const [crumbs] = nodesOfType('/projects/pulse', 'BreadcrumbList');
    const trail = crumbs.itemListElement as { name: string; item: string }[];
    expect(trail.map((c) => c.name)).toEqual(['Home', 'Projects', 'Pulse']);
    expect(trail.at(-1)!.item).toBe(`${BASE}/projects/pulse`);
    expect(nodesOfType('/', 'BreadcrumbList')).toHaveLength(0);
  });
});

describe('static body', () => {
  const body = renderStaticBody(page('/about'));

  it('mirrors the route text inside <noscript> with exactly one h1', () => {
    expect(body).toMatch(/^<noscript>/);
    expect(body.match(/<h1>/g)).toHaveLength(1);
    expect(body).toContain(profile.experience[0].org);
  });

  it('escapes content rather than trusting it as markup', () => {
    const escaped = renderStaticBody({
      ...page('/about'),
      heading: '<script>alert(1)</script>',
    });
    expect(escaped).not.toContain('<script>alert(1)</script>');
    expect(escaped).toContain('&lt;script&gt;');
  });
});

describe('crawler files', () => {
  it('allows every answer-engine crawler and advertises the sitemap', () => {
    const robots = renderRobotsTxt(BASE);
    for (const ua of ['GPTBot', 'OAI-SearchBot', 'ClaudeBot', 'PerplexityBot', 'Google-Extended']) {
      expect(AI_USER_AGENTS).toContain(ua);
      expect(robots).toContain(`User-agent: ${ua}\nAllow: /`);
    }
    expect(robots).toContain(`Sitemap: ${BASE}/sitemap.xml`);
    expect(robots).not.toMatch(/^Disallow: \//m);
  });

  it('lists every page in the sitemap under the sitemaps.org namespace', () => {
    const xml = renderSitemap(pages, BASE, '2026-08-13');
    expect(xml).toContain('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"');
    for (const p of pages) {
      expect(xml).toContain(`<loc>${BASE}${p.path === '/' ? '/' : p.path}</loc>`);
    }
    expect(xml.match(/<url>/g)).toHaveLength(pages.length);
  });

  it('gives llms.txt a summary, every project, and the contact facts', () => {
    const llms = renderLlmsTxt(pages, BASE);
    expect(llms).toMatch(/^# Felipe de Almeida\n\n> /);
    for (const p of projects) {
      expect(llms).toContain(`${BASE}/projects/${p.slug}.md`);
    }
    expect(llms).toContain(profile.contact.email);
    expect(llms).toContain(`${BASE}/llms-full.txt`);
  });

  it('inlines every page into llms-full.txt, including the pt-BR summary', () => {
    const full = renderLlmsFullTxt(pages, BASE);
    for (const p of pages) {
      expect(full).toContain(`# ${p.heading}`);
    }
    expect(full).toContain(profile.bio['pt-BR']);
  });

  it('renders a route to markdown with its heading, summary and source link', () => {
    const md = renderPageMarkdown(page('/projects/pulse'), BASE);
    expect(md.startsWith('# Pulse — ')).toBe(true);
    expect(md).toContain('## Highlights');
    expect(md).toContain(`Source: ${BASE}/projects/pulse`);
  });
});

it('index.html keeps the markers the aio plugin fills', () => {
  const html = readFileSync(join(__dirname, '../../../index.html'), 'utf8');
  expect(html).toContain('<!--aio:head-->');
  expect(html).toContain('<!--aio:body-->');
});
