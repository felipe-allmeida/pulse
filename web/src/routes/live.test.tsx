import { screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { LivePage } from '@/components/live/live-page';
import { renderWithI18n } from '@/test/render-with-i18n';
import { useEventStore } from '@/stores/event-store';

const useMetricsMock = vi.fn();
const useVisitsMock = vi.fn();

vi.mock('@/lib/api', () => ({
  useMetrics: () => useMetricsMock(),
  useVisits: () => useVisitsMock(),
}));

describe('LivePage', () => {
  beforeEach(() => {
    useEventStore.setState({ events: [], seenVisits: new Set() });
    useMetricsMock.mockReturnValue({ data: undefined, isLoading: true });
    useVisitsMock.mockReturnValue({ data: undefined, isLoading: true });
  });

  it('renders exactly one h1 plus the full widget stack', async () => {
    useMetricsMock.mockReturnValue({ data: { activeConnections: 7, totalVisits: 120 }, isLoading: false });
    useVisitsMock.mockReturnValue({
      data: [{ lat: 38.7, lon: -9.1, city: 'Lisbon', country: 'Portugal', at: '2026-08-04T10:00:00Z' }],
      isLoading: false,
    });

    await renderWithI18n(<LivePage />);

    const headings = screen.getAllByRole('heading', { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent('Live dashboard');

    // The full panel: KpiRow, LiveMap, RecentVisitsTable, VisitsChart, EventFeed.
    expect(screen.getByText('Active connections')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /world map of live visitor locations/i })).toBeInTheDocument();
    expect(screen.getByText('Recent visits')).toBeInTheDocument();
    expect(screen.getByText('Visits over time')).toBeInTheDocument();
    expect(screen.getByText('Live activity')).toBeInTheDocument();
  });

  it('renders pt-BR heading and section copy', async () => {
    await renderWithI18n(<LivePage />, { locale: 'pt-BR' });

    expect(screen.getByRole('heading', { level: 1, name: 'Painel ao vivo' })).toBeInTheDocument();
    expect(screen.getByText('Visitas recentes')).toBeInTheDocument();
  });
});
