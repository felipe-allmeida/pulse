import { screen } from '@testing-library/react';
import { describe, expect, it, vi, afterEach } from 'vitest';
import { renderWithI18n } from '@/test/render-with-i18n';

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

  it('shows skeletons while loading', async () => {
    useMetricsMock.mockReturnValue({ data: undefined, isLoading: true });
    const { container } = await renderWithI18n(<KpiRow />);
    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0);
  });

  it('renders both stat cards with sparklines once metrics arrive', async () => {
    vi.stubGlobal('ResizeObserver', ResizeObserverStub);
    useMetricsMock.mockReturnValue({ data: { activeConnections: 5, totalVisits: 42 }, isLoading: false });

    const { container } = await renderWithI18n(<KpiRow />);

    expect(screen.getByText('Active connections')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('Total visits')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(container.querySelectorAll('.recharts-surface').length).toBe(2);
  });

  it('renders pt-BR labels once metrics arrive', async () => {
    useMetricsMock.mockReturnValue({ data: { activeConnections: 5, totalVisits: 42 }, isLoading: false });

    await renderWithI18n(<KpiRow />, { locale: 'pt-BR' });

    expect(screen.getByText('Conexões ativas')).toBeInTheDocument();
    expect(screen.getByText('Total de visitas')).toBeInTheDocument();
  });
});
