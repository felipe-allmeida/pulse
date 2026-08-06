import { Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Locale } from '@/content/types';

const LANGUAGE_OPTIONS: { locale: Locale; label: string }[] = [
  { locale: 'en', label: 'EN' },
  { locale: 'pt-BR', label: 'Português' },
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
      <DropdownMenuContent align="end">
        {LANGUAGE_OPTIONS.map((option) => (
          <DropdownMenuItem
            key={option.locale}
            aria-current={option.locale === activeLocale}
            onSelect={() => handleSelect(option.locale)}
          >
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
