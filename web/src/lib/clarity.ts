/**
 * Microsoft Clarity — session recordings and heatmaps for the public site.
 *
 * Clarity ships as a copy-paste `<script>` for the document head. It lives
 * here instead because that snippet has no way to say "not on localhost": the
 * dev server hands out the same `index.html` as production, so every
 * `pnpm dev` session would land in the dashboard as a real visit. Loading it
 * from the bundle means the one gate that matters — `import.meta.env.PROD`,
 * applied at the call site in `main.tsx` — is a compile-time constant, and the
 * whole tag drops out of the dev graph.
 *
 * The cost is that the tag starts loading after the module bundle parses
 * rather than during head parsing. For a static site of this size that is a
 * few tens of milliseconds of recording lead-in, against permanently clean
 * data.
 *
 * Route changes need no wiring: Clarity watches the History API itself, so
 * TanStack Router's client-side navigations already arrive as separate pages.
 */

/** The project this site reports to (public — it ships in the tag URL). */
export const CLARITY_PROJECT_ID = 'y3rav4w960';

const TAG_ORIGIN = 'https://www.clarity.ms/tag/';

/**
 * The global the tag installs. Before `clarity.js` arrives it is the stub
 * below, which parks calls in `q`; the real script drains that queue on load,
 * so anything recorded during startup survives.
 */
type ClarityApi = {
  (...args: unknown[]): void;
  q?: unknown[][];
};

declare global {
  interface Window {
    clarity?: ClarityApi;
  }
}

export function tagUrl(projectId: string): string {
  return `${TAG_ORIGIN}${projectId}`;
}

/**
 * Installs the `window.clarity` queue stub and requests the tag. Safe to call
 * more than once — the second call is a no-op rather than a second recorder.
 */
export function loadClarity(projectId: string = CLARITY_PROJECT_ID): void {
  const src = tagUrl(projectId);
  if (document.querySelector(`script[src="${src}"]`)) return;

  window.clarity ??= function clarity(...args: unknown[]) {
    (window.clarity!.q ??= []).push(args);
  };

  const script = document.createElement('script');
  script.async = true;
  script.src = src;
  // The published snippet splices the tag in before the first existing
  // <script>; appending to <head> reaches the same preload scanner and needs
  // no "what if there is no script yet" branch. `async` makes the position
  // immaterial either way.
  document.head.append(script);
}
