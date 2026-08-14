import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router';
import { fireEvent, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { basepathForLocale } from '@/i18n/locale-url';
import { renderWithI18n } from '@/test/render-with-i18n';
import { LanguageToggle } from './language-toggle';

/**
 * The toggle reads the current route from the router, so the test mounts it in
 * one — at the same basepath the app uses for that locale.
 */
async function openMenu(pathname = '/', locale: 'en' | 'pt-BR' = 'en') {
  const rootRoute = createRootRoute({ component: LanguageToggle });
  const routes = ['/', '/about', '/projects', '/projects/$slug'].map((path) =>
    createRoute({ getParentRoute: () => rootRoute, path, component: () => null }),
  );
  const router = createRouter({
    routeTree: rootRoute.addChildren(routes),
    basepath: basepathForLocale(locale),
    history: createMemoryHistory({ initialEntries: [pathname] }),
  });

  await renderWithI18n(<RouterProvider router={router as never} />, { locale });
  // RouterProvider paints nothing until the router has loaded its first match.
  fireEvent.keyDown(await screen.findByRole('button', { name: /language|idioma/i }), { key: 'Enter' });
}

describe('LanguageToggle', () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.lang = '';
  });

  it('offers both PT and EN controls in the menu', async () => {
    await openMenu();

    expect(await screen.findByRole('menuitem', { name: /english|^en$/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /português/i })).toBeInTheDocument();
  });

  it('links each language to its own URL for the route being viewed', async () => {
    await openMenu('/projects/pulse');

    // Same route, other locale — switching language never dumps the visitor
    // back on the home page.
    expect(await screen.findByRole('menuitem', { name: /português/i })).toHaveAttribute(
      'href',
      '/pt/projects/pulse',
    );
    expect(screen.getByRole('menuitem', { name: /english/i })).toHaveAttribute('href', '/projects/pulse');
  });

  it('mirrors a prefixed path back to the unprefixed one', async () => {
    await openMenu('/pt/about', 'pt-BR');

    expect(await screen.findByRole('menuitem', { name: /english/i })).toHaveAttribute('href', '/about');
    expect(screen.getByRole('menuitem', { name: /português/i })).toHaveAttribute('href', '/pt/about');
  });

  it('remembers the chosen language for a later visit to the bare root', async () => {
    await openMenu();

    fireEvent.click(await screen.findByRole('menuitem', { name: /português/i }));

    expect(window.localStorage.getItem('pulse.lang')).toBe('pt-BR');
  });

  it('renders non-truncating, localized language labels and marks the active one', async () => {
    await openMenu();

    const englishItem = await screen.findByRole('menuitem', { name: /english/i });
    const portugueseItem = screen.getByRole('menuitem', { name: /português/i });

    // The literal strings, not split across nodes/lines ("e"/"n" bug).
    expect(englishItem).toHaveTextContent('English');
    expect(portugueseItem).toHaveTextContent('Português');

    // Never allowed to wrap — that's exactly how "EN" broke into "E"/"N".
    expect(englishItem.className).toMatch(/whitespace-nowrap/);
    expect(portugueseItem.className).toMatch(/whitespace-nowrap/);

    // A visible, programmatic active indicator.
    expect(englishItem).toHaveAttribute('aria-current', 'true');
    expect(portugueseItem).toHaveAttribute('aria-current', 'false');

    // >=44px touch target per row.
    expect(englishItem.className).toMatch(/min-h-11|h-11|min-h-\[44px\]/);
    expect(portugueseItem.className).toMatch(/min-h-11|h-11|min-h-\[44px\]/);
  });

  it('tags each option with the language it leads to', async () => {
    await openMenu();

    expect(await screen.findByRole('menuitem', { name: /português/i })).toHaveAttribute('hreflang', 'pt-BR');
    expect(screen.getByRole('menuitem', { name: /english/i })).toHaveAttribute('hreflang', 'en');
  });
});
