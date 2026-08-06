import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithI18n } from '@/test/render-with-i18n';

const useVisitsMock = vi.fn();

vi.mock('@/lib/api', () => ({
  useVisits: () => useVisitsMock(),
}));

const { VisitsChart } = await import('./visits-chart');

describe('VisitsChart', () => {
  it('mounts without throwing given mocked visit data', async () => {
    useVisitsMock.mockReturnValue({
      data: [
        { lat: 38.7, lon: -9.1, city: 'Lisbon', country: 'Portugal', at: '2026-08-04T10:15:00Z' },
        { lat: 40.7, lon: -74.0, city: 'NYC', country: 'United States', at: '2026-08-04T10:45:00Z' },
      ],
    });
    await expect(renderWithI18n(<VisitsChart />)).resolves.not.toThrow();
    expect(screen.getByText('Visits over time')).toBeInTheDocument();
  });

  it('renders an empty state when there is no data yet', async () => {
    useVisitsMock.mockReturnValue({ data: undefined });
    await renderWithI18n(<VisitsChart />);
    expect(screen.getByText('Visits over time')).toBeInTheDocument();
    expect(screen.getByText('No visits yet.')).toBeInTheDocument();
  });

  it('renders the pt-BR title and empty state', async () => {
    useVisitsMock.mockReturnValue({ data: undefined });
    await renderWithI18n(<VisitsChart />, { locale: 'pt-BR' });
    expect(screen.getByText('Visitas ao longo do tempo')).toBeInTheDocument();
    expect(screen.getByText('Nenhuma visita ainda.')).toBeInTheDocument();
  });
});
