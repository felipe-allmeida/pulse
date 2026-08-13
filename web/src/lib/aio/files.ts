/**
 * The non-HTML files an answer engine looks for: `robots.txt`, `sitemap.xml`,
 * the `llms.txt` family, and a markdown mirror of every route.
 *
 * `llms.txt` is the convention agents increasingly probe for before crawling a
 * site — a curated, plain-markdown map of what is here, without the nav, the
 * WebSocket client, or the 400 KB of chart bundle. `llms-full.txt` is the same
 * content expanded so a model can answer from one fetch.
 */
import { profile } from '../../content/profile';
import type { AioPage } from './pages';
import { absoluteUrl } from './render';

const en = <T extends { en: string }>(v: T): string => v.en;

/**
 * Crawlers that feed answer engines and model training. They are listed
 * explicitly rather than left to the wildcard so the intent is legible: this
 * site *wants* to be read and cited. `Google-Extended` and `Applebot-Extended`
 * are opt-out tokens — naming them with `Allow` records the same consent.
 */
export const AI_USER_AGENTS = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-User',
  'Claude-SearchBot',
  'anthropic-ai',
  'PerplexityBot',
  'Perplexity-User',
  'Google-Extended',
  'Applebot-Extended',
  'Applebot',
  'Bingbot',
  'DuckAssistBot',
  'Amazonbot',
  'meta-externalagent',
  'CCBot',
  'cohere-ai',
  'YouBot',
];

export function renderRobotsTxt(base: string): string {
  const blocks = [
    '# Pulse — https://github.com/felipe-allmeida/pulse',
    '# Every crawler is welcome, including the ones that feed answer engines.',
    '',
    'User-agent: *',
    'Allow: /',
    '',
    ...AI_USER_AGENTS.flatMap((ua) => [`User-agent: ${ua}`, 'Allow: /', '']),
    `Sitemap: ${base}/sitemap.xml`,
    '',
    '# Curated markdown map for LLM agents:',
    `# ${base}/llms.txt`,
    `# ${base}/llms-full.txt`,
    '',
  ];
  return blocks.join('\n');
}

export function renderSitemap(pages: AioPage[], base: string, lastmod: string): string {
  const urls = pages
    .map((page) =>
      [
        '  <url>',
        `    <loc>${absoluteUrl(base, page.path)}</loc>`,
        `    <lastmod>${lastmod}</lastmod>`,
        `    <priority>${page.priority.toFixed(1)}</priority>`,
        '  </url>',
      ].join('\n'),
    )
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

/** Markdown body of one route — the content of `/about.md` and friends. */
export function renderPageMarkdown(page: AioPage, base: string): string {
  const lines: string[] = [`# ${page.heading}`, '', `> ${page.description}`, ''];

  for (const section of page.sections) {
    lines.push(`## ${section.heading}`, '');
    for (const paragraph of section.paragraphs ?? []) {
      lines.push(paragraph, '');
    }
    for (const bullet of section.bullets ?? []) {
      lines.push(`- ${bullet}`);
    }
    if (section.bullets?.length) lines.push('');
  }

  lines.push('---', '', `Source: ${absoluteUrl(base, page.path)}`, '');
  return lines.join('\n');
}

/** The curated index — short by design, one hop from every real answer. */
export function renderLlmsTxt(pages: AioPage[], base: string): string {
  const byPath = Object.fromEntries(pages.map((p) => [p.path, p]));
  const projectPages = pages.filter((p) => p.path.startsWith('/projects/'));

  const lines: string[] = [
    `# ${profile.name}`,
    '',
    `> ${en(profile.title)}. ${en(profile.bio)}`,
    '',
    'This is the personal site and engineering portfolio of ' +
      `${profile.name}. The site itself ("Pulse") is a working distributed system — live presence over SignalR, a visitor world map, and public metrics served by a .NET event-driven backend — so the portfolio and the demo are the same artifact.`,
    '',
    '## Pages',
    '',
    ...['/', '/about', '/projects', '/live', '/watched']
      .filter((path) => byPath[path])
      .map((path) => {
        const page = byPath[path];
        const md = path === '/' ? '/index.md' : `${path}.md`;
        return `- [${page.heading}](${base}${md}): ${page.description}`;
      }),
    '',
    '## Projects',
    '',
    ...projectPages.map((page) => `- [${page.heading}](${base}${page.path}.md): ${page.description}`),
    '',
    '## Facts',
    '',
    `- Name: ${profile.name}`,
    `- Role: ${en(profile.title)}`,
    `- Currently: ${en(profile.experience[0].role)} at ${profile.experience[0].org}; open to new roles.`,
    `- Core stack: ${profile.skills.flatMap((g) => g.items).join(', ')}`,
    `- Email: ${profile.contact.email}`,
    `- LinkedIn: ${profile.contact.linkedin}`,
    '- GitHub: https://github.com/felipe-allmeida',
    '',
    '## Optional',
    '',
    `- [Full site content in one file](${base}/llms-full.txt)`,
    `- [CV (PDF)](${base}/cv.pdf)`,
    '',
  ];

  return lines.join('\n');
}

/** Everything, in one fetch, in reading order. */
export function renderLlmsFullTxt(pages: AioPage[], base: string): string {
  const header = [
    `# ${profile.name} — complete site content`,
    '',
    `> ${en(profile.title)}. Every page of ${base} as markdown, in one file.`,
    '',
    '## Português',
    '',
    `${en(profile.title)} — ${profile.bio['pt-BR']}`,
    '',
    '---',
    '',
  ].join('\n');

  return header + pages.map((page) => renderPageMarkdown(page, base)).join('\n');
}
