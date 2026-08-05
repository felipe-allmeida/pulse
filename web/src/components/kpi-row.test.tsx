import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi, afterEach } from 'vitest';

const useMetricsMock = vi.fn();

vi.mock('@/lib/api', () => ({
  useMetrics: () => useMetricsMock(),
}));

// jsdom has no ResizeObserver, which recharts' ResponsiveContainer needs to size
// itself. Stub it so the sparkline actually renders instead of staying 0x0.
class ResizeObserverStub {
  private callback: ResizeObserverCallback;
  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }
  observe(target: Element) {
    this.callback([{ target, contentRect: { width: 200, height: 48 } } as ResizeObserverEntry], this as unknown as ResizeObserver);
  }
  unobserve() {}
  disconnect() {}
}

const { KpiRow } = await import('./kpi-row');

describe('KpiRow', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('shows skeletons while loading', () => {
    useMetricsMock.mockReturnValue({ data: undefined, isLoading: true });
    const { container } = render(<KpiRow />);
    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0);
  });

  it('renders both stat cards with sparklines once metrics arrive', () => {
    vi.stubGlobal('ResizeObserver', ResizeObserverStub);
    useMetricsMock.mockReturnValue({ data: { activeConnections: 5, totalVisits: 42 }, isLoading: false });

    const { container } = render(<KpiRow />);

    expect(screen.getByText('Active connections')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('Total visits')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(container.querySelectorAll('.recharts-surface').length).toBe(2);
  });
});
