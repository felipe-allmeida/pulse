# "How can I help you?" redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the section's 2x2 grid of identical cards and its icon mini-diagram with an asymmetric grid and a monospace `hoje / depois` pair, and point the primary CTA at WhatsApp instead of the profile-scoped Ask widget.

**Architecture:** Five commits, each leaving the suite green. Copy lands first (new keys added *alongside* the old `diagram` keys, so nothing breaks), then the card component swaps the diagram for the transform block, then the section re-lays-out, then the CTA changes, and the now-dead `diagram` keys are deleted last.

**Tech Stack:** React 19 + TypeScript, TanStack Router, Tailwind v4, react-i18next, lucide-react, Vitest + Testing Library.

**Spec:** `docs/superpowers/specs/2026-08-17-how-i-help-redesign-design.md`

## Global Constraints

- Working directory for every command is `web/`. Run tests with `npx vitest run <path>`; the full suite is `npm test`.
- `tsc -b` is the authoritative typecheck, **not** `tsc --noEmit`. Run `npx tsc -b` before each commit.
- Lint with `npx oxlint`.
- Every i18n key must exist in **both** `en` and `pt-BR`. `web/src/i18n/help-copy.test.ts` enforces this for the `help` block.
- Card order is fixed: `repetitive, spreadsheet, ai, idea`.
- Accent text uses `text-signal-strong` (AA-safe in both themes), never the raw `text-signal`, which is a fill colour.
- Both CTAs keep a `min-h-11` (44px) tap target.
- Card headlines, bodies, examples and technical lines are **not** rewritten.

---

### Task 1: Add the transform copy, the labels, and the WhatsApp strings

Adds new keys only. The old `diagram` keys stay for now so `help-diagram.tsx` keeps working — they are deleted in Task 5.

**Files:**
- Modify: `web/src/i18n/help-copy.test.ts`
- Modify: `web/src/i18n/locales/pt-BR/home.json`
- Modify: `web/src/i18n/locales/en/home.json`

**Interfaces:**
- Consumes: nothing.
- Produces: `home:help.transformLabels.{before,after}`, `home:help.cards.<key>.transform.{before,after}`, `home:help.cta.whatsappMessage`, `home:help.cta.askAria`.

- [ ] **Step 1: Write the failing test**

In `web/src/i18n/help-copy.test.ts`, extend the `HelpBlock` type. Replace the existing type declaration with:

```ts
type HelpBlock = {
  eyebrow: string;
  heading: string;
  lede: string;
  examplesLabel: string;
  techLabel: string;
  transformLabels: { before: string; after: string };
  cards: Record<
    (typeof CARD_KEYS)[number],
    {
      headline: string;
      body: string;
      examples: string[];
      tech: string;
      diagram: { from: string; via: string; to: string };
      transform: { before: string; after: string };
    }
  >;
  cta: { ask: string; book: string; askAria: string; whatsappMessage: string };
};
```

In the `has every section-level string, non-empty` test, after the two `help.cta` assertions, add:

```ts
        for (const side of ['before', 'after'] as const) {
          expect(help.transformLabels[side].length, `${locale}.help.transformLabels.${side}`).toBeGreaterThan(0);
        }
        expect(help.cta.askAria.length, `${locale}.help.cta.askAria`).toBeGreaterThan(0);
        expect(help.cta.whatsappMessage.length, `${locale}.help.cta.whatsappMessage`).toBeGreaterThan(0);

        // The message is handed to the founder mid-sentence so they finish it
        // rather than facing an empty composer.
        expect(
          help.cta.whatsappMessage.endsWith(' '),
          `${locale}.help.cta.whatsappMessage is an unfinished sentence`,
        ).toBe(true);

        // WCAG 2.5.3: the accessible name must start with the visible label.
        expect(help.cta.askAria.startsWith(help.cta.ask), `${locale}.help.cta.askAria contains the visible label`).toBe(
          true,
        );
```

In the `has all four cards, in order, each complete` test, after the `diagram` loop, add:

```ts
          for (const side of ['before', 'after'] as const) {
            expect(card.transform[side].length, `${locale}.${key}.transform.${side}`).toBeGreaterThan(0);
          }
```

In the jargon test, inside the `for (const key of CARD_KEYS)` loop, after the `body` assertion, add:

```ts
        // The transform pair sits on the card surface, so it is held to the
        // same founder-readable standard as the headline and body.
        expect(card.transform.before, `${locale}.${key}.transform.before is jargon-free`).not.toMatch(JARGON);
        expect(card.transform.after, `${locale}.${key}.transform.after is jargon-free`).not.toMatch(JARGON);
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd web && npx vitest run src/i18n/help-copy.test.ts
```

Expected: FAIL — `transformLabels` is undefined, so reading `.before` throws `TypeError: Cannot read properties of undefined`.

- [ ] **Step 3: Add the keys to pt-BR**

In `web/src/i18n/locales/pt-BR/home.json`, inside the `help` block, add `transformLabels` immediately after `"techLabel"`:

```json
    "transformLabels": { "before": "hoje", "after": "depois" },
```

Add a `transform` object to each card, immediately after that card's existing `"diagram"` object:

```json
        "transform": { "before": "alguém redigita, toda segunda", "after": "roda sozinha, no horário" }
```

for `repetitive`;

```json
        "transform": { "before": "o caixa fecha no dia 5", "after": "painel que se atualiza sozinho" }
```

for `spreadsheet`;

```json
        "transform": { "before": "a resposta está enterrada num PDF", "after": "resposta com a fonte citada" }
```

for `ai`;

```json
        "transform": { "before": "a ideia está no papel", "after": "MVP no ar e time tocando" }
```

for `idea`.

Replace the `help.cta` object with:

```json
    "cta": {
      "ask": "Me conta o seu caso",
      "askAria": "Me conta o seu caso no WhatsApp",
      "book": "Conversar comigo",
      "whatsappMessage": "Oi Felipe, vim pelo seu site. O que trava aqui hoje é "
    }
```

The trailing space in `whatsappMessage` is deliberate — the sentence is unfinished on purpose and a test asserts it.

- [ ] **Step 4: Add the keys to en**

In `web/src/i18n/locales/en/home.json`, mirror the structure. After `"techLabel"`:

```json
    "transformLabels": { "before": "today", "after": "after" },
```

Per card, after each `"diagram"` object:

```json
        "transform": { "before": "someone retypes it, every Monday", "after": "runs on its own, on schedule" }
```

for `repetitive`;

```json
        "transform": { "before": "cash closes on the 5th", "after": "a dashboard that updates itself" }
```

for `spreadsheet`;

```json
        "transform": { "before": "the answer is buried in a PDF", "after": "an answer with the source cited" }
```

for `ai`;

```json
        "transform": { "before": "the idea is on paper", "after": "an MVP live and a team running it" }
```

for `idea`.

Replace the `help.cta` object with:

```json
    "cta": {
      "ask": "Tell me your case",
      "askAria": "Tell me your case on WhatsApp",
      "book": "Talk to me",
      "whatsappMessage": "Hi Felipe, I came from your site. What's stuck here today is "
    }
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
cd web && npx vitest run src/i18n/help-copy.test.ts && npx tsc -b
```

Expected: PASS, and a clean typecheck.

- [ ] **Step 6: Commit**

```bash
git add web/src/i18n/help-copy.test.ts web/src/i18n/locales/pt-BR/home.json web/src/i18n/locales/en/home.json
git commit -m "feat(web): copy for the hoje/depois pair and the WhatsApp CTA"
```

---

### Task 2: Swap the mini-diagram for the transform block

Deletes `help-diagram.tsx` and everything it carried: twelve icons, the `ICONS` map, the `IntersectionObserver`, the traversal timers and the reduced-motion branch.

**Files:**
- Create: `web/src/components/home/help/help-cards.ts`
- Modify: `web/src/components/home/help/help-card.tsx`
- Modify: `web/src/components/home/help/help-card.test.tsx`
- Modify: `web/src/components/home/help/how-i-help.tsx` (import line and the diagram mock's disappearance only)
- Modify: `web/src/components/home/help/how-i-help.test.tsx` (remove the mock)
- Delete: `web/src/components/home/help/help-diagram.tsx`
- Delete: `web/src/components/home/help/help-diagram.test.tsx`

**Interfaces:**
- Consumes: `home:help.transformLabels.*` and `home:help.cards.<key>.transform.*` from Task 1.
- Produces: `HelpCardKey` and `HELP_CARD_KEYS` from `@/components/home/help/help-cards`; `HelpCard` gains an optional `featured?: boolean` prop and stamps `data-featured="true"` on its root when set.

`HELP_CARD_KEYS` is exported as a `const` tuple (not a widened array) so Task 3 can destructure `[featured, ...rest]` and get exact types.

- [ ] **Step 1: Create the shared card vocabulary**

Create `web/src/components/home/help/help-cards.ts`:

```ts
/**
 * The card vocabulary the section and the card component share. A module with
 * no JSX so importing the key list never drags a component into the graph —
 * these used to live in `help-diagram.tsx`, which meant every consumer of the
 * key list imported twelve icons to read four strings.
 */

/** Ordered as rendered on the page. The first key is the featured card. */
export const HELP_CARD_KEYS = ['repetitive', 'spreadsheet', 'ai', 'idea'] as const;

export type HelpCardKey = (typeof HELP_CARD_KEYS)[number];
```

- [ ] **Step 2: Write the failing tests**

In `web/src/components/home/help/help-card.test.tsx`:

- Delete the `vi.mock('./help-diagram', …)` block at the top (lines 7-10).
- Delete the whole `beforeEach` that mocks `window.matchMedia` (lines 13-20). It existed only for the `useReducedMotion` call inside `HelpDiagram`; nothing left in `HelpCard` touches `matchMedia`.
- That leaves `vi` and `beforeEach` unused at the outer level, but the `when the examples key does not resolve to an array of strings` describe block at the bottom has its own `beforeEach`/`afterEach` — so the import becomes `import { afterEach, beforeEach, describe, expect, it } from 'vitest';` (drop `vi` only).
- Delete the `renders its diagram` test entirely.

Add these two tests after `renders the headline and body for its variant`:

```ts
  it('shows both sides of the transform when featured', async () => {
    await renderWithI18n(<HelpCard variant="repetitive" featured />);

    expect(screen.getByText('today')).toBeInTheDocument();
    expect(screen.getByText('someone retypes it, every Monday')).toBeInTheDocument();
    expect(screen.getByText('after')).toBeInTheDocument();
    expect(screen.getByText('runs on its own, on schedule')).toBeInTheDocument();
  });

  it('shows only the outcome when compact, so the three small cards stay short', async () => {
    await renderWithI18n(<HelpCard variant="repetitive" />);

    expect(screen.getByText(/runs on its own, on schedule/)).toBeInTheDocument();
    expect(screen.queryByText('someone retypes it, every Monday')).not.toBeInTheDocument();
    expect(screen.queryByText('today')).not.toBeInTheDocument();
  });

  it('marks the featured card in the DOM, and only when featured', async () => {
    const { container: plain } = await renderWithI18n(<HelpCard variant="ai" />);
    expect(plain.querySelector('[data-featured="true"]')).toBeNull();

    const { container: big } = await renderWithI18n(<HelpCard variant="ai" featured />);
    expect(big.querySelector('[data-featured="true"]')).toBeInTheDocument();
  });
```

- [ ] **Step 3: Run tests to verify they fail**

```bash
cd web && npx vitest run src/components/home/help/help-card.test.tsx
```

Expected: FAIL — `featured` is not a prop of `HelpCard`, and `today` / `someone retypes it, every Monday` are not in the DOM.

- [ ] **Step 4: Rewrite the card component**

Replace `web/src/components/home/help/help-card.tsx` in full:

```tsx
import { ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { type HelpCardKey } from '@/components/home/help/help-cards';
import { cn } from '@/lib/utils';

/**
 * One offer, in two layers. The surface — headline, body, and the
 * `hoje / depois` pair — is written for a founder and carries no technical
 * vocabulary at all. The `<details>` underneath holds three concrete examples
 * and closes with one dimmed line of real engineering terms, for whoever the
 * founder forwards this to.
 *
 * Two sizes. The featured card runs the full width of the section and shows
 * both sides of the transform; the three compact cards share a row and show
 * only the outcome. The hierarchy is the card's size — no copy is cut, because
 * this page is built to be read by answer engines and a shorter body would
 * trade retrievable text for whitespace.
 *
 * Native `<details>`/`<summary>` rather than a custom disclosure: keyboard
 * accessible with no code of ours, works with JavaScript disabled, and
 * leaves the collapsed copy in the DOM for crawlers.
 */
function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

export function HelpCard({ variant, featured = false }: { variant: HelpCardKey; featured?: boolean }) {
  const { t } = useTranslation('home');

  // i18next's return type for `t()` is unconstrained here (no
  // `CustomTypeOptions` module augmentation in this repo), so a missing or
  // malformed key resolves to the key path itself rather than an array. If
  // that untyped value were cast and rendered directly, `.map()` on a
  // string would throw during render — including during the SSR prerender.
  // Narrow it at runtime instead: a missing/malformed key costs the
  // examples list, not the page.
  const rawExamples: unknown = t(`home:help.cards.${variant}.examples`, { returnObjects: true });
  const examples = isStringArray(rawExamples) ? rawExamples : [];

  return (
    <div
      data-featured={featured ? 'true' : undefined}
      className={cn(
        'flex h-full flex-col gap-4 rounded-lg bg-signal-muted/10',
        featured ? 'border-2 border-signal/50 p-6' : 'border border-signal/20 p-5',
      )}
    >
      <h3
        className={cn(
          'font-semibold tracking-tight text-balance text-foreground',
          featured ? 'text-xl' : 'text-base',
        )}
      >
        {t(`home:help.cards.${variant}.headline`)}
      </h3>

      <p className="max-w-[60ch] flex-1 text-sm leading-relaxed text-muted-foreground">
        {t(`home:help.cards.${variant}.body`)}
      </p>

      {/*
        What replaced the three-icon mini diagram. Two mono lines on the
        featured card, one on the compact ones — same grammar as the event
        feed and the architecture diagram, and no JavaScript at all: the old
        version spent an IntersectionObserver and a reduced-motion branch
        animating a dot along a 24px rule.
      */}
      {featured ? (
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 border-y border-signal/15 py-2.5 font-mono text-xs leading-relaxed">
          <dt className="text-muted-foreground">{t('home:help.transformLabels.before')}</dt>
          <dd className="text-muted-foreground">{t(`home:help.cards.${variant}.transform.before`)}</dd>
          <dt className="text-signal-strong">{t('home:help.transformLabels.after')}</dt>
          <dd className="text-signal-strong">{t(`home:help.cards.${variant}.transform.after`)}</dd>
        </dl>
      ) : (
        <p className="border-t border-signal/15 pt-3 font-mono text-xs leading-relaxed text-signal-strong">
          <span aria-hidden="true">→ </span>
          {t(`home:help.cards.${variant}.transform.after`)}
        </p>
      )}

      <details className="group border-t border-signal/15 pt-3">
        {/*
          `list-none` + the WebKit pseudo-element rule kill the native
          triangle marker so the chevron below is the only affordance; the
          summary keeps its own focus ring and stays a real disclosure
          control for keyboard and screen readers.
        */}
        <summary className="flex cursor-pointer list-none items-center gap-1.5 rounded font-mono text-xs tracking-[0.15em] text-signal-strong uppercase focus-visible:ring-2 focus-visible:ring-signal-strong focus-visible:outline-none [&::-webkit-details-marker]:hidden">
          <ChevronRight
            className="size-3.5 transition-transform group-open:rotate-90 motion-reduce:transition-none"
            aria-hidden="true"
          />
          {t('home:help.examplesLabel')}
        </summary>

        <ul className="mt-3 flex flex-col gap-2">
          {examples.map((example) => (
            <li key={example} className="flex gap-2 text-sm leading-relaxed text-muted-foreground">
              <span aria-hidden="true" className="mt-2 size-1 shrink-0 rounded-full bg-signal/60" />
              <span>{example}</span>
            </li>
          ))}
        </ul>

        {/* The one place technical vocabulary is allowed. Small and dimmed on
            purpose: the founder's eye slides past it, the engineer's doesn't. */}
        <p className="mt-3 font-mono text-[11px] leading-relaxed text-muted-foreground">
          <span className="text-signal-strong">{t('home:help.techLabel')}</span>{' '}
          {t(`home:help.cards.${variant}.tech`)}
        </p>
      </details>
    </div>
  );
}
```

- [ ] **Step 5: Repoint the section's import and delete the diagram**

In `web/src/components/home/help/how-i-help.tsx`, change line 4 from:

```tsx
import { HELP_CARD_KEYS } from '@/components/home/help/help-diagram';
```

to:

```tsx
import { HELP_CARD_KEYS } from '@/components/home/help/help-cards';
```

In `web/src/components/home/help/how-i-help.test.tsx`:

- Delete the `vi.mock('./help-diagram', …)` block (lines 8-11).
- In the `renders all four cards, in order` test, delete the `for (const variant of …) expect(screen.getByTestId(…))` loop — the `h3` ordering assertion below it is the real check and it stands on its own.
- Delete the `window.matchMedia` mock from `beforeEach`, leaving only the `useAskWidgetStore.setState(…)` line (Task 4 removes that line and the now-empty `beforeEach` with it). `vi` then has no remaining use in this file, so drop it from the vitest import.

Then delete both diagram files:

```bash
git rm web/src/components/home/help/help-diagram.tsx web/src/components/home/help/help-diagram.test.tsx
```

- [ ] **Step 6: Run tests to verify they pass**

```bash
cd web && npx vitest run src/components/home/help && npx tsc -b && npx oxlint
```

Expected: PASS, clean typecheck, clean lint. If `oxlint` flags an unused import in either test file, remove it.

- [ ] **Step 7: Verify the shared motion helpers survived**

```bash
cd web && grep -rn "signal-edge" src/ && grep -rln "useReducedMotion" src/
```

Expected: `styles.css` and `architecture-diagram.tsx` still reference `signal-edge`; `use-reduced-motion` still has consumers (`architecture-diagram`, `visitor-line`, `hero-map`, `signal/pill`). Nothing to delete — this step is a check, not a change.

- [ ] **Step 8: Commit**

```bash
git add -A web/src/components/home/help
git commit -m "feat(web): the hoje/depois pair, in place of the three-icon diagram"
```

---

### Task 3: Make the grid asymmetric

**Files:**
- Modify: `web/src/components/home/help/how-i-help.tsx:34-38`
- Modify: `web/src/components/home/help/how-i-help.test.tsx`

**Interfaces:**
- Consumes: `HELP_CARD_KEYS` (tuple) and `HelpCard`'s `featured` prop from Task 2.
- Produces: nothing new.

- [ ] **Step 1: Write the failing test**

In `web/src/components/home/help/how-i-help.test.tsx`, add after the `renders all four cards, in order` test:

```ts
  it('features exactly one card, and it is the first', async () => {
    const { container } = await renderWithI18n(<HowIHelp />);

    const featured = container.querySelectorAll('[data-featured="true"]');
    expect(featured, 'hierarchy comes from one card being larger, not from four equal ones').toHaveLength(1);

    expect(featured[0]?.querySelector('h3')).toHaveTextContent(
      'Your team spends the day doing work a machine would do.',
    );
  });

  it('puts the three remaining cards in one row from md up', async () => {
    const { container } = await renderWithI18n(<HowIHelp />);

    const row = container.querySelector('[data-help-row]');
    expect(row).toBeInTheDocument();
    expect(row?.className).toMatch(/md:grid-cols-3/);
    expect(row?.querySelectorAll('h3')).toHaveLength(3);
  });
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd web && npx vitest run src/components/home/help/how-i-help.test.tsx
```

Expected: FAIL — no element carries `data-featured="true"`, and there is no `[data-help-row]`.

- [ ] **Step 3: Rewrite the grid**

In `web/src/components/home/help/how-i-help.tsx`, replace the card grid (currently lines 34-38):

```tsx
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {HELP_CARD_KEYS.map((variant) => (
            <HelpCard key={variant} variant={variant} />
          ))}
        </div>
```

with:

```tsx
        {/*
          Asymmetric on purpose. Four identically weighted cards gave the
          reader no entry point, so the first — repetitive manual work, the
          problem a founder recognises fastest — runs the full width and the
          other three share a row beneath it. Promoting a different offer is a
          reorder of HELP_CARD_KEYS, not a rewrite of this file.
        */}
        <div className="flex flex-col gap-4">
          <HelpCard variant={featuredKey} featured />

          <div data-help-row className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {compactKeys.map((variant) => (
              <HelpCard key={variant} variant={variant} />
            ))}
          </div>
        </div>
```

Add the destructuring just above the `return` in `HowIHelp`:

```tsx
  const [featuredKey, ...compactKeys] = HELP_CARD_KEYS;
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd web && npx vitest run src/components/home/help && npx tsc -b
```

Expected: PASS. If `tsc -b` reports `featuredKey` as possibly `undefined`, the tuple `as const` from Task 2 was lost — check that `help-cards.ts` does **not** annotate `HELP_CARD_KEYS` with `readonly HelpCardKey[]`.

- [ ] **Step 5: Commit**

```bash
git add web/src/components/home/help/how-i-help.tsx web/src/components/home/help/how-i-help.test.tsx
git commit -m "feat(web): one card leads the help grid, three follow"
```

---

### Task 4: Point the primary CTA at WhatsApp

**Files:**
- Modify: `web/src/components/home/help/how-i-help.tsx`
- Modify: `web/src/components/home/help/how-i-help.test.tsx`

**Interfaces:**
- Consumes: `home:help.cta.whatsappMessage` and `home:help.cta.askAria` from Task 1; `profile.contact.whatsapp` from `@/content/profile`.
- Produces: nothing new.

- [ ] **Step 1: Write the failing test**

In `web/src/components/home/help/how-i-help.test.tsx`:

Delete the `opens the Ask widget with an empty composer when the primary CTA is clicked` test. Delete the `useAskWidgetStore` import, and delete the whole `beforeEach` block — Task 2 already emptied it down to the single `useAskWidgetStore.setState(…)` line, which goes with it. Drop `fireEvent` from the `@testing-library/react` import and `beforeEach` from the vitest import, leaving `import { describe, expect, it } from 'vitest';`.

Add:

```ts
  it('sends the primary CTA to WhatsApp with the message half-written', async () => {
    await renderWithI18n(<HowIHelp />);

    const ask = screen.getByRole('link', { name: /tell me your case/i });
    const href = ask.getAttribute('href') ?? '';

    expect(href.startsWith(`${profile.contact.whatsapp}?text=`), href).toBe(true);
    expect(decodeURIComponent(href.split('?text=')[1] ?? '')).toBe(
      "Hi Felipe, I came from your site. What's stuck here today is ",
    );
    expect(ask).toHaveAttribute('target', '_blank');
    expect(ask).toHaveAttribute('rel', 'noreferrer');
  });

  it('names WhatsApp in the accessible name, keeping the visible label as its prefix', async () => {
    await renderWithI18n(<HowIHelp />);

    expect(screen.getByRole('link', { name: 'Tell me your case on WhatsApp' })).toBeInTheDocument();
  });
```

Change the tap-target test to query a link rather than a button:

```ts
  it('gives both CTAs a 44px+ tap target', async () => {
    await renderWithI18n(<HowIHelp />);

    const ask = screen.getByRole('link', { name: /tell me your case/i });
    const book = screen.getByRole('link', { name: /talk to me/i });

    for (const cta of [ask, book]) {
      expect(cta.className).toMatch(/min-h-11|min-h-\[44px\]/);
    }
  });
```

In the `renders pt-BR copy` test, change the primary-CTA assertion from `getByRole('button', …)` to:

```ts
    expect(screen.getByRole('link', { name: /me conta o seu caso/i })).toBeInTheDocument();
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd web && npx vitest run src/components/home/help/how-i-help.test.tsx
```

Expected: FAIL — the primary CTA is still a `<button>`, so `getByRole('link', { name: /tell me your case/i })` finds nothing.

- [ ] **Step 3: Rewrite the CTA block**

In `web/src/components/home/help/how-i-help.tsx`, replace the whole CTA block (the comment plus the `<div className="flex flex-wrap …">`) with:

```tsx
        {/*
          A real channel, not the Ask widget. That widget is a retrieval
          assistant scoped to Felipe's profile — a founder who accepted this
          invitation and described their actual problem was told the assistant
          had no information about Felipe, at the highest point of buying
          intent on the page. The message is handed over mid-sentence so the
          founder finishes it instead of facing an empty composer.
        */}
        <div className="flex flex-wrap items-center gap-3">
          {profile.contact.whatsapp !== '' && (
            <a
              href={`${profile.contact.whatsapp}?text=${encodeURIComponent(t('home:help.cta.whatsappMessage'))}`}
              target="_blank"
              rel="noreferrer"
              aria-label={t('home:help.cta.askAria')}
              className={cn(
                buttonVariants({ size: 'lg' }),
                'min-h-11 border-transparent bg-signal text-signal-foreground hover:bg-signal/90',
              )}
            >
              <MessageCircle aria-hidden="true" />
              {t('home:help.cta.ask')}
            </a>
          )}

          {profile.contact.calendly !== '' && (
            <a
              href={profile.contact.calendly}
              target="_blank"
              rel="noreferrer"
              className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'min-h-11')}
            >
              <Calendar aria-hidden="true" />
              {t('home:help.cta.book')}
            </a>
          )}
        </div>
```

Then fix the imports at the top of the file. Remove:

```tsx
import { Button, buttonVariants } from '@/components/ui/button';
import { useAskWidgetStore } from '@/stores/ask-widget-store';
```

and add:

```tsx
import { buttonVariants } from '@/components/ui/button';
```

Remove the `const openAskWidget = useAskWidgetStore((s) => s.open);` line from the component body. `Calendar` and `MessageCircle` stay imported from `lucide-react`; `MessageCircle` is kept deliberately — `lucide-react` dropped its brand icons, so there is no WhatsApp glyph.

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd web && npx vitest run src/components/home/help && npx tsc -b && npx oxlint
```

Expected: PASS, clean typecheck, clean lint.

- [ ] **Step 5: Confirm the Ask widget still has its other consumers**

```bash
cd web && grep -rn "useAskWidgetStore" src/ --include="*.tsx" --include="*.ts"
```

Expected: the Hero and the Ask widget itself still use the store. The store and the widget are **not** deleted — only this section stopped opening it.

- [ ] **Step 6: Run the full suite**

```bash
cd web && npm test
```

Expected: PASS. If `src/routes/index.test.tsx` fails, read the failure — the spec's check found no Ask-widget assertions there, so a failure means something else regressed and should be fixed, not silenced.

- [ ] **Step 7: Commit**

```bash
git add web/src/components/home/help/how-i-help.tsx web/src/components/home/help/how-i-help.test.tsx
git commit -m "fix(web): the help CTA reaches a human, not a profile chatbot"
```

---

### Task 5: Delete the dead `diagram` keys

Nothing reads them after Task 2. They stayed until now only so every earlier commit was green.

**Files:**
- Modify: `web/src/i18n/locales/pt-BR/home.json`
- Modify: `web/src/i18n/locales/en/home.json`
- Modify: `web/src/i18n/help-copy.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: nothing.

- [ ] **Step 1: Confirm nothing reads them**

```bash
cd web && grep -rn "diagram" src/ --include="*.tsx" --include="*.ts" | grep -v architecture-diagram | grep -v hero-map
```

Expected: only `src/i18n/help-copy.test.ts`. If any component still references `help.cards.*.diagram`, stop and fix that first.

- [ ] **Step 2: Drop the assertions and the type**

In `web/src/i18n/help-copy.test.ts`, remove `diagram: { from: string; via: string; to: string };` from the `HelpBlock` card type, and delete this loop from the `has all four cards, in order, each complete` test:

```ts
          for (const node of ['from', 'via', 'to'] as const) {
            expect(card.diagram[node].length, `${locale}.${key}.diagram.${node}`).toBeGreaterThan(0);
          }
```

- [ ] **Step 3: Run test to verify it still passes**

```bash
cd web && npx vitest run src/i18n/help-copy.test.ts
```

Expected: PASS. The keys are still in the JSON at this point — the test simply no longer asserts them.

- [ ] **Step 4: Delete the keys from both locales**

Remove the `"diagram": { "from": …, "via": …, "to": … }` object from all four cards in `web/src/i18n/locales/pt-BR/home.json` and all four in `web/src/i18n/locales/en/home.json`. Eight objects total. Watch the trailing commas — `transform` becomes the last key in each card object.

- [ ] **Step 5: Run the full suite**

```bash
cd web && npx vitest run && npx tsc -b && npx oxlint
```

Expected: PASS, clean typecheck, clean lint. A JSON syntax error from a stray comma shows up here as a module-load failure, not an assertion failure.

- [ ] **Step 6: Verify the prerender still builds**

```bash
cd web && npm run build
```

Expected: both the SSR prerender and the client build complete. This is the check that the section renders without a browser — the old diagram needed an `IntersectionObserver` guard for exactly this reason, and the replacement has no such dependency.

- [ ] **Step 7: Commit**

```bash
git add web/src/i18n
git commit -m "chore(web): drop the help cards' dead diagram copy"
```

---

## Verification

After Task 5, confirm the section in a browser before calling this done:

```bash
cd web && npm run dev
```

Check, at desktop width and at mobile width, in both themes:

- The featured card runs the full width; the other three share a row above `md` and stack below it.
- The `hoje / depois` labels line up in their own column on the featured card, and the three compact cards each show one `→` line.
- Both CTAs are at least 44px tall, and the WhatsApp link opens a composer with the half-written message.
- No mini-diagram, no travelling dot, anywhere in the section.
