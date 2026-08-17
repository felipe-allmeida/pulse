/**
 * Mounts the app only once the router can actually render something.
 *
 * `autoCodeSplitting` puts every route component in its own chunk, so calling
 * `createRoot().render()` straight away means React clears the prerendered
 * `#root` and then has nothing to put back until that chunk downloads and
 * evaluates. On a slow connection that is seconds of blank screen over markup
 * that was already correct and already styled.
 *
 * Loading first inverts it: the build-time markup stays visible, and the swap
 * happens when it can be instant.
 *
 * A failed load still renders. Leaving the prerendered markup up forever would
 * look fine and be completely inert — no navigation, no live data, no way for
 * the visitor to tell. Mounting lets the router surface the failure and retry.
 */
export async function mountWhenReady(
  load: () => Promise<unknown>,
  render: () => void,
): Promise<void> {
  try {
    await load();
  } catch {
    // Deliberately swallowed — see above.
  }
  render();
}
