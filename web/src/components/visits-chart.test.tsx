import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const useVisitsMock = vi.fn();

vi.mock('@/lib/api', () => ({
  useVisits: () => useVisitsMock(),
}));

const { VisitsChart } = await import('./visits-chart');

describe('VisitsChart', () => {
  it('mounts without throwing given mocked visit data', () => {
    useVisitsMock.mockReturnValue({
      data: [
        { lat: 38.7, lon: -9.1, city: 'Lisbon', country: 'Portugal', at: '2026-08-04T10:15:00Z' },
        { lat: 40.7, lon: -74.0, city: 'NYC', country: 'United States', at: '2026-08-04T10:45:00Z' },
      ],
    });
    expect(() => render(<VisitsChart />)).not.toThrow();
    expect(screen.getByText('Recent visits')).toBeInTheDocument();
  });

  it('renders an empty state when there is no data yet', () => {
    useVisitsMock.mockReturnValue({ data: undefined });
    render(<VisitsChart />);
    expect(screen.getByText('Recent visits')).toBeInTheDocument();
    expect(screen.getByText('No visits yet.')).toBeInTheDocument();
  });
});
