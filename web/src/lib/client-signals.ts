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
};

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

export function readClientSignals(): ClientSignals {
  return {
    language: safe(() => navigator.language) ?? 'unknown',
    languages: safe(() => [...(navigator.languages ?? [])]) ?? [],
    timeZone: safe(() => Intl.DateTimeFormat().resolvedOptions().timeZone) ?? null,
    screenWidth: safe(() => window.screen?.width) ?? null,
    screenHeight: safe(() => window.screen?.height) ?? null,
    pixelRatio: safe(() => window.devicePixelRatio) ?? null,
    cores: safe(() => navigator.hardwareConcurrency) ?? null,
    // Chromium-only, and bucketed by the browser rather than exact.
    memoryGb: safe(() => (navigator as Navigator & { deviceMemory?: number }).deviceMemory) ?? null,
    touchPoints: safe(() => navigator.maxTouchPoints) ?? null,
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
