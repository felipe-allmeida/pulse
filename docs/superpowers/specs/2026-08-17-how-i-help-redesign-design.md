# "How can I help you?" — asymmetric grid, and a CTA that reaches a human

**Date:** 2026-08-17
**Status:** approved, ready for planning
**Supersedes parts of:** `2026-08-17-how-i-help-home-design.md` (layout and CTA
only — the audience, the voice and the card copy from that spec stand)

## Why

The section shipped and does its job on content. Two things about it do not
work.

**The layout has no hierarchy and the diagram earns nothing.** Four cards in a
2x2 grid, identical border, identical weight, each topped by the same three
icons joined by two short lines. Nothing pulls the eye, so the reader has to
choose an entry point themselves — and at 16px next to a three-word mono label,
`Hand → Workflow → CheckCircle2` is decoration, not information. The animated
dot travelling the edge costs an `IntersectionObserver`, a reduced-motion
branch and a test file to say something the headline underneath already says
better.

**The primary CTA lies about where it goes.** "Tell me your case" opens the Ask
widget, which is a retrieval assistant scoped to Felipe's profile — its own
disclaimer says the answers come only from the profile. A founder who accepts
that invitation and describes their actual problem gets "I don't have that
information about Felipe." That is the worst possible answer at the highest
point of buying intent on the page. The button promises a channel and delivers
a résumé chatbot.

## Layout

The 2x2 grid becomes an asymmetric one.

- **Featured card — `repetitive`**, full width, `border-signal` at 2px,
  headline at `text-xl`, full body, and the `hoje / depois` block described
  below.
- **Three compact cards — `spreadsheet`, `ai`, `idea`** — a three-column row
  from `md` up, stacked on mobile. Headline at `text-base`, the same body copy
  they carry today, and a single mono line stating the outcome.

Card order stays `repetitive, spreadsheet, ai, idea`, so `HELP_CARD_KEYS` keeps
its meaning and the existing ordering test keeps holding.

Hierarchy comes from card size, not from cutting copy. Every paragraph that
exists today survives — this page is deliberately built to be read by answer
engines, and shortening the bodies to fit a narrower column would trade
retrievable text for whitespace.

Featuring `repetitive` is a claim: it says repetitive manual work is the
headline offer. It is a one-line parameter, not a rewrite — if another card
converts better, promote that one instead.

## Card anatomy

`help-diagram.tsx` is deleted in full: the twelve icons, the `ICONS` map, the
`IntersectionObserver`, the traversal timers, the reduced-motion branch, and
`help-diagram.test.tsx`. The `HelpCardKey` type and `HELP_CARD_KEYS` move to a
new `help-cards.ts` with no JSX, so `how-i-help.tsx` and `help-card.tsx` import
their shared vocabulary from a module that holds nothing else.

`signal-edge` in `styles.css` and the `use-reduced-motion` hook both stay —
`architecture-diagram.tsx` still uses them.

In the diagram's place, a monospace pair:

- **Featured card:** two lines between hairline rules — `hoje` in
  `text-muted-foreground`, `depois` in `text-signal-strong`, labels aligned in
  a fixed-width column so the two outcomes line up.
- **Compact cards:** the `depois` line only, prefixed with `→`, above the
  disclosure.

No JavaScript, no animation, no scroll observer. It reuses the mono-plus-signal
grammar the event feed and the architecture diagram already establish, so the
section reads as part of this site rather than as a marketing block pasted onto
it.

The `<details>` disclosure — three examples plus one dimmed technical line —
is unchanged on both card sizes. It works, it is keyboard accessible with no
code of ours, and it keeps the collapsed copy in the DOM for crawlers.

## Copy

In `home.json` for both locales, each card's `diagram: { from, via, to }`
becomes `transform: { before, after }`. Both strings are short enough to serve
the featured card's two-line block and the compact cards' single line.

| Card | `before` (pt-BR) | `after` (pt-BR) |
| --- | --- | --- |
| `repetitive` | alguém redigita, toda segunda | roda sozinha, no horário |
| `spreadsheet` | o caixa fecha no dia 5 | painel que se atualiza sozinho |
| `ai` | a resposta está enterrada num PDF | resposta com a fonte citada |
| `idea` | a ideia está no papel | MVP no ar e time tocando |

| Card | `before` (en) | `after` (en) |
| --- | --- | --- |
| `repetitive` | someone retypes it, every Monday | runs on its own, on schedule |
| `spreadsheet` | cash closes on the 5th | a dashboard that updates itself |
| `ai` | the answer is buried in a PDF | an answer with the source cited |
| `idea` | the idea is on paper | an MVP live and a team running it |

Two new keys carry the labels: `help.transformLabels.before` ("hoje" / "today")
and `help.transformLabels.after` ("depois" / "after"). Card headlines, bodies,
examples and technical lines are untouched.

## The CTA

`useAskWidgetStore` leaves this section. The Ask widget itself stays — the Hero
still opens it, and answering questions about Felipe is what it is good at.

The primary CTA becomes an anchor to `profile.contact.whatsapp` with a
prefilled message:

```
https://wa.me/<the number in profile.contact.whatsapp>?text=<encoded>
```

The message is deliberately an unfinished sentence, so the founder completes it
instead of facing an empty box:

- pt-BR: `Oi Felipe, vim pelo seu site. O que trava aqui hoje é `
- en: `Hi Felipe, I came from your site. What's stuck here today is `

It lives in `home.json` as `help.cta.whatsappMessage` and is passed through
`encodeURIComponent`. The link opens in a new tab with `rel="noreferrer"`, the
same treatment `contact-buttons.tsx` already gives the WhatsApp link on the
About page.

The visible label stays "Me conta o seu caso" / "Tell me your case" — the
invitation is the right one, it was only pointed at the wrong destination. The
accessible name names the destination ("… no WhatsApp" / "… on WhatsApp") so
the control does not hide where it goes. The icon stays `MessageCircle`;
`lucide-react` dropped its brand icons, so there is no WhatsApp glyph to use.

Calendly keeps its place as the outline secondary, unchanged.

If `profile.contact.whatsapp` is empty the button is not rendered, matching how
`calendly` already gates the booking CTA.

## Testing

- Delete `help-diagram.test.tsx` along with the component.
- `help-card.test.tsx`: drop the `help-diagram` mock. Assert the featured card
  renders both `before` and `after`; assert a compact card renders `after` and
  not `before`; keep the existing coverage of the examples list, the technical
  line, and the malformed-`examples` fallback.
- `how-i-help.test.tsx`: drop the `help-diagram` mock. Assert the four cards
  still render in `HELP_CARD_KEYS` order, that exactly one is featured, that
  the primary CTA is a link whose `href` is the `wa.me` URL carrying the
  encoded message, and that its accessible name names WhatsApp.
- `help-copy.test.ts`: this is the gate on the copy change. Its `HelpBlock`
  type declares `diagram: { from, via, to }` and it asserts all three nodes are
  non-empty in both locales — both become `transform: { before, after }`. Add
  `transformLabels` and `cta.whatsappMessage` to the type and to the
  section-level non-empty check, and extend the jargon guard to cover
  `transform.before` and `transform.after`: those strings sit on the card
  surface, which is exactly the text that must stay founder-readable.
- `index.test.tsx` needs no change — it asserts nothing about the Ask widget
  opening from this section.
- `tsc -b` is the authoritative typecheck, not `tsc --noEmit`.

## Out of scope

- Rewriting card headlines, bodies, examples or technical lines.
- Changing the Ask widget's behaviour, prompt or knowledge base.
- A lead-capture form or any backend endpoint. WhatsApp is the channel; there
  is nothing to build behind it.
- Touching any other home-page section.
