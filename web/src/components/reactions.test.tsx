import { act, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useEventStore } from '@/stores/event-store';
import { renderWithI18n } from '@/test/render-with-i18n';

const usePulseHubMock = vi.fn();

vi.mock('@/realtime/use-pulse-hub', () => ({
  usePulseHub: () => usePulseHubMock(),
}));

const { Reactions } = await import('./reactions');

function floatingEmojiEls(): Element[] {
  return Array.from(document.querySelectorAll('.animate-reaction-float'));
}

describe('Reactions', () => {
  beforeEach(() => {
    useEventStore.setState({ events: [] });
    usePulseHubMock.mockReturnValue({ count: 0, connection: 'connected', react: vi.fn() });
  });

  it('renders exactly the 8 allow-listed emoji buttons and no free-text input', async () => {
    const react = vi.fn();
    usePulseHubMock.mockReturnValue({ count: 0, connection: 'connected', react });

    await renderWithI18n(<Reactions />);

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(8);
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('calls react() with the clicked emoji', async () => {
    const react = vi.fn();
    usePulseHubMock.mockReturnValue({ count: 0, connection: 'connected', react });

    await renderWithI18n(<Reactions />);

    screen.getByText('🔥').click();

    expect(react).toHaveBeenCalledWith('🔥');
    expect(react).toHaveBeenCalledTimes(1);
  });

  it('does not float an emoji on mount when the store already has a reaction as its newest event', async () => {
    useEventStore.getState().push({ kind: 'reaction', label: 'Reaction 🎉', at: '2026-08-04T10:00:00Z' });

    await renderWithI18n(<Reactions />);

    expect(floatingEmojiEls()).toHaveLength(0);
  });

  it('floats an emoji when a new reaction is pushed after mount', async () => {
    await renderWithI18n(<Reactions />);

    expect(floatingEmojiEls()).toHaveLength(0);

    act(() => {
      useEventStore.getState().push({ kind: 'reaction', label: 'Reaction 🚀', at: '2026-08-04T10:01:00Z' });
    });

    const floating = floatingEmojiEls();
    expect(floating).toHaveLength(1);
    expect(floating[0]?.textContent).toBe('🚀');
  });

  it('renders localized aria-labels for reaction buttons in pt-BR', async () => {
    await renderWithI18n(<Reactions />, { locale: 'pt-BR' });

    expect(screen.getByRole('button', { name: 'Reagir com 🔥' })).toBeInTheDocument();
  });
});
