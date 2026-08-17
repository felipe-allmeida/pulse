// @vitest-environment node
//
// Node, not jsdom, on purpose. The whole value of this file is that it fails
// the moment something in the component tree reaches for `window`, `document`
// or `navigator` during render — under jsdom those all exist and the
// regression sails through, only to surface as an empty `#root` in every
// document the build ships.
import { describe, expect, it } from 'vitest';
import { renderRoute } from './entry-prerender';
import { buildPages } from './lib/aio/pages';
import { faq } from './content/faq';
import { profile } from './content/profile';

const CASES = (['en', 'pt-BR'] as const).flatMap((locale) =>
  buildPages(locale).map((page) => ({ locale, routePath: page.routePath })),
);

/** Visible text of the rendered markup, tags stripped. */
function textOf(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

describe('prerender', () => {
  it('has no browser globals to fall back on', () => {
    expect(typeof window).toBe('undefined');
    expect(typeof document).toBe('undefined');
  });

  it.each(CASES)('renders $routePath in $locale without touching the DOM', async ({ routePath, locale }) => {
    const html = await renderRoute(routePath, locale);

    expect(html.length).toBeGreaterThan(500);
    expect(html).toContain('pulse');
  });

  it('puts the About page’s substance in the markup, not just the shell', async () => {
    const text = textOf(await renderRoute('/about', 'en'));

    expect(text).toContain(profile.name);
    expect(text).toContain(profile.experience[0].org);
    // The FAQ answers are the most quotable thing on the site; they have to
    // survive into the served HTML.
    expect(text).toContain(faq[0].question.en.replace(/\s+/g, ' '));
  });

  it('renders each locale in its own language', async () => {
    expect(textOf(await renderRoute('/about', 'pt-BR'))).toContain('Disponível agora');
    expect(textOf(await renderRoute('/about', 'en'))).toContain('Available now');
  });

  it('keeps navigation in-locale so a crawler stays on the right side of the site', async () => {
    const pt = await renderRoute('/about', 'pt-BR');

    expect(pt).toContain('href="/pt/projects"');
    expect(pt).not.toMatch(/href="\/projects"/);

    // The language switcher's own links are *not* here — they live in a
    // dropdown that only mounts when opened. Crossing between locales is
    // hreflang's job (see renderHead), not the toggle's.
    expect(await renderRoute('/about', 'en')).toContain('href="/projects"');
  });

  it('lists every project on the projects index', async () => {
    const text = textOf(await renderRoute('/projects', 'en'));
    for (const name of ['Pulse', 'Ulbra Atende', 'Ulbra One']) {
      expect(text).toContain(name);
    }
  });
});
