# "How can I help you?" — replacing Send a pulse on the home page

**Date:** 2026-08-17
**Status:** approved, ready for planning

## Why

The home page's first interactive element is "Send a pulse" — a button that
pushes a real event through the SignalR pipeline and reports the measured
round-trip. It proves the system is live, and it is the best possible pitch for
a hiring engineer.

It is the wrong pitch for the audience Felipe is now selling to. He is
freelancing through Pampa Devs and the buyer is a startup founder, not a
recruiter and not a CTO. A founder does not evaluate a round-trip time. A
founder has a process that only moves when somebody remembers to move it, and
wants to know whether this person can fix that.

So the home page leads with the offer instead of the demo: a section titled
"How can I help you?" carrying four concrete problems Felipe is actually asked
to solve, in the founder's language, with the engineering detail folded away
for the technical person the founder will forward the link to.

## Audience and voice

**Primary reader: a startup founder.** No jargon on the surface. Not
"transactional outbox", not "event-driven", not "pull request", not "deploy".
The surface text names a problem the founder recognises from their own week
and states what changes.

**Secondary reader: whoever the founder asks to vet this.** Every card carries
a collapsed layer with concrete examples and, at the end, one small dimmed line
of actual technical terms. The founder reads the examples and glides past the
last line without effort; the engineer finds what they came for.

The section sells capability ("what I can do for you"), not résumé ("what I
did"). Past work appears as supporting evidence inside the collapsed layer, not
as the headline.

## Content

Four cards, 2x2. Each card: a mini diagram, a headline stating the founder's
problem, a short body stating what changes, and a `<details>` disclosure
labelled "examples" holding concrete examples plus one dimmed technical line.

### Card 1 — repetitive work

> **Your team spends the day doing work a machine would do.**
> An order arrives on WhatsApp and someone retypes it into the system. The
> Monday report gets assembled by hand. The reconciliation nobody has time for.
> That becomes a routine that runs on its own, on schedule, without forgetting.

*Examples:* the WhatsApp order entering the system on its own · Monday's report
ready on Sunday night · a nightly reconciliation across two databases that
reports only what disagreed.

*Technical line:* queues and workers, scheduling, API/webhook integrations,
end-to-end automated testing.

### Card 2 — spreadsheets and decisions

> **Someone on your team spends the day filling in a spreadsheet.**
> The spreadsheet can stay — it just doesn't need to be filled in by hand. The
> data is born where it already happens and arrives there on its own. From
> there it becomes a dashboard that updates itself, that you can filter and
> cross on the spot, and that acts when a number crosses a limit you set.

*Examples:* a closed sale landing on the dashboard the moment it happens · cash
position updating itself instead of closing on the 5th · stock below minimum
alerting whoever buys, with nobody watching.

*Technical line:* continuous ingestion from the source tool's API, data
modelling and aggregation, interactive dashboard, trigger rules firing a
webhook, queue or notification.

Note: the point of this card is that the data stops being typed, not that a
dashboard exists. Founders ask Felipe for "BI from my Excel/Google Sheets"
frequently; the offer is larger than what they ask for, and the card says so.

### Card 3 — AI in the existing business

> **You want AI in what the company already does, not in a demo.**
> An assistant that answers on top of your documents and your data, respecting
> who is allowed to see what. And, where it makes sense, your team working the
> system from inside Claude or ChatGPT.

*Examples:* someone on the team asking "how much is left on the X contract?"
and getting the answer without opening the system · an internal policy answered
from the document that already exists, with the source cited · a ticket opened,
classified and routed straight from an email.

*Technical line:* an MCP server over the system, identity and permissions
resolved per user, an indexed company knowledge base.

### Card 4 — the idea hasn't been built

> **The idea hasn't left the drawing board yet.**
> You know what you want to build and you need someone to build it — and then
> to lead the team that keeps building. From the first prototype worth showing
> a customer to the team that runs on its own.

*Examples:* an MVP live in weeks to validate with real customers · the first
engineer hired and onboarded · the architecture decision taken now that doesn't
trap you a year from now.

*Technical line:* 12+ years in .NET and React, event-driven architecture, Head
of Technology for teams of 3 to 13.

### Section framing and CTA

- **Eyebrow:** in the site's existing mono/uppercase style.
- **Heading:** "How can I help you?" / "Como eu posso te ajudar?"
- **Lede:** in the register of *"I don't sell technology. I fix the process
  that today only moves when someone remembers to do it by hand."*
- **CTA, at the foot of the section:** primary **"Tell me your case"** opening
  the Ask widget with that question pre-submitted (`useAskWidgetStore.open`,
  the same mechanism `AskChips` uses); secondary **"Talk to me"** linking to
  `profile.contact.calendly`.

All copy ships in both `en` and `pt-BR`. The Portuguese is the original — it is
the language the founder conversation happens in — and the English is a
translation of it, not the other way round.

## Visual design

Each card carries a small SVG diagram of the flow it replaces: by hand on the
left, running on its own on the right. The visual language is the one
`ArchitectureDiagram` already establishes — mono labels, the signal accent, a
hairline border — so the section reads as part of this site rather than as a
marketing block pasted onto it.

Motion: each diagram plays its traversal once when it scrolls into view
(IntersectionObserver). Under `prefers-reduced-motion: reduce` it renders
static. The element carries `data-motion="static" | "animated"`, matching the
convention already used by `ArchitectureDiagram`, `HeroMap` and `Pill`.

Disclosure uses native `<details>`/`<summary>`: keyboard accessible without
custom code, works with JavaScript disabled, and leaves the collapsed content
in the DOM for crawlers — which matters, since this site is deliberately
optimised to be read by answer engines.

Mobile: the 2x2 grid becomes a single column. Diagrams shrink but stay.

## Structure

### Page order

`Hero` → **How I help** → `EngineeringShowcase` → live proof → `VisitHistory`
→ `AskChips`

`Hero` and `EngineeringShowcase` currently share one full-bleed breakout
wrapper in `web/src/routes/index.tsx`. They get split: the `-mt-6` that cancels
`<main>`'s top padding stays with `Hero`'s wrapper, the new section renders as
an ordinary `max-w-5xl` section (like the live-proof block), and
`EngineeringShowcase` gets its own full-bleed wrapper without the `-mt-6`.

### New files, under `web/src/components/home/help/`

| File | Responsibility |
|---|---|
| `how-i-help.tsx` | The section: eyebrow, heading, lede, the 2x2 grid, the CTA pair |
| `help-card.tsx` | One card: diagram slot, headline, body, `<details>` with examples + technical line |
| `help-diagram.tsx` | The four mini SVG diagrams and their in-view traversal |

Each gets a co-located `*.test.tsx`, matching the repo's existing convention.

### Copy

New `help.*` block in `web/src/i18n/locales/{en,pt-BR}/home.json`. The existing
`sendPulse.*` block is removed from both.

### Removals

- `web/src/components/home/send-pulse.tsx` and `send-pulse.test.tsx`.
- `traversalKey` state in `engineering-showcase.tsx`. `ArchitectureDiagram`
  already declares `traversalKey?: number` and skips the traversal effect when
  it is `undefined`, so the diagram simply renders static — no change needed
  in that component.
- `sendPulse.*` keys in both locale files.

### Deliberately not removed

`usePulseHub` stays: `LiveIndicator` depends on it for the live count and
connection state. Only its `react()` method loses its last caller in the web
app. The server's `PresenceHub.React` endpoint is left in place — removing it
is a separate decision about the backend, out of scope here.

## Tests

- New co-located tests for `how-i-help`, `help-card`, `help-diagram`.
- `web/src/routes/index.test.tsx`: the two assertions for the "Send a pulse" /
  "Enviar um pulso" button (lines ~74 and ~80) are replaced with assertions for
  the new section's heading in each locale.
- `web/src/components/home/engineering-showcase.test.tsx`: drop the `SendPulse`
  and `usePulseHub` mocking that exists only for the button.
- Coverage worth asserting explicitly: the `<details>` opens and reveals the
  examples; the CTA calls `useAskWidgetStore.open` with the expected question;
  `data-motion` is `"static"` under reduced motion.

## Known follow-ups, out of scope

`AskChips` at the foot of the home page still asks three recruiter questions
("Does Felipe have Kubernetes experience?", "What is Felipe's strongest
stack?", "Is Felipe open to remote roles?"). If the home page's audience is now
a founder, that block is aimed at the wrong reader and there are two AI entry
points on one page saying different things. Realigning or removing it is a
separate change.
