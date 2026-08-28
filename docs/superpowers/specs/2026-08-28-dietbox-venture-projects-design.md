# The Dietbox venture and its project list — design

## Problem

The ULBRA spec closed with a promise: *"leave Dietbox adoptable later without a
second refactor."* This is that adoption.

Today `dietbox` is one card doing two jobs badly. It describes a **company** — a
four-year engagement, a 13-person organization, the site's only `leadership`
section — while sitting in a grid whose other members are single systems. A
reader gets four years of work compressed into one tile and no way to see the
platform underneath it. Meanwhile ULBRA, a mandate four months old, gets six
cards and a venture header.

The imbalance is not editorial. It is that Dietbox never got the model ULBRA
was built for.

There is also a factual problem. The current card asserts the realtime service
is *"scaled horizontally behind a Redis adapter."* The repository contains no
Redis: `dietbox-socket` is a single Socket.IO server with a shared-secret
handshake, rooms keyed by user id, and an HTTP fan-out endpoint. Either the
claim describes a later state not in this repository, or it is wrong. A site
whose stated purpose is to be checkable cannot carry an unchecked one.

## Decision

Introduce the `dietbox` venture and break the engagement into **six project
cards**, one per system. The existing `dietbox` card survives — narrowed to the
legacy webapp it half-describes already — so `/projects/dietbox` keeps its URL,
its place in the sitemap and its json-ld entry.

### The recut

The repositories do not map one-to-one onto systems, and this is the single
most important thing the implementation must get right. **`dietbox-api` is a
monorepo**, not a service. Inside it sit `Dietbox.Payment.API`,
`Dietbox.Auth.API`, `Dietbox.Foods.API`, `Dietbox.Jobs` and the
`BuildingBlocks` projects, each with its own path-filtered release pipeline
under `_/`. A card per repository would put Payment and B2C in the same tile
and call it "the API".

So the cards are **systems**, and a system crosses repositories:

| Card | Repositories it spans |
|---|---|
| Dietbox Webapp | `dietbox-webapp` (`Craftbox.Diet.*`) |
| Dietbox B2C | `dietbox-b2c` + `Dietbox.Auth.API` + `Dietbox.Crosscutting.Azure.Ad.B2C` |
| Dietbox Payment | `Dietbox.Payment.API` + `Crosscutting.Iugu/Ebanx/TSPay` + `dietbox-payment-client` |
| Dietbox Portal | `portal/dietbox-portal-service` + `portal/dietbox-portal-client` + `dietbox-common` |
| Dietbox Notifications | `dietbox-notification-service` |
| Dietbox Socket | `dietbox-socket` + `Dietbox.Crosscutting.Socket` |

### Alternatives rejected

- **Delete the `dietbox` card, mirror ULBRA exactly.** ULBRA has no `ulbra`
  card, so symmetry argues for none here. But `/projects/dietbox` is already in
  the sitemap and the json-ld graph, and the venture header has nowhere to put
  a `problem`, `metrics` or `decisions` block. Symmetry is not worth a 404.
- **Venture plus the current card untouched.** Cheapest. Also puts the role,
  the period and the leadership narrative on screen twice, three inches apart.
- **A card per repository.** Twenty-two repositories, six of them with real
  personal ownership, and Payment and B2C fused into one tile because they
  share a solution file. The repository layout is an artifact of how Azure
  DevOps was set up, not of how the product was built.
- **Seven cards, adding `dietbox-iac` or `dietbox-common`.** Both are genuinely
  the author's (5/5 and 18/18 commits) and both are genuinely small. They are
  substrate, not systems: `dietbox-common` is the shared building-block package
  and `dietbox-iac` is the Terraform for the estate. Each belongs in the
  `decisions` of one card — `dietbox-common` in Portal, whose layered service
  is the thing built on it, and `dietbox-iac` in Webapp, whose story is the
  move onto the Linux App Service plans that Terraform declares.

## The venture

`ventures.ts` gains a second entry. No interface change — the model already
fits, which was the point of writing it.

```ts
{
  slug: 'dietbox',
  name: 'Dietbox',
  url: 'https://dietbox.me',
  role: 'Senior Software Engineer → Head of Technology',
  period: 'Sep 2020 – Aug 2024',
  // engagement: omitted — direct employment needs no qualifier
  team: '13 people — engineering, QA, UX and support.',
  summary: ...,
  practices: [...]
}
```

`engagement` stays absent on purpose. It exists to say *"client of Pampa Devs"*
about ULBRA; Dietbox was a job, and a badge reading "Employment" is noise.

`role` carries an arrow because the mandate changed inside the period, and
`profile.experience` already lists the two roles as separate entries with
separate dates. The venture header summarises what the timeline itemises.

### `practices` — where the leadership section goes

The current card's four `leadership` sections move up to the venture verbatim
in substance:

1. **From one nightly deploy to several a day** — Scrum and trunk-based
   development; lead time from a month to a week and a half.
2. **A payment migration nobody noticed** — thousands of active subscribers
   moved between gateways with no pause in revenue.
3. **Cloud spend as an engineering problem** — 21% off the monthly Azure bill,
   with no feature freeze to pay for it.
4. **Reporting engineering in the executive's language** — DORA metrics and a
   roadmap to the executive team.

They move rather than duplicate. After this change **no project carries a
`leadership` section**, and the existing test asserting `dietbox` is the only
one that does becomes a test that none does — see *Tests*.

## Ordering

The group replaces `dietbox` in place: after `kota-embed`, before the ULBRA
projects. Order inside the group leads with weight, the way ULBRA leads with
the one system actually in production:

`dietbox` → `dietbox-b2c` → `dietbox-payment` → `dietbox-portal` →
`dietbox-notifications` → `dietbox-socket`

Keeping `dietbox` first also keeps the existing position test true with a
minimal edit.

## The six case studies

Commit figures below are from `git log` in each repository, counting the
author's commits against the total. They are the only hard numbers most of
these cards have, and they are stated as shares rather than as achievements.

### Dietbox Webapp — `dietbox` (rewrite)

**Renamed.** A card called "Dietbox" directly under a venture header called
"Dietbox" reads as a duplicate. The card is the webapp.

The decade-old monolith the product grew on and still its largest codebase:
`Craftbox.Diet` and its satellites (`.EntityFramework`, `.Catalogs`, `.Enums`,
`.Infrastructure`, `.Resources`, `.Reports`, `.Webjobs`) plus a gulp/Kendo UI
front end. The story is the move off .NET Framework on Windows App Service onto
.NET 6 on Linux, and the nightly deploy window that migration was fighting.

- **Ownership:** ~600 of ~3.9k commits — the existing "about a sixth of that
  repository's commits are mine" boundary is accurate and stays.
- **Keeps:** `screenshot: /screenshots/dietbox.webp` (the product's public
  face), the `problem` section about the nightly deploy, the `links` entry.
- **Loses:** `leadership` (moves to the venture), the org-level metrics (13
  people, lead time, cloud spend — all now venture practices), and the
  platform-wide `architecture` flow, which becomes the venture's job to imply
  and each card's job to state for itself.
- **Keeps as a metric:** the commit share. It is a real number about this
  repository and belongs on this card rather than the venture.

### Dietbox B2C — `dietbox-b2c` (new)

The identity backbone, and the author's largest personal ownership anywhere in
the estate: **~730 of ~1.5k commits**, over four years (May 2021 – Jul 2025).

Two Azure AD B2C policy sets — `nutricionista` and `paciente` — totalling
**~7.2k lines of Identity Experience Framework XML**, plus the static HTML/CSS
pages B2C serves as its custom UI, plus `Dietbox.Auth.API` and
`Dietbox.Crosscutting.Azure.Ad.B2C` on the platform side.

What the policies actually do, all readable in `TrustFrameworkExtensions.xml`:

- **Federation** with Google, Facebook and Apple, each with its own exchange
  profile and a claims-transformation into a common subject.
- **Migration on first sign-in.** A user from the legacy store signs in with
  their old credentials and is written into the directory in the same journey.
  The user experiences a login; the system experiences a migration.
- **Session revocation that actually revokes.** A `validFrom` timestamp on the
  user is compared against the refresh token's issue time, so a password change
  or an admin revoke signs the account out of every open browser — the
  behaviour the repository's own README lists as requirement #1.
- **Gated journeys.** Separate policies for subscribers and for academy
  students, with dedicated pages for the blocked user, the unsubscribed user
  and the social account with no match.

Sections: `overview`, `contribution`, `problem`, `architecture`, `states` (the
sign-in journey, from the policy's own steps), `decisions`, `highlights`.
`metrics` carries the two real figures: the XML line count and the commit
share.

**Trap:** this repository is the worst offender for the no-hostname rule. The
README is full of `dev.azure.com` URLs, the `.azure/*.yml` pipelines name the
tenant, and `appsettings.json` carries application ids. Nothing is quoted
verbatim. If a `script` section is included at all, it is a policy fragment
with the tenant and ids replaced by placeholders.

### Dietbox Payment — `dietbox-payment` (new)

Subscriptions and recurring billing: `Dietbox.Payment.API` behind a Vue 3
checkout.

The API is CQRS — commands named `Subscribe`, `CreateInvoice`,
`CreateInvoicePlan`, `GeneratePaymentLink`, `AddToCart`, `PayExtension`,
`SuspendSubscription`, `DeleteTransaction`, plus a `Voucher` and a `Recaptcha`
path. Its most interesting surface is the webhook handler tree, which is
effectively the subscription lifecycle written down: `AssinaturaCriada`,
`AssinaturaAtivada`, `AssinaturaAlterada`, `AssinaturaSuspensa`,
`AssinaturaVencida`, `InvoicePaymentFailed`, `AtualizarFatura`, and a
`RecebaFacil` subtree for marketplace subaccounts (`FaturaPaga`,
`FaturaLiberada`, `FaturaEstornada`, `SubContaVerificada`).

That tree is the `states` figure. It is derived, not invented — every state
name is a directory in the repository.

Three gateways sit behind crosscutting projects — `Crosscutting.Iugu`,
`Crosscutting.Ebanx`, `Crosscutting.TSPay` — which is what made the gateway
migration a change of implementation rather than a change of the domain.

The client (`dietbox-payment-client`) is Vue 3 + Vite + PrimeVue + Pinia +
`vue-i18n`, with Cypress e2e reporting through Allure. Its views are the
checkout funnel: `SubscriptionView`, `RenewalView`, and four distinct
thank-you pages including a student trial.

- **Ownership:** ~100 of ~1.2k client commits, and the API side is inside
  `dietbox-api` (~156 of ~722). This card must say plainly that it was a team's
  work, the way `kota-embed` names the front end as someone else's.
- **Decision worth writing up:** one repository, four release trains. Each API
  has a `release-<name>/*` branch trigger and a path filter excluding the other
  three, so a payment hotfix does not redeploy auth.

**Trap:** `price-adjustment/` — the CLI that carried out the gateway
migration — contains real customer data (`addresses.csv`,
`checar-assinantes.csv`, an XLSX of subscriber addresses). It is useful
evidence that the migration happened and it is **read-only context, never
quoted**. No row, no name, no count derived from those files reaches the site.

### Dietbox Portal — `dietbox-portal` (new)

The internal back office, and the newest generation of the platform's
architecture: **~276 of ~779 commits** across the two repositories.

The service is laid out in numbered layers on disk — `0-building-blocks`,
`2-services`, `3-application`, `4-domain`, `5-infra` — which is unusual enough
to be worth a `decisions` entry: the dependency direction is legible from the
directory listing, so a violation is visible before it compiles. Inside:
commands and queries with pipeline `Behaviours`, domain events separated from
integration events, and a `BuildingBlocks.Infrastructure.EventSourcing` package.

Three test projects: `Application.UnitTests`, `Domain.UnitTests`, and
`WebApp.IntegrationTests` with an `ExternalResources` fixture set.

The client is a Vue 3 admin (Vuex, chart.js, quill) whose views name the
business it administers: Admin, Dashboard, Nutritionist, Patient, Transaction,
User, Foods, Content, Marketing, Event.

**Decision to verify before writing:** the client authenticates with
`@azure/msal-browser`, i.e. Azure AD — *not* the B2C policies the product's
customers use. If that reading holds, it is the card's best decision: staff and
customers are different populations and giving them one identity system would
have meant granting customer-grade accounts administrative scopes. The
implementation plan must confirm this in the code before the copy asserts it.

This card also carries the `dietbox-common` story: the shared building blocks
that the newer services start from, rather than each inventing its own domain,
infrastructure and identity layer.

### Dietbox Notifications — `dietbox-notifications` (new)

The recommended sixth card, and the strongest of the new ones for a reason that
has nothing to do with size: **19 of 20 commits are the author's, and the
design document survives in the repository.**

`dietbox-notification-service/README.md` records why it exists — the official
WhatsApp Business API bill in May 2023 — what was decided (a pre-paid,
per-nutritionist send quota), and the capacity planning behind it:

| Figure | Value |
|---|---|
| Average notification size | 214 B |
| WhatsApp notifications sent, May 2023 | ~51k / month |
| Daily queries | ~30k |
| QPS, average / peak | 0.3 / 5 |
| Storage over ten years | ~1.4 GB |

These are real, documented, and the only numbers on the site sourced from a
design document written before the system existed. They make the `metrics`
grid — and a `table` if the copy wants one — with `metricsNote` saying exactly
where they came from.

The domain is three models: `NotificationLimit`, `NotificationLimitLog`,
`SentNotificationRecord`. The API is two controllers, `Notify` and
`Nutritionist`. The README's stated constraint is the `decisions` centrepiece:
built as an isolated service specifically for **zero impact on the main
product**, because the main product was too complex to safely extend.

The repository has C4 and data-model diagrams in `assets/`. They are **not**
published — they are a former employer's internal design artifacts, and the
site's own `CaseStudyFlow` renders the same information from localized content.

### Dietbox Socket — `dietbox-socket` (new)

The smallest card and the most nearly solo: **33 of 34 commits**, Apr–Jun 2022.

A Socket.IO server on Express. Clients connect with a shared-secret handshake
token and are joined to a room named for their user id; a client that ends up
in no room is disconnected on the spot. Event handlers are auto-loaded from a
directory, so adding one is adding a file. The platform pushes by calling
`POST /api/v1/notify` with rooms, an event name and a payload —
`Dietbox.Crosscutting.Socket` is the .NET client for exactly that. `/info`
reports the live connection count and `/health` reports latency. Logging goes
to winston and Application Insights. There is a load-test harness that
deliberately holds a share of clients on HTTP long-polling rather than
websockets.

- **The correction.** No Redis. The claim currently on the site is not
  supported by this repository and must be removed from the rewritten Webapp
  card and not reproduced here. What *is* true and interesting is the shape:
  realtime is a separate deployable precisely because long-lived connections
  scale on a different axis from request traffic — and because the monolith
  deployed once a night, so anything sharing its pipeline shared its cadence.
- **Trap:** `src/config/index.js` hardcodes a production hostname belonging to
  a different product entirely. It is not quoted, and if a `script` section is
  used the value is a placeholder.

## Screenshots

Three of the six have a user interface. The rule is the one `ProjectCover`'s
own documentation states: never a picture of something that does not exist.
A screenshot here is the repository's real markup and real stylesheet, with
placeholder data where a live backend would have supplied real data.

| Card | Approach |
|---|---|
| **B2C** | `src/flows/nutricionista/unified.html` is a static page with a real stylesheet. Serve it locally and inject, into the `<div id="api">` that Azure B2C fills at runtime, the self-asserted sign-in markup with placeholder copy. Highest fidelity of the three: the shell, the layout and the CSS are production files. |
| **Payment** | `dietbox-payment-client/dist/` is already built. Serve it statically and capture `SubscriptionView`. The API will be unreachable; if the result is an empty or error state, fall back to rendering the real `.vue` templates with fixture data. |
| **Portal** | `node_modules` is present, so `vue-cli-service serve` should run. MSAL will intercept before any view renders, so this one needs the router entered past auth with a stubbed store, or it is dropped. Lowest confidence — if it costs more than the other two combined, it falls back to the generated cover. |
| **Webapp** | Keeps the existing `dietbox.webp`. |
| **Socket, Notifications** | No UI exists. `ProjectCover` draws them from their own architecture steps. |

Captures are written to `web/public/screenshots/<slug>.webp`, matching the
existing assets in format and in the ~1120px-wide, 16:9 framing the current
files use.

Any placeholder data is generic — no real nutritionist, patient, plan price,
invoice or address, whether observed in the repositories or invented to look
plausible.

## Downstream effects

- `web/src/content/ventures.ts` — one new entry. No interface change.
- `web/src/content/projects.ts` — `dietbox` rewritten, five entries added, all
  six carrying `venture: 'dietbox'` and contiguous.
- `web/src/content/content.test.ts` — see below.
- `web/public/screenshots/` — up to three new `.webp` files.
- `src/Pulse.Api/Assistant/projects.generated.md` — regenerated with
  `npm run gen:assistant`. It is a committed artifact; a stale one contradicts
  the site the assistant is meant to describe.
- **No change needed** in `lib/aio/pages.ts`, `lib/aio/json-ld.ts`, the sitemap
  or the prerender entry. All read the flat array and group through
  `groupProjects()`, so the new slugs, their `/projects/$slug` routes and their
  sitemap entries appear on their own. This is the payoff of the ULBRA model
  and the implementation should verify it rather than assume it.
- **No new i18n keys.** Project and venture copy is localized inline;
  `venturePracticesHeading` already exists.

## Tests

New:

- Every Dietbox project resolves to the `dietbox` venture and the six are
  contiguous (covered by the existing generic rules — assert they pass with a
  second venture present, which no test has yet exercised).
- `dietbox-b2c` names the two audiences and carries its two real figures.
- `dietbox-notifications` carries the May 2023 capacity figures and attributes
  them.
- `dietbox-payment` names the work as a team's, in the same shape as the
  existing `kota-embed` and `ulbra-crm` rules.
- `dietbox-socket` makes no Redis claim — a regression test for the specific
  inaccuracy this spec removes.
- The Dietbox venture is direct employment: `engagement` is absent, unlike
  ULBRA's.

Changed:

- `content.test.ts:512` `dietbox has a case study` — still valid; the card
  still exists and still has one.
- `content.test.ts:553` `dietbox names the shared work` — still valid, same
  boundary text.
- `content.test.ts:559` `dietbox sits between kota-embed and the ulbra
  projects` — extended: `dietbox` is still the first card after `kota-embed`,
  and the five new slugs sit between it and `ulbra-atende`.
- `content.test.ts:571` `dietbox is the only project with a leadership section`
  — **inverted**. The section moves to the venture, so the rule becomes: no
  project carries `leadership`, and the Dietbox venture's `practices` are
  localized and non-empty.
- `content.test.ts:97` `pulse is public…; ulbra projects are private with no
  repo link` and `content.test.ts:135` `every venture project is private with
  no repository link` — now cover eleven projects instead of five.

Unchanged and load-bearing: `content.test.ts:418`, the no-hostname rule. Given
how much of this material comes from repositories full of Azure DevOps URLs,
tenant names, application ids and one hardcoded production hostname, it is the
single test most likely to catch a real mistake here.

## Open questions

Non-blocking for the plan; each becomes an explicit gap in it.

1. **Pagar.me or TSPay?** The site currently says the migration went from Iugu
   to Pagar.me. The code has a `Dietbox.Crosscutting.TSPay` project, TSPay
   webhook commands, and an `IuguDePara.cs` mapping in the migration CLI. Both
   can be true — TSPay reading as the group's own payments layer over Pagar.me.
   The existing wording stands until confirmed, because it is the author's own
   record of his own migration; but the card should not name a gateway the
   repositories contradict.
2. **The Redis claim.** Removed from the site by this spec on the evidence of
   the repository. If a Redis adapter was added after June 2022 in a branch or
   a repository not present here, the correction is wrong and the claim should
   come back — with a note of where it lives.
3. **Is `dietbox-webapp` the .NET 6 target, or is `dietbox-api`?** The webapp
   is `Craftbox.Diet` on .NET Framework; `dietbox-api` is the .NET 6 generation
   with the building blocks. Whether "the migration" moved the monolith itself
   or stood a new platform beside it changes the Webapp card's central claim.
   The plan resolves this from the repositories before the copy is written.
4. **Subscriber scale.** "Thousands of active subscribers" is the existing
   wording for the migration. If a real order of magnitude is available it
   makes the venture's second practice concrete; absent one, the vague form
   stays rather than a guess.
5. **Does publishing this need anyone's agreement?** Dietbox is a former
   employer and these are private repositories. Nothing proposed here
   publishes source, credentials, customer data or internal diagrams — the
   content is architecture described in prose, which is what the existing
   `dietbox` card already does. Worth noting that the line was drawn
   deliberately, not by omission.
