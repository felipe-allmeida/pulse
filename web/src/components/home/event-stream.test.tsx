import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useEventStore } from '@/stores/event-store';
import { renderWithI18n } from '@/test/render-with-i18n';

function mockMatchMedia(matches: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

const { EventStream } = await import('./event-stream');

describe('EventStream', () => {
  beforeEach(() => {
    useEventStore.setState({ events: [] });
    mockMatchMedia(false);
  });

  it('renders structured events from the shared event store, newest first', async () => {
    useEventStore
      .getState()
      .push({ kind: 'visit', city: 'Older', country: 'Land', at: '2026-08-04T09:00:00Z' });
    useEventStore
      .getState()
      .push({ kind: 'visit', city: 'Newer', country: 'Land', at: '2026-08-04T09:59:00Z' });

    await renderWithI18n(<EventStream />);

    const items = screen.getAllByRole('listitem');
    expect(items[0].textContent).toContain('Newer');
    expect(items[1].textContent).toContain('Older');
  });

  it('renders pt-BR localized visit and reaction labels via the shared eventFeed keys', async () => {
    useEventStore
      .getState()
      .push({ kind: 'visit', city: 'Lisboa', country: 'Portugal', at: '2026-08-04T09:55:00Z' });
    useEventStore.getState().push({ kind: 'reaction', emoji: '🔥', at: '2026-08-04T09:59:00Z' });

    await renderWithI18n(<EventStream />, { locale: 'pt-BR' });

    expect(screen.getByText('Visita de Lisboa, Portugal')).toBeInTheDocument();
    expect(screen.getByText('Reação 🔥')).toBeInTheDocument();
  });

  it('shows a live marker', async () => {
    await renderWithI18n(<EventStream />);
    expect(screen.getByText(/live/i)).toBeInTheDocument();
  });

  it('shows an empty state when there are no events yet', async () => {
    await renderWithI18n(<EventStream />);
    expect(screen.getByText(/no events yet/i)).toBeInTheDocument();
  });

  it('only shows the most recent 5 events', async () => {
    for (let i = 0; i < 8; i++) {
      useEventStore.getState().push({ kind: 'reaction', emoji: '🔥', at: `2026-08-04T09:${i}0:00Z` });
    }

    await renderWithI18n(<EventStream />);

    expect(screen.getAllByRole('listitem')).toHaveLength(5);
  });

  it('freezes the slide-in animation under prefers-reduced-motion: reduce', async () => {
    mockMatchMedia(true);
    useEventStore
      .getState()
      .push({ kind: 'visit', city: 'Lisbon', country: 'Portugal', at: '2026-08-04T09:55:00Z' });

    const { container } = await renderWithI18n(<EventStream />);

    expect(container.querySelector('[data-motion="static"]')).toBeInTheDocument();
  });
});
