import type { BrowserName, ClientSignals, OperatingSystem } from '@/lib/client-signals';
import type { VisitorContext } from '@/types/pulse';

/**
 * One row of the receipt, with the provenance of its number attached.
 *
 * `measured` comes from this site's own visit history. `published` comes from
 * public web-population market share. The page labels them differently on
 * purpose — presenting an estimate as a measurement would undercut the whole
 * argument the page is making.
 */
export type RarityDimension = {
  key: string;
  /** The reading itself, e.g. "America/Sao_Paulo". */
  value: string;
  /** Share of people expected to match, in (0, 1]. */
  share: number;
  source: 'measured' | 'published';
};

export type Rarity = {
  dimensions: RarityDimension[];
  /** Combined share, i.e. the product of every dimension. */
  share: number;
  /** 1 in `oneIn` browsers, rounded. */
  oneIn: number;
  /** log2(1/share) — the same figure expressed as bits. */
  bits: number;
};

/**
 * Rounded global web-population shares, in the ballpark of what StatCounter and
 * similar trackers publish. Deliberately coarse: reporting "18.4%" would imply
 * a precision this page has not earned, so everything here is rounded to
 * something a reader can sanity-check.
 *
 * These describe the whole web, not this site's audience, and the page says so.
 * The one figure that *is* measured — how many of this page's own visitors came
 * from your city — is computed from the visit history instead.
 */
const OS_SHARES: Record<OperatingSystem, number> = {
  Android: 0.44,
  Windows: 0.24,
  iOS: 0.18,
  macOS: 0.06,
  Linux: 0.02,
  unknown: 0.06,
};

const BROWSER_SHARES: Record<BrowserName, number> = {
  Chrome: 0.65,
  Safari: 0.18,
  Edge: 0.05,
  Firefox: 0.025,
  'Samsung Internet': 0.02,
  Opera: 0.02,
  unknown: 0.045,
};

/** Rough share of web users whose browser is set to each language. */
const LANGUAGE_SHARES: Record<string, number> = {
  en: 0.25,
  zh: 0.13,
  es: 0.06,
  hi: 0.05,
  pt: 0.04,
  ar: 0.04,
  ru: 0.035,
  ja: 0.03,
  de: 0.03,
  fr: 0.03,
  id: 0.02,
  it: 0.02,
};
/** Anything outside the list above is rarer than the least common entry in it. */
const OTHER_LANGUAGE_SHARE = 0.01;

/**
 * Timezones are long-tailed: a handful hold most of the population. These are
 * the crowded ones; everything else is treated as the tail.
 */
const CROWDED_TIME_ZONES: Record<string, number> = {
  'Asia/Shanghai': 0.12,
  'Asia/Kolkata': 0.1,
  'America/New_York': 0.05,
  'Europe/London': 0.03,
  'Europe/Berlin': 0.025,
  'America/Sao_Paulo': 0.025,
  'America/Chicago': 0.025,
  'Asia/Tokyo': 0.02,
  'America/Los_Angeles': 0.02,
  'Europe/Moscow': 0.02,
  'Europe/Paris': 0.02,
  'Asia/Jakarta': 0.02,
};
const OTHER_TIME_ZONE_SHARE = 0.005;

/** The resolutions that actually cluster; everything else is long-tail. */
const COMMON_RESOLUTIONS: Record<string, number> = {
  '1920x1080': 0.09,
  '1366x768': 0.05,
  '1536x864': 0.03,
  '390x844': 0.03,
  '393x852': 0.025,
  '1280x720': 0.02,
  '2560x1440': 0.02,
  '414x896': 0.02,
  '1440x900': 0.02,
  '360x800': 0.02,
};
const OTHER_RESOLUTION_SHARE = 0.005;

const CORE_COUNT_SHARES: Record<number, number> = { 2: 0.1, 4: 0.3, 6: 0.1, 8: 0.3, 12: 0.05, 16: 0.03 };
const OTHER_CORE_COUNT_SHARE = 0.02;

const TOUCH_SHARE = 0.55;
const NO_TOUCH_SHARE = 0.45;
const DNT_ON_SHARE = 0.08;
const DNT_OFF_SHARE = 0.92;

function clampShare(share: number): number {
  // Never 0 (an infinite "1 in N") and never above 1 (a share, not a count).
  return Math.min(1, Math.max(1e-12, share));
}

/** Builds the receipt, skipping any signal the browser withheld rather than guessing at it. */
export function rarityOf(signals: ClientSignals, visitor?: VisitorContext): Rarity {
  const dimensions: RarityDimension[] = [];

  const push = (key: string, value: string, share: number, source: RarityDimension['source'] = 'published') =>
    dimensions.push({ key, value, share: clampShare(share), source });

  if (signals.os !== 'unknown') push('os', signals.os, OS_SHARES[signals.os]);
  if (signals.browser !== 'unknown') push('browser', signals.browser, BROWSER_SHARES[signals.browser]);

  if (signals.language && signals.language !== 'unknown') {
    const base = signals.language.split('-')[0].toLowerCase();
    push('language', signals.language, LANGUAGE_SHARES[base] ?? OTHER_LANGUAGE_SHARE);
  }

  if (signals.timeZone) {
    push('timeZone', signals.timeZone, CROWDED_TIME_ZONES[signals.timeZone] ?? OTHER_TIME_ZONE_SHARE);
  }

  if (signals.screenWidth && signals.screenHeight) {
    const resolution = `${signals.screenWidth}×${signals.screenHeight}`;
    const key = `${signals.screenWidth}x${signals.screenHeight}`;
    push('resolution', resolution, COMMON_RESOLUTIONS[key] ?? OTHER_RESOLUTION_SHARE);
  }

  if (signals.cores !== null) {
    push('cores', String(signals.cores), CORE_COUNT_SHARES[signals.cores] ?? OTHER_CORE_COUNT_SHARE);
  }

  if (signals.touchPoints !== null) {
    const touch = signals.touchPoints > 0;
    push('touch', touch ? 'touch' : 'no-touch', touch ? TOUCH_SHARE : NO_TOUCH_SHARE);
  }

  if (signals.doNotTrack !== null) {
    push('doNotTrack', signals.doNotTrack ? 'on' : 'off', signals.doNotTrack ? DNT_ON_SHARE : DNT_OFF_SHARE);
  }

  // The only measured row on the receipt: how many of this page's own visitors
  // came from the same city. Placed last so the table ends on the one number
  // that is not an estimate.
  if (visitor?.geo && visitor.totalVisits > 0) {
    // +1 counts the visitor themselves, so a first-ever city reads as
    // 1-of-total instead of a divide-by-zero certainty.
    push('city', visitor.geo.city, (visitor.cityVisits + 1) / (visitor.totalVisits + 1), 'measured');
  }

  const share = clampShare(dimensions.reduce((acc, d) => acc * d.share, 1));
  return { dimensions, share, oneIn: Math.round(1 / share), bits: Math.log2(1 / share) };
}

/**
 * The running "1 in N" after each row is folded in. The page shows this
 * cumulatively, because watching common traits compound into a unique one is
 * the argument — the final number alone is just a big number.
 */
export function cumulativeOneIn(dimensions: RarityDimension[]): number[] {
  const running: number[] = [];
  let share = 1;
  for (const dimension of dimensions) {
    share = clampShare(share * dimension.share);
    running.push(Math.round(1 / share));
  }
  return running;
}
