/**
 * The page model the AIO build step renders from — one set per locale.
 *
 * A crawler that does not run JavaScript — which is every AI crawler that
 * matters today (GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot, CCBot) —
 * receives nothing but `<div id="root"></div>` from this SPA. So the content
 * of each route is described here, once, in plain data, and rendered into the
 * static HTML, the JSON-LD, the sitemap, and the markdown mirrors at build
 * time.
 *
 * This is a *summary* of each route, not a duplicate of the React tree: it
 * says the same things the mounted page says, in the form an answer engine
 * can quote. Every string is localized, because each locale is its own URL
 * (`/about`, `/pt/about`) served as its own document — a Portuguese URL whose
 * body is English would be worse than no Portuguese URL at all.
 */
import { faq } from '../../content/faq';
import { profile } from '../../content/profile';
import { projects } from '../../content/projects';
import type { Project } from '../../content/projects';
import type { Locale, LocalizedString } from '../../content/types';
import { LOCALES } from '../../content/types';
import { localeFromPathname, pathForLocale, routePathFromPathname } from '../../i18n/locale-url';

export interface AioSection {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
}

export interface AioPage {
  locale: Locale;
  /** Route path without the locale prefix — the identity shared across locales. */
  routePath: string;
  /** Public, locale-prefixed path: `/about` in en, `/pt/about` in pt-BR. */
  path: string;
  /** Emitted file, relative to `dist/`. */
  file: string;
  /** Full `<title>`. */
  title: string;
  description: string;
  /** The single `<h1>` of the static shell. */
  heading: string;
  sections: AioSection[];
  /**
   * Question/answer pairs shown on the page itself. Kept apart from
   * `sections` because they are also emitted as `FAQPage` JSON-LD, and that
   * markup is only legitimate while it mirrors visible content.
   */
  faq?: { question: string; answer: string }[];
  /** Sitemap hint. */
  priority: number;
}

/** Prose that exists only here — everything else comes from `src/content`. */
const COPY = {
  about: { en: 'About', 'pt-BR': 'Sobre' },
  biography: { en: 'Biography', 'pt-BR': 'Biografia' },
  experience: { en: 'Experience', 'pt-BR': 'Experiência' },
  skills: { en: 'Skills', 'pt-BR': 'Competências' },
  coreSkills: { en: 'Core skills', 'pt-BR': 'Principais competências' },
  education: { en: 'Education', 'pt-BR': 'Formação' },
  // "Spoken", not just "Languages": the skills block above already owns that
  // word for programming languages.
  languages: { en: 'Spoken languages', 'pt-BR': 'Idiomas' },
  contact: { en: 'Contact', 'pt-BR': 'Contato' },
  faq: { en: 'FAQ', 'pt-BR': 'Perguntas frequentes' },
  overview: { en: 'Overview', 'pt-BR': 'Visão geral' },
  stack: { en: 'Stack', 'pt-BR': 'Stack' },
  highlights: { en: 'Highlights', 'pt-BR': 'Destaques' },
  role: { en: 'Role', 'pt-BR': 'Papel' },
  selectedProjects: { en: 'Selected projects', 'pt-BR': 'Projetos selecionados' },
  whatThisPageIs: { en: 'What is on this page', 'pt-BR': 'O que há nesta página' },
  aboutTitlePrefix: { en: 'About', 'pt-BR': 'Sobre' },
  projectsTitle: { en: 'Projects', 'pt-BR': 'Projetos' },
  projectsHeading: { en: 'Projects by', 'pt-BR': 'Projetos de' },
  sourcePublic: { en: 'Source is public', 'pt-BR': 'O código é público' },
  sourceClosed: {
    en: 'Closed-source professional work — the write-up describes it without the source.',
    'pt-BR': 'Trabalho profissional de código fechado — o texto descreve o projeto sem o código.',
  },
  whatThisSiteIs: { en: 'What this site is', 'pt-BR': 'O que é este site' },
  siteExplainer: {
    en: 'Pulse is this portfolio and, at the same time, the system it describes. Opening the page joins a live presence set over a SignalR WebSocket, puts a dot on a shared world map, and publishes a visit event through a real event-driven backend — a .NET API, a RabbitMQ transactional outbox, a separate worker process, Postgres, and OpenTelemetry traces. The public metrics on the page are that system reporting on itself.',
    'pt-BR':
      'O Pulse é este portfólio e, ao mesmo tempo, o sistema que ele descreve. Abrir a página entra em um conjunto de presença ao vivo por WebSocket via SignalR, acende um ponto num mapa-múndi compartilhado e publica um evento de visita através de um backend real orientado a eventos — uma API .NET, um outbox transacional com RabbitMQ, um processo worker separado, Postgres e traces com OpenTelemetry. As métricas públicas da página são esse sistema relatando a si mesmo.',
  },
  projectsIndexDescription: {
    en: 'Software projects by {name}: {list} — distributed systems, internal enterprise platforms, and developer infrastructure in .NET and React.',
    'pt-BR':
      'Projetos de software de {name}: {list} — sistemas distribuídos, plataformas internas corporativas e infraestrutura para desenvolvedores em .NET e React.',
  },
  liveTitle: { en: 'Live system metrics', 'pt-BR': 'Métricas do sistema ao vivo' },
  liveDescription: {
    en: 'The public operations dashboard for Pulse: real-time presence counts, a live visitor world map, event throughput, and latency, read straight from the running .NET + Redis + Postgres backend.',
    'pt-BR':
      'O dashboard público de operações do Pulse: contagem de presença em tempo real, mapa-múndi de visitantes ao vivo, throughput de eventos e latência, lidos direto do backend .NET + Redis + Postgres em execução.',
  },
  liveBody: {
    en: 'A public ops dashboard for the system running this site. Presence comes from a TTL-pruned Redis sorted set behind a SignalR hub; visit events travel through a RabbitMQ transactional outbox to a worker that writes the audit log and aggregates in Postgres; traces and metrics are exported over OpenTelemetry. The numbers here are live, not sampled fixtures.',
    'pt-BR':
      'Um dashboard público de operações do sistema que roda este site. A presença vem de um sorted set do Redis podado por TTL atrás de um hub SignalR; eventos de visita passam por um outbox transacional com RabbitMQ até um worker que grava o log de auditoria e os agregados no Postgres; traces e métricas são exportados via OpenTelemetry. Os números aqui são ao vivo, não dados de exemplo.',
  },
  watchedTitle: {
    en: 'How web tracking actually works',
    'pt-BR': 'Como o rastreamento na web realmente funciona',
  },
  watchedDescription: {
    en: 'A walkthrough of what a website can infer about a visitor without cookies or permissions: passive browser signals, IP-derived coarse geolocation, fingerprinting surfaces, and how that data reaches a real-time ad auction.',
    'pt-BR':
      'Um passo a passo do que um site consegue inferir sobre um visitante sem cookies nem permissões: sinais passivos do navegador, geolocalização aproximada derivada do IP, superfícies de fingerprinting e como esses dados chegam a um leilão de anúncios em tempo real.',
  },
  watchedHeading: {
    en: 'What this page can tell about you',
    'pt-BR': 'O que esta página consegue dizer sobre você',
  },
  watchedBody: {
    en: 'A demonstration, built on this site, of the signals a visitor hands over passively: browser and device characteristics, coarse geolocation derived from the connecting IP, and the fingerprinting surfaces available to any page. It then shows how those signals are packaged into a bid request in a real-time ad auction. It is a teaching page about tracking, not a tracker: the demo does not persist the visitor IP.',
    'pt-BR':
      'Uma demonstração, construída neste site, dos sinais que um visitante entrega passivamente: características do navegador e do dispositivo, geolocalização aproximada derivada do IP de conexão e as superfícies de fingerprinting disponíveis para qualquer página. Em seguida mostra como esses sinais são empacotados em uma bid request num leilão de anúncios em tempo real. É uma página didática sobre rastreamento, não um rastreador: a demo não persiste o IP do visitante.',
  },
} satisfies Record<string, LocalizedString>;

/** Picks the locale's string, falling back to English for any gap. */
function localizer(locale: Locale) {
  return (value: LocalizedString): string => value[locale] || value.en;
}

/** `/pt/projects/pulse` → `pt/projects/pulse`; `/` → `index`; `/pt` → `pt`. */
export function basenameForPath(path: string): string {
  return path === '/' ? 'index' : path.replace(/^\//, '');
}

function fileForPath(path: string): string {
  return `${basenameForPath(path)}.html`;
}

function page(
  locale: Locale,
  routePath: string,
  fields: Omit<AioPage, 'locale' | 'routePath' | 'path' | 'file'>,
): AioPage {
  const path = pathForLocale(routePath, locale);
  return { locale, routePath, path, file: fileForPath(path), ...fields };
}

function projectSections(p: Project, locale: Locale): AioSection[] {
  const L = localizer(locale);
  const sections: AioSection[] = [
    { heading: L(COPY.overview), paragraphs: [L(p.detail?.overview ?? p.description)] },
    { heading: L(COPY.stack), bullets: p.tech },
  ];

  if (p.detail?.highlights?.length) {
    sections.push({ heading: L(COPY.highlights), bullets: p.detail.highlights.map(L) });
  }

  const source =
    p.visibility === 'public'
      ? `${L(COPY.sourcePublic)}${p.links.length ? ` — ${p.links[0].href}` : ''}.`
      : L(COPY.sourceClosed);

  sections.push({
    heading: L(COPY.role),
    paragraphs: [`${L(p.role)}${p.period ? ` · ${L(p.period)}` : ''}. ${source}`],
  });

  return sections;
}

function homePage(locale: Locale): AioPage {
  const L = localizer(locale);
  return page(locale, '/', {
    title: `${profile.name} — ${L(profile.title)}`,
    description: L(profile.tagline),
    heading: profile.name,
    sections: [
      { heading: L(COPY.about), paragraphs: [L(profile.bio)] },
      { heading: L(COPY.whatThisSiteIs), paragraphs: [L(COPY.siteExplainer)] },
      { heading: L(COPY.selectedProjects), bullets: projects.map((p) => `${p.name} — ${L(p.tagline)}`) },
      { heading: L(COPY.coreSkills), bullets: profile.skills.map((g) => `${L(g.group)}: ${g.items.join(', ')}`) },
    ],
    priority: 1.0,
  });
}

function aboutPage(locale: Locale): AioPage {
  const L = localizer(locale);
  return page(locale, '/about', {
    title: `${L(COPY.aboutTitlePrefix)} ${profile.name} — ${L(profile.title)}`,
    description: L(profile.bio),
    heading: `${L(COPY.aboutTitlePrefix)} ${profile.name}`,
    sections: [
      { heading: L(COPY.biography), paragraphs: [L(profile.bio)] },
      {
        heading: L(COPY.experience),
        bullets: profile.experience.map(
          (e) => `${L(e.role)}, ${e.org} (${L(e.period)}) — ${L(e.summary)}${e.url ? ` ${e.url}` : ''}`,
        ),
      },
      { heading: L(COPY.skills), bullets: profile.skills.map((g) => `${L(g.group)}: ${g.items.join(', ')}`) },
      {
        heading: L(COPY.education),
        bullets: [
          ...profile.education.map((e) => `${L(e.credential)} — ${e.org} (${L(e.period)})`),
          `${L(COPY.languages)}: ${L(profile.languages)}`,
        ],
      },
      {
        heading: L(COPY.contact),
        bullets: [
          `Email: ${profile.contact.email}`,
          `LinkedIn: ${profile.contact.linkedin}`,
          'GitHub: https://github.com/felipe-allmeida',
        ],
      },
    ],
    faq: faq.map((entry) => ({ question: L(entry.question), answer: L(entry.answer) })),
    priority: 0.9,
  });
}

function projectsPage(locale: Locale): AioPage {
  const L = localizer(locale);
  return page(locale, '/projects', {
    title: `${L(COPY.projectsTitle)} — ${profile.name}`,
    description: L(COPY.projectsIndexDescription)
      .replace('{name}', profile.name)
      .replace('{list}', projects.map((p) => p.name).join(', ')),
    heading: `${L(COPY.projectsHeading)} ${profile.name}`,
    sections: projects.map((p) => ({
      heading: p.name,
      paragraphs: [L(p.description)],
      bullets: [`${L(COPY.stack)}: ${p.tech.join(', ')}`, `${L(COPY.role)}: ${L(p.role)}`],
    })),
    priority: 0.9,
  });
}

function projectPage(p: Project, locale: Locale): AioPage {
  const L = localizer(locale);
  return page(locale, `/projects/${p.slug}`, {
    title: `${p.name} — ${L(p.tagline)} | ${profile.name}`,
    description: L(p.description),
    heading: `${p.name} — ${L(p.tagline)}`,
    sections: projectSections(p, locale),
    priority: 0.8,
  });
}

function livePage(locale: Locale): AioPage {
  const L = localizer(locale);
  return page(locale, '/live', {
    title: `${L(COPY.liveTitle)} — ${profile.name}`,
    description: L(COPY.liveDescription),
    heading: L(COPY.liveTitle),
    sections: [{ heading: L(COPY.whatThisPageIs), paragraphs: [L(COPY.liveBody)] }],
    priority: 0.6,
  });
}

function watchedPage(locale: Locale): AioPage {
  const L = localizer(locale);
  return page(locale, '/watched', {
    title: `${L(COPY.watchedTitle)} — ${profile.name}`,
    description: L(COPY.watchedDescription),
    heading: L(COPY.watchedHeading),
    sections: [{ heading: L(COPY.whatThisPageIs), paragraphs: [L(COPY.watchedBody)] }],
    priority: 0.6,
  });
}

/** Every route the AIO build step emits a static document for, in one locale. */
export function buildPages(locale: Locale): AioPage[] {
  return [
    homePage(locale),
    aboutPage(locale),
    projectsPage(locale),
    ...projects.map((p) => projectPage(p, locale)),
    livePage(locale),
    watchedPage(locale),
  ];
}

/** Every page of every locale — what the build step and the sitemap iterate. */
export function buildAllPages(): AioPage[] {
  return LOCALES.flatMap(buildPages);
}

/**
 * The page for a live pathname, in the locale that pathname belongs to,
 * tolerating the trailing slash a browser may carry.
 */
export function pageForPath(pathname: string): AioPage | undefined {
  const locale = localeFromPathname(pathname);
  const routePath = routePathFromPathname(pathname);
  const normalised = routePath.length > 1 ? routePath.replace(/\/+$/, '') : '/';
  return buildPages(locale).find((p) => p.routePath === normalised);
}

/** The same route in every locale — the `hreflang` set for a page. */
export function alternatesFor(routePath: string): { locale: Locale; path: string }[] {
  return LOCALES.map((locale) => ({ locale, path: pathForLocale(routePath, locale) }));
}
