# Hero Scroll Cue Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fill the dead gap at the foot of the home hero with a clickable "Scroll" cue — a label over a fading vertical rule — so the clipped sliver of the next section reads as an invitation instead of a rendering accident.

**Architecture:** One new presentational component, `ScrollCue`, absolutely positioned at the bottom of the hero's existing `relative isolate` section. It owns three behaviours: smooth-scroll to the next section on click, fade out once the page is scrolled, and freeze its travelling-segment animation under `prefers-reduced-motion`. The animation itself is a `@keyframes` rule in `styles.css` applied inline, matching how `ArchitectureDiagram` and `HelpDiagram` already use `signal-edge`.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4 (`styles.css`), `react-i18next`, Vitest + `@testing-library/react` (jsdom).

## Global Constraints

- Working directory for every command is `web/` (the Vite app). All paths below are relative to the repo root; `cd web` before running `pnpm test`.
- Test runner: `pnpm test` runs `vitest run`. Target a single file with `pnpm test src/components/home/scroll-cue.test.tsx`.
- Lint: `pnpm lint` runs `oxlint`. Must pass before each commit.
- Colours come from theme tokens only — `text-muted-foreground`, `text-signal-strong`, `bg-signal`, `border`. Never a hardcoded hex.
- Reduced motion uses the existing `useReducedMotion` hook from `@/hooks/use-reduced-motion` and is reported through a `data-motion` attribute valued `"static"` or `"animated"` — the convention `Pill`, `StatusPill`, and `ArchitectureDiagram` already follow.
- Class strings are composed with `cn` from `@/lib/utils`.
- User-visible copy goes through `react-i18next` (`useTranslation('home')`), never inline strings.
- The app is prerendered (`src/entry-prerender.tsx`), so `window` and `document` may only be touched inside `useEffect` or event handlers — never during render.
- Commit message subject lines are lowercase, conventional-commit prefixed, and describe the behaviour (`feat(web): …`), matching recent history.

---

### Task 1: The `scroll-cue` keyframes

**Files:**
- Modify: `web/src/styles.css` (append after the `signal-edge` keyframes block, which ends around line 190)

**Interfaces:**
- Consumes: nothing.
- Produces: a global CSS animation named `scroll-cue`. It translates an element from `translateY(-100%)` to `translateY(300%)` while fading in at 15% and out after 85%. Sized for a 16px-tall segment travelling the full height of a 48px rule (`-16px` → `+48px`).

- [ ] **Step 1: Add the keyframes**

Append to `web/src/styles.css`, directly after the closing brace of the `@keyframes signal-edge` block:

```css
/* The travelling segment inside the hero's scroll cue: a 16px sliver that
   runs the full height of the 48px rule, fading in as it enters and out as
   it leaves. `translateY(300%)` is 48px for a 16px-tall segment — the exact
   height of the rule, so it clears the bottom rather than stopping short.
   Frozen under `prefers-reduced-motion` by ScrollCue, which simply omits the
   `animation` property. */
@keyframes scroll-cue {
  0% {
    transform: translateY(-100%);
    opacity: 0;
  }
  15% {
    opacity: 1;
  }
  85% {
    opacity: 1;
  }
  100% {
    transform: translateY(300%);
    opacity: 0;
  }
}
```

- [ ] **Step 2: Verify the stylesheet still parses**

Run: `cd web && pnpm lint`
Expected: PASS, no new findings.

- [ ] **Step 3: Commit**

```bash
git add web/src/styles.css
git commit -m "feat(web): add the scroll-cue travelling-segment keyframes"
```

---

### Task 2: The `Scroll` copy in both locales

**Files:**
- Modify: `web/src/i18n/locales/pt-BR/home.json` (the `cta` object)
- Modify: `web/src/i18n/locales/en/home.json` (the `cta` object)

**Interfaces:**
- Consumes: nothing.
- Produces: the translation key `home:cta.scroll`, resolving to the string `"Scroll"` in both `en` and `pt-BR`.

- [ ] **Step 1: Add the key to pt-BR**

In `web/src/i18n/locales/pt-BR/home.json`, the `cta` object currently reads:

```json
  "cta": {
    "projects": "Ver os projetos",
    "about": "Sobre mim",
    "ask": "Pergunte à IA sobre mim"
  },
```

Add `scroll` as the last entry:

```json
  "cta": {
    "projects": "Ver os projetos",
    "about": "Sobre mim",
    "ask": "Pergunte à IA sobre mim",
    "scroll": "Scroll"
  },
```

- [ ] **Step 2: Add the key to en**

In `web/src/i18n/locales/en/home.json`, the `cta` object currently reads:

```json
  "cta": {
    "projects": "See the projects",
    "about": "About me",
    "ask": "Ask the AI about me"
  },
```

Add `scroll` as the last entry:

```json
  "cta": {
    "projects": "See the projects",
    "about": "About me",
    "ask": "Ask the AI about me",
    "scroll": "Scroll"
  },
```

The word is deliberately identical in both locales — it is short, it is already the word Brazilian users use, and routing it through i18n means changing it later is a locale edit rather than a component edit.

- [ ] **Step 3: Verify both files are valid JSON and the suite still passes**

Run: `cd web && pnpm test src/i18n/i18n.test.ts`
Expected: PASS (2 tests). A malformed JSON file fails the import and this run.

- [ ] **Step 4: Commit**

```bash
git add web/src/i18n/locales/pt-BR/home.json web/src/i18n/locales/en/home.json
git commit -m "feat(web): add the scroll cue label to both locales"
```

---

### Task 3: The scroll target `id` on `HowIHelp`

**Files:**
- Modify: `web/src/components/home/help/how-i-help.tsx:24`
- Test: `web/src/components/home/help/how-i-help.test.tsx`

**Interfaces:**
- Consumes: nothing.
- Produces: a DOM element with `id="how-i-help"` — the element `ScrollCue` (Task 4) scrolls to. Task 4 hardcodes this string as `SCROLL_CUE_TARGET_ID`; the two must match exactly.

- [ ] **Step 1: Write the failing test**

Add this test to `web/src/components/home/help/how-i-help.test.tsx`, inside the existing `describe('HowIHelp', …)` block. It follows the file's established pattern — `await renderWithI18n(<HowIHelp />)`, with `matchMedia` already stubbed by the file's `beforeEach`:

```tsx
  it('exposes the id the hero scroll cue scrolls to', async () => {
    const { container } = await renderWithI18n(<HowIHelp />);

    expect(container.querySelector('#how-i-help')).toBeInTheDocument();
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd web && pnpm test src/components/home/help/how-i-help.test.tsx`
Expected: FAIL — `expected null to be in the document`.

- [ ] **Step 3: Add the id**

In `web/src/components/home/help/how-i-help.tsx`, change line 24 from:

```tsx
    <section className="bg-background px-6 py-14 text-foreground sm:px-10 md:py-20">
```

to:

```tsx
    {/* `id` is the hero's ScrollCue target — see components/home/scroll-cue.tsx. */}
    <section id="how-i-help" className="bg-background px-6 py-14 text-foreground sm:px-10 md:py-20">
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd web && pnpm test src/components/home/help/how-i-help.test.tsx`
Expected: PASS, all tests in the file.

- [ ] **Step 5: Commit**

```bash
git add web/src/components/home/help/how-i-help.tsx web/src/components/home/help/how-i-help.test.tsx
git commit -m "feat(web): name the section the scroll cue points at"
```

---

### Task 4: The `ScrollCue` component

**Files:**
- Create: `web/src/components/home/scroll-cue.tsx`
- Test: `web/src/components/home/scroll-cue.test.tsx`

**Interfaces:**
- Consumes: `home:cta.scroll` (Task 2), `id="how-i-help"` (Task 3), the `scroll-cue` keyframes (Task 1), `useReducedMotion` from `@/hooks/use-reduced-motion`, `cn` from `@/lib/utils`.
- Produces: `export function ScrollCue(): JSX.Element` — takes no props — and `export const SCROLL_CUE_TARGET_ID = 'how-i-help'`. Renders a single `<button type="button" data-testid="scroll-cue">`. Task 5 imports `ScrollCue` and renders it inside `Hero`.

- [ ] **Step 1: Write the failing test**

Create `web/src/components/home/scroll-cue.test.tsx`:

```tsx
import { fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderWithI18n } from '@/test/render-with-i18n';
import { ScrollCue } from './scroll-cue';

function mockMatchMedia(matches: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

function scrollTo(y: number) {
  Object.defineProperty(window, 'scrollY', { value: y, writable: true, configurable: true });
  fireEvent.scroll(window);
}

/** Stands in for the real <section id="how-i-help"> that HowIHelp renders. */
function mountTarget() {
  const target = document.createElement('section');
  target.id = 'how-i-help';
  const scrollIntoView = vi.fn();
  target.scrollIntoView = scrollIntoView;
  document.body.appendChild(target);
  return { target, scrollIntoView };
}

afterEach(() => {
  document.getElementById('how-i-help')?.remove();
  scrollTo(0);
});

describe('ScrollCue', () => {
  it('renders a labelled button', async () => {
    mockMatchMedia(false);

    await renderWithI18n(<ScrollCue />);

    expect(await screen.findByRole('button', { name: 'Scroll' })).toBeInTheDocument();
  });

  it('smooth-scrolls to the next section when clicked', async () => {
    mockMatchMedia(false);
    const { scrollIntoView } = mountTarget();

    await renderWithI18n(<ScrollCue />);
    fireEvent.click(await screen.findByRole('button', { name: 'Scroll' }));

    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
  });

  it('jumps without smooth scrolling under prefers-reduced-motion: reduce', async () => {
    mockMatchMedia(true);
    const { scrollIntoView } = mountTarget();

    await renderWithI18n(<ScrollCue />);
    fireEvent.click(await screen.findByRole('button', { name: 'Scroll' }));

    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'auto', block: 'start' });
  });

  it('does not throw when the scroll target is absent', async () => {
    mockMatchMedia(false);

    await renderWithI18n(<ScrollCue />);

    expect(() => fireEvent.click(screen.getByRole('button', { name: 'Scroll' }))).not.toThrow();
  });

  it('freezes the travelling segment under prefers-reduced-motion: reduce', async () => {
    mockMatchMedia(true);

    await renderWithI18n(<ScrollCue />);

    expect(await screen.findByTestId('scroll-cue')).toHaveAttribute('data-motion', 'static');
  });

  it('animates the travelling segment when motion is allowed', async () => {
    mockMatchMedia(false);

    await renderWithI18n(<ScrollCue />);

    expect(await screen.findByTestId('scroll-cue')).toHaveAttribute('data-motion', 'animated');
  });

  it('fades out and stops taking clicks once the page is scrolled', async () => {
    mockMatchMedia(false);

    await renderWithI18n(<ScrollCue />);
    const cue = await screen.findByTestId('scroll-cue');
    expect(cue).toHaveClass('opacity-100');

    scrollTo(120);

    expect(cue).toHaveClass('opacity-0');
    expect(cue).toHaveClass('pointer-events-none');
    expect(cue).toHaveAttribute('tabindex', '-1');
  });

  it('comes back when the page returns to the top', async () => {
    mockMatchMedia(false);

    await renderWithI18n(<ScrollCue />);
    const cue = await screen.findByTestId('scroll-cue');

    scrollTo(120);
    expect(cue).toHaveClass('opacity-0');

    scrollTo(0);
    expect(cue).toHaveClass('opacity-100');
  });
});
```

Note on `renderWithI18n`: it is the shared helper at `web/src/test/render-with-i18n.tsx`, already used by `hero.test.tsx` and `how-i-help.test.tsx`. Its signature is `async function renderWithI18n(ui: ReactElement, opts?: { locale?: Locale })` — it awaits `i18n.changeLanguage` (defaulting to `en`, which is why the expected label is `"Scroll"`) and returns Testing Library's render result, so `await` on every call is required and `container` destructures off it.

- [ ] **Step 2: Run test to verify it fails**

Run: `cd web && pnpm test src/components/home/scroll-cue.test.tsx`
Expected: FAIL — the module `./scroll-cue` cannot be resolved.

- [ ] **Step 3: Write the implementation**

Create `web/src/components/home/scroll-cue.tsx`:

```tsx
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { cn } from '@/lib/utils';

/**
 * The id of the section directly below the hero — see
 * `components/home/help/how-i-help.tsx`. Kept here because this component is
 * the only thing that scrolls to it.
 */
export const SCROLL_CUE_TARGET_ID = 'how-i-help';

/**
 * Past this much scroll the cue has served its purpose and gets out of the
 * way. Small enough that the first flick of a wheel dismisses it, large
 * enough that a browser restoring a few pixels of scroll position doesn't.
 */
const HIDE_AFTER_PX = 32;

/**
 * The hero's "there is more below" affordance: a mono label over a 48px rule
 * that fades out at its lower end, with a short aqua segment running down it
 * on a loop.
 *
 * The hero reserves `min-h-[85vh]` and its content ends well short of that,
 * which left a tall dead gap and a sliver of the next section clipped by the
 * fold — read by a first-time visitor as a broken layout rather than an
 * invitation. This sits in that gap and points at the sliver.
 *
 * Desktop only (`hidden md:flex`): below `md` the hero has no minimum height,
 * so there is no gap to fill and the next section already follows naturally.
 *
 * Once the page scrolls past `HIDE_AFTER_PX` the cue fades to
 * `pointer-events-none` rather than unmounting — so its own smooth scroll
 * never races the listener that hides it — and it is pulled out of the tab
 * order and the accessibility tree while invisible.
 */
export function ScrollCue() {
  const { t } = useTranslation('home');
  const reducedMotion = useReducedMotion();
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const onScroll = () => setHidden(window.scrollY > HIDE_AFTER_PX);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToNextSection = () => {
    document.getElementById(SCROLL_CUE_TARGET_ID)?.scrollIntoView({
      behavior: reducedMotion ? 'auto' : 'smooth',
      block: 'start',
    });
  };

  return (
    <button
      type="button"
      onClick={scrollToNextSection}
      data-testid="scroll-cue"
      data-motion={reducedMotion ? 'static' : 'animated'}
      aria-hidden={hidden || undefined}
      tabIndex={hidden ? -1 : undefined}
      className={cn(
        'group absolute inset-x-0 bottom-8 z-10 mx-auto hidden w-fit min-h-11 flex-col items-center gap-2.5 transition-opacity duration-300 md:flex',
        hidden ? 'pointer-events-none opacity-0' : 'opacity-100',
      )}
    >
      <span className="font-mono text-xs tracking-[0.18em] text-muted-foreground uppercase transition-colors group-hover:text-signal-strong">
        {t('home:cta.scroll')}
      </span>
      {/* Decorative: the label alone is the button's accessible name. */}
      <span
        aria-hidden
        className="relative block h-12 w-px overflow-hidden bg-gradient-to-b from-border to-transparent"
      >
        <span
          className="absolute inset-x-0 top-0 block h-4 bg-gradient-to-b from-transparent to-signal"
          style={reducedMotion ? undefined : { animation: 'scroll-cue 2.4s cubic-bezier(0.4, 0, 0.2, 1) infinite' }}
        />
      </span>
    </button>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd web && pnpm test src/components/home/scroll-cue.test.tsx`
Expected: PASS, 8 tests.

- [ ] **Step 5: Lint**

Run: `cd web && pnpm lint`
Expected: PASS, no new findings.

- [ ] **Step 6: Commit**

```bash
git add web/src/components/home/scroll-cue.tsx web/src/components/home/scroll-cue.test.tsx
git commit -m "feat(web): add the hero scroll cue"
```

---

### Task 5: Mount the cue in the hero

**Files:**
- Modify: `web/src/components/home/hero.tsx` (imports, and inside the `<section>`)
- Test: `web/src/components/home/hero.test.tsx`

**Interfaces:**
- Consumes: `ScrollCue` from `@/components/home/scroll-cue` (Task 4).
- Produces: nothing further.

- [ ] **Step 1: Write the failing test**

In `web/src/components/home/hero.test.tsx`, add this test inside the existing `describe('Hero', …)` block:

```tsx
  it('renders the scroll cue that points at the section below', async () => {
    useMetricsMock.mockReturnValue({ data: { activeConnections: 1, totalVisits: 10 } });

    await renderHero();

    expect(await screen.findByRole('button', { name: 'Scroll' })).toBeInTheDocument();
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd web && pnpm test src/components/home/hero.test.tsx`
Expected: FAIL — unable to find an accessible element with the role "button" and name "Scroll".

- [ ] **Step 3: Mount the component**

In `web/src/components/home/hero.tsx`, add the import alongside the other `@/components/home/*` imports (after the `HeroMap` import, keeping the existing ordering style):

```tsx
import { ScrollCue } from '@/components/home/scroll-cue';
```

Then render it as the last child of the hero's `<section>`, immediately after the closing `</div>` of the `relative z-10 mx-auto …` content wrapper and before `</section>`:

```tsx
      {/*
        Anchored to the section's own box (which is already `relative
        isolate`), not to the content column — the cue belongs to the band and
        centres on the viewport. It sits below the content in source order so
        it also comes last in the tab order.
      */}
      <ScrollCue />
    </section>
```

Leave the hero's `md:min-h-[85vh]`, padding, and every existing child untouched. The sliver of the next section peeking under the fold is the thing the cue points at, and it stays.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd web && pnpm test src/components/home/hero.test.tsx`
Expected: PASS, all tests in the file.

- [ ] **Step 5: Run the whole suite and lint**

Run: `cd web && pnpm test && pnpm lint`
Expected: PASS, no failures and no new lint findings.

- [ ] **Step 6: Commit**

```bash
git add web/src/components/home/hero.tsx web/src/components/home/hero.test.tsx
git commit -m "feat(web): the hero points at what comes next"
```

---

### Task 6: Verify it in the browser

**Files:** none — verification only.

**Interfaces:**
- Consumes: everything above.
- Produces: confirmation, plus fixes to the files above if anything is wrong.

- [ ] **Step 1: Start the dev server**

Use the preview tooling (`preview_start`) rather than a bare shell command, with a `.claude/launch.json` entry for `pnpm dev` in `web/` on the port Vite reports. Open the home page at `/`.

- [ ] **Step 2: Check the desktop rendering**

At a 1280×800 desktop viewport, confirm:
- the cue sits centred at the foot of the dark hero band, above the sliver of "O que eu resolvo"
- the aqua segment runs top to bottom down the rule and repeats
- the label turns aqua on hover

- [ ] **Step 3: Check the behaviours**

- Click the cue: the page scrolls smoothly to the "O que eu resolvo" section.
- Scroll down a little: the cue fades out.
- Scroll back to the top: it fades back in.
- Tab to it and press Enter: same scroll as the click.

- [ ] **Step 4: Check mobile and light theme**

Resize to the 375×812 mobile preset and reload: the cue is absent. Switch to the light theme: the label and rule are still legible against the light hero surface.

- [ ] **Step 5: Check the console**

Read the console messages: no errors or React warnings from the new component.

- [ ] **Step 6: Capture proof**

Take a screenshot of the hero foot showing the cue in place and share it.

---

## Self-Review

**Spec coverage** — every section of `docs/superpowers/specs/2026-08-17-hero-scroll-cue-design.md` maps to a task: anatomy and placement (Task 4), the travelling segment (Tasks 1 and 4), the breakpoint (Task 4), hero height left alone (Task 5, stated explicitly), click behaviour (Tasks 3 and 4), hide-on-scroll (Task 4), reduced motion (Tasks 1 and 4), copy and i18n (Task 2), accessibility (Task 4), the six spec'd tests plus the hero assertion (Tasks 4 and 5).

**Naming consistency** — `SCROLL_CUE_TARGET_ID`, the literal `'how-i-help'` in Task 3's `id` attribute, and the test's `mountTarget()` helper all use the same string. `data-testid="scroll-cue"` matches every `getByTestId`/`findByTestId` in the tests. The keyframes name `scroll-cue` in Task 1 matches the inline `animation` value in Task 4. The rule is `h-12` (48px) and the segment `h-4` (16px), which is what `translateY(300%)` is computed against.
