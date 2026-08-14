/**
 * The mapping between locales and URL prefixes.
 *
 * Until now the site had one URL per route and picked its language in the
 * browser from `navigator`/localStorage. That is invisible to search: there is
 * no Portuguese URL to index, so the pt-BR half of the site simply does not
 * exist as far as any crawler — or any answer engine — is concerned.
 *
 * So the locale now lives in the path: `/about` is English, `/pt/about` is
 * Portuguese, and each is served as its own document with its own canonical
 * and `hreflang` alternates. The URL is authoritative; nothing overrides it
 * after load, because a page whose content disagrees with its own canonical
 * URL is worse than one that is merely monolingual.
 */
import type { Locale } from '../content/types';
import { LOCALES } from '../content/types';

/** English is unprefixed — it is the default and the `x-default` target. */
export const LOCALE_PREFIX: Record<Locale, string> = {
  en: '',
  'pt-BR': '/pt',
};

export const DEFAULT_LOCALE: Locale = 'en';

/** Where the visitor's explicit language choice is remembered. */
export const LOCALE_STORAGE_KEY = 'pulse.lang';

/**
 * The locale a public pathname belongs to. Matches on a path boundary, so
 * `/ptolemy` is English, not Portuguese.
 */
export function localeFromPathname(pathname: string): Locale {
  for (const locale of LOCALES) {
    const prefix = LOCALE_PREFIX[locale];
    if (prefix && (pathname === prefix || pathname.startsWith(`${prefix}/`))) return locale;
  }
  return DEFAULT_LOCALE;
}

/** Strips the locale prefix, giving the path the router works in. */
export function routePathFromPathname(pathname: string): string {
  const prefix = LOCALE_PREFIX[localeFromPathname(pathname)];
  if (!prefix) return pathname || '/';
  return pathname.slice(prefix.length) || '/';
}

/** The public path for a route in a given locale. `/about` + pt-BR → `/pt/about`. */
export function pathForLocale(routePath: string, locale: Locale): string {
  const prefix = LOCALE_PREFIX[locale];
  const normalised = routePath === '/' ? '' : routePath;
  return `${prefix}${normalised}` || '/';
}

/** The router `basepath` that makes every `<Link to="/about">` resolve in-locale. */
export function basepathForLocale(locale: Locale): string {
  return LOCALE_PREFIX[locale] || '/';
}

/** Translates a live pathname into its equivalent in another locale. */
export function switchLocalePath(pathname: string, target: Locale): string {
  return pathForLocale(routePathFromPathname(pathname), target);
}

function isLocale(value: string | null): value is Locale {
  return value !== null && (LOCALES as string[]).includes(value);
}

/**
 * Whether a first paint should bounce to the other locale.
 *
 * Only ever fires on the bare root. A visitor who followed a link to `/about`
 * asked for that URL and keeps it; only somebody arriving at `/` with no
 * language expressed in the path can be sent somewhere better. Returns the
 * target path, or `null` to stay put.
 */
export function rootRedirectPath(
  pathname: string,
  stored: string | null,
  navigatorLanguages: readonly string[],
): string | null {
  if (pathname !== '/') return null;

  const preferred = isLocale(stored)
    ? stored
    : navigatorLanguages.some((lang) => lang.toLowerCase().startsWith('pt'))
      ? 'pt-BR'
      : DEFAULT_LOCALE;

  return preferred === DEFAULT_LOCALE ? null : pathForLocale('/', preferred);
}
