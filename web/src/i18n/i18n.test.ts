import { describe, it, expect } from 'vitest';
import i18n from './index';

describe('i18n', () => {
  it('falls back to en for an unsupported language', async () => {
    await i18n.changeLanguage('fr');
    expect(i18n.resolvedLanguage).toBe('en');
    expect(i18n.t('common:online')).toBe('online');
  });
  it('serves pt-BR resources', async () => {
    await i18n.changeLanguage('pt-BR');
    expect(i18n.t('common:online')).toBe('online'); // 'online' stays the same in both locales
    expect(i18n.t('common:retry')).toBe('Tentar de novo');
  });
});
