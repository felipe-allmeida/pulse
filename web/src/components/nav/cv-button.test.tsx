import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithI18n } from '@/test/render-with-i18n';
import { CvButton } from './cv-button';

describe('CvButton', () => {
  it('serves the English CV in English', async () => {
    await renderWithI18n(<CvButton />);

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/cv.pdf');
    expect(link).toHaveAttribute('download', 'Felipe_de_Almeida_Resume.pdf');
  });

  it('serves the Portuguese CV in pt-BR — a localized label must not hand out the English file', async () => {
    await renderWithI18n(<CvButton />, { locale: 'pt-BR' });

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/cv-pt.pdf');
    expect(link).toHaveAttribute('download', 'Felipe_de_Almeida_Curriculo.pdf');
  });
});
