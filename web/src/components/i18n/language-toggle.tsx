import { Check, Languages } from 'lucide-react';
import { useRouterState } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Locale } from '@/content/types';
import { LOCALE_STORAGE_KEY, pathForLocale, routePathFromPathname } from '@/i18n/locale-url';

// Each language is named in its own endonym ("English" / "Português") —
// the standard pattern for a language switcher — so the keys hold the same
// value in every locale file (en + pt-BR parity is about the *key* existing
// in both, not the value differing).
const LANGUAGE_OPTIONS: { locale: Locale; labelKey: 'languageEn' | 'languagePt' }[] = [
  { locale: 'en', labelKey: 'languageEn' },
  { locale: 'pt-BR', labelKey: 'languagePt' },
];

/**
 * Switches language by *navigating* to the other locale's URL rather than
 * swapping strings in place.
 *
 * Each locale is its own set of URLs (`/about`, `/pt/about`), each served as
 * its own document with its own canonical, `hreflang`, and `<html lang>`.
 * Re-rendering in Portuguese while the address bar still said `/about` would
 * contradict every one of those. The full reload is the price, paid once per
 * switch.
 *
 * They are real anchors, so the options open in a new tab and survive a
 * right-click. They are not how crawlers find the other language, though —
 * the menu only mounts once opened, so it is absent from the served HTML.
 * Reciprocal `hreflang` in the document head does that job.
 */
export function LanguageToggle() {
  const { t, i18n } = useTranslation();
  const activeLocale = (i18n.resolvedLanguage ?? i18n.language) as Locale;

  // The route being viewed, from the router rather than `window.location`, so
  // the links are already correct in the build-time render — a document whose
  // language links all point at the home page is a worse map of the site than
  // one whose links point at the same route in the other language.
  const routePath = routePathFromPathname(
    useRouterState({ select: (state) => state.location.pathname }),
  );

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
            <DropdownMenuItem key={option.locale} asChild aria-current={isActive}>
              <a
                href={pathForLocale(routePath, option.locale)}
                hrefLang={option.locale}
                // Remembered so a later visit to the bare root lands in the
                // language this visitor actually picked.
                onClick={() => window.localStorage.setItem(LOCALE_STORAGE_KEY, option.locale)}
                className="flex min-h-11 items-center justify-between gap-3 whitespace-nowrap text-base"
              >
                <span className="whitespace-nowrap">{t(`nav:${option.labelKey}`)}</span>
                {isActive && <Check className="size-4 shrink-0 text-signal-strong" aria-hidden="true" />}
              </a>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
