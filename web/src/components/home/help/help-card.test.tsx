import { screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithI18n } from '@/test/render-with-i18n';
import { HelpCard } from './help-card';

vi.mock('./help-diagram', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./help-diagram')>();
  return { ...actual, HelpDiagram: ({ variant }: { variant: string }) => <div data-testid={`diagram-${variant}`} /> };
});

describe('HelpCard', () => {
  beforeEach(() => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })) as unknown as typeof window.matchMedia;
  });

  it('renders the headline and body for its variant', async () => {
    await renderWithI18n(<HelpCard variant="spreadsheet" />);

    expect(
      screen.getByText('Someone on your team spends the day filling in a spreadsheet.'),
    ).toBeInTheDocument();
    expect(screen.getByText(/The spreadsheet can stay/)).toBeInTheDocument();
  });

  it('renders its diagram', async () => {
    await renderWithI18n(<HelpCard variant="ai" />);

    expect(screen.getByTestId('diagram-ai')).toBeInTheDocument();
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

  it('renders pt-BR copy', async () => {
    await renderWithI18n(<HelpCard variant="repetitive" />, { locale: 'pt-BR' });

    expect(
      screen.getByText('Seu time gasta o dia em trabalho que a máquina faria.'),
    ).toBeInTheDocument();
    expect(screen.getByText(/exemplos/i)).toBeInTheDocument();
  });
});
