import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { projects } from '../../content/projects';
import { faq } from '../../content/faq';
import { profile } from '../../content/profile';
import type { Locale } from '../../content/types';
import { buildAllPages, buildPages, pageForPath } from './pages';
import { jsonLdForPage } from './json-ld';
import { renderHead, serialiseJsonLd } from './render';
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
const allPages = buildAllPages();

const page = (routePath: string, locale: Locale = 'en') => {
  const found = buildPages(locale).find((p) => p.routePath === routePath);
  if (!found) throw new Error(`no AIO page for ${routePath} in ${locale}`);
  return found;
};

/** The `@graph` nodes of a page, by `@type`. */
function nodesOfType(routePath: string, type: string, locale: Locale = 'en'): Record<string, unknown>[] {
  const graph = jsonLdForPage(page(routePath, locale), BASE, SITE_NAME)['@graph'] as Record<string, unknown>[];
  return graph.filter((n) => n['@type'] === type);
}

describe('pages', () => {
  it('covers every public route, each with a title and description', () => {
    const routes = buildPages('en').map((p) => p.routePath);
    expect(routes).toEqual(
      expect.arrayContaining([
        '/',
        '/about',
        '/projects',
        '/live',
        '/watched',
        ...projects.map((p) => `/projects/${p.slug}`),
      ]),
    );
    for (const p of allPages) {
      expect(p.title.length).toBeGreaterThan(10);
      // Long enough to be a real answer, short enough that Google does not
      // truncate it in a snippet.
      expect(p.description.length).toBeGreaterThan(50);
      expect(p.sections.length).toBeGreaterThan(0);
    }
  });

  it('emits one document per route per locale, at distinct paths', () => {
    const paths = allPages.map((p) => p.path);
    expect(new Set(paths).size).toBe(paths.length);
    expect(allPages).toHaveLength(buildPages('en').length * 2);
  });

  it('prefixes only the Portuguese paths and files', () => {
    expect(page('/projects/pulse').file).toBe('projects/pulse.html');
    expect(page('/').file).toBe('index.html');
    expect(page('/projects/pulse', 'pt-BR').path).toBe('/pt/projects/pulse');
    expect(page('/projects/pulse', 'pt-BR').file).toBe('pt/projects/pulse.html');
    expect(page('/', 'pt-BR').path).toBe('/pt');
    expect(page('/', 'pt-BR').file).toBe('pt.html');
  });

  it('actually translates the body, not just the URL', () => {
    const ptAbout = page('/about', 'pt-BR');
    expect(ptAbout.heading).toBe(`Sobre ${profile.name}`);
    expect(ptAbout.description).toBe(profile.bio['pt-BR']);
    expect(ptAbout.sections.map((s) => s.heading)).toEqual(['Biografia', 'Experiência', 'Competências', 'Contato']);
    // No English section heading survives into the Portuguese document.
    expect(page('/live', 'pt-BR').title).toContain('Métricas do sistema ao vivo');
  });

  it('resolves a live pathname to the page for that locale', () => {
    expect(pageForPath('/about')?.locale).toBe('en');
    expect(pageForPath('/pt/about')?.locale).toBe('pt-BR');
    expect(pageForPath('/pt/about')?.routePath).toBe('/about');
    expect(pageForPath('/about/')?.routePath).toBe('/about');
    expect(pageForPath('/pt')?.routePath).toBe('/');
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

  it('declares every locale of the route, with x-default on the English URL', () => {
    expect(head).toContain(`<link rel="alternate" hreflang="en" href="${BASE}/about" />`);
    expect(head).toContain(`<link rel="alternate" hreflang="pt-BR" href="${BASE}/pt/about" />`);
    expect(head).toContain(`<link rel="alternate" hreflang="x-default" href="${BASE}/about" />`);

    // The Portuguese document points at the same set — hreflang has to be
    // reciprocal or Google discards it.
    const ptHead = renderHead(page('/about', 'pt-BR'), BASE, SITE_NAME, profile.name);
    expect(ptHead).toContain(`<link rel="canonical" href="${BASE}/pt/about" />`);
    expect(ptHead).toContain(`<link rel="alternate" hreflang="en" href="${BASE}/about" />`);
    expect(ptHead).toContain(`<link rel="alternate" hreflang="pt-BR" href="${BASE}/pt/about" />`);
    expect(ptHead).toContain(`<link rel="alternate" hreflang="x-default" href="${BASE}/about" />`);
  });

  it('uses Open Graph territory codes and names the other locale', () => {
    expect(head).toContain('<meta property="og:locale" content="en_US" />');
    expect(head).toContain('<meta property="og:locale:alternate" content="pt_BR" />');
    const ptHead = renderHead(page('/about', 'pt-BR'), BASE, SITE_NAME, profile.name);
    expect(ptHead).toContain('<meta property="og:locale" content="pt_BR" />');
    expect(ptHead).toContain('<meta property="og:locale:alternate" content="en_US" />');
  });

  it('points at the markdown mirror of the same route', () => {
    expect(head).toContain('<link rel="alternate" type="text/markdown" href="/about.md"');
    expect(renderHead(page('/'), BASE, SITE_NAME, profile.name)).toContain('href="/index.md"');
    expect(renderHead(page('/about', 'pt-BR'), BASE, SITE_NAME, profile.name)).toContain('href="/pt/about.md"');
  });

  it('points the social card at an absolute image URL', () => {
    // A relative og:image is the most common reason a link preview renders blank.
    expect(head).toContain(`<meta property="og:image" content="${BASE}/og.png" />`);
    expect(head).toContain('<meta name="twitter:card" content="summary_large_image" />');
    expect(head).toContain(`<meta name="twitter:image" content="${BASE}/og.png" />`);
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
  it('describes one person under one @id, in both languages', () => {
    for (const p of allPages) {
      const [person] = (jsonLdForPage(p, BASE, SITE_NAME)['@graph'] as Record<string, unknown>[]).filter(
        (n) => n['@type'] === 'Person',
      );
      // Same identity on every page of every locale — one entity, not a dozen
      // lookalikes.
      expect(person['@id']).toBe(`${BASE}/#person`);
      expect(person.url).toBe(`${BASE}/about`);
      expect(person.name).toBe(profile.name);
      expect(person.sameAs).toContain('https://github.com/felipe-allmeida');
      expect(person.knowsAbout).toContain('.NET / ASP.NET Core');
    }
    // ...but the prose is the page's own language.
    expect(nodesOfType('/about', 'Person', 'pt-BR')[0].description).toBe(profile.bio['pt-BR']);
  });

  it('tags each page with the language it is actually written in', () => {
    expect(nodesOfType('/about', 'ProfilePage')[0].inLanguage).toBe('en');
    expect(nodesOfType('/about', 'ProfilePage', 'pt-BR')[0].inLanguage).toBe('pt-BR');
    expect(nodesOfType('/about', 'ProfilePage', 'pt-BR')[0]['@id']).toBe(`${BASE}/pt/about#page`);
  });

  it('marks /about as a ProfilePage whose main entity is that person', () => {
    expect(nodesOfType('/about', 'ProfilePage')[0].mainEntity).toEqual({ '@id': `${BASE}/#person` });
  });

  it('types public work as source code with a repo, private work as CreativeWork', () => {
    const [pulse] = nodesOfType('/projects/pulse', 'SoftwareSourceCode');
    expect(pulse.codeRepository).toMatch(/github\.com/);
    expect(nodesOfType('/projects/ulbra-one', 'SoftwareSourceCode')).toHaveLength(0);
    const [ulbra] = nodesOfType('/projects/ulbra-one', 'CreativeWork');
    expect(ulbra.name).toBe('Ulbra One');
    expect(ulbra.codeRepository).toBeUndefined();
  });

  it('lists every project on the projects index, in-locale', () => {
    const [collection] = nodesOfType('/projects', 'CollectionPage', 'pt-BR');
    const list = collection.mainEntity as { itemListElement: { url: string }[] };
    expect(list.itemListElement.map((i) => i.url)).toEqual(
      projects.map((p) => `${BASE}/pt/projects/${p.slug}`),
    );
  });

  it('gives nested routes a localized breadcrumb trail and the home page none', () => {
    const [crumbs] = nodesOfType('/projects/pulse', 'BreadcrumbList');
    const trail = crumbs.itemListElement as { name: string; item: string }[];
    expect(trail.map((c) => c.name)).toEqual(['Home', 'Projects', 'Pulse']);
    expect(trail.at(-1)!.item).toBe(`${BASE}/projects/pulse`);

    const [ptCrumbs] = nodesOfType('/projects/pulse', 'BreadcrumbList', 'pt-BR');
    const ptTrail = ptCrumbs.itemListElement as { name: string; item: string }[];
    expect(ptTrail.map((c) => c.name)).toEqual(['Início', 'Projetos', 'Pulse']);
    expect(ptTrail.at(-1)!.item).toBe(`${BASE}/pt/projects/pulse`);

    expect(nodesOfType('/', 'BreadcrumbList')).toHaveLength(0);
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

  it('lists every page of every locale, each carrying its hreflang set', () => {
    const xml = renderSitemap(allPages, BASE, '2026-08-13');
    expect(xml).toContain('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"');
    expect(xml).toContain('xmlns:xhtml="http://www.w3.org/1999/xhtml"');
    for (const p of allPages) {
      expect(xml).toContain(`<loc>${BASE}${p.path === '/' ? '/' : p.path}</loc>`);
    }
    expect(xml.match(/<url>/g)).toHaveLength(allPages.length);
    expect(xml).toContain(`<xhtml:link rel="alternate" hreflang="pt-BR" href="${BASE}/pt/about" />`);
    expect(xml).toContain(`<xhtml:link rel="alternate" hreflang="x-default" href="${BASE}/about" />`);
  });

  it('gives llms.txt a summary, every project, the contact facts and the pt index', () => {
    const llms = renderLlmsTxt(allPages, BASE);
    expect(llms).toMatch(/^# Felipe de Almeida\n\n> /);
    for (const p of projects) {
      expect(llms).toContain(`${BASE}/projects/${p.slug}.md`);
    }
    expect(llms).toContain(profile.contact.email);
    expect(llms).toContain(`${BASE}/llms-full.txt`);
    expect(llms).toContain('## Português');
    expect(llms).toContain(`${BASE}/pt/about.md`);
  });

  it('inlines every page of both languages into llms-full.txt', () => {
    const full = renderLlmsFullTxt(allPages, BASE);
    for (const p of allPages) {
      expect(full).toContain(`# ${p.heading}`);
    }
    expect(full).toContain('# English');
    expect(full).toContain('# Português');
  });

  it('renders a route to markdown with its heading, summary and source link', () => {
    const md = renderPageMarkdown(page('/projects/pulse'), BASE);
    expect(md.startsWith('# Pulse — ')).toBe(true);
    expect(md).toContain('## Highlights');
    expect(md).toContain(`Source: ${BASE}/projects/pulse`);

    const ptMd = renderPageMarkdown(page('/projects/pulse', 'pt-BR'), BASE);
    expect(ptMd).toContain('## Destaques');
    expect(ptMd).toContain(`Source: ${BASE}/pt/projects/pulse`);
  });
});

it('index.html keeps the markers the aio plugin fills', () => {
  const html = readFileSync(join(__dirname, '../../../index.html'), 'utf8');
  expect(html).toContain('<!--aio:head-->');
  expect(html).toContain('<!--aio:app-->');
  // The plugin swaps this exact string per locale.
  expect(html).toContain('<html lang="en">');
});

describe('faq', () => {
  it('carries the question/answer pairs on /about in both locales', () => {
    expect(page('/about').faq).toHaveLength(faq.length);
    expect(page('/about').faq?.[0].question).toBe(faq[0].question.en);
    expect(page('/about', 'pt-BR').faq?.[0].question).toBe(faq[0].question['pt-BR']);
    // Only /about has one — no other page renders the section.
    expect(allPages.filter((p) => p.faq?.length)).toHaveLength(2);
  });

  it('emits FAQPage markup the About page actually shows', () => {
    const [faqNode] = nodesOfType('/about', 'FAQPage');
    const questions = faqNode.mainEntity as { name: string; acceptedAnswer: { text: string } }[];

    expect(questions).toHaveLength(faq.length);
    expect(questions[0].name).toBe(faq[0].question.en);
    expect(questions[0].acceptedAnswer.text).toBe(faq[0].answer.en);

    // Claimed by the page, but not confused with the ProfilePage's own
    // mainEntity (the person).
    expect(nodesOfType('/about', 'ProfilePage')[0].hasPart).toEqual({ '@id': `${BASE}/about#faq` });
    expect(nodesOfType('/about', 'ProfilePage')[0].mainEntity).toEqual({ '@id': `${BASE}/#person` });
    expect(nodesOfType('/projects', 'FAQPage')).toHaveLength(0);
  });

  it('renders the answers into the markdown mirror', () => {
    expect(renderPageMarkdown(page('/about', 'pt-BR'), BASE)).toContain('## Perguntas frequentes');
    expect(renderPageMarkdown(page('/about', 'pt-BR'), BASE)).toContain(faq[0].answer['pt-BR']);
  });
});
