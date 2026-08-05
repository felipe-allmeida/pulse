import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useEventStore } from '@/stores/event-store';

const { EventFeed } = await import('./event-feed');

describe('EventFeed', () => {
  beforeEach(() => {
    useEventStore.setState({ events: [] });
  });

  it('lists events from the event store', () => {
    useEventStore.getState().push({ kind: 'visit', label: 'Visit from Lisbon', at: '2026-08-04T09:55:00Z' });
    useEventStore.getState().push({ kind: 'reaction', label: 'Reaction 🔥', at: '2026-08-04T09:59:00Z' });

    render(<EventFeed />);

    expect(screen.getByText('Visit from Lisbon')).toBeInTheDocument();
    expect(screen.getByText('Reaction 🔥')).toBeInTheDocument();
  });

  it('shows newest first', () => {
    useEventStore.getState().push({ kind: 'visit', label: 'Older event', at: '2026-08-04T09:00:00Z' });
    useEventStore.getState().push({ kind: 'visit', label: 'Newer event', at: '2026-08-04T09:59:00Z' });

    render(<EventFeed />);

    const items = screen.getAllByRole('listitem');
    expect(items[0].textContent).toContain('Newer event');
    expect(items[1].textContent).toContain('Older event');
  });

  it('shows an empty state when there are no events', () => {
    render(<EventFeed />);
    expect(screen.getByText(/no events yet/i)).toBeInTheDocument();
  });
});
