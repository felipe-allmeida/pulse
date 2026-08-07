import { fireEvent, screen, waitFor } from '@testing-library/react';
import { useTranslation } from 'react-i18next';
import { beforeEach, describe, expect, it } from 'vitest';
import i18n from '@/i18n';
import { renderWithI18n } from '@/test/render-with-i18n';
import { LanguageToggle } from './language-toggle';

function RetryLabel() {
  const { t } = useTranslation();
  return <span>{t('common:retry')}</span>;
}

describe('LanguageToggle', () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.lang = '';
  });

  it('offers both PT and EN controls in the menu', async () => {
    await renderWithI18n(<LanguageToggle />, { locale: 'en' });

    fireEvent.keyDown(screen.getByRole('button', { name: /language/i }), { key: 'Enter' });

    expect(await screen.findByRole('menuitem', { name: /english|^en$/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /português/i })).toBeInTheDocument();
  });

  it('switches i18n language, persists to localStorage, and updates <html lang> when PT is selected', async () => {
    await renderWithI18n(<LanguageToggle />, { locale: 'en' });

    fireEvent.keyDown(screen.getByRole('button', { name: /language/i }), { key: 'Enter' });
    const ptOption = await screen.findByRole('menuitem', { name: /português/i });
    fireEvent.click(ptOption);

    await waitFor(() => {
      expect(i18n.language).toBe('pt-BR');
    });
    expect(window.localStorage.getItem('pulse.lang')).toBe('pt-BR');
    expect(document.documentElement.lang).toBe('pt-BR');
  });

  it('renders non-truncating, localized language labels and marks the active one', async () => {
    await renderWithI18n(<LanguageToggle />, { locale: 'en' });

    fireEvent.keyDown(screen.getByRole('button', { name: /language/i }), { key: 'Enter' });

    const englishItem = await screen.findByRole('menuitem', { name: /english/i });
    const portugueseItem = screen.getByRole('menuitem', { name: /português/i });

    // The literal strings, not split across nodes/lines ("e"/"n" bug).
    expect(englishItem).toHaveTextContent('English');
    expect(portugueseItem).toHaveTextContent('Português');

    // Never allowed to wrap — that's exactly how "EN" broke into "E"/"N".
    expect(englishItem.className).toMatch(/whitespace-nowrap/);
    expect(portugueseItem.className).toMatch(/whitespace-nowrap/);

    // A visible, programmatic active indicator.
    expect(englishItem).toHaveAttribute('aria-current', 'true');
    expect(portugueseItem).toHaveAttribute('aria-current', 'false');

    // >=44px touch target per row.
    expect(englishItem.className).toMatch(/min-h-11|h-11|min-h-\[44px\]/);
    expect(portugueseItem.className).toMatch(/min-h-11|h-11|min-h-\[44px\]/);
  });

  it('flips a locale-dependent text node when the language changes', async () => {
    await renderWithI18n(
      <>
        <LanguageToggle />
        <RetryLabel />
      </>,
      { locale: 'en' },
    );

    expect(screen.getByText('Try again')).toBeInTheDocument();

    fireEvent.keyDown(screen.getByRole('button', { name: /language/i }), { key: 'Enter' });
    fireEvent.click(await screen.findByRole('menuitem', { name: /português/i }));

    expect(await screen.findByText('Tentar de novo')).toBeInTheDocument();
  });
});
