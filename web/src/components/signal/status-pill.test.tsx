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

const { StatusPill } = await import('./status-pill');

describe('StatusPill', () => {
  it('renders the localized "Available now" text', async () => {
    mockMatchMedia(false);

    await renderWithI18n(<StatusPill />);

    expect(screen.getByText(/available now/i)).toBeInTheDocument();
  });

  it('renders the localized pt-BR text', async () => {
    mockMatchMedia(false);

    await renderWithI18n(<StatusPill />, { locale: 'pt-BR' });

    expect(screen.getByText(/dispon[ií]vel agora/i)).toBeInTheDocument();
  });

  it('renders optional trailing detail next to the status text', async () => {
    mockMatchMedia(false);

    await renderWithI18n(<StatusPill detail="open to Staff / Principal" />);

    expect(screen.getByText(/open to staff \/ principal/i)).toBeInTheDocument();
  });

  it('freezes the pulse under prefers-reduced-motion: reduce', async () => {
    mockMatchMedia(true);

    const { container } = await renderWithI18n(<StatusPill />);

    expect(container.querySelector('[data-motion="static"]')).toBeInTheDocument();
  });

  it('animates the pulse when motion is not reduced', async () => {
    mockMatchMedia(false);

    const { container } = await renderWithI18n(<StatusPill />);

    expect(container.querySelector('[data-motion="animated"]')).toBeInTheDocument();
  });
});
