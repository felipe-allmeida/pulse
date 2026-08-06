import { renderHook, waitFor } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { describe, expect, it } from 'vitest';
import i18n from '@/i18n';
import { useLocalized } from './use-localized';

function wrapper({ children }: { children: React.ReactNode }) {
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}

describe('useLocalized', () => {
  it('returns the pt-BR value when the locale is pt-BR', async () => {
    await i18n.changeLanguage('pt-BR');
    const { result } = renderHook(() => useLocalized(), { wrapper });

    await waitFor(() => {
      expect(result.current({ en: 'Hi', 'pt-BR': 'Oi' })).toBe('Oi');
    });
  });

  it('falls back to en when the pt-BR value is empty', async () => {
    await i18n.changeLanguage('pt-BR');
    const { result } = renderHook(() => useLocalized(), { wrapper });

    await waitFor(() => {
      expect(result.current({ en: 'Hi', 'pt-BR': '' })).toBe('Hi');
    });
  });

  it('returns the en value when the locale is en', async () => {
    await i18n.changeLanguage('en');
    const { result } = renderHook(() => useLocalized(), { wrapper });

    await waitFor(() => {
      expect(result.current({ en: 'Hi', 'pt-BR': 'Oi' })).toBe('Hi');
    });
  });
});
