import { render } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import type { ReactElement } from 'react';
import i18n from '@/i18n';
import type { Locale } from '@/content/types';

export async function renderWithI18n(ui: ReactElement, opts?: { locale?: Locale }) {
  await i18n.changeLanguage(opts?.locale ?? 'en');
  return render(<I18nextProvider i18n={i18n}>{ui}</I18nextProvider>);
}
