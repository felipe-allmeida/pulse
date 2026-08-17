import { screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import i18n from '@/i18n';
import { renderWithI18n } from '@/test/render-with-i18n';
import { HelpCard } from './help-card';

describe('HelpCard', () => {
  it('renders the headline and body for its variant', async () => {
    await renderWithI18n(<HelpCard variant="spreadsheet" />);

    expect(
      screen.getByText('Someone on your team spends the day filling in a spreadsheet.'),
    ).toBeInTheDocument();
    expect(screen.getByText(/The spreadsheet can stay/)).toBeInTheDocument();
  });

  it('shows both sides of the transform when featured', async () => {
    const { container } = await renderWithI18n(<HelpCard variant="repetitive" featured />);

    expect(screen.getByText('today')).toBeInTheDocument();
    expect(screen.getByText('someone retypes it, every Monday')).toBeInTheDocument();
    expect(screen.getByText('after')).toBeInTheDocument();
    expect(screen.getByText('runs on its own, on schedule')).toBeInTheDocument();

    // The two shapes must not converge: a featured card gets the pair, never
    // the compact single line.
    expect(container.querySelector('[data-transform="pair"]')).toBeInTheDocument();
    expect(container.querySelector('[data-transform="after"]')).not.toBeInTheDocument();
  });

  it('shows only the outcome when compact, so the three small cards stay short', async () => {
    // Not `screen.getByText`: the repetitive card's body copy also contains
    // the words "runs on its own, on schedule" as prose, so a text search
    // matches both the body paragraph and the transform line. `data-transform`
    // targets the transform line itself rather than coupling the test to
    // Tailwind class names, which would break on a purely cosmetic restyle
    // and would silently pass nothing if the selector stopped matching.
    const { container } = await renderWithI18n(<HelpCard variant="repetitive" />);

    const line = container.querySelector('[data-transform="after"]');
    expect(line).toBeInTheDocument();
    expect(line).toHaveTextContent('runs on its own, on schedule');
    expect(screen.queryByText('someone retypes it, every Monday')).not.toBeInTheDocument();
    expect(screen.queryByText('today')).not.toBeInTheDocument();

    // The two shapes must not converge: a compact card gets the single line,
    // never the featured pair.
    expect(container.querySelector('[data-transform="pair"]')).not.toBeInTheDocument();
  });

  it('marks the featured card in the DOM, and only when featured', async () => {
    const { container: plain } = await renderWithI18n(<HelpCard variant="ai" />);
    expect(plain.querySelector('[data-featured="true"]')).toBeNull();

    const { container: big } = await renderWithI18n(<HelpCard variant="ai" featured />);
    expect(big.querySelector('[data-featured="true"]')).toBeInTheDocument();
  });

  it('puts the examples and the technical line inside a disclosure that starts closed', async () => {
    const { container } = await renderWithI18n(<HelpCard variant="idea" />);

    const details = container.querySelector('details') as HTMLDetailsElement;
    expect(details).toBeInTheDocument();
    expect(details.open, 'the card opens showing only founder-facing copy').toBe(false);

    expect(within(details).getByText(/examples/i)).toBeInTheDocument();
    expect(within(details).getByText('The first engineer hired and onboarded')).toBeInTheDocument();
    expect(within(details).getByText(/12\+ years in \.NET and React/)).toBeInTheDocument();
  });

  it('renders all three examples as a list', async () => {
    const { container } = await renderWithI18n(<HelpCard variant="repetitive" />);

    const items = container.querySelectorAll('details li');
    expect(items).toHaveLength(3);
    expect(items[0]).toHaveTextContent('The WhatsApp order entering the system on its own');
  });

  it('renders the technical line at full opacity, not a fractional-opacity muted colour', async () => {
    const { container } = await renderWithI18n(<HelpCard variant="idea" />);

    const details = container.querySelector('details') as HTMLDetailsElement;
    const techLine = within(details).getByText(/12\+ years in \.NET and React/).closest('p') as HTMLParagraphElement;

    expect(techLine.className).toMatch(/text-muted-foreground/);
    expect(techLine.className).not.toMatch(/text-muted-foreground\/70/);
  });

  it('renders pt-BR copy', async () => {
    await renderWithI18n(<HelpCard variant="repetitive" />, { locale: 'pt-BR' });

    expect(
      screen.getByText('Seu time gasta o dia em trabalho que a máquina faria.'),
    ).toBeInTheDocument();
    expect(screen.getByText(/exemplos/i)).toBeInTheDocument();
  });

  describe('when the examples key does not resolve to an array of strings', () => {
    const key = 'help.cards.repetitive.examples';
    let originalExamples: unknown;

    beforeEach(() => {
      originalExamples = i18n.getResource('en', 'home', key);
      // Simulate what real i18next returns for a missing/malformed key: the
      // key path itself, as a plain string rather than an array.
      i18n.addResource('en', 'home', key, `home:${key}`);
    });

    afterEach(() => {
      // `originalExamples` is really `string[]` here (that's what this key
      // resolves to in home.json), but `i18n.addResource`'s declared type
      // only allows a `string` value — a real gap in i18next's own types,
      // not a reason to weaken this. `addResourceBundle` deep-merges a
      // resource object and is typed `resources: any`, which actually
      // matches what the resource store accepts, so it restores the array
      // at the same nested path without any cast.
      i18n.addResourceBundle(
        'en',
        'home',
        { help: { cards: { repetitive: { examples: originalExamples } } } },
        true,
        true,
      );
    });

    it('still renders the headline and body, and produces no example list items', async () => {
      const { container } = await renderWithI18n(<HelpCard variant="repetitive" />);

      expect(
        screen.getByText('Your team spends the day doing work a machine would do.'),
      ).toBeInTheDocument();
      expect(screen.getByText(/An order arrives on WhatsApp/)).toBeInTheDocument();

      const items = container.querySelectorAll('details li');
      expect(items).toHaveLength(0);
    });
  });
});
