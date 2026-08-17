import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithI18n } from '@/test/render-with-i18n';
import { profile } from '@/content/profile';
import { HowIHelp } from './how-i-help';

describe('HowIHelp', () => {
  it('renders the heading, eyebrow and lede', async () => {
    await renderWithI18n(<HowIHelp />);

    expect(screen.getByRole('heading', { name: 'How can I help you?' })).toBeInTheDocument();
    expect(screen.getByText('what i solve')).toBeInTheDocument();
    expect(screen.getByText(/I don't sell technology/)).toBeInTheDocument();
  });

  it('renders all four cards, in order', async () => {
    const { container } = await renderWithI18n(<HowIHelp />);

    const headings = Array.from(container.querySelectorAll('h3')).map((h) => h.textContent);
    expect(headings).toEqual([
      'Your team spends the day doing work a machine would do.',
      'Someone on your team spends the day filling in a spreadsheet.',
      'You want AI in what the company already does, not in a demo.',
      "The idea hasn't left the drawing board yet.",
    ]);
  });

  it('sends the primary CTA to WhatsApp with the message half-written', async () => {
    await renderWithI18n(<HowIHelp />);

    const ask = screen.getByRole('link', { name: /tell me your case/i });
    const href = ask.getAttribute('href') ?? '';

    // Asserted against the literal encoded href, not round-tripped through
    // decodeURIComponent: the English message contains only spaces and a
    // comma, so encoding and decoding it is a no-op that would pass whether
    // or not the component actually calls encodeURIComponent.
    expect(href).toBe(
      `${profile.contact.whatsapp}?text=Hi%20Felipe%2C%20I%20came%20from%20your%20site.%20What's%20stuck%20here%20today%20is%20`,
    );
    expect(ask).toHaveAttribute('target', '_blank');
    expect(ask).toHaveAttribute('rel', 'noreferrer');
  });

  it('names WhatsApp in the accessible name, keeping the visible label as its prefix', async () => {
    await renderWithI18n(<HowIHelp />);

    expect(screen.getByRole('link', { name: 'Tell me your case on WhatsApp' })).toBeInTheDocument();
  });

  it('gives both CTAs a 44px+ tap target', async () => {
    await renderWithI18n(<HowIHelp />);

    const ask = screen.getByRole('link', { name: /tell me your case/i });
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
    expect(screen.getByRole('link', { name: /me conta o seu caso/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /conversar comigo/i })).toBeInTheDocument();
  });

  it('features exactly one card, and it is the first', async () => {
    const { container } = await renderWithI18n(<HowIHelp />);

    const featured = container.querySelectorAll('[data-featured="true"]');
    expect(featured, 'hierarchy comes from one card being larger, not from four equal ones').toHaveLength(1);

    expect(featured[0]?.querySelector('h3')).toHaveTextContent(
      'Your team spends the day doing work a machine would do.',
    );
  });

  it('puts the three remaining cards in one row from md up', async () => {
    const { container } = await renderWithI18n(<HowIHelp />);

    const row = container.querySelector('[data-help-row]');
    expect(row).toBeInTheDocument();
    expect(row?.className).toMatch(/md:grid-cols-3/);
    expect(row?.querySelectorAll('h3')).toHaveLength(3);
  });
});
