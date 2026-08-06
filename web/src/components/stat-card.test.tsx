import { screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Activity } from 'lucide-react';
import { renderWithI18n } from '@/test/render-with-i18n';
import { StatCard } from './stat-card';

// jsdom has no ResizeObserver, which recharts' ResponsiveContainer relies on to
// size itself. Stub it with a synchronous implementation so the sparkline chart
// actually renders (instead of staying stuck at 0x0) for the assertion below.
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

describe('StatCard', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders the label and value', async () => {
    await renderWithI18n(<StatCard label="Active" value={5} icon={Activity} />);
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('renders a sparkline svg when series is provided', async () => {
    vi.stubGlobal('ResizeObserver', ResizeObserverStub);
    const { container } = await renderWithI18n(
      <StatCard label="Active" value={5} icon={Activity} series={[1, 2, 3, 4, 5]} />
    );
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(container.querySelector('.recharts-surface')).toBeInTheDocument();
  });

  it('does not render a sparkline when series is empty or absent', async () => {
    const { container } = await renderWithI18n(<StatCard label="Active" value={5} icon={Activity} series={[]} />);
    expect(container.querySelector('.recharts-responsive-container')).not.toBeInTheDocument();
  });

  it('marks the decorative icon as aria-hidden', async () => {
    const { container } = await renderWithI18n(<StatCard label="Active" value={5} icon={Activity} />);
    expect(container.querySelector('svg[aria-hidden="true"]')).toBeInTheDocument();
  });

  it('formats the value with Intl.NumberFormat for the active locale', async () => {
    await renderWithI18n(<StatCard label="Active" value={12345} icon={Activity} />, { locale: 'pt-BR' });
    expect(screen.getByText('12.345')).toBeInTheDocument();
  });
});
