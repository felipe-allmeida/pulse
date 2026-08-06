import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useEventStore } from '@/stores/event-store';
import { renderWithI18n } from '@/test/render-with-i18n';

const useMetricsMock = vi.fn();
const useVisitsMock = vi.fn();

vi.mock('@/lib/api', () => ({
  useMetrics: () => useMetricsMock(),
  useVisits: () => useVisitsMock(),
}));

function mockMatchMedia(matches: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

const { EngineeringShowcase } = await import('./engineering-showcase');

describe('EngineeringShowcase', () => {
  beforeEach(() => {
    useEventStore.setState({ events: [] });
    useMetricsMock.mockReturnValue({ data: { activeConnections: 5, totalVisits: 100 } });
    useVisitsMock.mockReturnValue({
      data: [{ lat: 38.7, lon: -9.1, city: 'Lisbon', country: 'Portugal', at: '2026-08-04T10:00:00Z' }],
    });
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

  it('composes stat tiles, the event stream, and the architecture diagram', async () => {
    await renderWithI18n(<EngineeringShowcase />);

    expect(screen.getByText(/online now/i)).toBeInTheDocument();
    expect(screen.getByText(/no events yet/i)).toBeInTheDocument();
    expect(screen.getByText('RabbitMQ')).toBeInTheDocument();
  });
});
