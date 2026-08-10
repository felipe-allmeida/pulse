import type { VisitorContext } from '@/types/pulse';

/**
 * One true statement about the visitor, ready to be phrased by i18n. Every
 * variant carries only values — the wording lives in the locale files, so a
 * translation can reorder or re-case the numbers as its language needs.
 */
export type VisitorFact =
  | { kind: 'firstEver' }
  | { kind: 'firstFromCity'; city: string }
  | { kind: 'firstFromCityInDays'; city: string; days: number }
  | { kind: 'milestone'; position: number }
  | { kind: 'recent24h'; position: number }
  | { kind: 'previous'; city: string; at: string }
  | { kind: 'position'; position: number };

/** A city has to have been quiet this long before "the first in N days" is worth saying. */
const QUIET_CITY_DAYS = 7;
/** Below this, "the nth person in 24 hours" describes a ghost town rather than activity. */
const MIN_ACTIVE_24H = 3;
/** Round numbers only count as round at this granularity. */
const MILESTONE_STEP = 100;

const DAY_MS = 86_400_000;

/**
 * Every fact that is true right now, rarest first.
 *
 * The ordering is by how *striking* the fact is, which is not quite the same as
 * statistical rarity: a personal fact ("the first person from Porto Alegre")
 * beats a numeric one ("the 1,300th visitor") even when the numeric one is
 * rarer, because it is about the reader rather than about the counter.
 *
 * `previous` deliberately sits just above the floor despite being the most
 * evocative line of the set. It is true on almost every visit, so ranking it
 * high would make it win nearly every time and flatten the rotation that
 * `index` exists to drive.
 */
function eligibleFacts(ctx: VisitorContext, now: number): VisitorFact[] {
  const facts: VisitorFact[] = [];
  // The stored counts stop at the visit before this one — see VisitorContext.
  const position = ctx.totalVisits + 1;

  if (ctx.totalVisits === 0) facts.push({ kind: 'firstEver' });

  if (ctx.geo) {
    if (ctx.cityVisits === 0) {
      facts.push({ kind: 'firstFromCity', city: ctx.geo.city });
    } else if (ctx.lastCityVisitAt) {
      const days = Math.floor((now - new Date(ctx.lastCityVisitAt).getTime()) / DAY_MS);
      if (days >= QUIET_CITY_DAYS) facts.push({ kind: 'firstFromCityInDays', city: ctx.geo.city, days });
    }
  }

  if (position >= MILESTONE_STEP && position % MILESTONE_STEP === 0) {
    facts.push({ kind: 'milestone', position });
  }

  if (ctx.visitsLast24h >= MIN_ACTIVE_24H) {
    facts.push({ kind: 'recent24h', position: ctx.visitsLast24h + 1 });
  }

  if (ctx.previous) facts.push({ kind: 'previous', city: ctx.previous.city, at: ctx.previous.at });

  // The floor: true on every visit, with or without geo, so the greeting can
  // never come up empty.
  facts.push({ kind: 'position', position });
  return facts;
}

/**
 * Picks the fact to greet this visitor with.
 *
 * `index` walks the eligible list so a reload says something new instead of
 * repeating itself — the first view gets the most striking fact available, and
 * each subsequent one steps down the list, wrapping so it never runs out.
 */
export function pickVisitorFact(ctx: VisitorContext, now: number = Date.now(), index = 0): VisitorFact {
  const facts = eligibleFacts(ctx, now);
  return facts[Math.abs(index) % facts.length];
}

const EN_ORDINAL_SUFFIX: Record<string, string> = { one: 'st', two: 'nd', few: 'rd', other: 'th' };

/**
 * Formats a position as a localized ordinal — "1,247th", "1.247ª".
 *
 * Done here rather than in the locale files because the two languages need
 * different machinery: Portuguese ordinals are regular (always "ª" for the
 * feminine "pessoa"), while English picks a suffix per number class. Handing
 * i18n a finished string keeps one `{{position}}` placeholder in both.
 */
export function formatOrdinal(position: number, language: string): string {
  const number = new Intl.NumberFormat(language).format(position);
  if (language.toLowerCase().startsWith('pt')) return `${number}ª`;
  const rule = new Intl.PluralRules('en', { type: 'ordinal' }).select(position);
  return `${number}${EN_ORDINAL_SUFFIX[rule] ?? EN_ORDINAL_SUFFIX.other}`;
}

const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['day', 86_400_000],
  ['hour', 3_600_000],
  ['minute', 60_000],
];

/**
 * "3 hours ago" / "há 3 horas" — the coarsest unit that still reads as a real
 * interval, since the exact second of someone else's visit is neither
 * interesting nor ours to advertise precisely.
 *
 * `numeric: 'always'` on purpose: 'auto' turns a 25-hour gap into "yesterday",
 * which claims a calendar day this code has no way to know. Same reason
 * /api/visitor windows a rolling 24h instead of a "today" — the server can't
 * see the visitor's timezone, so the copy stays in intervals.
 */
export function formatTimeAgo(at: string, now: number, language: string): string {
  const elapsed = Math.max(0, now - new Date(at).getTime());
  const format = new Intl.RelativeTimeFormat(language, { numeric: 'always' });
  for (const [unit, ms] of RELATIVE_UNITS) {
    const value = Math.floor(elapsed / ms);
    if (value >= 1) return format.format(-value, unit);
  }
  // Floors at one minute rather than zero: a visit seconds old (or a clock
  // skewed into the future) would otherwise render as "há 0 minuto".
  return format.format(-1, 'minute');
}
