import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithI18n } from '@/test/render-with-i18n';

const useVisitsMock = vi.fn();

vi.mock('@/lib/api', () => ({
  useVisits: () => useVisitsMock(),
}));

const { LiveMap } = await import('./live-map');

describe('LiveMap', () => {
  it('mounts without throwing given mocked visit data', async () => {
    useVisitsMock.mockReturnValue({
      data: [
        { lat: 38.7, lon: -9.1, city: 'Lisbon', country: 'Portugal', at: '2026-08-04T10:00:00Z' },
        { lat: 40.7, lon: -74.0, city: 'NYC', country: 'United States', at: '2026-08-04T11:00:00Z' },
      ],
    });
    await expect(renderWithI18n(<LiveMap />)).resolves.not.toThrow();
    expect(screen.getByText('Live locations')).toBeInTheDocument();
  });

  it('mounts without throwing when there is no data yet', async () => {
    useVisitsMock.mockReturnValue({ data: undefined });
    await expect(renderWithI18n(<LiveMap />)).resolves.not.toThrow();
    expect(screen.getByText('Live locations')).toBeInTheDocument();
  });

  it('renders the pt-BR title', async () => {
    useVisitsMock.mockReturnValue({ data: undefined });
    await renderWithI18n(<LiveMap />, { locale: 'pt-BR' });
    expect(screen.getByText('Localizações ao vivo')).toBeInTheDocument();
  });
});
