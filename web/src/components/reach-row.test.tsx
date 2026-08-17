import { screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithI18n } from '@/test/render-with-i18n';
import type { Stats } from '@/types/pulse';

const useStatsMock = vi.fn();

vi.mock('@/lib/api', () => ({
  useStats: () => useStatsMock(),
}));

const { ReachRow } = await import('./reach-row');

const stats: Stats = {
  countries: 12,
  cities: 34,
  firstVisitAt: '2026-01-02T03:04:05Z',
  topCountries: [
    { city: '', country: 'Brazil', count: 62 },
    { city: '', country: 'United States', count: 14 },
  ],
  topCities: [
    { city: 'Porto Alegre', country: 'Brazil', count: 48 },
    { city: 'Mountain View', country: 'United States', count: 9 },
  ],
};

describe('ReachRow', () => {
  beforeEach(() => {
    useStatsMock.mockReset();
  });

  it('ranks countries and cities with their all-time totals', async () => {
    useStatsMock.mockReturnValue({ data: stats, isLoading: false });

    await renderWithI18n(<ReachRow />);

    expect(screen.getByText('Top countries')).toBeInTheDocument();
    expect(screen.getByText('12 countries in all')).toBeInTheDocument();
    expect(screen.getByText('Brazil')).toBeInTheDocument();
    expect(screen.getByText('62')).toBeInTheDocument();

    // Country rows carry an empty `city`; city rows name both.
    expect(screen.getByText('34 cities in all')).toBeInTheDocument();
    expect(screen.getByText('Porto Alegre, Brazil')).toBeInTheDocument();
  });

  it('scales each bar against the busiest row, not the total', async () => {
    useStatsMock.mockReturnValue({ data: stats, isLoading: false });

    const { container } = await renderWithI18n(<ReachRow />);

    // Against a total dominated by one origin every other bar collapses to a
    // sliver, so the leader is 100% and the rest are relative to it.
    const bars = [...container.querySelectorAll('[aria-hidden="true"] > div')].map(
      (b) => (b as HTMLElement).style.width,
    );
    expect(bars[0]).toBe('100%');
    expect(bars[1]).toBe(`${Math.round((14 / 62) * 100)}%`);
  });

  it('pluralises the totals in pt-BR', async () => {
    useStatsMock.mockReturnValue({
      data: { ...stats, countries: 1, cities: 1 },
      isLoading: false,
    });

    await renderWithI18n(<ReachRow />, { locale: 'pt-BR' });

    expect(screen.getByText('Países que mais visitam')).toBeInTheDocument();
    expect(screen.getByText('1 país no total')).toBeInTheDocument();
    expect(screen.getByText('1 cidade no total')).toBeInTheDocument();
  });

  it('shows skeletons while stats load, and an empty state when there are none', async () => {
    useStatsMock.mockReturnValue({ data: undefined, isLoading: true });
    const loading = await renderWithI18n(<ReachRow />);
    expect(loading.container.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0);
    loading.unmount();

    useStatsMock.mockReturnValue({
      data: { countries: 0, cities: 0, firstVisitAt: null, topCountries: [], topCities: [] },
      isLoading: false,
    });
    await renderWithI18n(<ReachRow />);
    expect(screen.getAllByText('No visits yet.')).toHaveLength(2);
  });

  it('formats counts for the active locale', async () => {
    useStatsMock.mockReturnValue({
      data: { ...stats, topCountries: [{ city: '', country: 'Brazil', count: 1204 }] },
      isLoading: false,
    });

    await renderWithI18n(<ReachRow />, { locale: 'pt-BR' });

    const countries = screen.getByText('Países que mais visitam').closest('[data-slot="card"]')!;
    expect(within(countries as HTMLElement).getByText('1.204')).toBeInTheDocument();
  });
});
