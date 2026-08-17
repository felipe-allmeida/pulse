import { screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithI18n } from '@/test/render-with-i18n';
import { RouterErrorScreen } from './router-error';

describe('RouterErrorScreen', () => {
  it('says what happened in the visitor’s language', async () => {
    await renderWithI18n(<RouterErrorScreen />, { locale: 'pt-BR' });

    // TanStack's built-in screen is English-only, unstyled, and offers a
    // "Show Error" stack toggle — which is what a Portuguese visitor whose
    // route chunk failed to download actually saw.
    expect(screen.getByRole('alert')).toHaveTextContent('Algo deu errado.');
    expect(screen.getByRole('button', { name: 'Tentar de novo' })).toBeInTheDocument();
  });

  it('reloads the document rather than retrying in place', async () => {
    const reload = vi.fn();
    const original = window.location;
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...original, reload },
    });

    try {
      await renderWithI18n(<RouterErrorScreen />);
      fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

      // The likeliest reason to be on this screen is that a chunk did not
      // arrive; re-running the same failed import in place would just fail
      // again, while a reload refetches the (no-cache) document and whatever
      // the current build's assets now are.
      expect(reload).toHaveBeenCalledOnce();
    } finally {
      Object.defineProperty(window, 'location', { configurable: true, value: original });
    }
  });
});
