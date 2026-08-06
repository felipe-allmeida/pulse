const MINUTE = 60;
const HOUR = MINUTE * 60;
const DAY = HOUR * 24;

/**
 * Pure helper: formats `at` relative to `now`. Kept pure (no Date.now() inside)
 * so tests can pass a fixed `now` and get a deterministic string.
 *
 * `locale` threads the active i18n language (`i18n.language`) through to
 * `Intl.RelativeTimeFormat` so callers control formatting rather than this
 * module hardcoding a single locale.
 */
export function formatRelativeTime(at: string, now: Date = new Date(), locale = 'en'): string {
  const relativeTimeFormatter = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  const diffSeconds = Math.round((new Date(at).getTime() - now.getTime()) / 1000);
  const absSeconds = Math.abs(diffSeconds);

  if (absSeconds < MINUTE) {
    return relativeTimeFormatter.format(diffSeconds, 'second');
  }
  if (absSeconds < HOUR) {
    return relativeTimeFormatter.format(Math.round(diffSeconds / MINUTE), 'minute');
  }
  if (absSeconds < DAY) {
    return relativeTimeFormatter.format(Math.round(diffSeconds / HOUR), 'hour');
  }
  return relativeTimeFormatter.format(Math.round(diffSeconds / DAY), 'day');
}
