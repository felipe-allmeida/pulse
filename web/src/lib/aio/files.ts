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
import type { Locale } from '../../content/types';
import { LOCALES } from '../../content/types';
import { DEFAULT_LOCALE } from '../../i18n/locale-url';
import type { AioPage } from './pages';
import { alternatesFor } from './pages';
import { absoluteUrl, markdownPathFor } from './render';

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

/**
 * A sitemap with the `hreflang` set inline on every entry — the form Google
 * documents for multilingual sites, and the one that stops the two locales
 * being read as duplicates of each other.
 */
export function renderSitemap(pages: AioPage[], base: string, lastmod: string): string {
  const urls = pages
    .map((page) => {
      const alternates = alternatesFor(page.routePath);
      const links = [
        ...alternates.map(
          (alternate) =>
            `    <xhtml:link rel="alternate" hreflang="${alternate.locale}" href="${absoluteUrl(base, alternate.path)}" />`,
        ),
        `    <xhtml:link rel="alternate" hreflang="x-default" href="${absoluteUrl(
          base,
          alternates.find((a) => a.locale === DEFAULT_LOCALE)!.path,
        )}" />`,
      ];
      return [
        '  <url>',
        `    <loc>${absoluteUrl(base, page.path)}</loc>`,
        `    <lastmod>${lastmod}</lastmod>`,
        `    <priority>${page.priority.toFixed(1)}</priority>`,
        ...links,
        '  </url>',
      ].join('\n');
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls}\n</urlset>\n`;
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

  if (page.faq?.length) {
    lines.push(`## ${page.locale === 'pt-BR' ? 'Perguntas frequentes' : 'FAQ'}`, '');
    for (const entry of page.faq) {
      lines.push(`### ${entry.question}`, '', entry.answer, '');
    }
  }

  lines.push('---', '', `Source: ${absoluteUrl(base, page.path)}`, '');
  return lines.join('\n');
}

const LOCALE_LABEL: Record<Locale, string> = { en: 'English', 'pt-BR': 'Português' };

function pageLinks(pages: AioPage[], base: string, locale: Locale): string[] {
  return pages
    .filter((page) => page.locale === locale)
    .map((page) => `- [${page.heading}](${base}${markdownPathFor(page.path)}): ${page.description}`);
}

/** The curated index — short by design, one hop from every real answer. */
export function renderLlmsTxt(pages: AioPage[], base: string): string {
  const english = pages.filter((page) => page.locale === DEFAULT_LOCALE);
  const content = english.filter((page) => !page.routePath.startsWith('/projects/'));
  const projectPages = english.filter((page) => page.routePath.startsWith('/projects/'));

  const lines: string[] = [
    `# ${profile.name}`,
    '',
    `> ${en(profile.title)}. ${en(profile.bio)}`,
    '',
    'This is the personal site and engineering portfolio of ' +
      `${profile.name}. The site itself ("Pulse") is a working distributed system — live presence over SignalR, a visitor world map, and public metrics served by a .NET event-driven backend — so the portfolio and the demo are the same artifact.`,
    '',
    `Every page exists in English (unprefixed) and Portuguese (under /pt).`,
    '',
    '## Pages',
    '',
    ...content.map((page) => `- [${page.heading}](${base}${markdownPathFor(page.path)}): ${page.description}`),
    '',
    '## Projects',
    '',
    ...projectPages.map((page) => `- [${page.heading}](${base}${markdownPathFor(page.path)}): ${page.description}`),
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
    '## Português',
    '',
    ...pageLinks(pages, base, 'pt-BR'),
    '',
    '## Optional',
    '',
    `- [Full site content in one file](${base}/llms-full.txt)`,
    `- [CV (PDF)](${base}/cv.pdf)`,
    '',
  ];

  return lines.join('\n');
}

/** Everything, in one fetch, in reading order, grouped by language. */
export function renderLlmsFullTxt(pages: AioPage[], base: string): string {
  const header = [
    `# ${profile.name} — complete site content`,
    '',
    `> ${en(profile.title)}. Every page of ${base} as markdown, in one file.`,
    '',
  ].join('\n');

  const sections = LOCALES.map((locale) => {
    const body = pages
      .filter((page) => page.locale === locale)
      .map((page) => renderPageMarkdown(page, base))
      .join('\n');
    return `\n# ${LOCALE_LABEL[locale]}\n\n${body}`;
  }).join('\n');

  return header + sections;
}
