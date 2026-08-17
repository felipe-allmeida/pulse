import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('loadWorld', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.doUnmock('topojson-client');
    vi.resetModules();
  });

  it('retries after a rejection instead of replaying it forever', async () => {
    // `feature` throws on its first call only, simulating a transient
    // failure in the dynamically-imported chunk (a real production case now
    // that the topojson is a separately-fetched chunk rather than bundled
    // in statically). Every call after that behaves like the real decode.
    let calls = 0;
    vi.doMock('topojson-client', async () => {
      const actual = await vi.importActual<typeof import('topojson-client')>('topojson-client');
      return {
        ...actual,
        feature: (...args: Parameters<typeof actual.feature>) => {
          calls += 1;
          if (calls === 1) throw new Error('simulated decode failure');
          return actual.feature(...args);
        },
      };
    });

    const { loadWorld } = await import('./world');

    await expect(loadWorld()).rejects.toThrow('simulated decode failure');

    // A later caller — a component mounting minutes later, per the bug
    // report — must get a fresh attempt, not the same rejected promise.
    const world = await loadWorld();
    expect(world.features.length).toBeGreaterThan(100);
    expect(world.features.some((f) => f.properties.name === 'Brazil')).toBe(true);
  });

  // Concurrent callers sharing a single decode is also covered by
  // "decodes once and hands back the same object" in
  // src/hooks/use-world.test.ts, which this fix does not change the
  // behaviour of on the success path — only the failure path gained a
  // reset. Repeated here directly against `loadWorld` so this file stands
  // on its own.
  it('still shares one decode between concurrent callers on the success path', async () => {
    const { loadWorld } = await import('./world');
    const [a, b] = await Promise.all([loadWorld(), loadWorld()]);
    expect(a).toBe(b);
  });
});
