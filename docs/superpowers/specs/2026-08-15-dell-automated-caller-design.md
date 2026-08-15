# Dell Automated Caller — case study + case-study figures — Design Spec

- **Status:** Approved design, pending implementation plan
- **Date:** 2026-08-15
- **Scope:** Add Dell Automated Caller as a fifth project on `/projects`, and give the case-study pages three new figure types — a script block, a before/after comparison, and a result table — plus a visual refinement to the existing architecture flow that all three case studies inherit.

---

## 1. Purpose

The portfolio's case studies are all prose, numbers, and a row of labelled boxes.
That works, but it leaves the most concrete thing about a project — what it
actually looks like to use, and what it actually produced — on the page as a
description of itself.

Dell Automated Caller is the project that most needs the fix and best justifies
building it. It is an internal tool from 2020 with no public instance and no UI
in the repository, so there is nothing to screenshot; but its substance is
unusually showable. It has a real domain-specific language with a grammar that
can be printed, a data model whose output is a three-column comparison, and a
before/after result that is the strongest single number in the portfolio: a test
cycle that took about a month by hand ran in about three hours.

The figures built here are generic. Dell fills all of them; the other case
studies use the ones that apply.

---

## 2. Decisions (locked)

- **Dell may be named.** The client, the product, and the architecture are
  publishable. Internal infrastructure is not: no deployment endpoints, no
  internal host names, no environment names, and no credentials of any kind
  from the source repository's build configuration. Naming which products
  those are would itself be the disclosure this rule exists to prevent.
- **Nothing is presented as a screenshot.** There is no UI in the repository —
  only the stock ASP.NET Core scaffold views — so no rendering of a product
  interface is possible without inventing it. Every figure is an illustration of
  the system's *inputs and outputs*, drawn from the real grammar and the real
  data model, and is labelled as an illustration. A mockup dressed as a capture
  of a named client's product would be a fabricated record, and is out of scope
  regardless of how it is framed.
- **HTML where the content is text or data.** The script block and the result
  table are HTML because they are text and tabular data that must be selectable
  and reachable by a screen reader. The before/after comparison was specified as
  SVG on the theory that its meaning is proportion; during implementation that
  was reversed — two horizontal bars are not geometry, and a `div` whose width is
  a percentage states the proportion as truthfully as a `<rect>` while keeping
  the labels as real text. See the implementation plan's deviations list.
- **The architecture flow stays DOM-based.** It stacks on mobile and is
  navigable today; an SVG rewrite would trade both away for looks. It gets a
  visual refinement, not a new rendering model.
- **Two classes of number, distinguished.** The DSL command count and the
  validation-target count are verifiable in source. The call volume and the
  cycle duration are the author's recollection of a 2020 project and cannot be
  verified from the repository. Both are publishable; the spec records which is
  which so nobody later mistakes testimony for measurement.
- **Existing invariants hold.** `visibility: 'private'`, `links: []`, no
  external links, all copy localized `en` / `pt-BR`, exactly one `<h1>`.

---

## 3. Schema

Three new optional fields on `ProjectDetailContent`:

```ts
/** A short, real script or config sample, rendered as a code block. */
export interface CaseStudyScript {
  /** Short label above the block — "A test script", "Um roteiro de teste". */
  caption: LocalizedString;
  /** Lines of the sample, verbatim. Not localized: it is code. */
  lines: string[];
  /** Optional note under the block. */
  note?: LocalizedString;
}

/** A two-sided before/after figure, drawn to scale. */
export interface CaseStudyComparison {
  caption: LocalizedString;
  before: { label: LocalizedString; value: LocalizedString; /** relative magnitude, any unit */ weight: number };
  after: { label: LocalizedString; value: LocalizedString; weight: number };
  /** Where the numbers come from, shown as a footnote. */
  source?: LocalizedString;
}

/** A small illustrative table of the system's output. */
export interface CaseStudyTable {
  caption: LocalizedString;
  columns: LocalizedString[];
  /** Row cells, already formatted. Illustrative values, real structure. */
  rows: string[][];
  note?: LocalizedString;
}
```

`ProjectDetailContent` gains `script?`, `comparison?`, and `table?`. No existing
field changes.

`weight` is a unitless relative magnitude driving bar length. It exists
so the figure cannot silently misrepresent the comparison: the numbers on screen
and the bar lengths come from the same content.

---

## 4. Components

Four files under `web/src/components/projects/`, each with a colocated test,
each returning `null` when its field is absent.

### 4.1 `case-study-script.tsx`
A `<pre><code>` block in the site's mono face, on the panel background already
used by the metric tiles, with the optional note below as a `<figcaption>`.
The caption is not rendered here — it is the section heading (see below). Command keywords are emphasized by wrapping the
first token of each line in a `<span>`; no syntax-highlighting dependency, no
`dangerouslySetInnerHTML`. Horizontally scrollable inside its own container so a
long line never widens the page.

### 4.2 `case-study-comparison.tsx`
Two horizontal bars whose lengths are proportional to `weight`, each labelled
with its value and label, and the source as a footnote below. Plain elements, not
SVG: the labels are real text a screen reader reads in document order, so no
`role="img"` and no `<title>`/`<desc>` restating them is needed. A weight of zero
or less draws no bar at all — the minimum-width floor keeps a small number
visible, never invents one. Colors come from the signal tokens; no animation.

### 4.3 `case-study-table.tsx`
A real `<table>` with `<th scope="col">`, wrapped in an `overflow-x-auto`
container. No `<table>`-level `<caption>` element: the figure's caption is the
section heading (see below), and rendering it twice would duplicate it. The note renders below and carries the illustrative
disclaimer.

### 4.4 `case-study-architecture.tsx` (refine)
Keeps its DOM structure, its props, and its stacking behavior. The refinement is
presentational only: the node box gains the panel treatment used by the metric
tiles so the two figures read as one family, and the connector gains a subtler
weight. No prop change, so `ulbra-atende` and `kota-embed` inherit it without
touching their content.

`project-detail.tsx` renders the new sections in this order, after the existing
ones: **… Architecture → Script → Comparison → Table → What it does →
Engineering decisions.** The figures sit next to Architecture because they are
all "how it works"; the feature list and decisions stay last.

**Each figure's own `caption` is its section heading**, rendered through
`SubsectionHeading` like every other section title. No new keys are added to the
`projects` i18n namespace: a heading like "A test script" is specific to one
project's figure, not a label the site reuses, so it belongs in content next to
the thing it names. This also means a second project adopting a figure words its
own heading rather than inheriting Dell's.

---

## 5. Dell Automated Caller content

**Tagline.** Automated end-to-end testing for a phone system.

**Overview.** An internal tool that tests an interactive voice system by
actually calling it: a test script drives a real phone call, the system's spoken
responses are transcribed and checked, and the result is reported back into the
test-management tool alongside the rest of the suite.

**Problem.** Testing a phone menu meant a person dialling it, pressing the keys,
listening to what the system said, and writing down whether it was right — once
per scenario, per language, per route. A full cycle was over twenty thousand
calls placed by hand, which in practice meant the full cycle almost never ran.
Automating it took the cycle to about three hours.

**Metrics** (three tiles):

| Value | Label | Note |
|---|---|---|
| 20k+ | calls per test cycle | previously placed one at a time, by hand |
| ~3h | to run the full cycle | it had taken about a month |
| 9 | commands in the test DSL | the script is validated before anything is dialled |

The first two are the author's recollection; the third is verifiable in source.

**Architecture summary.** A .NET Core service in DDD layers. The API accepts a
script; a validator rejects a malformed one before a call is placed; the run is
dispatched over a RabbitMQ publish/subscribe queue; a telephony provider places
the call and posts each transcribed response back by webhook; the response is
scored against what the script expected; the outcome is written back to the
test-management tool against its plan, suite and work-item identifiers.

**Diagram nodes** (five, linear): `Test script` → `Validator` → `Queue` →
`Telephony provider` → `Test management`.

**Script figure.** A real, valid script under the grammar the validator
enforces:

```
Setup (Language="en-US")
Dial +1 (000) 000-0000
Wait 3
Hear [Confidence=85%] thank you for calling, please say or enter your service tag
Enter (serialnumber) 1234567#
Hear [WaitBefore=2] one moment while I look that up
Validate IVR
Hang
```

The dialled number is a documentation placeholder, not a real one.

**Comparison figure.** About a month of manual testing against about three
hours automated, sourced to the author's recollection.

**Table figure.** Three columns — expected, heard, similarity — over three rows
showing a pass, a near-miss that still passes on its declared threshold, and a
failure. Structure from the real `SpeechResult` model; values illustrative.

**Decisions** (four):

1. **Assert on similarity, with the threshold declared per step.** Speech
   transcription is never character-exact, so comparing for equality fails good
   tests. Each assertion carries its own tolerance in the script, because how
   close a transcription lands depends on what was said — a stock prompt
   transcribes reliably, a product name does not.
2. **The script is a small language, validated before anything is dialled.** A
   real call costs time and money and cannot be undone. The validator checks
   that the required commands are present, that single-use commands appear once,
   that the order is legal, and that each line matches its grammar — reporting
   every error in plain language before the first digit is dialled.
3. **A queue between the request and the call.** A phone call takes minutes and
   fails for reasons outside the caller's control. Publish/subscribe decouples
   whoever asked for the run from whatever executes it, so a slow or failed call
   never blocks the request that started it.
4. **Checking more than the audio.** Hearing the right words does not prove the
   call was routed correctly. Separate validation steps check the voice menu,
   the telephony routing, and the records both left behind — which is what makes
   it an end-to-end test rather than an audio assertion.

**Highlights.**
- A test script is a short list of ordered commands: dial, wait, enter digits, listen, validate, hang up.
- Placeholders in the script are substituted at run time, so one script covers many data sets.
- Every spoken response is stored with what was expected, what was heard, and how closely they matched.
- Results are written back to the test-management tool against the plan, suite and work item they belong to.
- A malformed script is rejected with a readable list of errors before any call is placed.

**Tech chips.** `.NET Core`, `RabbitMQ`, `Entity Framework`, `Twilio`,
`xUnit`.

Note: an earlier draft also listed `Polly`, taken from the source repository's
own README. Verified against the source during review: no project references it
and there is no retry code anywhere. The README over-claimed; the chip was
removed rather than inherited.

**Role.** Conception, architecture and implementation — later mentoring the
junior engineer who joined the project.

**Period.** 2020.

**Position.** Last in the projects array — it is the oldest work.

**Slug.** `dell-automated-caller`.

---

## 6. Testing

- **Content test:** Dell joins the both-locale sweep; the new figure fields are
  checked for both locales where localized, and the comparison's `weight` values
  are asserted positive so a zero-length bar cannot ship.
- **Component tests:** each figure renders its content in both locales and
  returns nothing when its field is absent. The comparison asserts its
  accessible name describes both sides. The table asserts a real `<th>` per
  column.
- **Page test:** `/projects/dell-automated-caller` renders its `<h2>`s in the
  locked order, with one `<h1>` and no external link.
- **Regression:** `ulbra-atende` and `kota-embed` still render exactly the
  sections they render today — the architecture refinement must not change their
  section list.
- No test pins a metric value.

---

## 7. Out of scope

- Any rendering that could read as a screenshot of a client product.
- New figures for `pulse`, `ulbra-atende`, or `ulbra-one`. They inherit the
  refined architecture flow; they gain no script, comparison, or table, because
  they have none to show.
- Syntax highlighting as a dependency.
