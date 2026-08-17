import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithI18n } from '@/test/render-with-i18n';
import { EngineeringShowcase } from './engineering-showcase';

function mockMatchMedia(matches: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

describe('EngineeringShowcase', () => {
  beforeEach(() => {
    mockMatchMedia(false);
  });

  it('renders the localized eyebrow', async () => {
    await renderWithI18n(<EngineeringShowcase />);
    expect(screen.getByText(/what you're looking at/i)).toBeInTheDocument();
  });

  it('renders the localized pt-BR eyebrow', async () => {
    await renderWithI18n(<EngineeringShowcase />, { locale: 'pt-BR' });
    expect(screen.getByText(/o que você está vendo/i)).toBeInTheDocument();
  });

  it('composes the architecture diagram — "how it works" — and nothing else that duplicates the live-proof block', async () => {
    await renderWithI18n(<EngineeringShowcase />);

    expect(screen.getByText('RabbitMQ')).toBeInTheDocument();

    // Stats and the event stream are shown exactly once on the home page,
    // in the live-proof block (routes/index.tsx) — not here.
    expect(screen.queryByText(/online now/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/no events yet/i)).not.toBeInTheDocument();
  });
});
