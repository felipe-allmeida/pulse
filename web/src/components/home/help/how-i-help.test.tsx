import { fireEvent, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithI18n } from '@/test/render-with-i18n';
import { profile } from '@/content/profile';
import { useAskWidgetStore } from '@/stores/ask-widget-store';
import { HowIHelp } from './how-i-help';

vi.mock('./help-diagram', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./help-diagram')>();
  return { ...actual, HelpDiagram: ({ variant }: { variant: string }) => <div data-testid={`diagram-${variant}`} /> };
});

describe('HowIHelp', () => {
  beforeEach(() => {
    useAskWidgetStore.setState({ isOpen: false, pendingQuestion: null });
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })) as unknown as typeof window.matchMedia;
  });

  it('renders the heading, eyebrow and lede', async () => {
    await renderWithI18n(<HowIHelp />);

    expect(screen.getByRole('heading', { name: 'How can I help you?' })).toBeInTheDocument();
    expect(screen.getByText('what i solve')).toBeInTheDocument();
    expect(screen.getByText(/I don't sell technology/)).toBeInTheDocument();
  });

  it('renders all four cards, in order', async () => {
    const { container } = await renderWithI18n(<HowIHelp />);

    for (const variant of ['repetitive', 'spreadsheet', 'ai', 'idea']) {
      expect(screen.getByTestId(`diagram-${variant}`)).toBeInTheDocument();
    }

    const headings = Array.from(container.querySelectorAll('h3')).map((h) => h.textContent);
    expect(headings).toEqual([
      'Your team spends the day doing work a machine would do.',
      'Someone on your team spends the day filling in a spreadsheet.',
      'You want AI in what the company already does, not in a demo.',
      "The idea hasn't left the drawing board yet.",
    ]);
  });

  it('opens the Ask widget with an empty composer when the primary CTA is clicked', async () => {
    await renderWithI18n(<HowIHelp />);

    fireEvent.click(screen.getByRole('button', { name: /tell me your case/i }));

    expect(useAskWidgetStore.getState().isOpen).toBe(true);
    expect(
      useAskWidgetStore.getState().pendingQuestion,
      'the visitor types their own case — nothing is submitted for them',
    ).toBeNull();
  });

  it('gives both CTAs a 44px+ tap target', async () => {
    await renderWithI18n(<HowIHelp />);

    const ask = screen.getByRole('button', { name: /tell me your case/i });
    const book = screen.getByRole('link', { name: /talk to me/i });

    for (const cta of [ask, book]) {
      expect(cta.className).toMatch(/min-h-11|min-h-\[44px\]/);
    }
  });

  it('links the secondary CTA to the booking link, in a new tab', async () => {
    await renderWithI18n(<HowIHelp />);

    const book = screen.getByRole('link', { name: /talk to me/i });
    expect(book).toHaveAttribute('href', profile.contact.calendly);
    expect(book).toHaveAttribute('target', '_blank');
    expect(book).toHaveAttribute('rel', 'noreferrer');
  });

  it('renders pt-BR copy', async () => {
    await renderWithI18n(<HowIHelp />, { locale: 'pt-BR' });

    expect(screen.getByRole('heading', { name: 'Como eu posso te ajudar?' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /me conta o seu caso/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /conversar comigo/i })).toBeInTheDocument();
  });

  it('exposes the id the hero scroll cue scrolls to', async () => {
    const { container } = await renderWithI18n(<HowIHelp />);

    expect(container.querySelector('#how-i-help')).toBeInTheDocument();
  });
});
