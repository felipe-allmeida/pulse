# Scroll cue — the hero tells you there is more below

**Date:** 2026-08-17
**Status:** approved, ready for planning

## Why

The home hero is `md:min-h-[85vh]`. Its content — pill, name, title, tagline,
visitor line, CTAs, stack chips — ends well before that height is used up, so
on a desktop viewport the band closes with a tall dead gap and then a thin
sliver of the next section ("O que eu resolvo") clipped by the fold.

Nothing in that gap says the page continues. The clipped sliver reads as a
rendering accident rather than an invitation, which is exactly how it was
reported: "hoje mostra meio quebrado uma parte de baixo do site."

The fix is not to hide the sliver. A sliver of the next section is a good
scroll affordance *once something points at it*. So the gap gets a scroll cue:
a small label over a thin vertical line, centred at the foot of the hero.

## What it is

A new component, `web/src/components/home/scroll-cue.tsx`, rendered by `Hero`.

**Anatomy.** A `<button type="button">` stacking two things:

1. The label `Scroll` — extra-small, uppercase, wide letter-spacing, mono,
   `text-muted-foreground`.
2. Below it, a vertical rule 1px wide and 48px tall, drawn as a top-to-bottom
   gradient that fades out at its lower end (no hard cut).

Inside the rule, a short aqua segment (~16px) travels top to bottom on a
~2.4s loop and fades in and out at the ends. That segment is the only thing on
the page that moves here.

**Placement.** `absolute inset-x-0 bottom-8` inside the hero's `<section>`,
which is already `relative isolate`, horizontally centred. It is centred on the
viewport, not aligned to the `max-w-5xl` content column — the cue belongs to the
band, not to the copy.

**Breakpoint.** `hidden md:flex`. Below `md` the hero has no `min-h-[85vh]`,
so there is no dead gap and the next section already follows naturally; the cue
would only cost vertical space.

**The hero keeps `md:min-h-[85vh]`.** The peeking sliver stays and is now
intentional.

## Behaviour

**Click.** Scrolls to the section immediately after the hero — `HowIHelp`,
whose `<section>` gains `id="how-i-help"`. Uses `scrollIntoView({ block: 'start' })` with
`behavior: 'smooth'`, or `behavior: 'auto'` when reduced motion is preferred.
If the target element is not found, the click is a no-op — never a thrown error.

**Hides once scrolling starts.** A passive `scroll` listener on `window`: at
`window.scrollY > 32` the cue transitions to `opacity-0` and
`pointer-events-none`; at or below 32 it returns. It is a cue for
the top of the page and has no business floating over a scrolled hero.

Because it becomes `pointer-events-none` rather than unmounting, its own smooth
scroll never fights the listener.

**Motion.** Uses the existing `useReducedMotion` hook and exposes `data-motion`,
matching `Pill`, `StatusPill` and `ArchitectureDiagram`. Under
`prefers-reduced-motion: reduce` the travelling segment is frozen; the label,
the rule, the click and the hide-on-scroll all still work. The
`@keyframes scroll-cue` rule lives in `web/src/styles.css` beside
`live-map-ping` and `signal-edge`.

## Copy and i18n

One new key, `home:cta.scroll`, valued `"Scroll"` in both `en` and `pt-BR`. The
word reads the same in both languages and is short enough for the space; routing
it through i18n now means changing it later is a locale edit, not a component
edit.

## Accessibility

- A real `<button>`: reachable by keyboard, activated by Enter and Space, and
  carrying the app's focus ring.
- Its accessible name is the visible label.
- The rule and the moving segment are decorative and `aria-hidden`.
- Tap target at least 44px tall (`min-h-11`) even though it only renders from
  `md` up, matching the rule applied across the site.
- Colour contrast: the label uses `text-muted-foreground`, which clears AA on
  the hero surface in both themes.

## Tests

`web/src/components/home/scroll-cue.test.tsx`:

- renders the localized label and an accessible button
- clicking calls `scrollIntoView` on the target section
- clicking uses `behavior: 'auto'` under `prefers-reduced-motion: reduce`
- freezes the travelling segment under `prefers-reduced-motion: reduce`
  (asserted through `data-motion`)
- becomes hidden and non-interactive once scrolled past the threshold, and
  returns when scrolled back to the top
- does not throw when the scroll target is absent

`web/src/components/home/hero.test.tsx` gains one assertion: the hero renders
the cue.

## Out of scope

- Changing the hero's height or any existing hero content. (Its bottom padding
  is amended below — the height and content stay out of scope.)
- Any scroll cue on other pages or between other sections.
- Scroll-driven animation of the hero itself.

## Amendment: hero bottom padding (2026-08-17)

The hero's natural content height (773px) means `md:min-h-[85vh]` only becomes
the binding constraint above ~909px of viewport height. Below that, the
original `md:py-28` left a fixed 6px of clearance between the stack-chip row
and the cue (112px bottom padding − 32px `bottom-8` − 74px cue height), which
reads as a bare uppercase "Scroll" jammed under the last chip at common laptop
viewports like 1440×900. The hero's `md` padding was changed from `md:py-28`
to `md:pt-28 md:pb-40`, adding clearance for the cue at every height while
leaving the top padding, `md:min-h-[85vh]`, and all other hero content
untouched.
