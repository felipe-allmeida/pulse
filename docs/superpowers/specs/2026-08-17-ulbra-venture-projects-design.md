# The ULBRA venture and its project list — design

## Problem

The projects index mixes two granularities without saying so.

`dietbox` is one card describing *a company* — a four-year engagement with a
`contribution` block and the site's only `leadership` section. `ulbra-atende`
and `ulbra-one` are two cards describing *two systems*, with no card for the
organization they belong to and nothing connecting them to each other. A reader
sees four unrelated projects where the truth is two engagements, one of which
produced six systems.

ULBRA is also absent from `profile.experience` entirely. The timeline runs from
Pampa Devs (`Current`) back to Vox Game Studio, and a Head of Technology mandate
running right now — three engineers, six systems — appears nowhere on the page
whose job is to list what the author has done.

Two more things are wrong on the existing cards:

- `ulbra-one` describes an ERP in the present tense (*"An internal ERP built to
  replace legacy systems"*) as though it had shipped. It is in testing,
  pre-launch.
- Both ULBRA cards carry `role: 'Software engineer'` / `period: 'Professional
  work'`. The role is wrong — he is Head of Technology there — and the period is
  a non-answer where every other entry on the site now carries real dates.

## Decision

Introduce a **venture**: an organization that contains projects. Fill it for
ULBRA now; leave Dietbox adoptable later without a second refactor.

### Alternatives rejected

- **Six more cards in the flat grid.** The grid goes from 6 to 10 cards, 6 of
  them ULBRA. The portfolio's variety — a live system, an insurance embed, a
  SaaS, a telephony test rig — drowns under one client.
- **A `/ventures/ulbra` route that is one long case study.** Six systems as
  sections of one page means none of them is linkable, and the site's whole
  case-study apparatus (`metrics`, `architecture`, `decisions`) is built per
  project, not per section.
- **Nesting projects inside the venture object.** `projects.ts` is 1300 lines
  and is consumed as a flat list by `pages.ts`, `json-ld.ts`, the
  `projects.generated.md` generator and ~25 tests. Nesting rewrites all four to
  buy nothing the foreign key does not.
- **An ULBRA-specific grouping, no abstraction.** Cheaper now, and wrong the day
  Dietbox is broken into its parts — which is already the stated next step.

## The venture model

New file `web/src/content/ventures.ts`:

```ts
export interface Venture {
  slug: string;
  name: string;
  /** The organization's own site, when there is a verified one. Same rule as
   *  `profile.experience[].url`: absent rather than guessed. */
  url?: string;
  role: LocalizedString;
  period: LocalizedString;
  /** How the engagement is held — "Client of Pampa Devs", "Side venture".
   *  Optional: direct employment needs no qualifier. */
  engagement?: LocalizedString;
  /** 1–2 sentences: what the organization is and what the mandate is. */
  summary: LocalizedString;
  /** The team led, when there is one. */
  team?: LocalizedString;
}
```

`Project` gains exactly one field:

```ts
/** The venture this project was built inside, by slug. Absent for
 *  independent work. */
venture?: string;
```

A project with no `venture` renders exactly as it does today. Dietbox adopts the
model later by adding a `Venture` entry and tagging whichever sub-projects get
written — no change to this code.

`engagement` replaces what would otherwise be a `sideVenture: boolean`, because
the two cases already in hand are not the same case: ROLÊ was a side venture run
alongside a day job, ULBRA is a client of the author's own studio. A boolean
would flatten both into one word that is wrong for one of them.

## Rendering on `/projects`

`projects` stays a single ordered array. The page walks it; a run of consecutive
projects sharing a `venture` is wrapped in a `<section>` carrying the venture
header — name (linked when `url` is set), role, engagement, period, team, summary
— above its own card grid. Everything else renders as it does now, `pulse`
featured and double-width.

The ULBRA group therefore renders **in place**, where `ulbra-atende` and
`ulbra-one` already sit: after `dietbox`, before `dell-automated-caller`. The
ordering invariants in `content.test.ts` (`dietbox sits between kota-embed and
the ulbra projects`, `dell-automated-caller is last`) hold unchanged.

Order inside the group:

1. Ulbra Atende — in production, the deepest case study
2. Ulbra One — the ERP, pre-launch
3. Ulbra CRM — inherited platform, rebuilt under his direction
4. Ulbra Admin — dashboards for the presidency and board
5. Student Dashboard — the installed kiosk
6. Infra — the platform everything above deploys onto

User-facing systems by weight, with the substrate last: Infra is the answer to
"how does any of this ship", and that answer reads better once the reader knows
what *this* is.

The four new projects ship **without screenshots**. `ProjectCover` already draws
a deterministic diagram from the project's own content, and its own
documentation says it exists precisely so that unphotographable systems are not
faked. Adding mockups for four internal systems would contradict that.

## The `/about` timeline

A new entry, most recent first:

```
role:       Head of Technology
org:        ULBRA
url:        https://www.ulbra.br
period:     Apr 2026 – Current          ← see Open questions
engagement: Client of Pampa Devs
summary:    Leads a three-engineer team building the university's internal
            platform — service desk, ERP, CRM, administrative dashboards and
            the datacenter automation they deploy onto.
```

`https://ulbra.br` was checked with a request: it answers 200 and redirects to
`https://www.ulbra.br/`, which is the form committed.

ULBRA is not a ninth employer. It is a client engagement held through Pampa
Devs, which is already on the timeline as `Current` — so the row is labelled as
such rather than passed off as separate employment. It still earns its own row
rather than a clause inside the Pampa Devs summary: the role and the period are
specific and checkable, and a Head of Technology mandate buried in a studio
blurb is a fact the page has hidden rather than published.

`profile.bio` currently ends *"Currently freelancing through Pampa Devs — his
software studio — and open to new roles"* and stops there. It gains the ULBRA
mandate in both locales.

**This breaks `content.test.ts:60` — *"only the current role has an open-ended
period"* — and the break is correct.** Pampa Devs and ULBRA are both current, and
they are current simultaneously because one is the client of the other. The test
is rewritten to allow more than one open-ended period while still requiring real
dates on every closed one, which is the invariant that was actually worth having.

The team is two engineers inherited on arrival plus one hired on 21 May 2026.
That hire is stated in the venture `team` string, not as a separate timeline
event.

## The six case studies

Every one gets `venture: 'ulbra'`, a real `role`, a real `period`, and a
`contribution` with an explicit `boundary` (see below). Facts below come from
the repositories in `~/dev/ulbra` and `~/dev/aelbra/infra` plus the author's own
account; nothing is inferred beyond them.

### Ulbra Atende — `ulbra-atende` (exists)

Already a full case study. Changes are the venture tag and the corrected
`role`/`period`. Its `metricsNote` says *"in ~3 months of production"* and the
figures are now roughly four months old — refresh pending (Open questions).

The codebase is named `ulbra-sau` and the product is named Ulbra Atende. The
site keeps the product name; the internal name tells the reader nothing.

### Ulbra One — `ulbra-one` (upgrade, thin → full)

A modular monolith in .NET 10 on PostgreSQL 17, EF Core code-first with
snake_case, React + Tailwind + shadcn, replacing the legacy Senior systems. Its
architecture conventions deliberately mirror Ulbra Atende — `IEndpoint`,
`Result<T>`, migrate-on-startup — so a developer moving between the two
codebases is not learning a second set of rules.

**Status corrected: in testing, about to launch.** Every sentence moves out of
the completed present tense. No production metric exists because there is no
production yet, and the `metrics` section is omitted rather than filled with
build-time trivia.

This also flips `content.test.ts:241` — *"every project except ulbra-one states
what the author did"* — since `ulbra-one` gains a `contribution`. The exception
is removed and the rule becomes universal.

### Ulbra CRM — `ulbra-crm` (new)

The university's CRM platform, inherited: no tests, unstructured code. Now at
100% test coverage, with usability work that moved it to React with TanStack
Router so that routing state — filters above all — survives navigation. Before,
every screen change was a full reload and the filters were lost.

**This is the one project where the author did not write the code.** He set the
direction and handed the work to the team. `contribution.boundary` says so
plainly. The precedent is `kota-embed`, which already names its front end as
someone else's work.

That makes it the clearest leadership artifact in the set — an inherited
codebase taken from zero tests to full coverage by three engineers under his
direction — and it is only worth publishing because it is labelled accurately.
`metrics`: test coverage 0% → 100% is a real, checkable number and is the one
figure this case study carries.

### Ulbra Admin — `ulbra-admin` (new)

Administrative dashboards used by the presidency and the board to check the
university's numbers. A .NET 10 API and a React 19 SPA reading two external
sources: the CRM's MongoDB, read-only, and enrollment from the Prime Oracle
system through `prime-api`, a typed HTTP client — never Oracle directly.

Its `decisions` section is the strongest in the group, because the codebase
states its own constraints: *single project, no modules, no DDD*, and *never
query Oracle directly*. Ulbra Atende, from the same team and the same quarter, is
a modular monolith. Two systems in one house with opposite architectures for
declared reasons is exactly what a decisions section is for — the reader learns
that the architecture was chosen per problem rather than applied by habit.

Design tokens are inherited from Ulbra Atende, which is how six systems built in
five months look like one platform.

### Student Dashboard — `ulbra-student-dashboard` (new)

Installed in Building 1, the medical school, where it shows the class schedule.
A .NET 10 API and a React 19 SPA, with an ODBC container reading a Microsoft
Fabric Lakehouse.

Two faces on one system: `/display` is a 768×512 fullscreen kiosk that rotates
schedule pages and marketing slides on a fixed cadence and switches between a
day and a night theme by clock; `/admin` is Google-SSO-protected CRUD over the
marketing content, with a scheduled playlist. The kiosk polls rather than holds a
socket — the right call for an unattended screen that must recover from a network
blip without anyone walking to Building 1.

### Infra — `ulbra-infra` (new)

The one the author explicitly wants explained, and the one with the sharpest
before/after.

**Before:** everything on-premise, nothing automated. Deployment meant a person
on the box installing Node and running the app by hand.

**After:** `setup-servidor.sh` takes a bare server to ready in one run — Docker
and dependencies, daemon and firewall, Node Exporter, Swarm initialized as
manager, overlay networks, then Traefik and the observability stack (Grafana,
Prometheus, Loki, Tempo). Per application it is a compose file with Traefik
labels and a GitHub Actions workflow: push → build image → push to registry →
SSH → `docker stack deploy`. OpenTelemetry is opt-in through two environment
variables, after which metrics, logs and traces appear in Grafana without
further wiring.

Rendered with `architecture` (the two-phase flow: provision once, then per app)
and a sanitized `script` excerpt. **`content.test.ts:222` forbids publishing any
hostname, URL or credential in a project narrative, and the infra README is full
of internal hostnames.** Every sample is rewritten with placeholder domains
before it is committed; the test is the enforcement.

`comparison` — the site's to-scale before/after figure — is the natural fit for
manual-versus-CI, but it needs two numbers to draw. Pending (Open questions); if
no numbers arrive, the contrast stays prose and the figure is omitted rather
than drawn to invented proportions.

## Contribution boundaries

Three engineers, six systems, and a lead who is in all of them. Without an
explicit boundary the page silently claims his team's work.

| Project | Boundary |
| --- | --- |
| Ulbra Atende | one engineer alongside him |
| Ulbra One | one engineer alongside him |
| Ulbra CRM | **directed only — the team implemented it** |
| Ulbra Admin | his alone |
| Student Dashboard | his alone |
| Infra | his alone |

`contribution.boundary` is omitted only where he genuinely built it alone.

## Downstream effects

Everything below already derives from `src/content` and follows automatically —
listed so that none is discovered as a surprise:

- **`pages.ts`** enumerates `projects` for the index summary, the per-project
  static pages, the sitemap and the markdown mirrors. Four new slugs mean eight
  new prerendered documents (two locales) with no code change. The venture
  header must also reach the static shell — a crawler that does not run
  JavaScript should see that these six belong to one engagement.
- **`json-ld.ts`** picks up the projects; the timeline change feeds `alumniOf`'s
  neighbours in the same graph.
- **`projects.generated.md`** must be regenerated with `pnpm gen:assistant`, or
  `assistant-profile.test.ts` fails on drift. That is the intended behaviour:
  forgetting breaks CI rather than shipping an assistant that contradicts the
  page it sits on. Grounding grows by four new case studies plus one upgraded
  from a stub, on top of the ~7,500 tokens already there — worth re-checking
  against the 500/day cap before merge.
- **`profile.md`** (the assistant's hand-written half) describes current work.
  It says nothing about ULBRA and must.
- **FAQ** — "what is he working on now" is answered by the About page's current
  role. That answer is now incomplete.

## Tests

New:

- Every venture string is localized in every locale.
- Every project's `venture` resolves to a real venture slug.
- Projects sharing a venture are contiguous in the array — the grouping renders
  from array order, so a split run would silently produce two headers for one
  venture.
- Every ULBRA project is `private` with no repository link (extends the existing
  rule at `content.test.ts:68`).
- Ulbra CRM names the work as the team's.
- The venture URL is absolute https.

Changed:

- `content.test.ts:60` — more than one concurrent open-ended period is allowed.
- `content.test.ts:241` — the `ulbra-one` exception is removed.
- `content.test.ts:68` — extended to the four new slugs.

Unchanged and load-bearing: `content.test.ts:222`, the no-hostname rule, which is
what keeps the infra write-up publishable.

## Open questions

Blocking the final copy, not the implementation plan. Each is marked in the plan
as an explicit gap.

1. **Start date.** Stated as 5 May 2026. The first commits, all authored by
   Felipe de Almeida, predate it: `infra` 9 Apr, `ulbra-sau` 18 Apr,
   `ulbra-student-dashboard` 28 Apr. Nearly a month of code before the date.
   `Apr 2026` covers both and is what this spec assumes; if 5 May is the
   contract date and April was a pilot, the period should describe the work.
   The page exists to be checked by a recruiter, so the two must agree.
2. **ULBRA's scale.** "The whole of ULBRA" — how many people, how many campuses?
   It is the number that sizes the mandate, and the Atende `problem` section
   currently has none.
3. **Ulbra Atende metrics refresh.** `metricsNote` says ~3 months; it is now ~4.
4. **Metrics for One, Admin, Student Dashboard and Infra.** None supplied.
   Absent numbers, `metrics` is omitted per project — the type allows it and an
   invented figure is worse than a missing section. Infra's `comparison` figure
   depends on this.
