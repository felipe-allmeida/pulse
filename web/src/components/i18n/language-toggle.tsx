import { Check, Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Locale } from '@/content/types';

// Each language is named in its own endonym ("English" / "Português") —
// the standard pattern for a language switcher — so the keys hold the same
// value in every locale file (en + pt-BR parity is about the *key* existing
// in both, not the value differing).
const LANGUAGE_OPTIONS: { locale: Locale; labelKey: 'languageEn' | 'languagePt' }[] = [
  { locale: 'en', labelKey: 'languageEn' },
  { locale: 'pt-BR', labelKey: 'languagePt' },
];

export function LanguageToggle() {
  const { t, i18n } = useTranslation();
  const activeLocale = (i18n.resolvedLanguage ?? i18n.language) as Locale;

  const handleSelect = (locale: Locale) => {
    if (locale === activeLocale) return;
    void i18n.changeLanguage(locale);
    document.documentElement.lang = locale;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t('nav:language')}>
          <Languages className="size-4" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      {/* A two-item quick switch, not primary navigation — a properly sized,
          non-truncating popover is the right weight here; the full
          bottom-sheet treatment (top-nav) is reserved for the larger menu. */}
      <DropdownMenuContent align="end" className="min-w-40">
        {LANGUAGE_OPTIONS.map((option) => {
          const isActive = option.locale === activeLocale;
          return (
            <DropdownMenuItem
              key={option.locale}
              aria-current={isActive}
              onSelect={() => handleSelect(option.locale)}
              className="flex min-h-11 items-center justify-between gap-3 whitespace-nowrap text-base"
            >
              <span className="whitespace-nowrap">{t(`nav:${option.labelKey}`)}</span>
              {isActive && <Check className="size-4 shrink-0 text-signal-strong" aria-hidden="true" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
