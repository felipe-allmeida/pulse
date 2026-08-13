/**
 * What the browser hands over without being asked.
 *
 * Every field here is a plain property read — no permission prompt, no cookie,
 * no storage write, and nothing that leaves the page. That restraint is the
 * point of the exercise: the `/watched` page argues that the alarming part of
 * tracking is how *ordinary* the ingredients are, which only lands if the page
 * itself sticks to the ordinary ones.
 *
 * Deliberately absent, though they would all "work":
 * - WebRTC public-IP discovery — publishing someone's IP unprompted is a
 *   different category of risk from listing their screen size.
 * - Canvas/WebGL/audio hashing and font probing — these exist to build a
 *   *durable* identifier, which is the thing the page is arguing against.
 * - Anything persisted. The fingerprint below is derived and shown, never
 *   stored, so a second visit cannot be linked to a first.
 */
export type ClientSignals = {
  language: string;
  languages: string[];
  timeZone: string | null;
  screenWidth: number | null;
  screenHeight: number | null;
  pixelRatio: number | null;
  cores: number | null;
  memoryGb: number | null;
  touchPoints: number | null;
  doNotTrack: boolean | null;
  platform: string | null;
  colorScheme: 'dark' | 'light' | null;
  os: OperatingSystem;
  browser: BrowserName;
  userAgent: string;
  /** Hostname the visitor arrived from, or null when they came directly. */
  referrer: string | null;
  /** Local hour of day, 0-23, as the visitor's own clock reports it. */
  localHour: number;
  /** Day of week on the visitor's clock, 0 = Sunday. */
  localDay: number;
};

export type OperatingSystem = 'Android' | 'iOS' | 'Windows' | 'macOS' | 'Linux' | 'unknown';
export type BrowserName = 'Chrome' | 'Safari' | 'Edge' | 'Firefox' | 'Samsung Internet' | 'Opera' | 'unknown';

/**
 * Order matters in both of these: the UA string is a pile of compatibility
 * lies, so every check has to run after the ones that would otherwise swallow
 * it. Edge claims to be Chrome, Chrome claims to be Safari, and iPadOS claims
 * to be a Mac. Each entry below is placed to be tested before whatever it
 * impersonates.
 */
const BROWSER_MATCHERS: [BrowserName, RegExp][] = [
  ['Edge', /\bEdg(e|A|iOS)?\//],
  ['Samsung Internet', /SamsungBrowser\//],
  ['Opera', /\b(OPR|Opera)\//],
  ['Firefox', /\b(Firefox|FxiOS)\//],
  ['Chrome', /\b(Chrome|CriOS|Chromium)\//],
  ['Safari', /\bSafari\//],
];

const OS_MATCHERS: [OperatingSystem, RegExp][] = [
  ['Android', /\bAndroid\b/],
  ['iOS', /\b(iPhone|iPad|iPod)\b/],
  ['Windows', /\bWindows\b/],
  ['macOS', /\bMac OS X\b|\bMacintosh\b/],
  ['Linux', /\bLinux\b|\bX11\b/],
];

function detectBrowser(userAgent: string): BrowserName {
  for (const [name, pattern] of BROWSER_MATCHERS) if (pattern.test(userAgent)) return name;
  return 'unknown';
}

function detectOs(userAgent: string, touchPoints: number | null): OperatingSystem {
  for (const [name, pattern] of OS_MATCHERS) {
    if (!pattern.test(userAgent)) continue;
    // iPadOS reports itself as a desktop Mac. A touchscreen is the practical
    // tell, since no shipping Mac has one.
    if (name === 'macOS' && (touchPoints ?? 0) > 1) return 'iOS';
    return name;
  }
  return 'unknown';
}

function safe<T>(read: () => T): T | null {
  try {
    const value = read();
    return value === undefined ? null : value;
  } catch {
    return null;
  }
}

/**
 * `navigator.userAgentData` is Chromium-only; `navigator.platform` is
 * deprecated but still the only hint Safari and Firefox give. Neither is
 * reliable, which the page says out loud rather than papering over.
 */
function readPlatform(): string | null {
  const uaData = (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData;
  if (uaData?.platform) return uaData.platform;
  const legacy = (navigator as Navigator & { platform?: string }).platform;
  return legacy || null;
}

/**
 * The site that linked here, if any.
 *
 * Not a new kind of reading — the browser sends this header to every site it
 * visits, unasked. Same-origin arrivals are reported as null: a visitor
 * clicking through from the home page came from nowhere in particular, and
 * naming this site as the referrer would be noise. Note that a client-side
 * route change does not reset `document.referrer`, so someone who landed on
 * `/` from elsewhere and clicked through still carries their real source.
 */
function readReferrer(): string | null {
  const raw = safe(() => document.referrer);
  if (!raw) return null;
  try {
    const { hostname } = new URL(raw);
    return hostname && hostname !== window.location.hostname ? hostname : null;
  } catch {
    return null;
  }
}

export function readClientSignals(): ClientSignals {
  const userAgent = safe(() => navigator.userAgent) ?? '';
  const touchPoints = safe(() => navigator.maxTouchPoints) ?? null;
  const now = new Date();

  return {
    userAgent,
    referrer: readReferrer(),
    localHour: now.getHours(),
    localDay: now.getDay(),
    os: detectOs(userAgent, touchPoints),
    browser: detectBrowser(userAgent),
    language: safe(() => navigator.language) ?? 'unknown',
    languages: safe(() => [...(navigator.languages ?? [])]) ?? [],
    timeZone: safe(() => Intl.DateTimeFormat().resolvedOptions().timeZone) ?? null,
    screenWidth: safe(() => window.screen?.width) ?? null,
    screenHeight: safe(() => window.screen?.height) ?? null,
    pixelRatio: safe(() => window.devicePixelRatio) ?? null,
    cores: safe(() => navigator.hardwareConcurrency) ?? null,
    // Chromium-only, and bucketed by the browser rather than exact.
    memoryGb: safe(() => (navigator as Navigator & { deviceMemory?: number }).deviceMemory) ?? null,
    touchPoints,
    doNotTrack: safe(() => {
      const raw = navigator.doNotTrack;
      return raw === null || raw === undefined || raw === 'unspecified' ? null : raw === '1';
    }),
    platform: safe(readPlatform),
    colorScheme: safe(() =>
      typeof window.matchMedia !== 'function'
        ? null
        : window.matchMedia('(prefers-color-scheme: dark)').matches
          ? ('dark' as const)
          : ('light' as const),
    ),
  };
}

/**
 * A short, stable-looking digest of the signals above.
 *
 * Shown to make one argument concrete — that these scattered readings collapse
 * into a single handle — and for nothing else. It is never stored, never sent,
 * and never compared against a previous visit, so it identifies no one here.
 * On a site that *did* store it, this is the whole trick.
 *
 * FNV-1a: a non-cryptographic hash, chosen because it is short enough to read
 * aloud and needs no dependency. It is not a security primitive.
 */
export function fingerprintOf(signals: ClientSignals): string {
  const material = [
    signals.os,
    signals.browser,
    signals.language,
    signals.languages.join(','),
    signals.timeZone,
    signals.screenWidth,
    signals.screenHeight,
    signals.pixelRatio,
    signals.cores,
    signals.memoryGb,
    signals.touchPoints,
    signals.platform,
    signals.colorScheme,
  ].join('|');

  let hash = 0x811c9dc5;
  for (let i = 0; i < material.length; i++) {
    hash ^= material.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}
