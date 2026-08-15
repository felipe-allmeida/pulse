# Project pages — case-study sections, starting with Ulbra Atende — Design Spec

- **Status:** Approved design, pending implementation plan
- **Date:** 2026-08-14
- **Scope:** Extend the `/projects/$slug` detail page with optional case-study sections (problem, metrics, architecture, decisions), and fill them in for `ulbra-atende` using material gathered from the client's private repository and its production database. Frontend + content only — no backend, no realtime, no deploy change.

---

## 1. Purpose

The project detail page today renders exactly two things beyond the header: a
one-paragraph overview and three to five bullet highlights. For `ulbra-atende`
those bullets are generic enough to describe any ticketing system ever built
("role-based access", "configurable ticket workflows"). Nothing on the page
tells a reader what problem the system solved, how big it actually is, or which
engineering decisions were made and why.

That is the whole value of the project in a portfolio. Ulbra Atende replaced
GLPI as the single intake channel for ULBRA's IT department, and in its first
three months in production it absorbed roughly 2,400 tickets with a median
first response around six minutes. It also does something genuinely uncommon:
it runs its own OAuth 2.0 authorization server and exposes an MCP server, so a
user can connect Claude or ChatGPT to their own account and work tickets in
natural language under exactly the permissions they already have.

This spec adds the structure to say all of that, in a form the other projects
can adopt later.

---

## 2. Decisions (locked)

- **Reusable schema, not a bespoke page.** Case-study content lives in optional
  fields on `ProjectDetailContent`. `ProjectDetail` renders each section only
  when its field is present. Ulbra Atende fills all of them; `pulse` and
  `ulbra-one` keep working untouched and can be enriched later.
- **Rounded numbers, never exact.** Production figures are published as orders
  of magnitude ("~2.4k tickets", "200+ users", "~5.0 CSAT"), not exact counts.
  Rounded numbers read less like a database dump, age better as the system
  grows, and keep the client's operational detail out of a public page.
- **No personal data, ever.** No user names, e-mails, ticket titles, ticket
  bodies, or comment text — not in copy, not in screenshots. Aggregates only.
- **GLPI may be named.** Confirmed by the project owner. The system it replaced
  is part of the story.
- **Zela is out of scope.** The inspections/routines/shifts sub-product is
  still in development and has not shipped. It is not mentioned on the page.
  Revisit once it ships.
- **Screenshots come from the client's internal dev environment**, captured
  through the owner's logged-in Chrome. Dev holds only test data created by the
  development team — no third-party ticket content. Production is never
  screenshotted.
- **The architecture diagram is static.** The home page's
  `ArchitectureDiagram` animates a pulse across its edges because that page
  *is* a live system. A project case study is not live; an animated diagram
  there would be decoration claiming to be data. Static, `prefers-reduced-motion`
  irrelevant by construction.
- **Existing invariants hold.** The public/private confidentiality rule stays
  (`ulbra-atende` is private → no external links, lock label). Exactly one
  `<h1>` per page. All new copy is localized en / pt-BR.

---

## 3. Content schema

In `web/src/content/projects.ts`:

```ts
/** One headline number on a case-study page. */
export interface CaseStudyMetric {
  /** Pre-rounded, already-formatted display value — "~2.4k", "85%". */
  value: LocalizedString;
  /** What the number counts. */
  label: LocalizedString;
  /** Optional qualifier — "in 3 months of production". */
  note?: LocalizedString;
}

/** One node in a project's architecture diagram. */
export interface CaseStudyArchitectureNode {
  /** Short technical label, not localized — "Postgres 17", "RabbitMQ". */
  label: string;
  detail: LocalizedString;
}

/** A titled prose block — used for "why X and not Y" decisions. */
export interface CaseStudySection {
  heading: LocalizedString;
  body: LocalizedString;
}

export interface ProjectDetailContent {
  overview?: LocalizedString;
  highlights?: LocalizedString[];
  /** The situation before the project existed. 2-4 sentences. */
  problem?: LocalizedString;
  /** 3-4 headline numbers. Rounded — never exact production counts. */
  metrics?: CaseStudyMetric[];
  architecture?: {
    summary: LocalizedString;
    nodes: CaseStudyArchitectureNode[];
  };
  /** 3-5 engineering decisions with their rationale. */
  decisions?: CaseStudySection[];
}
```

`value` is a `LocalizedString` rather than a bare string because number
formatting differs between locales ("~2.4k" vs "~2,4 mil").

---

## 4. Components

Three new components under `web/src/components/projects/`, each with a
colocated test file, following the existing signal language:

### 4.1 `case-study-metrics.tsx`
A responsive grid of metric tiles (2 columns on mobile, 4 on `sm+`). Value in
large mono aqua (`text-signal-strong`), label below in `text-muted-foreground`,
note in smaller mono. Reuses the visual treatment of `stat-card.tsx` rather
than inventing a second stat look; if the reuse is clean, extract the shared
tile into `components/signal/` instead of duplicating.

### 4.2 `case-study-architecture.tsx`
The summary paragraph followed by a static node diagram. Horizontal flow on
`sm+`, vertical stack on mobile, each node a bordered box with an icon from
`lucide-react`, its label, and its detail. Connector lines in `border-signal/25`
to match the existing timeline treatment. No animation, no state.

### 4.3 `case-study-decisions.tsx`
A list of heading + body blocks, sharing the left-border-with-dot treatment
already used by the highlights list in `project-detail.tsx`. If that markup is
duplicated, extract it into a small shared `SignalList` primitive.

`project-detail.tsx` gains four conditional sections, rendered in this order
after the screenshot: **Overview → Problem → Metrics → Architecture → What it
does (highlights) → Decisions**. Highlights move below architecture so the page
reads narrative-first (why it exists, how big, how it is built) before the
feature list.

---

## 5. Ulbra Atende content

Sourced from the client's private repository and from read-only aggregate queries against its production database.

**Problem.** ULBRA's IT department took requests through GLPI, e-mail, and
direct messages at the same time. No SLA per team, no audit trail on approvals,
no way to measure whether anyone was satisfied. Ulbra Atende replaces GLPI as
the single intake channel and makes each of those measurable.

**Metrics** (four tiles, all noted "in ~3 months of production"):

| Value | Label |
|---|---|
| ~2.4k | tickets handled — 85% closed |
| 200+ | users across ~30 teams |
| ~6 min | median first response |
| ~5.0 | satisfaction score, 400+ responses |

Median resolution time (~1.4h) is deliberately left out of the tiles — four
numbers is the limit before a grid stops being scannable — and appears instead
in the closing sentence of the problem paragraph.

**Architecture summary.** A .NET 10 modular monolith: one deployable, separate
bounded contexts (Core, Identity, Notifications, MCP), each layered
Domain → Application → Infrastructure with its own Postgres schema. Integration
events travel over MassTransit + RabbitMQ through an EF transactional outbox.
Attachments in S3/MinIO, caching in Redis, tracing via OpenTelemetry,
integration tests against real Postgres/RabbitMQ/MinIO through Testcontainers.

**Diagram nodes.** React 19 SPA → .NET 10 API (modular monolith) → Postgres 17
(schema per module) → RabbitMQ (transactional outbox) → notification fan-out
(Slack · Google Chat · e-mail), with MCP + OAuth hanging off the API as a second
entry point.

**Decisions** (four blocks):

1. **A modular monolith, not microservices.** One team, one deploy. The
   boundary that matters is the module, enforced by project references and
   schema separation — not the network. Distribution would have bought
   deployment independence nobody needed and paid for it in latency and
   debugging.
2. **A transactional outbox for every integration event.** The event row is
   written in the same transaction as the business change. A notification can
   never fire for a ticket that failed to commit, and never disappears because
   RabbitMQ was down at the wrong moment.
3. **Strongly-typed IDs from a source generator.** Every entity has its own ID
   struct rendered as `ti_…`, `tm_…`, `us_…`. Passing a team ID where a ticket
   ID belongs stops compiling — a whole class of bug moved from runtime to
   build time, and IDs are self-describing in logs and URLs.
4. **Its own OAuth server, and an MCP server behind it.** OpenIddict issues
   tokens; the MCP server exposes ticket read/write and lookup tools. A user
   connects Claude or ChatGPT to their own account through a consent screen and
   works tickets in natural language — under exactly the permissions they
   already have in the UI, with the same scope checks on every tool call.

**Highlights** (feature list, replacing today's three generic bullets): SLA per
team with audited pause reasons; multi-stage ticket templates; approval flow;
parent/child tickets and dependencies; notifications to Slack, Google Chat, and
e-mail; dashboard with drill-down that reconciles with the underlying listings;
CSAT collection.

**Tech chips** update to: `.NET 10`, `PostgreSQL 17`, `RabbitMQ`, `React 19`,
`OpenIddict`, `MCP`, `OpenTelemetry`, `Docker Swarm`.

---

## 6. Screenshots

Captured from the client's internal dev environment through the owner's
authenticated Chrome session, since the app is behind Google OAuth on an
internal network. Target one wide shot of the ticket dashboard. Before
committing, the image is checked for any personal data; dev accounts belong to
the development team only, but the check is not skipped on that basis.

Stored at `web/public/screenshots/ulbra-atende.png`, wired through the existing
`project.screenshot` field, which `ProjectScreenshot` already handles.

If capture proves impractical, the page ships without it — every other section
stands alone, and `ProjectScreenshot` already handles an absent `src`.

---

## 7. Testing

- **Content test** (`content.test.ts`): every `CaseStudyMetric`,
  `CaseStudySection`, and architecture node has both `en` and `pt-BR`; no
  section is present but empty.
- **Component tests**: each new component renders its content in both locales
  and returns nothing when its field is absent.
- **`project-detail.test.tsx`**: extended to assert the new sections render for
  a project that has them and are absent for one that does not, that section
  order matches §4, and that the existing invariants still hold — one `<h1>`,
  no external links for a private project.
- No test asserts an exact production number; the numbers are content, and
  pinning them in tests would make routine copy edits fail the build.

---

## 8. Out of scope

- The projects index page (`/projects`) and `ProjectCard` — unchanged.
- Case-study content for `pulse` and `ulbra-one` — the schema supports them;
  filling them in is separate work.
- Zela — still in development, revisit when it reaches production.
- Any live or auto-refreshing metric. The numbers are a hand-curated snapshot
  with a date, not a feed.
