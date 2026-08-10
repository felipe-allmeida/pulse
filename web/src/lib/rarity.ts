import type { ClientSignals } from '@/lib/client-signals';
import type { VisitorContext } from '@/types/pulse';

/**
 * One dimension of "how unusual are you", with the provenance of its number
 * attached. `measured` values come from this site's own visit history;
 * `estimated` ones come from public browser-population figures and are
 * ballpark. The page labels them differently — a fabricated statistic
 * presented as fact would undercut the entire argument it is making.
 */
export type RarityDimension = {
  key: string;
  /** The reading itself, e.g. "America/Sao_Paulo". */
  value: string;
  /** Share of people expected to match, in (0, 1]. */
  share: number;
  source: 'measured' | 'estimated';
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
 * Rough shares of the global browser population, used only where this site has
 * no measurement of its own.
 *
 * These are order-of-magnitude figures, not survey data, and the page says so.
 * They are also the honest weak point of every "you are 1 in N" widget on the
 * web: the multiplication assumes the dimensions are independent, which they
 * are not (language and timezone correlate heavily, for one). The result
 * overstates uniqueness — which the copy admits rather than hides.
 */
const ESTIMATED_SHARES = {
  /** A common desktop resolution vs. anything else. */
  commonResolution: 0.08,
  uncommonResolution: 0.01,
  /** English-speaking browsers vs. any other single language. */
  englishLanguage: 0.25,
  otherLanguage: 0.04,
  /** A major timezone vs. a minor one. */
  timeZone: 0.03,
  /** Touch-capable devices. */
  touch: 0.55,
  noTouch: 0.45,
  /** Do Not Track is off for the overwhelming majority. */
  dntOff: 0.9,
  dntOn: 0.1,
  /** Reported core counts cluster hard on 4/8. */
  commonCores: 0.35,
  unusualCores: 0.05,
} as const;

const COMMON_RESOLUTIONS = new Set(['1920x1080', '1366x768', '1536x864', '2560x1440', '1440x900']);
const COMMON_CORE_COUNTS = new Set([4, 8]);

function clampShare(share: number): number {
  // Never 0 (an infinite "1 in N") and never above 1 (a share, not a count).
  return Math.min(1, Math.max(1e-9, share));
}

/**
 * Builds the dimensions for a visitor, skipping any signal the browser withheld
 * rather than guessing a value for it.
 */
export function rarityOf(signals: ClientSignals, visitor?: VisitorContext): Rarity {
  const dimensions: RarityDimension[] = [];

  // Measured, not estimated: this is literally how many of this page's own
  // visitors came from the same city.
  if (visitor?.geo && visitor.totalVisits > 0) {
    dimensions.push({
      key: 'city',
      value: visitor.geo.city,
      // +1 counts the visitor themselves, so a first-ever city reads as
      // 1-of-total instead of a divide-by-zero certainty.
      share: clampShare((visitor.cityVisits + 1) / (visitor.totalVisits + 1)),
      source: 'measured',
    });
  }

  if (signals.language && signals.language !== 'unknown') {
    dimensions.push({
      key: 'language',
      value: signals.language,
      share: signals.language.toLowerCase().startsWith('en')
        ? ESTIMATED_SHARES.englishLanguage
        : ESTIMATED_SHARES.otherLanguage,
      source: 'estimated',
    });
  }

  if (signals.timeZone) {
    dimensions.push({
      key: 'timeZone',
      value: signals.timeZone,
      share: ESTIMATED_SHARES.timeZone,
      source: 'estimated',
    });
  }

  if (signals.screenWidth && signals.screenHeight) {
    const resolution = `${signals.screenWidth}x${signals.screenHeight}`;
    dimensions.push({
      key: 'resolution',
      value: resolution,
      share: COMMON_RESOLUTIONS.has(resolution)
        ? ESTIMATED_SHARES.commonResolution
        : ESTIMATED_SHARES.uncommonResolution,
      source: 'estimated',
    });
  }

  if (signals.cores !== null) {
    dimensions.push({
      key: 'cores',
      value: String(signals.cores),
      share: COMMON_CORE_COUNTS.has(signals.cores)
        ? ESTIMATED_SHARES.commonCores
        : ESTIMATED_SHARES.unusualCores,
      source: 'estimated',
    });
  }

  if (signals.touchPoints !== null) {
    const touch = signals.touchPoints > 0;
    dimensions.push({
      key: 'touch',
      value: touch ? 'touch' : 'no-touch',
      share: touch ? ESTIMATED_SHARES.touch : ESTIMATED_SHARES.noTouch,
      source: 'estimated',
    });
  }

  if (signals.doNotTrack !== null) {
    dimensions.push({
      key: 'doNotTrack',
      value: signals.doNotTrack ? 'on' : 'off',
      share: signals.doNotTrack ? ESTIMATED_SHARES.dntOn : ESTIMATED_SHARES.dntOff,
      source: 'estimated',
    });
  }

  const share = clampShare(dimensions.reduce((acc, d) => acc * d.share, 1));
  return {
    dimensions,
    share,
    oneIn: Math.round(1 / share),
    bits: Math.log2(1 / share),
  };
}

/**
 * The running "1 in N" after each dimension is folded in — the page shows this
 * cumulatively, because watching common traits multiply into a unique one is
 * the argument, not the final number on its own.
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
