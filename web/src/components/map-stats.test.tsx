import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithI18n } from '@/test/render-with-i18n';

const useMetricsMock = vi.fn();

vi.mock('@/lib/api', () => ({
  useMetrics: () => useMetricsMock(),
}));

const { MapStats } = await import('./map-stats');

describe('MapStats', () => {
  beforeEach(() => {
    useMetricsMock.mockReset();
  });

  it('shows both live counters with their labels', async () => {
    useMetricsMock.mockReturnValue({ data: { activeConnections: 7, totalVisits: 1204 }, isLoading: false });

    await renderWithI18n(<MapStats />);

    expect(screen.getByText('Active connections')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('Total visits')).toBeInTheDocument();
    expect(screen.getByText('1,204')).toBeInTheDocument();
  });

  it('formats numbers for the active locale', async () => {
    useMetricsMock.mockReturnValue({ data: { activeConnections: 3, totalVisits: 1204 }, isLoading: false });

    await renderWithI18n(<MapStats />, { locale: 'pt-BR' });

    expect(screen.getByText('Conexões ativas')).toBeInTheDocument();
    expect(screen.getByText('Total de visitas')).toBeInTheDocument();
    expect(screen.getByText('1.204')).toBeInTheDocument();
  });

  it('renders skeletons instead of zeroes while metrics load', async () => {
    useMetricsMock.mockReturnValue({ data: undefined, isLoading: true });

    const { container } = await renderWithI18n(<MapStats />);

    expect(screen.queryByText('0')).not.toBeInTheDocument();
    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0);
  });
});
