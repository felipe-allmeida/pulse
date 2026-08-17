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
    loadWorld()
      .then((loaded) => {
        if (!cancelled) setWorld(loaded);
      })
      .catch(() => {
        // Stay undefined — every consumer already renders without geometry.
        // `loadWorld` resets its in-flight promise on rejection, so a later
        // mount (or a future render of this same hook) gets a fresh attempt;
        // this hook doesn't retry or surface an error state itself.
      });
    return () => {
      cancelled = true;
    };
  }, [world]);

  return world;
}
