import type { ClientSignals } from '@/lib/client-signals';
import type { VisitorContext } from '@/types/pulse';

/**
 * An audience segment this page worked out for itself, in the shape a data
 * provider would attach it to a bid request.
 *
 * These are the honest counterpart to `user.data.segment`. A real broker infers
 * *intent* — "in-market for a car", "new parent" — from cross-site browsing,
 * purchase records, app telemetry and location history over time. None of that
 * is available here, and none of it can be honestly guessed at from a single
 * page view, so this page does not pretend to.
 *
 * What it can do is show the inferences that genuinely follow from readings
 * already on the page. Every entry below is derived, not invented, and the
 * `confidence` field marks the ones that are a real reach — a price bracket
 * guessed from pixel density is exactly the sort of cheerful nonsense the ad
 * industry treats as fact, and saying so is more useful than hiding it.
 *
 * The point of showing these next to the empty broker slot is the contrast:
 * this is what one page infers in a few milliseconds, with no history and no
 * budget. The other slot is what someone with your whole browsing history
 * attaches, and it's the one you don't get to see.
 */
export type DerivedSegment = {
  id: string;
  name: string;
  confidence: 'observed' | 'inferred' | 'guessed';
};

/** Hostnames worth naming outright, since "where you came from" is the point. */
const KNOWN_SOURCES: Record<string, string> = {
  'linkedin.com': 'LinkedIn',
  'www.linkedin.com': 'LinkedIn',
  'lnkd.in': 'LinkedIn',
  'github.com': 'GitHub',
  'news.ycombinator.com': 'Hacker News',
  'x.com': 'X',
  'twitter.com': 'X',
  't.co': 'X',
  'www.google.com': 'Google Search',
  'google.com': 'Google Search',
  'www.instagram.com': 'Instagram',
  'l.instagram.com': 'Instagram',
  'www.reddit.com': 'Reddit',
  'reddit.com': 'Reddit',
};

function trafficSource(referrer: string | null): DerivedSegment {
  if (!referrer) return { id: 'traffic.source', name: 'direct', confidence: 'observed' };
  return { id: 'traffic.source', name: KNOWN_SOURCES[referrer] ?? referrer, confidence: 'observed' };
}

/**
 * The price-bracket guess. Advertisers bid real money on this, inferred from
 * roughly these inputs — which is worth seeing precisely because the reasoning
 * is so thin.
 */
function deviceTier(signals: ClientSignals): DerivedSegment | null {
  const { pixelRatio, cores, memoryGb, os } = signals;
  if (pixelRatio === null && cores === null && memoryGb === null) return null;

  const premiumHints =
    (pixelRatio !== null && pixelRatio >= 2 ? 1 : 0) +
    (cores !== null && cores >= 8 ? 1 : 0) +
    (memoryGb !== null && memoryGb >= 8 ? 1 : 0) +
    (os === 'macOS' || os === 'iOS' ? 1 : 0);

  const name = premiumHints >= 3 ? 'high-end-device' : premiumHints >= 2 ? 'mid-range-device' : 'budget-device';
  return { id: 'device.tier', name, confidence: 'guessed' };
}

function daypart(signals: ClientSignals): DerivedSegment {
  const weekend = signals.localDay === 0 || signals.localDay === 6;
  const hour = signals.localHour;
  const part = hour < 6 ? 'night' : hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
  return { id: 'context.daypart', name: `${weekend ? 'weekend' : 'weekday'}-${part}`, confidence: 'observed' };
}

/**
 * Reading the privacy signals themselves as a segment. This is the sourest
 * joke available: the flags a person sets to avoid being profiled are
 * themselves profilable, and a browser that sets them stands out more, not
 * less.
 */
function privacyPosture(signals: ClientSignals): DerivedSegment | null {
  const markers: string[] = [];
  if (signals.doNotTrack === true) markers.push('dnt-on');
  if (signals.browser === 'Firefox') markers.push('privacy-leaning-browser');
  if (markers.length === 0) return null;
  return { id: 'audience.privacy', name: markers.join('+'), confidence: 'inferred' };
}

export function deriveSegments(signals: ClientSignals, visitor?: VisitorContext): DerivedSegment[] {
  const segments: DerivedSegment[] = [trafficSource(signals.referrer)];

  if (visitor?.geo) {
    segments.push({ id: 'geo.market', name: visitor.geo.country, confidence: 'observed' });
  }

  if (signals.language && signals.language !== 'unknown') {
    segments.push({ id: 'audience.language', name: signals.language, confidence: 'observed' });
  }

  if (signals.touchPoints !== null) {
    segments.push({
      id: 'device.type',
      name: signals.touchPoints > 0 ? 'mobile-or-tablet' : 'desktop',
      confidence: 'inferred',
    });
  }

  const tier = deviceTier(signals);
  if (tier) segments.push(tier);

  segments.push(daypart(signals));

  const privacy = privacyPosture(signals);
  if (privacy) segments.push(privacy);

  return segments;
}
