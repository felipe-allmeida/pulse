/**
 * Schema.org JSON-LD for every route.
 *
 * This is the part of AIO that survives every extraction pipeline. Whatever an
 * answer engine does with the rendered text — readability heuristics, chunking,
 * dropping `<noscript>` — a `<script type="application/ld+json">` block is
 * structured, unambiguous, and read directly. It is where the machine-readable
 * claims live: who this person is, what they do, which repositories are theirs,
 * which profiles corroborate the identity.
 *
 * The graph is `@id`-linked rather than duplicated: every page repeats the same
 * `#person` and `#website` nodes so a crawler that only ever fetches one URL
 * still gets the full identity, and a crawler that fetches all of them can
 * merge them into one entity instead of six lookalikes.
 */
import { profile } from '../../content/profile';
import { projects } from '../../content/projects';
import type { Project } from '../../content/projects';
import type { AioPage } from './pages';

type JsonLdNode = Record<string, unknown>;

const en = <T extends { en: string }>(v: T): string => v.en;

const personId = (base: string) => `${base}/#person`;
const websiteId = (base: string) => `${base}/#website`;
const projectId = (base: string, slug: string) => `${base}/projects/${slug}#project`;

/** Flat skill list — `knowsAbout` is how an LLM answers "what is he good at?". */
function knowsAbout(): string[] {
  return [...new Set(profile.skills.flatMap((g) => g.items))];
}

function personNode(base: string): JsonLdNode {
  const current = profile.experience[0];
  return {
    '@type': 'Person',
    '@id': personId(base),
    name: profile.name,
    url: `${base}/about`,
    jobTitle: en(profile.title),
    description: en(profile.bio),
    email: `mailto:${profile.contact.email}`,
    knowsAbout: knowsAbout(),
    knowsLanguage: ['en', 'pt-BR'],
    sameAs: [profile.contact.linkedin, 'https://github.com/felipe-allmeida'],
    worksFor: { '@type': 'Organization', name: current.org },
    hasOccupation: {
      '@type': 'Occupation',
      name: en(profile.title),
      occupationalCategory: '15-1252.00 Software Developers',
    },
  };
}

function websiteNode(base: string, siteName: string): JsonLdNode {
  return {
    '@type': 'WebSite',
    '@id': websiteId(base),
    name: siteName,
    url: `${base}/`,
    inLanguage: 'en',
    author: { '@id': personId(base) },
    publisher: { '@id': personId(base) },
  };
}

function projectNode(base: string, p: Project): JsonLdNode {
  const repo = p.links.find((l) => /github\.com/i.test(l.href))?.href;
  return {
    // Public work with a repository is source code; the closed-source client
    // platforms are described as CreativeWork so the graph does not imply a
    // repository that nobody can open.
    '@type': repo ? 'SoftwareSourceCode' : 'CreativeWork',
    '@id': projectId(base, p.slug),
    name: p.name,
    url: `${base}/projects/${p.slug}`,
    headline: en(p.tagline),
    description: en(p.detail?.overview ?? p.description),
    author: { '@id': personId(base) },
    creator: { '@id': personId(base) },
    keywords: p.tech.join(', '),
    ...(repo ? { codeRepository: repo, programmingLanguage: p.tech } : {}),
  };
}

function breadcrumbNode(base: string, page: AioPage): JsonLdNode | null {
  if (page.path === '/') return null;
  const segments = page.path.split('/').filter(Boolean);
  const items = [{ name: 'Home', path: '' }, ...segments.map((s, i) => ({
    name: s === 'projects' ? 'Projects' : (projects.find((p) => p.slug === s)?.name ?? s),
    path: `/${segments.slice(0, i + 1).join('/')}`,
  }))];
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: `${base}${item.path || '/'}`,
    })),
  };
}

/** The `@graph` for one route, ready to be serialised into a single script tag. */
export function jsonLdForPage(page: AioPage, base: string, siteName: string): JsonLdNode {
  const graph: JsonLdNode[] = [personNode(base), websiteNode(base, siteName)];

  const pageNode: JsonLdNode = {
    '@type': page.path === '/about' ? 'ProfilePage' : page.path === '/projects' ? 'CollectionPage' : 'WebPage',
    '@id': `${base}${page.path === '/' ? '/' : page.path}#page`,
    url: `${base}${page.path === '/' ? '/' : page.path}`,
    name: page.title,
    description: page.description,
    inLanguage: 'en',
    isPartOf: { '@id': websiteId(base) },
    about: { '@id': personId(base) },
    ...(page.path === '/about' ? { mainEntity: { '@id': personId(base) } } : {}),
  };

  if (page.path === '/projects') {
    pageNode.mainEntity = {
      '@type': 'ItemList',
      itemListElement: projects.map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: `${base}/projects/${p.slug}`,
        name: p.name,
      })),
    };
    graph.push(...projects.map((p) => projectNode(base, p)));
  }

  const slug = page.path.startsWith('/projects/') ? page.path.slice('/projects/'.length) : null;
  const project = slug ? projects.find((p) => p.slug === slug) : undefined;
  if (project) {
    pageNode.mainEntity = { '@id': projectId(base, project.slug) };
    graph.push(projectNode(base, project));
  }

  graph.push(pageNode);

  const breadcrumb = breadcrumbNode(base, page);
  if (breadcrumb) graph.push(breadcrumb);

  return { '@context': 'https://schema.org', '@graph': graph };
}
