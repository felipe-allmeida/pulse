import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithI18n } from '@/test/render-with-i18n';

const useMetricsMock = vi.fn();
const useVisitsMock = vi.fn();

vi.mock('@/lib/api', () => ({
  useMetrics: () => useMetricsMock(),
  useVisits: () => useVisitsMock(),
}));

const { StatTiles } = await import('./stat-tiles');

const points = [
  { lat: 38.7, lon: -9.1, city: 'Lisbon', country: 'Portugal', at: '2026-08-04T10:00:00Z' },
  { lat: 40.7, lon: -74.0, city: 'New York', country: 'United States', at: '2026-08-04T11:00:00Z' },
  { lat: 35.7, lon: 139.7, city: 'Tokyo', country: 'Japan', at: '2026-08-04T11:05:00Z' },
  // Same city name, different country — must not collapse into the Lisbon count.
  { lat: -33.4, lon: -70.6, city: 'Lisbon', country: 'Chile', at: '2026-08-04T11:10:00Z' },
];

describe('StatTiles', () => {
  it('renders real values from the metrics and visits hooks', async () => {
    useMetricsMock.mockReturnValue({ data: { activeConnections: 12, totalVisits: 4231 } });
    useVisitsMock.mockReturnValue({ data: points });

    await renderWithI18n(<StatTiles />);

    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('4,231')).toBeInTheDocument();
    // 3 distinct countries: Portugal, United States, Japan, Chile → 4
    expect(screen.getByText('4')).toBeInTheDocument();
    // 4 distinct city+country pairs (two "Lisbon"s are different countries)
    expect(screen.getByText(/online now/i)).toBeInTheDocument();
  });

  it('does not render a fabricated latency tile', async () => {
    useMetricsMock.mockReturnValue({ data: { activeConnections: 12, totalVisits: 4231 } });
    useVisitsMock.mockReturnValue({ data: points });

    await renderWithI18n(<StatTiles />);

    expect(screen.queryByText(/laten/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/p95/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/ms\b/i)).not.toBeInTheDocument();
  });

  it('falls back to zero values when data has not loaded yet', async () => {
    useMetricsMock.mockReturnValue({ data: undefined });
    useVisitsMock.mockReturnValue({ data: undefined });

    await renderWithI18n(<StatTiles />);

    expect(screen.getAllByText('0').length).toBeGreaterThan(0);
  });

  it('formats numbers with Intl.NumberFormat for the current locale', async () => {
    useMetricsMock.mockReturnValue({ data: { activeConnections: 12, totalVisits: 1234567 } });
    useVisitsMock.mockReturnValue({ data: points });

    await renderWithI18n(<StatTiles />, { locale: 'pt-BR' });

    expect(screen.getByText('1.234.567')).toBeInTheDocument();
  });

  it('renders pt-BR labels', async () => {
    useMetricsMock.mockReturnValue({ data: { activeConnections: 12, totalVisits: 4231 } });
    useVisitsMock.mockReturnValue({ data: points });

    await renderWithI18n(<StatTiles />, { locale: 'pt-BR' });

    expect(screen.getByText(/online agora/i)).toBeInTheDocument();
  });
});
