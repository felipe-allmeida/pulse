# Attribution section + flow figures — Design Spec

- **Status:** Approved design, pending implementation plan
- **Date:** 2026-08-15
- **Scope:** Three changes to the project case-study pages: replace the cramped horizontal architecture diagram with a stacked row layout, add a dedicated "What I did" section so each project states the author's actual contribution, and give Kota Embed and Ulbra Atende generated figures of their own.

---

## 1. Purpose

Three problems, one set of files.

**The architecture diagram is cramped.** Five nodes across a `max-w-3xl` column leaves about 130px per box. Labels wrap mid-phrase, `provider-agnostic` hyphenates across lines, and because the row centres its items the boxes float at different heights and nothing aligns. It also renders as two different layouts — a row on `sm+`, a stack below — and only one of them gets looked at.

**The pages do not say what the author did.** `role` is one mono line under the tagline, easy to skip, and on the older projects it says nothing: "Design & implementation", "Software engineer". A reader finishes a case study knowing what the system does and not what this person built. On a portfolio that is the whole point of the page.

**Two projects have no figure.** Dell has three; Kota and Ulbra Atende have prose and a node row. The material for better exists — Kota's intent lifecycle and Ulbra Atende's ticket-and-SLA flow are both real, documented, and the author's own work.

---

## 2. Decisions (locked)

- **One layout, not two.** The flow renders as stacked rows at every width: label on the left, detail on the right, over the left rail with dots the page already uses for decisions and highlights. No breakpoint switch, so there is no second layout that nobody reviews.
- **One primitive, two meanings.** Rewriting the architecture flow produces exactly the renderer a state machine needs. Rather than ship two near-identical components, extract a shared flow primitive and drive it from two content fields: `architecture` (topology — what calls what) and `states` (lifecycle — what happens next). Same rendering, different semantics, different section headings.
- **Attribution is a section, not a line.** A `contribution` field renders as its own `<h2>` section immediately after the overview — before the problem, because a reader deciding whether to keep reading should learn the author's part early. `role` stays as it is: it feeds the card and the page header, where a short line is right.
- **Attribution states its boundary.** Where work was shared, the section says so explicitly rather than leaving the reader to assume. Kota's says the front end was built by others. Silence about a boundary reads as a claim over everything.
- **Figures are generated, never captured.** Kota's product runs behind a third party's authentication and the author has no commits in its front-end repository; a screenshot of that UI on this page would attribute someone else's work to him, contradicting the very section this spec adds. Both new figures are drawn from the parts he built.
- **Ulbra One is out of scope.** It remains a three-bullet shell; it gets its own work later, with the same repository-and-database groundwork the other three had.
- **Existing invariants hold.** All copy localized `en` / `pt-BR`, exactly one `<h1>`, private projects keep `links: []`, no client infrastructure or personal data anywhere.

---

## 3. Schema

```ts
/** What the author actually did on a project. */
export interface ProjectContribution {
  /** One or two sentences naming the contribution. */
  summary: LocalizedString;
  /** The specific areas owned — 2-5 items. */
  areas?: LocalizedString[];
  /** What was explicitly someone else's. Omit when the author built it all. */
  boundary?: LocalizedString;
}

/** One step in a flow — a topology node or a lifecycle state. */
export interface CaseStudyFlowStep {
  /** Short label. A product name or a state name, so not localized. */
  label: string;
  detail: LocalizedString;
}

/** A named sequence of steps: what calls what, or what happens next. */
export interface CaseStudyFlow {
  /** Doubles as the section heading. */
  caption: LocalizedString;
  summary?: LocalizedString;
  steps: CaseStudyFlowStep[];
}
```

`ProjectDetailContent` gains `contribution?: ProjectContribution` and
`states?: CaseStudyFlow`.

The existing `architecture?: { summary; nodes }` is **migrated** to
`CaseStudyFlow`: `nodes` becomes `steps`, and it gains an optional `caption`
that defaults to the existing `architectureHeading` i18n key when absent. This
keeps the three projects that already have an architecture working without
content edits beyond the rename, and it means `states` and `architecture` share
one type rather than two that drift.

`CaseStudyArchitectureNode` is renamed to `CaseStudyFlowStep`. It has no other
consumers.

---

## 4. Components

### 4.1 `case-study-flow.tsx` (new, replaces `case-study-architecture.tsx`)

An optional summary paragraph, then an `<ol>` on a left rail. Each `<li>` is a
row: a fixed-width mono label in the signal colour, and the detail beside it at
body width. A dot marks each step on the rail, matching the treatment
`CaseStudyDecisions` already uses.

The label column is fixed at `10rem` on `sm+` and stacks above the detail below
that — the only responsive behaviour, and it changes nothing structural: the
same elements in the same order, one just wraps. Renders `null` when `steps` is
empty. No animation.

`case-study-architecture.tsx` and its test are deleted. Their behaviour is
covered by the new component's tests.

### 4.2 `project-contribution.tsx` (new)

The summary as a paragraph, the areas as the same left-rail bullet list the
highlights use, and the boundary as a closing line set apart from them — muted,
so it reads as a qualification rather than an achievement.

### 4.3 `project-detail.tsx`

Section order becomes: **Overview → What I did → The problem → By the numbers →
Architecture → States → Script → Comparison → Table → What it does → Engineering
decisions.**

"What I did" takes a new i18n key in the `projects` namespace — unlike a figure
caption, it is a label the site reuses across every project, so it belongs in
the namespace and not in content. The architecture and states sections take
their heading from the flow's own `caption`, falling back to
`architectureHeading` for architecture when the caption is absent.

---

## 5. Content

### 5.1 Contribution, per project

- **Pulse** — sole author. Design, backend, front end, infrastructure.
- **Kota Embed** — backend, platform team: the multi-tenant core, the intent
  workflows, the public API contract, integration testing. Boundary: the front
  end was built by others.
- **Ulbra Atende** — principal author, from scratch. Architecture, backend,
  front end, deployment.
- **Dell Automated Caller** — conception, architecture and implementation, and
  later mentoring the junior engineer who joined.
- **Ulbra One** — no `contribution`; out of scope, so the field is simply absent
  and its section does not render.

### 5.2 Kota Embed — the intent lifecycle

A `states` flow captioned "The life of an enrollment" / "A vida de uma adesão",
with a summary explaining that an enrollment cannot finish inside one request, so
its in-between state is a persisted entity the system can query and resume.

The step labels are the **real status values** from the enrollment intent's status
enum, not invented ones — domain vocabulary, which the confidentiality rule
covers only insofar as it forbids infrastructure, credentials and partner names.
Using the real names makes the figure checkable rather than decorative:

`Processing` (the request is recorded and validated before anything external is
called) → `ActionRequired` (the insurer needs something only a person can supply,
and the intent says so instead of failing) → `PendingConfirmation` (everything is
gathered; the requester confirms) → `Enrolling` (handed to the insurer's adapter,
which answers on its own schedule) → `Enrolled` (the policy exists, and the
platform reports it).

The summary notes that the enum also carries terminal states the happy path skips
— an intent can end `Ineligible` or `NotUndertaken` — so the figure does not imply
that every enrollment reaches the end.

### 5.3 Ulbra Atende — the life of a ticket

A `states` flow captioned "The life of a ticket" / "A vida de um chamado",
covering intake through closure with the SLA clock as the thread. Step labels are
the real ticket statuses, with the pause modelled as its own recorded entity
rather than a status:

`Open` (the SLA clock starts against the receiving team's policy) → `InProgress`
(an assignee owns it; first-response is already measured) → `Paused` (waiting on
the requester or a third party — the clock stops, and who paused it and why is
recorded as its own entry) → `Completed` (the requester is asked to rate it).

The summary notes that a ticket can also end `Cancelled`, and that work needing
sign-off waits on an approval before it starts.

### 5.4 Pulse

No new figure. Its home page already carries a live architecture diagram that
animates a real event crossing the pipeline; a static second one on the project
page would be a worse copy of something the visitor can watch working.

---

## 6. Testing

- **Content test:** every `contribution` and `states` field has both locales
  throughout; `areas` and `steps` are non-empty where present; the four in-scope
  projects have a `contribution`.
- **Component tests:** `CaseStudyFlow` renders its steps in order in both
  locales, returns nothing when empty, and renders no heading of its own.
  `ProjectContribution` renders summary, areas and boundary, and omits the
  boundary cleanly when absent.
- **Page tests:** the section order above holds for a project with every
  section, and for one with only some; a project with no `contribution` renders
  no "What I did" heading.
- **Migration:** the three existing architecture flows still render, and
  `ulbra-one` — which has neither new field — renders exactly the sections it
  renders today.

---

## 7. Out of scope

- Ulbra One's case study.
- A screenshot of Kota's front end. Revisit separately if wanted; it is not
  blocked by this work.
- Any change to the card grid on `/projects`.
