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
