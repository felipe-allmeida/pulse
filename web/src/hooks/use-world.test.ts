import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useWorld } from './use-world';
import { loadWorld, worldIfLoaded } from '@/lib/world';

describe('useWorld', () => {
  it('starts undefined so the first render never waits on 108 KB of geometry', () => {
    const { result } = renderHook(() => useWorld());
    // Only meaningful before anything else in the process has loaded it.
    if (!worldIfLoaded()) expect(result.current).toBeUndefined();
  });

  it('resolves to a feature collection with named countries', async () => {
    const { result } = renderHook(() => useWorld());
    await waitFor(() => expect(result.current).toBeDefined());

    expect(result.current!.features.length).toBeGreaterThan(100);
    expect(result.current!.features.some((f) => f.properties.name === 'Brazil')).toBe(true);
  });

  it('decodes once and hands back the same object', async () => {
    const [a, b] = await Promise.all([loadWorld(), loadWorld()]);
    expect(a).toBe(b);
  });
});
