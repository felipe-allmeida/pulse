import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithI18n } from '@/test/render-with-i18n';

const useVisitsMock = vi.fn();

vi.mock('@/lib/api', () => ({
  useVisits: () => useVisitsMock(),
}));

const { RecentVisitsTable } = await import('./recent-visits-table');

describe('RecentVisitsTable', () => {
  it('renders visit rows with city, country and a relative time', async () => {
    useVisitsMock.mockReturnValue({
      data: [
        { lat: 38.7, lon: -9.1, city: 'Lisbon', country: 'Portugal', at: '2026-08-04T09:59:00Z' },
        { lat: 40.7, lon: -74.0, city: 'NYC', country: 'United States', at: '2026-08-04T09:55:00Z' },
      ],
      isLoading: false,
    });

    await renderWithI18n(<RecentVisitsTable now={new Date('2026-08-04T10:00:00Z')} />);

    expect(screen.getByText('Lisbon')).toBeInTheDocument();
    expect(screen.getByText('Portugal')).toBeInTheDocument();
    expect(screen.getByText('NYC')).toBeInTheDocument();
    expect(screen.getByText('United States')).toBeInTheDocument();

    const relativeTimes = screen.getAllByText(/ago/i);
    expect(relativeTimes.length).toBeGreaterThan(0);
  });

  it('sorts newest first', async () => {
    useVisitsMock.mockReturnValue({
      data: [
        { lat: 40.7, lon: -74.0, city: 'NYC', country: 'United States', at: '2026-08-04T09:00:00Z' },
        { lat: 38.7, lon: -9.1, city: 'Lisbon', country: 'Portugal', at: '2026-08-04T09:59:00Z' },
      ],
      isLoading: false,
    });

    await renderWithI18n(<RecentVisitsTable now={new Date('2026-08-04T10:00:00Z')} />);

    const cityCells = screen.getAllByRole('row').slice(1).map((row) => row.textContent);
    expect(cityCells[0]).toContain('Lisbon');
    expect(cityCells[1]).toContain('NYC');
  });

  it('shows skeleton rows while loading', async () => {
    useVisitsMock.mockReturnValue({ data: undefined, isLoading: true });
    const { container } = await renderWithI18n(<RecentVisitsTable />);
    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0);
  });

  it('shows an empty state when there are no visits', async () => {
    useVisitsMock.mockReturnValue({ data: [], isLoading: false });
    await renderWithI18n(<RecentVisitsTable />);
    expect(screen.getByText(/no visits/i)).toBeInTheDocument();
  });

  it('renders pt-BR column headers and empty state', async () => {
    useVisitsMock.mockReturnValue({ data: [], isLoading: false });
    await renderWithI18n(<RecentVisitsTable />, { locale: 'pt-BR' });
    expect(screen.getByText('Cidade')).toBeInTheDocument();
    expect(screen.getByText('País')).toBeInTheDocument();
    expect(screen.getByText('Quando')).toBeInTheDocument();
    expect(screen.getByText(/nenhuma visita/i)).toBeInTheDocument();
  });
});
