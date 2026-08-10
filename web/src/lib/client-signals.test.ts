import { afterEach, describe, expect, it, vi } from 'vitest';
import { fingerprintOf, readClientSignals, type ClientSignals } from './client-signals';

function stub(property: string, value: unknown, target: object = navigator) {
  Object.defineProperty(target, property, { value, configurable: true, writable: true });
}

function baseSignals(overrides: Partial<ClientSignals> = {}): ClientSignals {
  return {
    language: 'pt-BR',
    languages: ['pt-BR', 'en'],
    timeZone: 'America/Sao_Paulo',
    screenWidth: 1920,
    screenHeight: 1080,
    pixelRatio: 2,
    cores: 8,
    memoryGb: 8,
    touchPoints: 0,
    doNotTrack: false,
    platform: 'macOS',
    colorScheme: 'dark',
    os: 'macOS',
    browser: 'Safari',
    referrer: null,
    localHour: 14,
    localDay: 2,
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
    ...overrides,
  };
}

describe('readClientSignals', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('reads what the browser offers without asking for anything', () => {
    stub('language', 'pt-BR');
    stub('languages', ['pt-BR', 'en']);
    stub('hardwareConcurrency', 8);
    stub('maxTouchPoints', 5);

    const signals = readClientSignals();

    expect(signals.language).toBe('pt-BR');
    expect(signals.languages).toEqual(['pt-BR', 'en']);
    expect(signals.cores).toBe(8);
    expect(signals.touchPoints).toBe(5);
    expect(signals.timeZone).toBeTruthy();
  });

  it('copies navigator.languages instead of aliasing it', () => {
    const live = ['pt-BR'];
    stub('languages', live);

    const signals = readClientSignals();
    live.push('mutated');

    expect(signals.languages).toEqual(['pt-BR']);
  });

  it('reports an unset Do Not Track as unknown rather than as opted out', () => {
    stub('doNotTrack', 'unspecified');

    // "Not stated" and "explicitly off" are different facts, and the rarity
    // maths must not count a silent browser as having made a choice.
    expect(readClientSignals().doNotTrack).toBeNull();
  });

  it('distinguishes an explicit Do Not Track signal in both directions', () => {
    stub('doNotTrack', '1');
    expect(readClientSignals().doNotTrack).toBe(true);

    stub('doNotTrack', '0');
    expect(readClientSignals().doNotTrack).toBe(false);
  });

  it('degrades to nulls when a reading throws instead of breaking the page', () => {
    Object.defineProperty(navigator, 'hardwareConcurrency', {
      get() {
        throw new Error('blocked by a privacy extension');
      },
      configurable: true,
    });

    expect(() => readClientSignals()).not.toThrow();
    expect(readClientSignals().cores).toBeNull();
  });

  it('falls back to navigator.platform when userAgentData is absent', () => {
    stub('userAgentData', undefined);
    stub('platform', 'MacIntel');

    expect(readClientSignals().platform).toBe('MacIntel');
  });

  it('prefers userAgentData.platform when the browser exposes it', () => {
    stub('userAgentData', { platform: 'macOS' });
    stub('platform', 'MacIntel');

    expect(readClientSignals().platform).toBe('macOS');
  });
});

describe('fingerprintOf', () => {
  it('is stable for identical signals', () => {
    expect(fingerprintOf(baseSignals())).toBe(fingerprintOf(baseSignals()));
  });

  it('changes when any single signal changes', () => {
    const original = fingerprintOf(baseSignals());

    expect(fingerprintOf(baseSignals({ timeZone: 'Europe/Lisbon' }))).not.toBe(original);
    expect(fingerprintOf(baseSignals({ screenWidth: 1366 }))).not.toBe(original);
    expect(fingerprintOf(baseSignals({ cores: 4 }))).not.toBe(original);
  });

  it('is a fixed-width hex digest', () => {
    expect(fingerprintOf(baseSignals())).toMatch(/^[0-9a-f]{8}$/);
  });

  it('handles signals that are entirely missing', () => {
    const empty = baseSignals({
      language: 'unknown',
      languages: [],
      timeZone: null,
      screenWidth: null,
      screenHeight: null,
      pixelRatio: null,
      cores: null,
      memoryGb: null,
      touchPoints: null,
      platform: null,
      colorScheme: null,
    });

    expect(fingerprintOf(empty)).toMatch(/^[0-9a-f]{8}$/);
  });
});

describe('user-agent detection', () => {
  function detect(userAgent: string, maxTouchPoints = 0) {
    stub('userAgent', userAgent);
    stub('maxTouchPoints', maxTouchPoints);
    const signals = readClientSignals();
    return { os: signals.os, browser: signals.browser };
  }

  it('identifies the mainstream desktop combinations', () => {
    expect(
      detect(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36',
      ),
    ).toEqual({ os: 'Windows', browser: 'Chrome' });

    expect(
      detect(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
      ),
    ).toEqual({ os: 'macOS', browser: 'Safari' });

    expect(detect('Mozilla/5.0 (X11; Linux x86_64; rv:133.0) Gecko/20100101 Firefox/133.0')).toEqual({
      os: 'Linux',
      browser: 'Firefox',
    });
  });

  it('sees through the browsers that impersonate Chrome', () => {
    // Edge and Opera both carry "Chrome/" in their UA; order of checks decides.
    expect(
      detect(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36 Edg/131.0',
      ).browser,
    ).toBe('Edge');

    expect(
      detect(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36 OPR/117.0',
      ).browser,
    ).toBe('Opera');

    expect(
      detect(
        'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/27.0 Chrome/125.0 Mobile Safari/537.36',
      ).browser,
    ).toBe('Samsung Internet');
  });

  it('does not call Chrome "Safari" just because it says so', () => {
    // Every Chromium UA ends in "Safari/537.36" for compatibility.
    expect(
      detect(
        'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Mobile Safari/537.36',
      ),
    ).toEqual({ os: 'Android', browser: 'Chrome' });
  });

  it('recognises the iOS browsers that are all WebKit underneath', () => {
    expect(
      detect(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/131.0 Mobile/15E148',
        5,
      ),
    ).toEqual({ os: 'iOS', browser: 'Chrome' });

    expect(
      detect(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
        5,
      ),
    ).toEqual({ os: 'iOS', browser: 'Safari' });
  });

  it('catches an iPad claiming to be a Mac', () => {
    const iPadOS =
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15';

    // Identical UA to a desktop Mac — the touchscreen is the only tell, since
    // no shipping Mac has one.
    expect(detect(iPadOS, 5).os).toBe('iOS');
    expect(detect(iPadOS, 0).os).toBe('macOS');
  });

  it('says unknown instead of guessing at an unrecognised agent', () => {
    expect(detect('some-crawler/1.0')).toEqual({ os: 'unknown', browser: 'unknown' });
  });
});
