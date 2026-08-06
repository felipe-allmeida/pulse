import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
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
});
