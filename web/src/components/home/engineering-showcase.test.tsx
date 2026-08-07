import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithI18n } from '@/test/render-with-i18n';

function mockMatchMedia(matches: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

const usePulseHubMock = vi.fn();

vi.mock('@/realtime/use-pulse-hub', () => ({
  usePulseHub: () => usePulseHubMock(),
}));

const { EngineeringShowcase } = await import('./engineering-showcase');

describe('EngineeringShowcase', () => {
  beforeEach(() => {
    mockMatchMedia(false);
    usePulseHubMock.mockReturnValue({ count: 3, connection: 'connected', react: vi.fn().mockResolvedValue(undefined) });
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

  it('hosts the "send a pulse" button next to the diagram', async () => {
    await renderWithI18n(<EngineeringShowcase />);

    expect(screen.getByRole('button', { name: /send a pulse/i })).toBeInTheDocument();
  });

  it('places "send a pulse" before the diagram in DOM order, so it reads as the section\'s call-to-action near the heading — not buried after it', async () => {
    await renderWithI18n(<EngineeringShowcase />);

    const button = screen.getByRole('button', { name: /send a pulse/i });
    const diagramNode = screen.getByText('RabbitMQ');

    // DOCUMENT_POSITION_FOLLOWING on the diagram (from the button's
    // perspective) means the button comes first in the DOM.
    // eslint-disable-next-line no-bitwise
    expect(button.compareDocumentPosition(diagramNode) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
