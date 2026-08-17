import { useEffect, useState } from 'react';
import { loadWorld, worldIfLoaded, type World } from '@/lib/world';

/**
 * The map geometry, once it has loaded. `undefined` on the first render (and
 * for the whole build-time render, which never runs effects) — every consumer
 * has to draw something sensible without it, which both maps already did.
 */
export function useWorld(): World | undefined {
  const [world, setWorld] = useState<World | undefined>(worldIfLoaded);

  useEffect(() => {
    if (world) return;
    let cancelled = false;
    void loadWorld().then((loaded) => {
      if (!cancelled) setWorld(loaded);
    });
    return () => {
      cancelled = true;
    };
  }, [world]);

  return world;
}
