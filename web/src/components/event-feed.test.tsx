import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useEventStore } from '@/stores/event-store';
import { renderWithI18n } from '@/test/render-with-i18n';

const { EventFeed } = await import('./event-feed');

describe('EventFeed', () => {
  beforeEach(() => {
    useEventStore.setState({ events: [] });
  });

  it('lists events from the event store', async () => {
    useEventStore
      .getState()
      .push({ kind: 'visit', city: 'Lisbon', country: 'Portugal', at: '2026-08-04T09:55:00Z' });
    useEventStore.getState().push({ kind: 'reaction', emoji: '🔥', at: '2026-08-04T09:59:00Z' });

    await renderWithI18n(<EventFeed />);

    expect(screen.getByText('Visit from Lisbon, Portugal')).toBeInTheDocument();
    expect(screen.getByText('Pulse 🔥')).toBeInTheDocument();
  });

  it('shows newest first', async () => {
    useEventStore
      .getState()
      .push({ kind: 'visit', city: 'Older', country: 'Land', at: '2026-08-04T09:00:00Z' });
    useEventStore
      .getState()
      .push({ kind: 'visit', city: 'Newer', country: 'Land', at: '2026-08-04T09:59:00Z' });

    await renderWithI18n(<EventFeed />);

    const items = screen.getAllByRole('listitem');
    expect(items[0].textContent).toContain('Newer');
    expect(items[1].textContent).toContain('Older');
  });

  it('shows an empty state when there are no events', async () => {
    await renderWithI18n(<EventFeed />);
    expect(screen.getByText(/no events yet/i)).toBeInTheDocument();
  });

  it('renders pt-BR title and empty state', async () => {
    await renderWithI18n(<EventFeed />, { locale: 'pt-BR' });
    expect(screen.getByText('Atividade ao vivo')).toBeInTheDocument();
    expect(screen.getByText(/nenhum evento ainda/i)).toBeInTheDocument();
  });

  it('renders pt-BR visit and pulse events with no English fragments', async () => {
    useEventStore
      .getState()
      .push({ kind: 'visit', city: 'Lisboa', country: 'Portugal', at: '2026-08-04T09:55:00Z' });
    useEventStore.getState().push({ kind: 'reaction', emoji: '🔥', at: '2026-08-04T09:59:00Z' });

    await renderWithI18n(<EventFeed />, { locale: 'pt-BR' });

    expect(screen.getByText('Visita de Lisboa, Portugal')).toBeInTheDocument();
    expect(screen.getByText('Pulso 🔥')).toBeInTheDocument();
  });
});
