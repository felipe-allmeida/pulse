import { act, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { describe, expect, it, vi } from 'vitest';
import i18n from '@/i18n';
import { renderWithI18n } from '@/test/render-with-i18n';

function mockMatchMedia(matches: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

const { ArchitectureDiagram } = await import('./architecture-diagram');

describe('ArchitectureDiagram', () => {
  it('renders localized node labels for the full pipeline', async () => {
    mockMatchMedia(false);

    await renderWithI18n(<ArchitectureDiagram />);

    expect(screen.getByText('Web')).toBeInTheDocument();
    expect(screen.getByText('API')).toBeInTheDocument();
    expect(screen.getByText('RabbitMQ')).toBeInTheDocument();
    expect(screen.getByText('Worker')).toBeInTheDocument();
    expect(screen.getByText('Postgres')).toBeInTheDocument();
  });

  it('renders a localized caption', async () => {
    mockMatchMedia(false);

    await renderWithI18n(<ArchitectureDiagram />, { locale: 'pt-BR' });

    expect(screen.getByText(/pipeline/i)).toBeInTheDocument();
  });

  it('freezes the signal pulse under prefers-reduced-motion: reduce', async () => {
    mockMatchMedia(true);

    const { container } = await renderWithI18n(<ArchitectureDiagram />);

    expect(container.querySelector('[data-motion="static"]')).toBeInTheDocument();
  });

  it('animates the signal pulse when motion is not reduced', async () => {
    mockMatchMedia(false);

    const { container } = await renderWithI18n(<ArchitectureDiagram />);

    expect(container.querySelector('[data-motion="animated"]')).toBeInTheDocument();
  });

  it('does not play a traversal on mount, even with a traversalKey already set', async () => {
    mockMatchMedia(false);

    const { container } = await renderWithI18n(<ArchitectureDiagram traversalKey={0} />);

    expect(container.querySelector('[data-traversal="playing"]')).not.toBeInTheDocument();
  });

  it('plays one traversal when traversalKey changes', async () => {
    mockMatchMedia(false);

    const { container, rerender } = await renderWithI18n(<ArchitectureDiagram traversalKey={0} />);
    expect(container.querySelector('[data-traversal="playing"]')).not.toBeInTheDocument();

    // `rerender` must be handed the same top-level element type it was
    // first rendered with (the I18nextProvider wrapper renderWithI18n
    // applies) — otherwise React tears down and remounts a fresh tree
    // instead of updating props on the existing one, which would silently
    // reset the "already mounted" guard this test is meant to exercise.
    await act(async () => {
      rerender(
        <I18nextProvider i18n={i18n}>
          <ArchitectureDiagram traversalKey={1} />
        </I18nextProvider>,
      );
    });

    expect(container.querySelector('[data-traversal="playing"]')).toBeInTheDocument();
  });

  it('does not play a traversal under prefers-reduced-motion', async () => {
    mockMatchMedia(true);

    const { container, rerender } = await renderWithI18n(<ArchitectureDiagram traversalKey={0} />);

    await act(async () => {
      rerender(
        <I18nextProvider i18n={i18n}>
          <ArchitectureDiagram traversalKey={1} />
        </I18nextProvider>,
      );
    });

    expect(container.querySelector('[data-traversal="playing"]')).not.toBeInTheDocument();
  });
});
