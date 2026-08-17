import { screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithI18n } from '@/test/render-with-i18n';
import { HelpDiagram } from './help-diagram';

function mockMatchMedia(matches: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

/**
 * jsdom has no IntersectionObserver. This stub records the callback so a
 * test can decide when the diagram "enters the viewport".
 */
let triggerIntersection: ((isIntersecting: boolean) => void) | null = null;

function stubIntersectionObserver() {
  triggerIntersection = null;
  class Stub {
    cb: IntersectionObserverCallback;
    constructor(cb: IntersectionObserverCallback) {
      this.cb = cb;
      triggerIntersection = (isIntersecting: boolean) =>
        this.cb([{ isIntersecting } as IntersectionObserverEntry], this as unknown as IntersectionObserver);
    }
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
    takeRecords = vi.fn(() => []);
    root = null;
    rootMargin = '';
    thresholds = [];
  }
  vi.stubGlobal('IntersectionObserver', Stub);
}

describe('HelpDiagram', () => {
  beforeEach(() => {
    mockMatchMedia(false);
    stubIntersectionObserver();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders the three localized node labels for its variant', async () => {
    await renderWithI18n(<HelpDiagram variant="spreadsheet" />);

    expect(screen.getByText('spreadsheet')).toBeInTheDocument();
    expect(screen.getByText('dashboard')).toBeInTheDocument();
    expect(screen.getByText('action')).toBeInTheDocument();
  });

  it('renders pt-BR node labels', async () => {
    await renderWithI18n(<HelpDiagram variant="spreadsheet" />, { locale: 'pt-BR' });

    expect(screen.getByText('planilha')).toBeInTheDocument();
    expect(screen.getByText('painel')).toBeInTheDocument();
    expect(screen.getByText('ação')).toBeInTheDocument();
  });

  it('gives each variant its own triple of three distinct icons', async () => {
    const { container: repetitive } = await renderWithI18n(<HelpDiagram variant="repetitive" />);
    const { container: idea } = await renderWithI18n(<HelpDiagram variant="idea" />);

    // lucide-react stamps every icon with a `lucide-<name>` class — the only
    // stable handle on *which* icon rendered. The exact names are not
    // asserted: they change across lucide majors, and what matters is that
    // each card gets three different icons and no two cards share a triple.
    const iconsOf = (root: HTMLElement) =>
      Array.from(root.querySelectorAll('svg')).map(
        (svg) => Array.from(svg.classList).find((c) => c.startsWith('lucide-')) ?? '',
      );

    expect(iconsOf(repetitive)).toHaveLength(3);
    expect(new Set(iconsOf(repetitive)).size, 'three distinct icons within a card').toBe(3);
    expect(new Set(iconsOf(idea)).size, 'three distinct icons within a card').toBe(3);
    expect(iconsOf(repetitive)).not.toEqual(iconsOf(idea));
  });

  it('starts idle and plays the traversal once when it scrolls into view', async () => {
    const { container } = await renderWithI18n(<HelpDiagram variant="ai" />);
    const diagram = container.querySelector('[data-motion]') as HTMLElement;

    expect(diagram).toHaveAttribute('data-motion', 'animated');
    expect(diagram).toHaveAttribute('data-traversal', 'idle');

    triggerIntersection?.(true);

    await vi.waitFor(() => expect(diagram).toHaveAttribute('data-traversal', 'playing'));
  });

  it('stays static under prefers-reduced-motion, even once in view', async () => {
    mockMatchMedia(true);

    const { container } = await renderWithI18n(<HelpDiagram variant="ai" />);
    const diagram = container.querySelector('[data-motion]') as HTMLElement;

    expect(diagram).toHaveAttribute('data-motion', 'static');

    triggerIntersection?.(true);

    expect(diagram).toHaveAttribute('data-traversal', 'idle');
  });
});
