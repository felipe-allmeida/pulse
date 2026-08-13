/**
 * The page model the AIO build step renders from.
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
 * can quote. It is deliberately English-only, matching `<html lang="en">` —
 * the app picks its language client-side from one URL per route, so there is
 * no pt-BR URL to point a crawler at. (Per-locale URLs are the follow-up that
 * would make the pt-BR copy indexable too.)
 */
import { profile } from '../../content/profile';
import { projects } from '../../content/projects';
import type { Project } from '../../content/projects';

export interface AioSection {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
}

export interface AioPage {
  /** Route path, always absolute, no trailing slash except the root. */
  path: string;
  /** Emitted file, relative to `dist/`. */
  file: string;
  /** Full `<title>`. */
  title: string;
  description: string;
  /** The single `<h1>` of the static shell. */
  heading: string;
  sections: AioSection[];
  /** Sitemap hint. */
  priority: number;
}

const en = <T extends { en: string }>(v: T): string => v.en;

/** `/projects/pulse` → `projects/pulse.html`; `/` → `index.html`. */
export function fileForPath(path: string): string {
  return path === '/' ? 'index.html' : `${path.replace(/^\//, '')}.html`;
}

function projectSections(p: Project): AioSection[] {
  const sections: AioSection[] = [
    {
      heading: 'Overview',
      paragraphs: [en(p.detail?.overview ?? p.description)],
    },
    {
      heading: 'Stack',
      bullets: p.tech,
    },
  ];
  if (p.detail?.highlights?.length) {
    sections.push({ heading: 'Highlights', bullets: p.detail.highlights.map(en) });
  }
  sections.push({
    heading: 'Role',
    paragraphs: [
      `${en(p.role)}${p.period ? ` · ${en(p.period)}` : ''}. ${
        p.visibility === 'public'
          ? `Source is public${p.links.length ? ` at ${p.links[0].href}` : ''}.`
          : 'Closed-source professional work — the write-up describes it without the source.'
      }`,
    ],
  });
  return sections;
}

function homePage(): AioPage {
  return {
    path: '/',
    file: 'index.html',
    title: `${profile.name} — ${en(profile.title)}`,
    description: en(profile.tagline),
    heading: profile.name,
    sections: [
      { heading: 'About', paragraphs: [en(profile.bio)] },
      {
        heading: 'What this site is',
        paragraphs: [
          'Pulse is this portfolio and, at the same time, the system it describes. Opening the page joins a live presence set over a SignalR WebSocket, puts a dot on a shared world map, and publishes a visit event through a real event-driven backend — a .NET API, a RabbitMQ transactional outbox, a separate worker process, Postgres, and OpenTelemetry traces. The public metrics on the page are that system reporting on itself.',
        ],
      },
      {
        heading: 'Selected projects',
        bullets: projects.map((p) => `${p.name} — ${en(p.tagline)}`),
      },
      {
        heading: 'Core skills',
        bullets: profile.skills.map((g) => `${en(g.group)}: ${g.items.join(', ')}`),
      },
    ],
    priority: 1.0,
  };
}

function aboutPage(): AioPage {
  return {
    path: '/about',
    file: 'about.html',
    title: `About ${profile.name} — ${en(profile.title)}`,
    description: en(profile.bio),
    heading: `About ${profile.name}`,
    sections: [
      { heading: 'Biography', paragraphs: [en(profile.bio)] },
      {
        heading: 'Experience',
        bullets: profile.experience.map(
          (e) => `${en(e.role)}, ${e.org} (${en(e.period)}) — ${en(e.summary)}`,
        ),
      },
      {
        heading: 'Skills',
        bullets: profile.skills.map((g) => `${en(g.group)}: ${g.items.join(', ')}`),
      },
      {
        heading: 'Contact',
        bullets: [
          `Email: ${profile.contact.email}`,
          `LinkedIn: ${profile.contact.linkedin}`,
          'GitHub: https://github.com/felipe-allmeida',
        ],
      },
    ],
    priority: 0.9,
  };
}

function projectsPage(): AioPage {
  return {
    path: '/projects',
    file: 'projects.html',
    title: `Projects — ${profile.name}`,
    description: `Software projects by ${profile.name}: ${projects.map((p) => p.name).join(', ')} — distributed systems, internal enterprise platforms, and developer infrastructure in .NET and React.`,
    heading: `Projects by ${profile.name}`,
    sections: projects.map((p) => ({
      heading: p.name,
      paragraphs: [en(p.description)],
      bullets: [`Stack: ${p.tech.join(', ')}`, `Role: ${en(p.role)}`],
    })),
    priority: 0.9,
  };
}

function projectPage(p: Project): AioPage {
  return {
    path: `/projects/${p.slug}`,
    file: `projects/${p.slug}.html`,
    title: `${p.name} — ${en(p.tagline)} | ${profile.name}`,
    description: en(p.description),
    heading: `${p.name} — ${en(p.tagline)}`,
    sections: projectSections(p),
    priority: 0.8,
  };
}

function livePage(): AioPage {
  return {
    path: '/live',
    file: 'live.html',
    title: `Live system metrics — ${profile.name}`,
    description:
      'The public operations dashboard for Pulse: real-time presence counts, a live visitor world map, event throughput, and latency, read straight from the running .NET + Redis + Postgres backend.',
    heading: 'Live system metrics',
    sections: [
      {
        heading: 'What is on this page',
        paragraphs: [
          'A public ops dashboard for the system running this site. Presence comes from a TTL-pruned Redis sorted set behind a SignalR hub; visit events travel through a RabbitMQ transactional outbox to a worker that writes the audit log and aggregates in Postgres; traces and metrics are exported over OpenTelemetry. The numbers here are live, not sampled fixtures.',
        ],
      },
    ],
    priority: 0.6,
  };
}

function watchedPage(): AioPage {
  return {
    path: '/watched',
    file: 'watched.html',
    title: `How web tracking actually works — ${profile.name}`,
    description:
      'A walkthrough of what a website can infer about a visitor without cookies or permissions: passive browser signals, IP-derived coarse geolocation, fingerprinting surfaces, and how that data reaches a real-time ad auction.',
    heading: 'What this page can tell about you',
    sections: [
      {
        heading: 'What is on this page',
        paragraphs: [
          'A demonstration, built on this site, of the signals a visitor hands over passively: browser and device characteristics, coarse geolocation derived from the connecting IP, and the fingerprinting surfaces available to any page. It then shows how those signals are packaged into a bid request in a real-time ad auction. It is a teaching page about tracking, not a tracker: the demo does not persist the visitor IP.',
        ],
      },
    ],
    priority: 0.6,
  };
}

/**
 * The page for a live pathname, tolerating the trailing slash a browser may
 * carry. Returns `undefined` for routes with no static document.
 */
export function pageForPath(pathname: string): AioPage | undefined {
  const normalised = pathname.length > 1 ? pathname.replace(/\/+$/, '') : '/';
  return buildPages().find((p) => p.path === normalised);
}

/** Every route the AIO build step emits a static document for. */
export function buildPages(): AioPage[] {
  return [
    homePage(),
    aboutPage(),
    projectsPage(),
    ...projects.map(projectPage),
    livePage(),
    watchedPage(),
  ];
}
