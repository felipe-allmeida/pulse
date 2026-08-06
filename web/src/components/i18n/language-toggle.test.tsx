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
