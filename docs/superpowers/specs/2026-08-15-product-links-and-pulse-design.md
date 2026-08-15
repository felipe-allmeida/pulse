# Product links + the Pulse case study — Design Spec

- **Status:** Approved design, pending implementation plan
- **Date:** 2026-08-15
- **Scope:** Let a project link to its public product site even when its source is private, and write the case study for Pulse — the one project on the site that is a technical benchmark rather than a product.

---

## 1. Purpose

Two gaps, both about the pages saying less than they could.

**A project can have a private repository and a public product.** Dietbox and
Kota both sell to customers at addresses anyone can visit. The site currently
renders no links at all for a project marked `private`, because `visibility` was
read as "this project is secret" when what it actually means is "the source is
not published". A reader who wants to see the thing cannot.

**Pulse has the thinnest case study on the site, and it is the featured
project.** It carries an overview, a contribution and a feature list, and none
of the problem, architecture or decisions the other four have. That is backwards
for the one project a visitor can watch running — and it happened because the
page was trying to describe what Pulse *does*, which was never the point.

---

## 2. Decisions (locked)

- **`visibility` describes the source, not the product.** A private project may
  carry a link to its public product site. It may not carry a repository link —
  that invariant stays, and stays tested. The lock indicator still renders for
  private projects, now beside the product link: "the source is closed, the
  product is not" is the true statement, and showing both says it.
- **Only real, reachable URLs.** Each was checked before being written down.
  Nothing points at a staging host, an internal address, or a page behind a
  customer's login.
- **Pulse is described as what it is: a benchmark.** It was built to demonstrate
  seniority, not to serve users. Its case study says so in the first line of the
  problem, because the alternative — describing a portfolio's visit counter as
  though it answered a business need — is the kind of claim a reader sees
  through immediately.
- **The over-engineering is stated, not hidden.** A transactional outbox behind
  a visit counter is more than the feature needs. On this project that is the
  deliverable, and saying so plainly is stronger than pretending a requirement
  pulled it into existence.
- **Pulse's numbers are live, not written.** The site already publishes an ops
  dashboard with real connection, throughput and latency figures. The case study
  points at it rather than freezing numbers into copy that will age — this is
  the one project whose claims the reader can check while reading them.
- **Existing invariants hold.** All copy localized `en` / `pt-BR`, exactly one
  `<h1>`, no personal data.

---

## 3. Schema and rendering

No schema change. `Project.links` already exists and already carries
`{ label, href }`.

The change is in two components:

- `project-card.tsx` and `project-detail.tsx` currently render `links` only when
  `visibility === 'public'`, and render the lock indicator otherwise. Both now
  render `links` whenever there are any, and render the lock indicator whenever
  `visibility === 'private'` — the two stop being alternatives.
- The existing content test keeps asserting that no private project carries a
  repository link, and gains an assertion that every `href` in the file is
  `https:` and absolute, so a relative or insecure link cannot slip in.

---

## 4. Product links

| Project | Link |
|---|---|
| `pulse` | its GitHub repository (unchanged) and `https://pulse.felipealmeida.tech` |
| `kota-embed` | `https://kota.io` |
| `ulbra-atende`, `ulbra-one` | none — internal systems with no public address |
| `dell-automated-caller` | none — an internal tool, and the client's site is not this project |

Pulse gains a "Live site" link alongside its repository. The others carry one
labelled "Website".

Dietbox is not in this table because it is not yet a project here. Its link —
`https://dietbox.me`, checked and reachable — is recorded in its own spec and
lands with its entry.

---

## 5. The Pulse case study

**Problem.** A CV asserts seniority and a repository demands that someone read
it; neither lets a stranger *watch a system work*. Pulse exists to close that
gap — it is a portfolio that is also the thing being demonstrated. The
constraint it was built against was not a user need but an evidentiary one: make
the claim checkable in the thirty seconds someone actually spends.

**Metrics.** None. Pulse publishes a live ops dashboard with real connection
counts, event throughput and latency; freezing a snapshot of those into copy
would replace a checkable claim with an unverifiable one. The case study links to
the dashboard instead. This is the only project on the site where that is
possible, and doing it is the point.

**Architecture flow** (five steps): `Browser` (a React client holding a SignalR
connection) → `API` (resolves the visitor's rough location, publishes the visit,
and broadcasts presence) → `Outbox` (the event is flushed in the same save as
the write)
→ `Worker` (drains the outbox over RabbitMQ and appends the audit) → `World
map` (polls the accumulated visits, so it never blocks on the round trip that
fills it).

**Engineering decisions** (four):

1. **A transactional outbox behind a visit counter.** Nothing about counting
   visits requires one. The point is not the counter — it is that the pattern is
   here, wired end to end, in something a reader can watch rather than a diagram
   they have to trust. On a product this would be over-engineering; on a
   demonstration it is the deliverable.
2. **Real telemetry, published.** The ops dashboard exposes the system's actual
   numbers, which means a reader can catch the site lying about itself. Most
   portfolios make claims that cannot be checked; this one chose the version that
   can be.
3. **Prerendered pages over a client-only app.** The site renders its content
   into HTML at build time, so a first visit does not wait on JavaScript and a
   crawler sees the same page a person does — and, usefully, a deploy can be
   verified with `curl` rather than a browser.
4. **An assistant grounded in a maintained profile.** The AI answers from a file
   the author keeps current, and says it does not know rather than inventing.
   Ungrounded, it would be a demonstration of exactly the wrong thing.

**What it does** (the existing highlights, unchanged).

**Contribution** (existing, unchanged): sole author.

---

## 6. Testing

- **Content:** every `href` across all projects is absolute and `https:`; no
  private project carries a repository link; `pulse` carries both a repository
  and a live-site link.
- **Components:** a private project with links renders them *and* the lock
  indicator; a private project without links renders only the indicator; a
  public project is unchanged.
- **Page:** `/projects/pulse` renders its `<h2>`s in the locked order, including
  the problem, architecture and decisions sections it previously lacked.
- **Regression:** every other project renders exactly the sections it renders
  today.

---

## 7. Out of scope

- Dietbox itself — its case study has its own spec and lands separately.
- Any metric tile for Pulse. If the live dashboard ever stops being the better
  answer, revisit then.
- Reconciling the site with the author's CV, which lists employers the site does
  not mention and omits work the site describes. Real, worth doing, not this.
