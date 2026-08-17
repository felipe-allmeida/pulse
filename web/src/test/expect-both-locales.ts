import { expect } from 'vitest';
import { LOCALES } from '@/content/types';
import type { LocalizedString } from '@/content/types';

/** Every field typed as `LocalizedString` must carry real text in every locale. */
export function expectBothLocales(value: LocalizedString, label: string) {
  for (const locale of LOCALES) {
    expect(value[locale], `${label} missing ${locale}`).toBeTruthy();
    expect(value[locale].trim(), `${label} empty in ${locale}`).not.toBe('');
  }
}
