# Kota Embed — case study on the projects page — Design Spec

- **Status:** Approved design, pending implementation plan
- **Date:** 2026-08-14
- **Scope:** Add Kota Embed as a fourth project on `/projects`, filling the case-study fields introduced for Ulbra Atende. Content only — no schema change, no new components.

---

## 1. Purpose

The case-study fields added for Ulbra Atende were designed to be reusable. This
is the first test of that claim: a second project fills `problem`, `metrics`,
`architecture`, `decisions`, and `highlights` without a single change to the
type or the components.

It also fills a real gap in the portfolio. The projects listed today are a
self-hosted demo and two internal systems for one organization. Kota Embed is
the one piece of work that is none of those: a multi-tenant commercial product,
integrated with nine external insurers across three regulatory regions, running
embedded inside other companies' applications.

---

## 2. Decisions (locked)

- **The product is named; its insurance partners are not.** "Kota" and "Embed"
  appear. The nine insurers are described by count and behavior, never by name —
  they are the employer's commercial partners, not the author's to publicize.
- **Scope is honest about authorship.** The author contributed to the backend,
  concentrated in the multi-tenant platform core, its public contract, and its
  integration tests. The front end was built by others. The page
  therefore describes the product in one paragraph as context, and spends the
  case study on the platform core. The `role` field states this plainly rather
  than leaving the reader to assume he built the whole thing.
- **Numbers are structural, not operational.** Nine insurer integrations, three
  regulatory regions, seven intent workflow types — all verifiable in source.
  No production figures: this is a former employer, and their production systems
  are not somewhere to go looking for portfolio material.
- **No screenshot.** The product runs embedded in third-party platforms behind
  their authentication. There is no instance to capture, and capturing a former
  employer's live product is not on the table.
- **Nothing internal reaches these documents.** This spec, the implementation
  plan, and the page live in a public repository. No issue identifiers, no
  repository paths, no commit counts, no insurer names, no internal hostnames.
  What was learned from the source stays in the conversation; what reaches a
  file is publishable as written.
- **Existing invariants hold.** `visibility: 'private'`, `links: []`, no
  external links. All copy localized `en` / `pt-BR`. Exactly one `<h1>`.

---

## 3. What changes

One new entry in `web/src/content/projects.ts` with slug `kota-embed`,
positioned after `pulse` and before `ulbra-atende`, and the `en` / `pt-BR`
values it carries. Nothing else:
`ProjectDetail` already renders every case-study section conditionally, and
`ProjectCard` already handles a project with no screenshot.

The content test gains Kota to its both-locale sweep. `project-detail.test.tsx`
gains one case asserting the new page renders its sections in order — the same
assertion shape Ulbra Atende already uses.

---

## 4. Content

**Tagline.** Health insurance enrollment, embedded inside other companies'
platforms.

**Overview.** Kota Embed lets employers offer health insurance to their
employees without leaving the software they already use — the enrollment flow
runs embedded in a third-party platform, backed by a multi-tenant .NET service
that integrates directly with insurers.

**Problem.** Enrolling someone in health insurance looks like a form. It is
not. Each insurer wants different data in a different shape on its own
schedule; some answer over HTTP, others by exchanging files over SFTP.
Regulatory disclosure obligations differ by region. And all of it happens
inside an iframe hosted on another company's platform, where the user expects
it to feel immediate. A form hardcoded per insurer does not survive the second
insurer.

**Metrics** (three tiles):

| Value | Label | Note |
|---|---|---|
| 9 | insurer integrations | HTTP APIs and SFTP file exchange |
| 3 | regulatory regions | disclosure rules differ per region |
| 7 | intent workflow types | enrollment, quote, amendment, renewal … |

**Architecture summary.** A .NET modular monolith split by bounded context:
the multi-tenant platform core, one module per insurer, a compliance module, a
webhook module, and financial reporting. The core never calls an insurer
directly — every provider call goes through an adapter factory, so the code
that runs enrollment does not know which insurer it is talking to. Long-running
work is modeled as an Intent: a persisted state machine rather than a request
held open.

**Diagram nodes** (five, linear):

1. `Third-party platform` — the host application, embedding the flow in an iframe.
2. `Public API` — versioned contract and webhooks for platform integrators.
3. `Platform core` — employers, employees, eligibility, and the intent state machines.
4. `Adapter factory` — the single door to every insurer; the core stays provider-agnostic.
5. `Insurer integrations` — one module per insurer, over HTTP or SFTP file exchange.

**Decisions** (four):

1. **Intents instead of request/response.** An enrollment cannot finish inside
   one call — an insurer may take minutes or days. Modeling it as a persisted
   state machine with its own status makes the in-between state something the
   system can query, resume, and report on, instead of a transaction held open
   and hoped for.
2. **Adaptive requirements instead of a form per insurer.** What a given case
   must collect depends on the insurer *and* the regulatory region. Rather than
   encoding nine forms, the platform asks a requirements service what this case
   needs and renders that. Adding an insurer stops being a front-end change.
3. **An adapter factory as the only door to a provider.** The platform core
   resolves an adapter and talks to that. It never learns which insurer it is
   serving, which is what keeps a ninth integration from touching enrollment
   logic — and what let provider contracts be introduced behind feature flags
   and migrated without stopping the product.
4. **Idempotency and duplicate suppression as a requirement, not a repair.**
   Retries happen, webhooks arrive twice, and consumers run concurrently against
   the same rows. Intent creation takes an idempotency key, auto-enrollment
   suppresses the duplicate intent-and-webhook pair, and the screening consumer
   handles serialization conflicts rather than assuming they cannot happen.

**Highlights.**

- Multi-tenant by construction: platform → employer → employee → group, isolated per tenant.
- Enrollment, quoting, amendment, renewal, policy import, and dependant management, each as its own workflow.
- Eligibility computed from provider rules rather than stored as a flag.
- Policy and plan data aggregated across insurers into one response.
- Versioned public API and signed webhooks for the platforms doing the embedding.
- Insurer integrations over both HTTP APIs and scheduled SFTP file exchange.

**Tech chips.** `.NET`, `PostgreSQL`, `EF Core`, `AWS`, `OpenTelemetry`,
`Multi-tenant`, `Webhooks`.

**Role.** Senior Product Engineer, platform team — the multi-tenant core, its
intent workflows, the public API contract, and integration testing. Front end
by others.

The title matches the one the About page already carries for this employer;
an earlier draft said "Backend engineer", which understated the role and
contradicted `/about` one click away. Honesty about *scope* is what "front end
by others" is for — it does not require understating seniority.

---

## 5. Testing

- **Content test:** Kota joins the existing both-locale sweep; every localized
  string in the new entry has real `en` and `pt-BR` values.
- **Page test:** one case asserting `/projects/kota-embed` renders its `<h2>`s
  in the locked order, with exactly one `<h1>` and no external link.
- No test pins the metric values — they are content, and pinning them would
  make a copy edit fail the build.

---

## 6. Out of scope

- Any change to `ProjectDetailContent`, the case-study components, or `ProjectCard`.
- A screenshot or image gallery.
- Case-study content for `pulse` and `ulbra-one`.
