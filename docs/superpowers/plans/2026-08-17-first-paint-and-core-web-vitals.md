# First Paint and Core Web Vitals Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stop the site painting blank then black on first load, and bring LCP from 2.9s to under 2.5s, by keeping the prerendered markup on screen and taking dead weight off the critical path.

**Architecture:** The prerendered document already contains each route's real markup. Today `createRoot` throws it away before the route chunk exists, so the screen is empty for as long as that chunk takes. Three moves fix it: mount only once the router can render, resolve the theme before the first paint, and shrink what the mount waits on. Caching and image weight are independent wins in the same pass.

**Tech Stack:** React 19, TanStack Router (`autoCodeSplitting`), Vite 8 (rolldown), Tailwind 4, vitest, Caddy 2, Docker.

This plan implements **Phase 1** of `docs/superpowers/specs/2026-08-17-site-seo-optimization-design.md`. Phases 2 and 3 (content/meta audit, AI-crawler surface audit) get their own plan — they are audit work of a different shape and depend on what this plan leaves in place.

## Global Constraints

- Work happens in `web/` unless a path says otherwise. Run commands from the repo root as `pnpm -C web <script>`.
- `createRoot` stays. `hydrateRoot` is explicitly rejected — see `web/src/entry-prerender.tsx`'s header comment and spec section 1.1.
- Every emitted document must keep the `<!--aio:head-->` and `<!--aio:app-->` markers working; `web/plugins/aio.ts` throws if they go missing, and `aio.test.ts` asserts it.
- Public files (`web/public/`) keep their authored names — Vite does not hash them. Only `/assets/*` may be served `immutable`.
- Acceptance thresholds, measured on the spec's profile (Moto G Power emulated, slow 4G): **LCP < 2.5s**, **TBT not worse than 100ms**, **CLS < 0.1**, **zero blank frames in the filmstrip**.
- Microsoft Clarity is landing in a parallel session and also edits `web/index.html`. Expect to reconcile, and hold Clarity constant across the before/after Lighthouse runs (spec 1.9).

## Measured baseline

Captured from a real `pnpm -C web build` on 2026-08-17. Task 10 compares against these.

| Chunk | Raw | Gzip | On the home critical path? |
|---|---|---|---|
| `use-visit-feed-*.js` | 431 KB | 140 KB | Yes, but **not preloaded** — discovered only after the entry evaluates. Holds the 108 KB topojson. |
| `index-*.js` (entry) | 372 KB | 120 KB | Yes, `<script src>` |
| `ask-widget-store-*.js` | 100 KB | 29 KB | Yes, preloaded. Holds `@microsoft/signalr`. |
| `projects-Bg8E3aML.js` | 58 KB | 20 KB | Yes, preloaded |
| `index-*.css` | 56 KB | 9.9 KB | Yes, render-blocking |
| `live-*.js` | 120 KB | 31 KB | **No** — `/live` only. Holds `recharts`. |

The home document's declared preload graph is 296 KB raw across 12 tags, all emitted by Vite already.

### Deliberately not done

Both were in an earlier draft and were removed after measurement. Do not re-add them without new evidence.

- **Splitting `recharts`.** Already `/live`-only; it never enters the home graph.
- **Adding `modulepreload` for the entry graph.** Vite already emits all 12 tags. Task 8 adds one tag Vite cannot know about, which is a different thing.

---

## File Structure

**Created**
- `web/src/lib/mount-when-ready.ts` — the ordering rule for mounting (load, then render, render anyway on failure). Pure and testable; `main.tsx` stays a thin entry.
- `web/src/lib/mount-when-ready.test.ts`
- `web/src/hooks/use-world.ts` — React access to the lazily-decoded map geometry.
- `web/src/hooks/use-world.test.ts`
- `web/src/document.test.ts` — asserts the shape of what `index.html` and the emitted documents carry (theme script, stamped class, inlined CSS, route preload).
- `deploy/cache-headers.test.sh` — curls a running container and asserts the `Cache-Control` matrix.

**Modified**
- `.github/workflows/ci.yml` — run the web test suite and the linter.
- `deploy/Caddyfile` — the `Cache-Control` matrix.
- `web/index.html` — synchronous theme script.
- `web/src/main.tsx` — use `mountWhenReady`.
- `web/src/lib/aio/render.ts` — gains `renderDocument()`, the single place a document is assembled.
- `web/plugins/aio.ts` — call `renderDocument()` instead of chaining `.replace()`; pass the built CSS and the route's chunk.
- `web/src/lib/world.ts` — becomes an async loader with a sync cache read.
- `web/src/components/live-map.tsx`, `web/src/components/home/hero-map.tsx` — consume `useWorld()`.
- `web/src/realtime/hub.ts`, `web/src/realtime/use-pulse-hub.tsx` — dynamic `@microsoft/signalr`.
- `web/src/routes/__root.tsx` — lazy `AskWidget`.
- `web/src/content/projects.ts` — WebP screenshot paths.

`renderDocument()` is the decomposition decision that matters: Tasks 3, 8 and 9 all change how a document is assembled, and without one seam they would each add another `.replace()` chain to the plugin.

---

## Task 1: Make CI run the web tests, and capture the baseline

Nothing downstream is verifiable until the suite actually runs somewhere other than a developer's laptop. The `frontend` job builds and typechecks but never runs `vitest` or `oxlint`, so every test this plan adds would be decoration.

**Files:**
- Modify: `.github/workflows/ci.yml:50-75`

**Interfaces:**
- Consumes: nothing
- Produces: a CI job that fails on a failing web test; a recorded baseline for Task 10

- [ ] **Step 1: Confirm the suite currently passes**

```bash
pnpm -C web install --frozen-lockfile && pnpm -C web test
```

Expected: PASS. If anything fails, stop and report — a red baseline invalidates every later step.

- [ ] **Step 2: Add the test and lint steps to CI**

In `.github/workflows/ci.yml`, after the `Typecheck` step of the `frontend` job:

```yaml
      - name: Lint
        run: pnpm -C web lint

      - name: Test
        run: pnpm -C web test
```

- [ ] **Step 3: Verify the workflow parses**

```bash
python3 -c "import yaml,sys; yaml.safe_load(open('.github/workflows/ci.yml')); print('ok')"
```

Expected: `ok`

- [ ] **Step 4: Record the baseline**

```bash
pnpm -C web build && ls -la web/dist/assets/*.js | awk '{print $5, $9}' | sort -rn
```

Paste the output into the PR description under "Baseline". Then run Lighthouse against the production URL on the spec's profile (Moto G Power emulated, slow 4G) for **both** `/pt/` and one project detail page, and record LCP / TBT / CLS / Speed Index plus the filmstrip. Task 10 compares against exactly these.

- [ ] **Step 5: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: run the web test suite and linter

The frontend job installed, built and typechecked but never ran vitest
or oxlint, so the whole web suite only ever ran locally."
```

---

## Task 2: Cache headers

382 KiB of hashed assets are refetched on every visit because `deploy/Caddyfile` sets no `Cache-Control` at all. Independent of everything else in this plan and the largest repeat-visit win available.

**Files:**
- Modify: `deploy/Caddyfile`
- Create: `deploy/cache-headers.test.sh`

**Interfaces:**
- Consumes: nothing
- Produces: nothing other tasks read

- [ ] **Step 1: Write the failing test**

Create `deploy/cache-headers.test.sh`:

```bash
#!/usr/bin/env bash
# Asserts the Cache-Control matrix from the SEO design spec, section 1.4,
# against a running pulse-web container. Run: deploy/cache-headers.test.sh
set -euo pipefail

BASE="${1:-http://localhost:8080}"
failures=0

check() {
  local path="$1" expected="$2"
  local actual
  actual="$(curl -fsSI "$BASE$path" | tr -d '\r' \
    | awk -F': ' 'tolower($1)=="cache-control" {print $2}')"
  if [ "$actual" != "$expected" ]; then
    echo "FAIL $path"
    echo "  expected: $expected"
    echo "  actual:   ${actual:-<none>}"
    failures=$((failures + 1))
  else
    echo "ok   $path"
  fi
}

# A hashed asset, discovered from the served document so this never pins a hash.
asset="$(curl -fsS "$BASE/" | grep -o '/assets/[^"]*\.js' | head -1)"
[ -n "$asset" ] || { echo "could not find a hashed asset in /"; exit 1; }

check "$asset"            "public, max-age=31536000, immutable"
check "/"                 "no-cache"
check "/about"            "no-cache"
check "/llms.txt"         "no-cache"
check "/sitemap.xml"      "no-cache"
check "/favicon.svg"      "public, max-age=604800"
check "/og.png"           "public, max-age=604800"

[ "$failures" -eq 0 ] || { echo "$failures check(s) failed"; exit 1; }
echo "all cache headers correct"
```

```bash
chmod +x deploy/cache-headers.test.sh
```

- [ ] **Step 2: Run it against the current build to watch it fail**

```bash
docker build -f deploy/Dockerfile.web -t pulse-web . \
  && docker run -d --rm -p 8080:80 --name pulse-web-test pulse-web \
  && sleep 2 && deploy/cache-headers.test.sh
```

Expected: FAIL on every row, each reporting `actual: <none>`.

- [ ] **Step 3: Add the matrix to the Caddyfile**

In `deploy/Caddyfile`, inside the final `handle { ... }` block, immediately **before** `root * /srv`:

```caddyfile
	# Cache-Control, absent until now — which is why every visit refetched
	# the whole asset graph. Three non-overlapping matchers rather than a
	# broad default plus overrides, so the rule for any given request is
	# readable from one line.
	#
	# /assets/* carries Vite's content hashes, so it is safe to freeze
	# forever. Files in public/ keep their authored names and must not be,
	# hence the separate, shorter window.
	#
	# The documents are `no-cache` because each one embeds the hashed asset
	# names: a cached document pins a released build in place and the next
	# deploy is invisible until it expires.
	@assets path /assets/*
	header @assets Cache-Control "public, max-age=31536000, immutable"

	@public path /favicon.ico /favicon.svg /apple-touch-icon.png /og.png /cv.pdf /screenshots/*
	header @public Cache-Control "public, max-age=604800"

	@documents not path /assets/* /favicon.ico /favicon.svg /apple-touch-icon.png /og.png /cv.pdf /screenshots/*
	header @documents Cache-Control "no-cache"
```

- [ ] **Step 4: Rebuild and verify it passes**

```bash
docker stop pulse-web-test || true
docker build -f deploy/Dockerfile.web -t pulse-web . \
  && docker run -d --rm -p 8080:80 --name pulse-web-test pulse-web \
  && sleep 2 && deploy/cache-headers.test.sh
```

Expected: `all cache headers correct`

- [ ] **Step 5: Confirm the SPA fallback still works**

```bash
curl -fsS -o /dev/null -w '%{http_code}\n' http://localhost:8080/about
curl -fsS http://localhost:8080/about | grep -c 'aio' || true
docker stop pulse-web-test
```

Expected: `200`, and a non-zero grep count — the header block must not have disturbed `try_files`.

- [ ] **Step 6: Commit**

```bash
git add deploy/Caddyfile deploy/cache-headers.test.sh
git commit -m "perf(deploy): cache the hashed assets, revalidate the documents

382 KiB of content-hashed assets came back with no Cache-Control at all,
so every visit refetched the entire graph. The documents stay no-cache:
each embeds the hashed asset names, so caching one pins a released build."
```

---

## Task 3: Resolve the theme before the first paint

The served document is light while the store's default is dark, so the page paints light and then turns dark. Fixed in two layers so the common case needs no JavaScript. This task also introduces `renderDocument()`, the seam Tasks 8 and 9 build on.

**Files:**
- Modify: `web/src/lib/aio/render.ts`
- Modify: `web/plugins/aio.ts:120-135`
- Modify: `web/index.html`
- Create: `web/src/document.test.ts`

**Interfaces:**
- Consumes: `AioPage` from `web/src/lib/aio/pages.ts`; `HEAD_MARKER` / `APP_MARKER` from `web/plugins/aio.ts`
- Produces:

```ts
export interface DocumentOptions {
  /** The built index.html, with both markers still in place. */
  template: string;
  page: AioPage;
  /** Output of renderHead(). */
  head: string;
  /** Prerendered markup for #root. */
  app: string;
  /** Built stylesheet source, inlined into <style>. Added in Task 8. */
  css?: string;
  /** Extra module paths to preload, e.g. "/assets/use-visit-feed-x.js". Added in Task 9. */
  modulePreloads?: string[];
}

export function renderDocument(options: DocumentOptions): string;
```

- [ ] **Step 1: Write the failing test**

Create `web/src/document.test.ts`:

```ts
/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { buildPages } from './lib/aio/pages';
import { renderDocument } from './lib/aio/render';

// Reading index.html off disk follows favicon.test.ts / styles.test.ts.
const webRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const template = readFileSync(join(webRoot, 'index.html'), 'utf-8');

const home = buildPages('en')[0];
const ptHome = buildPages('pt-BR')[0];

describe('theme resolution before first paint', () => {
  it('runs the theme script before any stylesheet, so it beats the paint', () => {
    const script = template.indexOf('pulse-theme');
    expect(script).toBeGreaterThan(-1);

    const stylesheet = template.search(/<link[^>]+rel="stylesheet"/);
    // -1 means Vite injects it at build time, i.e. after everything authored
    // here — which also satisfies the ordering requirement.
    if (stylesheet !== -1) expect(script).toBeLessThan(stylesheet);
  });

  it('uses no async attribute, since a deferred script cannot beat the paint', () => {
    const tag = /<script(?![^>]*\ssrc=)[^>]*>/.exec(template)?.[0] ?? '';
    expect(tag).not.toContain('async');
    expect(tag).not.toContain('defer');
    expect(tag).not.toContain('type="module"');
  });
});

describe('renderDocument', () => {
  const doc = (page = home) =>
    renderDocument({ template, page, head: '<title>t</title>', app: '<p>a</p>' });

  it('stamps the dark class, so the document matches the store default', () => {
    expect(doc()).toContain('class="dark"');
  });

  it('stamps the locale and the class in one <html> tag, not two', () => {
    const html = doc(ptHome);
    const openTags = html.match(/<html[^>]*>/g) ?? [];
    expect(openTags).toHaveLength(1);
    expect(openTags[0]).toContain('lang="pt-BR"');
    expect(openTags[0]).toContain('class="dark"');
  });

  it('fills both markers and leaves neither behind', () => {
    const html = doc();
    expect(html).toContain('<title>t</title>');
    expect(html).toContain('<p>a</p>');
    expect(html).not.toContain('<!--aio:head-->');
    expect(html).not.toContain('<!--aio:app-->');
  });

  it('refuses a template missing a marker rather than shipping a blank document', () => {
    expect(() =>
      renderDocument({ template: '<html lang="en"></html>', page: home, head: '', app: '' }),
    ).toThrow(/marker/i);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

```bash
pnpm -C web test src/document.test.ts
```

Expected: FAIL — `renderDocument` is not exported from `./lib/aio/render`.

- [ ] **Step 3: Add `renderDocument` to `web/src/lib/aio/render.ts`**

Append to the file, and add `import type { AioPage } from './pages';` if the existing type-only import does not already cover it (it does — the file already imports `AioPage`):

```ts
/** Placeholders in index.html that every emitted document fills in. */
const HEAD_MARKER = '<!--aio:head-->';
const APP_MARKER = '<!--aio:app-->';

export interface DocumentOptions {
  /** The built index.html, with both markers still in place. */
  template: string;
  page: AioPage;
  /** Output of `renderHead()`. */
  head: string;
  /** Prerendered markup for `#root`. */
  app: string;
}

/**
 * Assembles one emitted document.
 *
 * This exists so there is a single place a document is put together. It used
 * to be a chain of `.replace()` calls inside the build plugin, which meant
 * every new thing a document needed — the theme class here, the inlined CSS
 * and route preload later — added another link to that chain, untested,
 * inside a Vite hook.
 *
 * The `dark` class is stamped in the same substitution as `lang`, rather than
 * a second one: they both rewrite the opening `<html>` tag, and two
 * independent replacements over the same tag is how you end up with one of
 * them silently winning.
 */
export function renderDocument({ template, page, head, app }: DocumentOptions): string {
  if (!template.includes(HEAD_MARKER) || !template.includes(APP_MARKER)) {
    throw new Error(
      `[pulse-aio] "${HEAD_MARKER}" / "${APP_MARKER}" not found in the built index.html — restore the markers in web/index.html.`,
    );
  }

  return template
    .replace('<html lang="en">', `<html lang="${page.locale}" class="dark">`)
    .replace(HEAD_MARKER, head)
    .replace(APP_MARKER, app);
}
```

- [ ] **Step 4: Add the inline theme script to `web/index.html`**

Immediately after the `<meta name="viewport" ...>` line, before the `theme-color` metas:

```html
    <!--
      Resolves the theme before the first paint. The emitted documents ship
      with class="dark" already stamped (see src/lib/aio/render.ts), which
      covers everyone who never touched the toggle without running any
      JavaScript at all; this only has to correct the visitor who chose
      light, and to apply the default in `pnpm dev`, where no build step
      stamped anything.

      Synchronous and ahead of the stylesheet on purpose: async, defer or
      type="module" would all run after the first paint, which is the exact
      flash this removes. The try/catch is not decoration — a throw in a
      blocking head script stops the parser, so a corrupt localStorage entry
      would cost the whole page rather than a preference.
    -->
    <script>
      try {
        var stored = localStorage.getItem('pulse-theme');
        var theme = stored ? JSON.parse(stored).state.theme : null;
        document.documentElement.classList.toggle('dark', theme !== 'light');
      } catch (e) {
        document.documentElement.classList.add('dark');
      }
    </script>
```

- [ ] **Step 5: Run the test to verify it passes**

```bash
pnpm -C web test src/document.test.ts
```

Expected: PASS (6 tests)

- [ ] **Step 6: Use `renderDocument` in the plugin**

In `web/plugins/aio.ts`, import it:

```ts
import { renderHead, renderDocument } from '../src/lib/aio/render';
```

Delete the marker check in `writeBundle` (lines beginning `if (!template.includes(HEAD_MARKER)`) — `renderDocument` now owns it — and replace the `const html = template.replace(...).replace(...).replace(...)` chain with:

```ts
        const html = renderDocument({
          template,
          page,
          head: renderHead(page, base, site.name, profile.name),
          app,
        });
```

Keep the `HEAD_MARKER` / `APP_MARKER` exports in `aio.ts` — `aio.test.ts` imports them.

- [ ] **Step 7: Verify the whole suite and a real build**

```bash
pnpm -C web test && pnpm -C web build \
  && grep -o '<html[^>]*>' web/dist/index.html web/dist/pt.html
```

Expected: tests PASS; `dist/index.html` shows `<html lang="en" class="dark">` and `dist/pt.html` shows `<html lang="pt-BR" class="dark">`.

- [ ] **Step 8: Commit**

```bash
git add web/index.html web/src/lib/aio/render.ts web/plugins/aio.ts web/src/document.test.ts
git commit -m "fix(web): resolve the theme before the first paint

The document was served light while the store defaults to dark, so the
page painted light and then turned dark a moment later. The emitted
documents now carry the class, and a blocking head script corrects the
visitor who chose light.

Document assembly moves out of the build plugin's replace() chain into
renderDocument(), which is where the inlined CSS and the route preload
will go next."
```

---

## Task 4: Mount only when the app can render

`createRoot` currently fires before the route chunk exists, so React discards correct markup and leaves the screen empty until that chunk lands. This is the blank-then-black frame.

**Files:**
- Create: `web/src/lib/mount-when-ready.ts`
- Create: `web/src/lib/mount-when-ready.test.ts`
- Modify: `web/src/main.tsx:57-64`

**Interfaces:**
- Consumes: nothing
- Produces: `export async function mountWhenReady(load: () => Promise<unknown>, render: () => void): Promise<void>`

- [ ] **Step 1: Write the failing test**

Create `web/src/lib/mount-when-ready.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest';
import { mountWhenReady } from './mount-when-ready';

describe('mountWhenReady', () => {
  it('does not render before the router has loaded', async () => {
    const render = vi.fn();
    let release!: () => void;
    const load = () => new Promise<void>((resolve) => { release = resolve; });

    const done = mountWhenReady(load, render);
    // The whole point: while the route chunk is in flight the prerendered
    // markup must stay on screen, so nothing may render yet.
    expect(render).not.toHaveBeenCalled();

    release();
    await done;
    expect(render).toHaveBeenCalledOnce();
  });

  it('renders anyway when loading fails, rather than freezing the page', async () => {
    const render = vi.fn();
    await mountWhenReady(() => Promise.reject(new Error('offline')), render);
    expect(render).toHaveBeenCalledOnce();
  });

  it('does not reject when loading fails', async () => {
    await expect(mountWhenReady(() => Promise.reject(new Error('x')), () => {})).resolves.toBeUndefined();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

```bash
pnpm -C web test src/lib/mount-when-ready.test.ts
```

Expected: FAIL — cannot resolve `./mount-when-ready`.

- [ ] **Step 3: Write the implementation**

Create `web/src/lib/mount-when-ready.ts`:

```ts
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
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
pnpm -C web test src/lib/mount-when-ready.test.ts
```

Expected: PASS (3 tests)

- [ ] **Step 5: Use it in `web/src/main.tsx`**

Add the import alongside the other `./lib` imports:

```tsx
import { mountWhenReady } from './lib/mount-when-ready';
```

Replace the `ReactDOM.createRoot(...)` call in the `else` branch with:

```tsx
  void mountWhenReady(
    () => router.load(),
    () =>
      ReactDOM.createRoot(document.getElementById('root')!).render(
        <React.StrictMode>
          <QueryClientProvider client={queryClient}>
            <RouterProvider router={router} />
          </QueryClientProvider>
        </React.StrictMode>,
      ),
  );
```

- [ ] **Step 6: Verify the suite and check the swap by eye**

```bash
pnpm -C web test && pnpm -C web build
```

Expected: PASS, build succeeds.

Then serve `web/dist` and load the home page with the network throttled to slow 4G in devtools. Expected: content is visible throughout — **no blank or black frame at any point**. This is the task's real acceptance criterion; the unit tests only cover the ordering rule.

- [ ] **Step 7: Commit**

```bash
git add web/src/lib/mount-when-ready.ts web/src/lib/mount-when-ready.test.ts web/src/main.tsx
git commit -m "fix(web): mount only once the router can render

createRoot fired before the route chunk existed, so React threw away the
prerendered markup and left an empty #root until that chunk evaluated —
about two seconds on the audited profile, and the blank-then-black frames
in the filmstrip.

A failed load still mounts: leaving prerendered markup up forever looks
fine and is completely inert."
```

---

## Task 4b: Prerender the Portuguese home page at all

Found while verifying Task 4, pre-existing and unrelated to any task in this plan.
`renderRoute('/', 'pt-BR')` returns **0 bytes**, so `dist/pt.html` and
`dist/pt/index.html` ship an empty `#root` — 24 bytes of markup against 27,855 for
the English home and 39,696 for `/pt/about`.

Reproduced twice: against the built prerender bundle, and from source with the
router driven directly.

The cause is an exact-string collision. `pathForLocale('/', 'pt-BR')` returns
`/pt`, which is also `basepathForLocale('pt-BR')`. TanStack Router strips the
basepath from the history entry, leaving `''`, which matches no route. Driving the
same router with `/pt/` instead renders 27,978 bytes. `web/plugins/aio.ts` already
notes that the router renders its own home link as `/pt/`; the prerender entry never
got the same treatment.

Why it matters here: this is the URL the original Lighthouse audit ran against, and
the one Portuguese visitors land on. Until it is fixed, Task 4 has no markup to keep
on screen there, so the central fix of this plan does nothing on that page.

**Files:**
- Modify: `web/src/entry-prerender.tsx`
- Modify: `web/src/entry-prerender.test.ts`
- Modify: `web/plugins/aio.ts`

**Interfaces:**
- Consumes: `pathForLocale`, `basepathForLocale` from `web/src/i18n/locale-url.ts`
- Produces: nothing other tasks read

- [ ] **Step 1: Write the failing test**

In `web/src/entry-prerender.test.ts`, the existing `it.each(ROUTES)` suite only ever
runs the `en` locale, which is why this shipped. Widen it to both. Replace the
`ROUTES` constant and that block with:

```ts
const CASES = (['en', 'pt-BR'] as const).flatMap((locale) =>
  buildPages(locale).map((page) => ({ locale, routePath: page.routePath })),
);
```

```ts
  it.each(CASES)('renders $routePath in $locale without touching the DOM', async ({ routePath, locale }) => {
    const html = await renderRoute(routePath, locale);

    expect(html.length).toBeGreaterThan(500);
    expect(html).toContain('pulse');
  });
```

Keep every other test in the file as it is.

- [ ] **Step 2: Run it to verify it fails**

```bash
pnpm -C web test src/entry-prerender.test.ts
```

Expected: FAIL on exactly one case — `/` in `pt-BR`, receiving 0 characters. Every
other case passes. If more than one fails, stop and report: the diagnosis is wrong.

- [ ] **Step 3: Fix the history entry**

In `web/src/entry-prerender.tsx`, `renderRoute` currently builds the router with
`initialEntries: [pathForLocale(routePath, locale)]`. Replace that with:

```tsx
  const basepath = basepathForLocale(locale);
  const path = pathForLocale(routePath, locale);
  /*
    A prefixed locale's home is the one case where the public path and the
    basepath are the same string (`/pt`). The router strips the basepath from
    the history entry, which would leave `''` — matching no route, rendering
    nothing, and shipping a document whose #root is empty. `/pt/` is the form
    the router itself produces for that link (see web/plugins/aio.ts).
  */
  const initialEntry = path === basepath ? `${path}/` : path;

  const router = createRouter({
    routeTree,
    basepath,
    history: createMemoryHistory({ initialEntries: [initialEntry] }),
  });
```

Add `basepathForLocale` to the existing import from `./i18n/locale-url` if it is not
already there.

- [ ] **Step 4: Run the test to verify it passes**

```bash
pnpm -C web test src/entry-prerender.test.ts
```

Expected: PASS, every locale/route case.

- [ ] **Step 5: Make the build refuse to ship an empty `#root`**

This failure was invisible for its whole life because an empty `#root` looks
completely normal in a browser — the SPA mounts over it — and is only wrong for the
crawlers that never run the bundle. `web/plugins/aio.ts` already treats a missing
prerender bundle as fatal for exactly this reason; extend that to the output.

In `writeBundle`, immediately after `const app = await renderRoute(...)`:

```ts
        if (app.length < 500) {
          // Same reasoning as loadPrerenderer's throw: a document with an empty
          // #root renders fine for every human and is worthless to every
          // crawler, so nothing downstream would ever surface this.
          throw new Error(
            `[pulse-aio] ${page.path} prerendered to ${app.length} characters — expected a full document. ` +
              `Check renderRoute() for this route/locale pair.`,
          );
        }
```

- [ ] **Step 6: Prove the guard would have caught the original bug**

Temporarily revert only the Step 3 change, run `pnpm -C web build`, and confirm the
build now FAILS naming `/pt`. Then restore the fix and confirm the build passes.
Record both outputs in your report. A guard that does not fire is not a guard.

- [ ] **Step 7: Verify the emitted documents**

```bash
pnpm -C web test && pnpm -C web build
python3 -c "
for f in ['web/dist/index.html','web/dist/pt.html','web/dist/pt/index.html']:
    h=open(f).read(); print(f, 'total=', len(h), 'h1=', h.count('<h1'))
"
```

Expected: all three well over 20,000 bytes with one `<h1>` each. Before this task
`pt.html` and `pt/index.html` were 8,657 bytes with zero.

- [ ] **Step 8: Commit**

```bash
git add web/src/entry-prerender.tsx web/src/entry-prerender.test.ts web/plugins/aio.ts
git commit -m "fix(web): prerender the Portuguese home page

renderRoute('/', 'pt-BR') returned nothing, so /pt and /pt/index.html
shipped an empty #root — 24 bytes against 27,855 for the English home.

pathForLocale('/', 'pt-BR') is '/pt', which is also the router basepath.
Stripping the basepath left '', which matches no route. '/pt/' is the form
the router produces for that link itself.

The prerender test only ever ran the English locale, which is why this
survived; it now runs both. The build also refuses to emit a document
whose #root is empty, since that failure is invisible in a browser and
only wrong for the crawlers the whole prerender step exists to serve."
```

---

## Task 5: Get the map geometry out of the route chunk

`use-visit-feed-*.js` is **431 KB raw / 140 KB gzip**, the largest chunk in the build, and it is not preloaded — it is discovered only after the entry evaluates. After Task 4 the swap waits on exactly this. Most of it is the 108 KB topojson and its decode.

Neither map puts that geometry in the prerendered document: `HeroMap` draws to a `<canvas>`, and `LiveMap` already skips the country paths under SSR by design (`live-map.tsx:57`). So the geometry contributes zero pixels to the first paint and can be deferred with no visual regression there.

`d3-geo` stays statically imported. It is needed to project the live visitor points, it is a fraction of the weight, and moving it too would mean threading async through both maps' render paths for little gain.

**Files:**
- Modify: `web/src/lib/world.ts`
- Create: `web/src/hooks/use-world.ts`
- Create: `web/src/hooks/use-world.test.ts`
- Modify: `web/src/components/live-map.tsx:1-20,54-60`
- Modify: `web/src/components/home/hero-map.tsx:5,49,162`

**Interfaces:**
- Consumes: nothing
- Produces:

```ts
// web/src/lib/world.ts
export type World = FeatureCollection<Geometry, { name: string }>;
export function loadWorld(): Promise<World>;
/** The decoded geometry if loadWorld() has already resolved, else undefined. */
export function worldIfLoaded(): World | undefined;

// web/src/hooks/use-world.ts
export function useWorld(): World | undefined;
```

- [ ] **Step 1: Write the failing test**

Create `web/src/hooks/use-world.test.ts`:

```ts
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
```

- [ ] **Step 2: Run it to verify it fails**

```bash
pnpm -C web test src/hooks/use-world.test.ts
```

Expected: FAIL — cannot resolve `./use-world`.

- [ ] **Step 3: Rewrite `web/src/lib/world.ts` as a lazy loader**

```ts
import type { FeatureCollection, Geometry } from 'geojson';
import type { Topology, GeometryCollection } from 'topojson-specification';

type CountryProperties = { name: string };
export type World = FeatureCollection<Geometry, CountryProperties>;

let cached: World | undefined;
let inFlight: Promise<World> | undefined;

/**
 * World landmasses as a GeoJSON FeatureCollection, decoded from the bundled
 * Natural Earth topojson.
 *
 * Dynamic on purpose. The topojson is 108 KB of JSON plus a decode, and a
 * static import put both into the route chunk — 431 KB raw, the largest in the
 * build, and the thing the mount now waits on (see mount-when-ready.ts).
 *
 * Nothing on the first paint needs it: HeroMap draws to a canvas, which
 * prerenders empty, and LiveMap deliberately omits the country paths from the
 * build-time render. The geometry is post-swap decoration, so it loads like
 * decoration.
 */
export async function loadWorld(): Promise<World> {
  if (cached) return cached;
  // Concurrent callers (both maps mount together on the home page) share one
  // fetch and one decode rather than racing to do it twice.
  inFlight ??= (async () => {
    const [{ feature }, { default: topology }] = await Promise.all([
      import('topojson-client'),
      import('@/assets/countries-110m.json'),
    ]);
    const typed = topology as unknown as Topology<{
      countries: GeometryCollection<CountryProperties>;
    }>;
    cached = feature(typed, typed.objects.countries) as World;
    return cached;
  })();
  return inFlight;
}

/** The geometry if `loadWorld()` has already resolved — for sync render paths. */
export function worldIfLoaded(): World | undefined {
  return cached;
}
```

- [ ] **Step 4: Write `web/src/hooks/use-world.ts`**

```ts
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
```

- [ ] **Step 5: Run the test to verify it passes**

```bash
pnpm -C web test src/hooks/use-world.test.ts
```

Expected: PASS (3 tests)

- [ ] **Step 6: Move `live-map.tsx` onto the hook**

Replace `import { world } from '@/lib/world';` with `import { useWorld } from '@/hooks/use-world';`, and delete the two module-scope lines:

```ts
const projection = geoNaturalEarth1().fitSize([WIDTH, HEIGHT], world);
const path = geoPath(projection);
```

Inside `LiveMap`, after `const points = data ?? EMPTY_POINTS;`:

```ts
  const world = useWorld();
  /*
    Undefined until the geometry lands. Do NOT substitute an empty
    FeatureCollection to keep this non-null: `fitSize` derives its scale from
    the object's bounds, and empty bounds give an Infinity scale, so every
    `projection([lon, lat])` call downstream returns NaN and the pings render
    at NaN coordinates rather than not rendering.
  */
  const projected = useMemo(() => {
    if (!world) return undefined;
    const projection = geoNaturalEarth1().fitSize([WIDTH, HEIGHT], world);
    return { projection, path: geoPath(projection) };
  }, [world]);
```

Change the country-paths expression from `(import.meta.env.SSR ? [] : world.features)` to:

```tsx
            {(projected ? world!.features : []).map((geo) => {
```

and read `path` from `projected` inside that callback (`projected.path(geo)`).

The SSR check is no longer needed: during the build-time render effects never run, so `world` is `undefined` and the paths are skipped for exactly the same reason as before.

Guard the pings block the same way — `{(projected ? pings : []).map(...)}`, reading `projected.projection` inside — so no marker is ever placed from a projection that has no geometry to fit to. The pings are live data, so they now appear a moment later than they used to; that is the same moment the countries appear, and the map is decoration around the numbers either way.

In the dev-only unmatched-country effect, guard on the geometry:

```ts
    if (!import.meta.env.DEV || !world) return;
```

and add `world` to that effect's dependency array.

- [ ] **Step 7: Move `hero-map.tsx` onto the hook**

Replace `import { world } from '@/lib/world';` with `import { useWorld } from '@/hooks/use-world';`.

`buildProjection` (line 49) and `drawFrame` (line 162) both close over `world`, so thread it through as a parameter rather than reading a module binding — change their signatures to take `world: World` as the first argument and pass it at the call sites. Add `import type { World } from '@/lib/world';`.

Inside `HeroMap`, add `const world = useWorld();` alongside the other hooks, and make the drawing effect bail until it arrives:

```ts
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !world) return;
```

Add `world` to that effect's dependency array. The canvas simply stays empty until the geometry lands — which is what it does today for the first two seconds anyway.

- [ ] **Step 8: Verify the suite, the build, and the payoff**

```bash
pnpm -C web test && pnpm -C web build && ls -la web/dist/assets/*.js | awk '{print $5, $9}' | sort -rn | head -6
```

Expected: tests PASS. `use-visit-feed-*.js` is dramatically smaller than its 431 KB baseline, and a new chunk holds the topojson. Record both numbers for Task 10.

- [ ] **Step 9: Confirm the prerendered documents are unchanged in substance**

```bash
grep -c '<canvas' web/dist/index.html
grep -o 'aio:app' web/dist/index.html || echo "marker filled, good"
```

Expected: the canvas is present and the marker is gone — the build-time render still produces the same document it did before.

- [ ] **Step 10: Commit**

```bash
git add web/src/lib/world.ts web/src/hooks/use-world.ts web/src/hooks/use-world.test.ts \
       web/src/components/live-map.tsx web/src/components/home/hero-map.tsx
git commit -m "perf(web): load the map geometry off the critical path

The 108 KB topojson and its decode sat in a statically-imported module,
which put them in the route chunk: 431 KB raw, the largest in the build,
not preloaded, and — after the previous commit — the thing the mount
waits on.

Nothing on the first paint needs it. HeroMap draws to a canvas, which
prerenders empty, and LiveMap already omitted the country paths from the
build-time render. So it loads like the decoration it is."
```

---

## Task 6: Load SignalR on demand

`@microsoft/signalr` sits in `ask-widget-store-*.js` (100 KB raw / 29 KB gzip), which the home document preloads. Nothing before the swap needs a WebSocket.

**Files:**
- Modify: `web/src/realtime/hub.ts`
- Modify: `web/src/realtime/use-pulse-hub.tsx:32-80`

**Interfaces:**
- Consumes: nothing
- Produces: `export function buildHub(): Promise<HubConnection>` — **now async**, changed from the synchronous `buildHub()`

- [ ] **Step 1: Check for existing coverage before changing the shape**

```bash
ls web/src/realtime/ && pnpm -C web test src/realtime
```

Record which tests exist and that they pass. They must still pass at step 5.

- [ ] **Step 2: Make `hub.ts` load the client dynamically**

```ts
import type { HubConnection } from '@microsoft/signalr';

/**
 * Builds the presence hub connection, loading the SignalR client on demand.
 *
 * `import type` is erased at compile time, so the 100 KB client is no longer
 * in the entry graph — nothing before the first interaction needs a WebSocket,
 * and the home document was preloading it on every visit.
 */
export const buildHub = async (): Promise<HubConnection> => {
  const { HubConnectionBuilder } = await import('@microsoft/signalr');
  return new HubConnectionBuilder().withUrl('/hub/presence').withAutomaticReconnect().build();
};
```

- [ ] **Step 3: Make the provider's effect tolerate an async build**

In `web/src/realtime/use-pulse-hub.tsx`, the effect body becomes:

```tsx
  useEffect(() => {
    let cancelled = false;
    let hub: HubConnection | undefined;
    let retryTimeout: ReturnType<typeof setTimeout> | undefined;
    let heartbeat: ReturnType<typeof setInterval> | undefined;

    void buildHub().then((built) => {
      // The effect can be cleaned up (unmount, StrictMode double-invoke)
      // while the client is still loading — without this the late arrival
      // would wire up handlers and a heartbeat nobody ever tears down.
      if (cancelled) return;
      hub = built;
      connectionRef.current = built;

      const onPresenceUpdated = (n: number) => setCount(n);
      const onReactionReceived = (reaction: Reaction) => {
        useEventStore.getState().push({ kind: 'reaction', emoji: reaction.emoji, at: reaction.at });
      };

      built.on('PresenceUpdated', onPresenceUpdated);
      built.on('ReactionReceived', onReactionReceived);
      built.onreconnecting(() => setConnection('reconnecting'));
      built.onreconnected(() => setConnection('connected'));
      built.onclose(() => setConnection('offline'));

      const attemptStart = () => {
        built
          .start()
          .then(() => {
            if (!cancelled) setConnection('connected');
          })
          .catch(() => {
            if (cancelled) return;
            setConnection('offline');
            retryTimeout = setTimeout(attemptStart, START_RETRY_MS);
          });
      };
      attemptStart();

      heartbeat = setInterval(() => {
        built.invoke('Heartbeat').catch(() => {});
      }, HEARTBEAT_INTERVAL_MS);
    });

    return () => {
      cancelled = true;
      if (retryTimeout) clearTimeout(retryTimeout);
      if (heartbeat) clearInterval(heartbeat);
      void hub?.stop();
      connectionRef.current = null;
    };
  }, []);
```

Keep the surrounding cleanup semantics identical to what the file already does — read the existing teardown (from line 80) and preserve every step of it inside the new `return`.

- [ ] **Step 4: Fix any remaining `buildHub()` call sites**

```bash
grep -rn "buildHub" web/src
```

Every call site must now await. Update any the grep finds beyond the provider.

- [ ] **Step 5: Verify**

```bash
pnpm -C web test && pnpm -C web exec tsc --noEmit && pnpm -C web build \
  && grep -l "HubConnectionBuilder" web/dist/assets/*.js
```

Expected: tests PASS, typecheck clean, and SignalR now lives in its own chunk rather than `ask-widget-store-*.js`. Confirm the home document no longer preloads it:

```bash
grep -o 'href="/assets/[^"]*"' web/dist/index.html
```

- [ ] **Step 6: Commit**

```bash
git add web/src/realtime/hub.ts web/src/realtime/use-pulse-hub.tsx
git commit -m "perf(web): load the SignalR client on demand

@microsoft/signalr sat in a chunk the home document preloaded, ~100 KB
for a WebSocket nothing needs before the swap. import type is erased, so
only the dynamic import remains in the graph."
```

---

## Task 7: Load the Ask panel when it opens

`AskWidget` lives in `__root.tsx`, so every page pays for it, but it renders a `Sheet` that is closed by default. Its graph is `ask-widget-store` (100 KB) plus the content modules it answers from — `projects` (58 KB), `profile` (15 KB), `faq` (9.5 KB).

**Files:**
- Modify: `web/src/routes/__root.tsx`

**Interfaces:**
- Consumes: nothing
- Produces: nothing other tasks read

- [ ] **Step 1: Confirm the trigger is separable from the panel**

```bash
sed -n '1,140p' web/src/components/ask/ask-widget.tsx
```

Read how the `Sheet` trigger and content are structured, and how `useAskWidgetStore`'s open state is set (the "ask chips" on the home page open it too — `hero-ask-integration.test.tsx` covers that path). The trigger and the store must stay eager; only the panel body and `streamAsk` may become lazy. If the current structure does not allow that split, stop and report rather than reshaping the component blind.

- [ ] **Step 2: Make the widget lazy in `web/src/routes/__root.tsx`**

```tsx
import { Suspense, lazy } from 'react';

/*
  The panel is a Sheet that starts closed, but it sat in the root layout —
  so every page loaded its store, plus the projects, profile and FAQ content
  it answers from, before anyone asked anything. Lazy here rather than inside
  the component because the import graph is what costs, not the render.
*/
const AskWidget = lazy(() =>
  import('@/components/ask/ask-widget').then((m) => ({ default: m.AskWidget })),
);
```

and wrap the usage:

```tsx
        <Suspense fallback={null}>
          <AskWidget />
        </Suspense>
```

`fallback={null}` is correct here and does **not** risk layout shift: the widget is a fixed-position overlay, so it occupies no space in the document flow.

- [ ] **Step 3: Verify nothing that depended on it regressed**

```bash
pnpm -C web test && pnpm -C web exec tsc --noEmit
```

Expected: PASS — including `src/components/home/hero-ask-integration.test.tsx`, which exercises the chips-open-the-widget path. If it fails, the trigger is entangled with the panel and step 1's split was wrong; report rather than loosening the test.

- [ ] **Step 4: Confirm the home graph shrank**

```bash
pnpm -C web build && grep -o 'href="/assets/[^"]*"' web/dist/index.html
```

Expected: `ask-widget-store-*`, `projects-*`, `profile-*` and `faq-*` are gone from the home document's preload list.

- [ ] **Step 5: Verify the widget still works in a browser**

Serve `web/dist`, open the home page, click the ask trigger. Expected: the panel opens (after a brief chunk fetch) and streams a reply. Then open it via a home-page ask chip. Expected: same.

- [ ] **Step 6: Commit**

```bash
git add web/src/routes/__root.tsx
git commit -m "perf(web): load the Ask panel when it opens

It renders a Sheet that starts closed, but living in the root layout meant
every page loaded its store and the projects, profile and FAQ content it
answers from — before anyone asked anything."
```

---

## Task 7b: Stop the whole content corpus loading for a title

Found during Task 7's review, and it is the larger half of what that task was
supposed to remove. Task 7's brief wrongly attributed `projects-*` (58 KB),
`profile-*` (15 KB) and `faq-*` (9.5 KB) to `AskWidget`. They come from
`useRouteHead()`, called unconditionally in `web/src/routes/__root.tsx`, which
reaches `pageForPath()` in `web/src/lib/aio/pages.ts` — a module that statically
imports `faq`, `profile` and `projects` and whose `buildPages()` constructs the
full `AioPage` model for **every route in both locales**.

All of that, on every page, to retitle the document. And the served document
already carries its own correct `<title>` from the AIO build step, so none of it
is needed on first load — only on a client-side navigation, which by definition
happens after the visitor is already looking at a rendered page.

**Files:**
- Modify: `web/src/lib/aio/use-route-head.ts`
- Modify: `web/src/lib/aio/use-route-head.test.tsx`

**Interfaces:**
- Consumes: `pageForPath` from `web/src/lib/aio/pages.ts`
- Produces: nothing other tasks read

- [ ] **Step 1: Establish what the hook actually guarantees**

```bash
cat web/src/lib/aio/use-route-head.ts && cat web/src/lib/aio/use-route-head.test.tsx
```

Read both fully before changing anything. Note in your report: what the hook sets
(title, description, canonical, anything else), whether it runs on first mount or
only on pathname change, and what its tests currently pin. The rest of this task
depends on the answer to one question — **is the first-mount write redundant with
what the served document already contains?** State your finding explicitly.

- [ ] **Step 2: Write the failing test**

Add to `web/src/lib/aio/use-route-head.test.tsx`:

```tsx
  it('does not pull the page model into the initial render', async () => {
    // The served document already carries this route's title from the AIO
    // build step, so nothing about the first paint needs the page model —
    // and reaching for it statically drags faq, profile and projects (~82 KB)
    // onto every page in the site.
    const modules = await import('./use-route-head');
    const source = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), 'use-route-head.ts'),
      'utf-8',
    );

    expect(modules).toBeDefined();
    expect(source).not.toMatch(/^import .*\bfrom '\.\/pages'/m);
    expect(source).toMatch(/await import\('\.\/pages'\)/);
  });
```

Add the Node imports this needs at the top of the file, following the pattern in
`web/src/favicon.test.ts`:

```ts
/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
```

- [ ] **Step 3: Run it to verify it fails**

```bash
pnpm -C web test src/lib/aio/use-route-head.test.tsx
```

Expected: FAIL — `pages` is currently a static import.

- [ ] **Step 4: Make the page model load on demand**

Convert the static `import { pageForPath } from './pages'` into a dynamic
`await import('./pages')` inside the hook's effect. The effect is already
asynchronous in nature (it writes to `document` after render), so this does not
change when the title lands in any way a visitor can perceive — the document
already shows the right title before the hook runs at all.

Guard against the usual async-effect hazard: if the pathname changes again while
the import is in flight, the late resolution must not write a stale title. Use a
`cancelled` flag in the effect's cleanup, the same shape as
`web/src/hooks/use-world.ts`.

- [ ] **Step 5: Run the tests to verify they pass**

```bash
pnpm -C web test src/lib/aio/use-route-head.test.tsx
```

Expected: PASS, including every pre-existing test in that file. If a pre-existing
test now fails because the title write became asynchronous, wrap its assertion in
`waitFor` rather than weakening it — and say so explicitly in your report.

- [ ] **Step 6: Confirm the content modules left the home graph**

```bash
pnpm -C web test && pnpm -C web build && grep -o 'href="/assets/[^"]*"' web/dist/index.html
```

Expected: `projects-*`, `profile-*` and `faq-*` are gone from the home document's
preload list. Report the entry chunk's size before and after.

- [ ] **Step 7: Confirm the served titles are untouched**

```bash
grep -o '<title>[^<]*</title>' web/dist/index.html web/dist/pt.html web/dist/about.html
```

Expected: each document still carries its own correct, localized title. This task
must not change what the AIO build step emits — only what the client loads to
maintain it afterwards.

- [ ] **Step 8: Commit**

```bash
git add web/src/lib/aio/use-route-head.ts web/src/lib/aio/use-route-head.test.tsx
git commit -m "perf(web): load the page model only when retitling needs it

useRouteHead() runs on every page and reached pageForPath() through a
static import, so pages.ts built the AioPage model for every route in
both locales — dragging faq, profile and projects onto every page in the
site, ~82 KB, to set a title.

The served document already carries its own title from the AIO build
step. Only a client-side navigation needs this, and that happens with a
rendered page already on screen."
```

---

## Task 8: Inline the stylesheet

56 KB raw / 9.9 KB gzip of render-blocking CSS costing 450ms, which on slow 4G is a round trip rather than parse time. The documents are already assembled at build time and already served `no-cache`, so inlining costs no cacheability.

**Files:**
- Modify: `web/src/lib/aio/render.ts`
- Modify: `web/plugins/aio.ts`
- Modify: `web/src/document.test.ts`

**Interfaces:**
- Consumes: `renderDocument` from Task 3
- Produces: `DocumentOptions` gains `css?: string`

- [ ] **Step 1: Replace the ordering test this task makes obsolete**

Task 3's review found that `document.test.ts`'s "runs the theme script before any
stylesheet" assertion never executes: it reads the source `index.html`, where Vite
has not yet injected the stylesheet link, so its `if (stylesheet !== -1)` guard is
always false. This task removes the blocking `<link>` altogether, which retires the
property that test was reaching for and replaces it with a stronger one.

Delete that `it(...)` block and put this in its place, inside the same
`describe('theme resolution before first paint', ...)`:

```ts
  it('runs the theme script before the inlined styles', () => {
    // Synthesised, because the source index.html has no stylesheet link — Vite
    // injects one at build time and this task then inlines it. Reading the
    // source file directly is what made the previous version of this test
    // assert nothing.
    const withLink = template.replace(
      '<!--aio:head-->',
      '<link rel="stylesheet" crossorigin href="/assets/index-abc.css">',
    );
    const html = renderDocument({
      template: withLink,
      page: home,
      head: '',
      app: '',
      css: '.x{color:red}',
    });

    expect(html.indexOf('pulse-theme')).toBeLessThan(html.indexOf('<style>'));
  });
```

- [ ] **Step 2: Write the failing test**

Append to `web/src/document.test.ts`:

```ts
describe('inlined stylesheet', () => {
  it('inlines the css and drops the blocking link', () => {
    const withLink = template.replace(
      '<!--aio:head-->',
      '<link rel="stylesheet" crossorigin href="/assets/index-abc.css">',
    );
    const html = renderDocument({
      template: withLink,
      page: home,
      head: '',
      app: '',
      css: '.x{color:red}',
    });

    expect(html).toContain('<style>.x{color:red}</style>');
    expect(html).not.toContain('rel="stylesheet"');
  });

  it('leaves the document alone when no css is passed', () => {
    const withLink = template.replace(
      '<!--aio:head-->',
      '<link rel="stylesheet" crossorigin href="/assets/index-abc.css">',
    );
    expect(renderDocument({ template: withLink, page: home, head: '', app: '' })).toContain(
      'rel="stylesheet"',
    );
  });

  it('escapes a closing style tag in the css so it cannot break out', () => {
    const html = renderDocument({
      template,
      page: home,
      head: '',
      app: '',
      css: 'a{content:"</style><script>x</script>"}',
    });
    expect(html).not.toContain('<script>x</script>');
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

```bash
pnpm -C web test src/document.test.ts
```

Expected: FAIL — `css` is not part of `DocumentOptions`.

- [ ] **Step 3: Extend `renderDocument`**

Add to `DocumentOptions`:

```ts
  /**
   * Built stylesheet source. Inlined into a <style> and the blocking <link>
   * removed — 450ms of round trip on the audited profile, for 10 KB gzipped
   * that these documents cannot cache anyway (they are served no-cache, since
   * each embeds the hashed asset names).
   */
  css?: string;
```

and in the body, after the marker check:

```ts
  let html = template
    .replace('<html lang="en">', `<html lang="${page.locale}" class="dark">`)
    .replace(HEAD_MARKER, head)
    .replace(APP_MARKER, app);

  if (css) {
    // `</style>` inside a string literal in the CSS would close the tag early
    // and hand the rest of the sheet to the HTML parser — the stylesheet
    // equivalent of the JSON-LD escape in serialiseJsonLd above.
    const safe = css.replace(/<\/style/gi, '<\\/style');
    html = html
      .replace(/<link[^>]+rel="stylesheet"[^>]*>/g, '')
      .replace('</head>', `<style>${safe}</style></head>`);
  }

  return html;
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
pnpm -C web test src/document.test.ts
```

Expected: PASS

- [ ] **Step 5: Pass the built CSS from the plugin**

In `web/plugins/aio.ts`'s `writeBundle`, the hook signature already receives `outputOptions`; add the second parameter to read the bundle:

```ts
    async writeBundle(outputOptions, bundle) {
```

After the template is read, find the emitted stylesheet:

```ts
      // The one stylesheet Vite emitted for the client build. Read from the
      // bundle rather than globbed off disk so it always matches this build's
      // hash.
      const cssFile = Object.keys(bundle).find((name) => name.endsWith('.css'));
      const css = cssFile ? readFileSync(join(outDir, cssFile), 'utf8') : undefined;
```

and pass it into the `renderDocument` call:

```ts
        const html = renderDocument({
          template,
          page,
          head: renderHead(page, base, site.name, profile.name),
          app,
          css,
        });
```

- [ ] **Step 6: Verify against a real build**

```bash
pnpm -C web test && pnpm -C web build \
  && grep -c '<style>' web/dist/index.html \
  && grep -c 'rel="stylesheet"' web/dist/index.html || echo "no blocking stylesheet, good"
```

Expected: one `<style>` block, zero `rel="stylesheet"` links.

- [ ] **Step 7: Confirm the page still looks right**

Serve `web/dist` and load the home page and `/about`. Expected: fully styled, indistinguishable from before, and no flash of unstyled content.

- [ ] **Step 8: Commit**

```bash
git add web/src/lib/aio/render.ts web/plugins/aio.ts web/src/document.test.ts
git commit -m "perf(web): inline the stylesheet into every emitted document

450ms of render-blocking round trip for 10 KB gzipped, on documents that
are served no-cache anyway — they each embed the hashed asset names, so
there was no cacheability to lose."
```

---

## Task 9: Preload the route's own chunk

Vite emits `modulepreload` for the entry's static graph — 12 tags, already correct. It cannot emit one for the route component's chunk, because that is a dynamic import reached only once the entry evaluates. After Task 4 the mount waits on exactly that chunk, so it is discovered a full round trip later than it needs to be.

Do this task **after** Task 5, so the chunk being preloaded is the shrunken one.

**Files:**
- Modify: `web/src/lib/aio/render.ts`
- Modify: `web/plugins/aio.ts`
- Modify: `web/src/document.test.ts`

**Interfaces:**
- Consumes: `renderDocument` from Tasks 3 and 8
- Produces: `DocumentOptions` gains `modulePreloads?: string[]`

- [ ] **Step 1: Write the failing test**

Append to `web/src/document.test.ts`:

```ts
describe('route chunk preload', () => {
  it('emits a modulepreload for each extra chunk', () => {
    const html = renderDocument({
      template,
      page: home,
      head: '',
      app: '',
      modulePreloads: ['/assets/index-abc.js'],
    });
    expect(html).toContain('<link rel="modulepreload" crossorigin href="/assets/index-abc.js">');
  });

  it('adds nothing when there is nothing to preload', () => {
    const html = renderDocument({ template, page: home, head: '', app: '', modulePreloads: [] });
    expect(html).not.toContain('rel="modulepreload"');
  });

  it('escapes the href so a filename can never break out of the attribute', () => {
    const html = renderDocument({
      template,
      page: home,
      head: '',
      app: '',
      modulePreloads: ['/assets/a".js'],
    });
    expect(html).toContain('&quot;');
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

```bash
pnpm -C web test src/document.test.ts
```

Expected: FAIL — `modulePreloads` is not part of `DocumentOptions`.

- [ ] **Step 3: Extend `renderDocument`**

Add to `DocumentOptions`:

```ts
  /**
   * Extra chunks to preload, on top of the entry graph Vite already emits.
   * Specifically the route component's own chunk: it is a dynamic import, so
   * Vite cannot know to preload it, and the mount now waits on it (see
   * mount-when-ready.ts) — without this it is discovered a round trip late.
   */
  modulePreloads?: string[];
```

and in the body, before the `css` block:

```ts
  if (modulePreloads?.length) {
    const tags = modulePreloads
      .map((href) => `<link rel="modulepreload" crossorigin href="${escapeHtml(href)}">`)
      .join('\n    ');
    html = html.replace('</head>', `${tags}</head>`);
  }
```

`escapeHtml` is already exported from this file.

- [ ] **Step 4: Run the test to verify it passes**

```bash
pnpm -C web test src/document.test.ts
```

Expected: PASS

- [ ] **Step 5: Resolve each route's chunk in the plugin**

In `writeBundle`, using the `bundle` parameter added in Task 8:

```ts
      /**
       * The chunk holding a route's component.
       *
       * The route path is NOT the route filename: `/projects/pulse` is served
       * by `routes/projects_.$slug.tsx`, and deriving one from the other by
       * string surgery gets that case wrong and silently emits no preload.
       * The mapping is small and explicit instead.
       */
      const ROUTE_FILES: Record<string, string> = {
        '/': 'routes/index',
        '/about': 'routes/about',
        '/projects': 'routes/projects',
        '/live': 'routes/live',
      };

      const chunkForRoute = (routePath: string): string | undefined => {
        // Every /projects/<slug> shares one dynamic route file.
        const routeFile = routePath.startsWith('/projects/')
          ? 'routes/projects_.$slug'
          : ROUTE_FILES[routePath];
        if (!routeFile) return undefined;

        for (const [fileName, chunk] of Object.entries(bundle)) {
          if (chunk.type !== 'chunk') continue;
          // facadeModuleId, not the chunk name — rolldown prefixes and dedupes
          // names, but the facade points at the real source module.
          if (chunk.facadeModuleId?.includes(routeFile)) return `/${fileName}`;
        }
        return undefined;
      };
```

If `buildAllPages()` yields a route path not in `ROUTE_FILES` and not under `/projects/`, `chunkForRoute` returns `undefined` and that document simply gets no extra preload — correct, not silent breakage. Step 6 checks the mapping actually resolves.

and in the page loop:

```ts
        const routeChunk = chunkForRoute(page.routePath);
        const html = renderDocument({
          template,
          page,
          head: renderHead(page, base, site.name, profile.name),
          app,
          css,
          modulePreloads: routeChunk ? [routeChunk] : [],
        });
```

- [ ] **Step 6: Verify it resolves real chunks, not nothing**

```bash
pnpm -C web build && grep -o 'rel="modulepreload"[^>]*' web/dist/index.html | tail -3
grep -o 'rel="modulepreload"[^>]*' web/dist/about.html | tail -3
```

Expected: the home document preloads a different chunk from `about.html`. **If both show the same chunk, or neither shows an extra one, the matcher is wrong** — fix it rather than committing a no-op. Cross-check against the real chunk names:

```bash
ls web/dist/assets/*.js
```

- [ ] **Step 7: Commit**

```bash
git add web/src/lib/aio/render.ts web/plugins/aio.ts web/src/document.test.ts
git commit -m "perf(web): preload each document's own route chunk

Vite preloads the entry's static graph but cannot see the route component,
which is a dynamic import — and since the mount now waits on it, it was
being discovered a full round trip late."
```

---

## Task 10: Compress the project screenshots

`web/public/screenshots/` holds ~1.6 MB of raw PNG. On a project detail page the screenshot is above the fold and is therefore the LCP element — invisible to the original audit, which ran against `/pt/`.

| File | Now |
|---|---|
| `dietbox.png` | 856 KB |
| `pulse.png` | 272 KB |
| `ulbra-atende.png` | 240 KB |
| `kota.png` | 156 KB |
| `dell-automated-caller.png` | 32 KB |
| `ulbra-one.png` | 32 KB |

**Files:**
- Create: `web/public/screenshots/*.webp`
- Delete: `web/public/screenshots/*.png`
- Modify: `web/src/content/projects.ts:149,317,549,800,1030,1077`
- Modify: `deploy/Caddyfile` (extend the `@public` matcher)

**Interfaces:**
- Consumes: nothing
- Produces: nothing other tasks read

- [ ] **Step 1: Convert**

```bash
cd web/public/screenshots && for f in *.png; do cwebp -q 82 "$f" -o "${f%.png}.webp"; done && ls -la
```

If `cwebp` is unavailable, install it (`brew install webp`). Do not substitute a lossless converter — the point is the size reduction.

- [ ] **Step 2: Check the result is worth it and still looks right**

```bash
du -ch web/public/screenshots/*.webp | tail -1
```

Expected: well under 400 KB total. Open two or three `.webp` files and compare against the PNGs by eye — these are UI screenshots, so text must stay legible. If any looks degraded, re-encode that one at `-q 90` rather than accepting it.

- [ ] **Step 3: Point the content at them and remove the PNGs**

In `web/src/content/projects.ts`, change all six `screenshot:` values from `.png` to `.webp`. Then:

```bash
rm web/public/screenshots/*.png
grep -rn "screenshots/.*\.png" web/src web/plugins || echo "no stale png references"
```

Expected: `no stale png references`.

- [ ] **Step 4: Extend the Caddy matcher**

In `deploy/Caddyfile`, the `@public` and `@documents` matchers list `/screenshots/*`, which already covers `.webp`. Confirm no rule names `.png` explicitly:

```bash
grep -n "png" deploy/Caddyfile
```

Expected: only `/apple-touch-icon.png` and `/og.png`, which are unaffected.

- [ ] **Step 5: Verify**

```bash
pnpm -C web test && pnpm -C web build \
  && grep -o 'screenshots/[^"]*' web/dist/projects/pulse.html | head -3
```

Expected: tests PASS and the emitted document references `.webp`. Then serve `web/dist`, open `/projects` and one detail page, and confirm every screenshot renders.

- [ ] **Step 6: Commit**

```bash
git add web/public/screenshots web/src/content/projects.ts
git commit -m "perf(web): ship the project screenshots as webp

~1.6 MB of raw PNG, with dietbox.png alone at 856 KB. On a project detail
page the screenshot is above the fold and is the LCP element — which the
original audit missed by running against the home page."
```

---

## Task 11: Verify against the baseline

**Files:**
- Modify: `docs/superpowers/specs/2026-08-17-site-seo-optimization-design.md` (record the result)

**Interfaces:**
- Consumes: the baseline from Task 1
- Produces: the measured outcome

- [ ] **Step 1: Build and run the full stack**

```bash
pnpm -C web test && pnpm -C web exec tsc --noEmit && pnpm -C web lint \
  && docker build -f deploy/Dockerfile.web -t pulse-web . \
  && docker run -d --rm -p 8080:80 --name pulse-web-verify pulse-web \
  && sleep 2 && deploy/cache-headers.test.sh
```

Expected: everything PASSES.

- [ ] **Step 2: Re-run Lighthouse on both pages**

Same profile as Task 1 (Moto G Power emulated, slow 4G), against `/pt/` and the same project detail page, **with Clarity in the same state as the baseline run** (spec 1.9).

- [ ] **Step 3: Check each acceptance criterion**

Record actual against target:

| Metric | Baseline | Target | Actual |
|---|---|---|---|
| LCP | 2.9s | < 2.5s | |
| TBT | 100ms | ≤ 100ms | |
| CLS | 0.003 | < 0.1 | |
| Speed Index | 3.9s | improved | |
| Blank frames in filmstrip | yes | **none** | |

The filmstrip row is the one that cannot be traded away — it is the bug the user reported.

- [ ] **Step 4: Watch for the one regression this plan can cause**

Load the home page on a throttled connection and watch the moment the app mounts. Expected: no visible jump when the prerendered markup is replaced. If content shifts or flickers at the swap, that is spec section 1.3's risk having materialised — report it rather than accepting it, since it is worse than the original bug.

- [ ] **Step 5: Record the outcome and clean up**

```bash
docker stop pulse-web-verify
```

Add a "Result" section to the spec with the table from step 3, then:

```bash
git add docs/superpowers/specs/2026-08-17-site-seo-optimization-design.md
git commit -m "docs: record the measured result of the first-paint work"
```

---

## Self-Review

**Spec coverage**

| Spec section | Task |
|---|---|
| 1.1 Mount only when the app can render | 4 |
| 1.2 Resolve the theme before the first paint | 3 |
| 1.3 Keep the swap invisible | 4 (step 6), 11 (step 4) |
| 1.4 Cache headers | 2 |
| 1.5 Take weight off the critical path | 5, 6, 7 |
| 1.6 Inline the critical CSS | 8 |
| 1.7 Preload the entry and route chunks | 9 |
| 1.8 Compress the project screenshots | 10 |
| 1.9 Clarity landing in parallel | Global Constraints; 11 step 2 |
| Verification and acceptance criteria | 1 (step 4), 11 |

**Gaps found and closed**

- Spec 1.3 named a test extension to `entry-prerender.test` that no task delivered. That test asserts the build-time render survives without `window`, which is not the same property as the two renders agreeing visually — and a unit test cannot honestly assert the latter without a browser. Verification is where it belongs, so it is now Task 4 step 6 and Task 11 step 4, both explicit and both blocking. The spec's wording overstated what a unit test could give.
- Spec 1.5 lists `recharts` as a target. Measurement showed it is already `/live`-only, so no task implements it; the "Deliberately not done" section records this with evidence so it is not re-added.
- Spec 1.7 implies emitting the entry preloads; Vite already does. Task 9 is narrowed to the one tag Vite cannot emit, and says so.
- The `AskWidget` (Task 7) is not in the spec at all — it surfaced from the bundle inventory. It is the second-largest win in this plan.

**Type consistency**

`renderDocument` takes one options object across Tasks 3, 8 and 9, with `css` and `modulePreloads` optional and added in place — no call site changes shape between tasks. `buildHub` changes from sync to `Promise<HubConnection>` in Task 6, with step 4 dedicated to catching every call site. `loadWorld` / `worldIfLoaded` / `useWorld` are named identically in the Interfaces block and in the code of Task 5.

**Placeholders:** none. Every code step carries the real content.
