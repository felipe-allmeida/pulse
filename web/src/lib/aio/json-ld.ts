/**
 * Schema.org JSON-LD for every route, in every locale.
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
 * merge them into one entity instead of a dozen lookalikes. Those `@id`s stay
 * on the unprefixed English URL across both locales *on purpose* — there is
 * one Felipe and one Pulse, described in two languages, not two of each.
 */
import { profile } from '../../content/profile';
import { projects } from '../../content/projects';
import type { Project } from '../../content/projects';
import type { Locale, LocalizedString } from '../../content/types';
import { LOCALES } from '../../content/types';
import { pathForLocale } from '../../i18n/locale-url';
import type { AioPage } from './pages';

type JsonLdNode = Record<string, unknown>;

function localizer(locale: Locale) {
  return (value: LocalizedString): string => value[locale] || value.en;
}

const personId = (base: string) => `${base}/#person`;
const websiteId = (base: string) => `${base}/#website`;
const projectId = (base: string, slug: string) => `${base}/projects/${slug}#project`;

/** Flat skill list — `knowsAbout` is how an LLM answers "what is he good at?". */
function knowsAbout(): string[] {
  return [...new Set(profile.skills.flatMap((g) => g.items))];
}

/**
 * `alumniOf`, deduped by institution — two degrees from one university is
 * still one alma mater, and a graph listing it twice invites a crawler to
 * merge them into two lookalike organisations.
 */
function alumniOf(): JsonLdNode[] {
  return [...new Set(profile.education.map((e) => e.org))].map((name) => ({
    '@type': 'CollegeOrUniversity',
    name,
  }));
}

function personNode(base: string, locale: Locale): JsonLdNode {
  const L = localizer(locale);
  const current = profile.experience[0];
  return {
    '@type': 'Person',
    '@id': personId(base),
    name: profile.name,
    // Identity URL stays on the canonical English profile even on the pt page:
    // the `@id` and `url` are what tie the two documents to one person.
    url: `${base}/about`,
    jobTitle: L(profile.title),
    description: L(profile.bio),
    email: `mailto:${profile.contact.email}`,
    knowsAbout: knowsAbout(),
    knowsLanguage: LOCALES,
    sameAs: [profile.contact.linkedin, 'https://github.com/felipe-allmeida'],
    worksFor: { '@type': 'Organization', name: current.org, ...(current.url ? { url: current.url } : {}) },
    alumniOf: alumniOf(),
    hasCredential: profile.education.map((e) => ({
      '@type': 'EducationalOccupationalCredential',
      name: L(e.credential),
      recognizedBy: { '@type': 'CollegeOrUniversity', name: e.org },
    })),
    hasOccupation: {
      '@type': 'Occupation',
      name: L(profile.title),
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
    // One site published in two languages, not two sites.
    inLanguage: LOCALES,
    author: { '@id': personId(base) },
    publisher: { '@id': personId(base) },
  };
}

function projectNode(base: string, p: Project, locale: Locale): JsonLdNode {
  const L = localizer(locale);
  const repo = p.links.find((l) => /github\.com/i.test(l.href))?.href;
  return {
    // Public work with a repository is source code; the closed-source client
    // platforms are described as CreativeWork so the graph does not imply a
    // repository that nobody can open.
    '@type': repo ? 'SoftwareSourceCode' : 'CreativeWork',
    '@id': projectId(base, p.slug),
    name: p.name,
    url: `${base}${pathForLocale(`/projects/${p.slug}`, locale)}`,
    headline: L(p.tagline),
    description: L(p.detail?.overview ?? p.description),
    author: { '@id': personId(base) },
    creator: { '@id': personId(base) },
    keywords: p.tech.join(', '),
    ...(repo ? { codeRepository: repo, programmingLanguage: p.tech } : {}),
  };
}

const CRUMB_HOME: LocalizedString = { en: 'Home', 'pt-BR': 'Início' };
const CRUMB_PROJECTS: LocalizedString = { en: 'Projects', 'pt-BR': 'Projetos' };

function breadcrumbNode(base: string, page: AioPage): JsonLdNode | null {
  if (page.routePath === '/') return null;
  const L = localizer(page.locale);
  const segments = page.routePath.split('/').filter(Boolean);

  const items = [
    { name: L(CRUMB_HOME), routePath: '/' },
    ...segments.map((segment, i) => ({
      name: segment === 'projects' ? L(CRUMB_PROJECTS) : (projects.find((p) => p.slug === segment)?.name ?? segment),
      routePath: `/${segments.slice(0, i + 1).join('/')}`,
    })),
  ];

  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: `${base}${pathForLocale(item.routePath, page.locale)}`,
    })),
  };
}

/** The `@graph` for one route, ready to be serialised into a single script tag. */
export function jsonLdForPage(page: AioPage, base: string, siteName: string): JsonLdNode {
  const graph: JsonLdNode[] = [personNode(base, page.locale), websiteNode(base, siteName)];
  const url = `${base}${page.path === '/' ? '/' : page.path}`;

  const pageNode: JsonLdNode = {
    '@type':
      page.routePath === '/about' ? 'ProfilePage' : page.routePath === '/projects' ? 'CollectionPage' : 'WebPage',
    '@id': `${url}#page`,
    url,
    name: page.title,
    description: page.description,
    inLanguage: page.locale,
    isPartOf: { '@id': websiteId(base) },
    about: { '@id': personId(base) },
    ...(page.routePath === '/about' ? { mainEntity: { '@id': personId(base) } } : {}),
  };

  if (page.routePath === '/projects') {
    pageNode.mainEntity = {
      '@type': 'ItemList',
      itemListElement: projects.map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: `${base}${pathForLocale(`/projects/${p.slug}`, page.locale)}`,
        name: p.name,
      })),
    };
    graph.push(...projects.map((p) => projectNode(base, p, page.locale)));
  }

  const slug = page.routePath.startsWith('/projects/') ? page.routePath.slice('/projects/'.length) : null;
  const project = slug ? projects.find((p) => p.slug === slug) : undefined;
  if (project) {
    pageNode.mainEntity = { '@id': projectId(base, project.slug) };
    graph.push(projectNode(base, project, page.locale));
  }

  /*
    The FAQ is its own node rather than a second `@type` on the page: a
    ProfilePage's `mainEntity` is the person, an FAQPage's is the question
    list, and merging the two would leave both meanings ambiguous. The page
    claims it via `hasPart`.

    It is emitted only from `page.faq`, which is the same array the About page
    renders — structured data describing answers a visitor cannot find on the
    page is the one kind of markup search engines actively penalise.
  */
  if (page.faq?.length) {
    const faqId = `${url}#faq`;
    pageNode.hasPart = { '@id': faqId };
    graph.push({
      '@type': 'FAQPage',
      '@id': faqId,
      url,
      inLanguage: page.locale,
      about: { '@id': personId(base) },
      mainEntity: page.faq.map((entry) => ({
        '@type': 'Question',
        name: entry.question,
        acceptedAnswer: { '@type': 'Answer', text: entry.answer },
      })),
    });
  }

  graph.push(pageNode);

  const breadcrumb = breadcrumbNode(base, page);
  if (breadcrumb) graph.push(breadcrumb);

  return { '@context': 'https://schema.org', '@graph': graph };
}
