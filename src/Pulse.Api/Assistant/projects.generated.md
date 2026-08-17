<!-- GENERATED from web/src/content/projects.ts by `pnpm gen:assistant`. Do not edit by hand:
     edit the source and regenerate, or the drift test in assistant-profile.test.ts fails. -->

## Project case studies

These are the projects written up on the site, in the order they appear there. Each one is a real
system Felipe worked on; the "What Felipe did" line is the authoritative statement of his part in it.

### Pulse — A live, real-time system embedded in a portfolio.

- **Role:** Design & implementation
- **Source:** public — Live site: https://pulse.felipealmeida.tech · GitHub: https://github.com/felipe-allmeida/pulse
- **Stack:** .NET 10, SignalR, RabbitMQ, Redis, Postgres, React 19, Docker, Terraform
- **What it is:** A self-hosted portfolio that doubles as a live systems demo: presence, visits, and metrics travel through a real event-driven backend in real time, not canned data.
- **What Felipe did:** Solo project — the design, the event-driven backend, the front end, and the infrastructure it runs on.
  - The realtime presence pipeline and its world map.
  - The transactional outbox and the event-driven backend behind it.
  - The public ops dashboard and the metrics it exposes.
  - The AI assistant and the profile that grounds it.
  - Deployment, from container build to the machine it lands on.
- **Problem it solved:** A CV asserts seniority and a repository demands that someone read it; neither lets a stranger watch a system work. Pulse closes that gap by being both the portfolio and the thing being demonstrated. The constraint it was built against was not a user need but an evidentiary one — make the claim checkable in the thirty seconds someone actually spends.
- **Architecture:** A .NET backend behind a React client. A new connection resolves the visitor’s rough location and publishes a visit event through a transactional outbox, flushed in the same save as the write. A worker drains that outbox over RabbitMQ and appends the audit trail in Postgres. SignalR carries live presence — the connection count, and reactions — while the world map reads the accumulated visits by polling, so the map draws on its own schedule instead of blocking on that round trip. Tracing runs through OpenTelemetry, and the whole thing ships as containers behind Caddy.
  - Browser — A React client holding a SignalR connection open.
  - API — Resolves the visitor’s rough location, publishes the visit, and broadcasts the new presence count to everyone.
  - Outbox — The event is buffered and flushed in the same save as the write, so it cannot be published for something that did not commit.
  - Worker — Drains the outbox over RabbitMQ and appends the visit to the audit trail.
  - World map — Polls the accumulated visits on its own schedule, so the map never blocks on the round trip that fills it.
- **What it does:**
  - Live presence via SignalR — see who else is on the site right now, on a world map.
  - Event-driven .NET backend with a RabbitMQ transactional outbox, Postgres, and OpenTelemetry tracing.
  - A public ops dashboard exposing real metrics — live connections, visits over time, and the event feed as it happens.
  - An AI assistant grounded in a maintained profile, streaming answers about the author.
  - Deployed with Docker Compose + Caddy behind Terraform-managed infrastructure.
- **Engineering decisions:**
  - **A transactional outbox behind a visit counter** — Nothing about counting visits requires one. The point is not the counter — it is that the pattern is here, wired end to end, in something a reader can watch rather than a diagram they have to trust. On a product this would be over-engineering; on a demonstration it is the deliverable.
  - **Real telemetry, published** — The ops dashboard exposes the system’s actual numbers, which means a reader can catch the site lying about itself. Most portfolios make claims that cannot be checked; this one chose the version that can be.
  - **Prerendered pages over a client-only app** — The site renders its content into HTML at build time, so a first visit does not wait on JavaScript and a crawler sees the same page a person does — and, usefully, a deploy can be verified with a single request rather than a browser.
  - **An assistant grounded in a maintained profile** — The assistant answers from a file the author keeps current, and says it does not know rather than inventing. Ungrounded, it would be a demonstration of exactly the wrong thing.

### Kota Embed — Health insurance enrollment, embedded inside other companies' platforms.

- **Role:** Senior Product Engineer, platform team (Professional work)
- **Source:** closed — professional work described without the code (Website: https://kota.io)
- **Stack:** .NET, PostgreSQL, EF Core, AWS, OpenTelemetry, Multi-tenant, Webhooks
- **What it is:** Kota Embed lets employers offer health insurance to their employees without leaving the software they already use — the enrollment flow runs embedded in a third-party platform, backed by a multi-tenant .NET service that integrates directly with insurers.
- **What Felipe did:** I owned the multi-tenant core — the part that turns an enrollment request into a policy across nine insurers that each behave differently.
  - The intent state machines behind enrollment, quoting, amendment and renewal.
  - Adaptive requirements: asking a service what a case must collect instead of hardcoding a form per insurer.
  - The versioned public API contract and its webhooks.
  - Provider contracts introduced behind feature flags and migrated without stopping the product.
  - Idempotency and duplicate suppression, and the integration suite that covers them.
  - NOT his work: The front end — the embedded flow and its SDK — was built by others; I have no commits in it.
- **Problem it solved:** Enrolling someone in health insurance looks like a form. It is not. Each insurer wants different data in a different shape on its own schedule; some answer over HTTP, others by exchanging files over SFTP. Regulatory disclosure obligations differ by region. And all of it happens inside an iframe hosted on another company’s platform, where the user expects it to feel immediate. A form hardcoded per insurer does not survive the second insurer.
- **Results:** 9 insurer integrations (HTTP APIs and SFTP file exchange); 3 regulatory regions (disclosure rules differ per region); 7 intent workflow types (enrollment, quote, amendment, renewal…)
- **Architecture:** A .NET modular monolith split by bounded context: the multi-tenant platform core, one module per insurer, plus compliance, webhooks, and financial reporting. The core never calls an insurer directly — every provider call goes through an adapter factory, so the code that runs an enrollment does not know which insurer it is talking to. Long-running work is modeled as an intent: a persisted state machine rather than a request held open.
  - Third-party platform — The host application, embedding the enrollment flow in an iframe.
  - Public API — Versioned contract and signed webhooks for the platforms doing the embedding.
  - Platform core — Employers, employees, eligibility, and the intent state machines.
  - Adapter factory — The single door to every insurer, keeping the core provider-agnostic.
  - Insurer integrations — One module per insurer, over HTTP or scheduled SFTP file exchange.
- **The life of an enrollment:** These are the statuses an enrollment actually moves through. It can also end ineligible, or not undertaken at all — the happy path below is not the only way out.
  - Processing — The request is recorded against its idempotency key and validated, before anything external is called.
  - ActionRequired — Something is missing that only a person can supply. The intent says so and waits, instead of failing.
  - PendingConfirmation — Everything the insurer and the region require is gathered; the requester confirms before it is sent.
  - Enrolling — Handed to the insurer through its adapter, which answers on its own schedule.
  - Enrolled — The policy exists. The platform reports it back to whoever asked.
- **What it does:**
  - Multi-tenant by construction: platform → employer → employee → group, isolated per tenant.
  - Group setup, enrollment, quoting, amendment, renewal, policy import, and dependant management, each as its own workflow.
  - Eligibility computed from provider rules rather than stored as a flag.
  - Policy and plan data aggregated across insurers into a single response.
  - A versioned public API and signed webhooks for the platforms doing the embedding.
  - Insurer integrations over both HTTP APIs and scheduled SFTP file exchange.
- **Engineering decisions:**
  - **Intents instead of request/response** — An enrollment cannot finish inside one call — an insurer may take minutes or days. Modeling it as a persisted state machine with its own status makes the in-between state something the system can query, resume, and report on, instead of a transaction held open and hoped for.
  - **Adaptive requirements instead of a form per insurer** — What a given case must collect depends on the insurer and the regulatory region at once. Rather than encoding nine forms, the platform asks a requirements service what this case needs and renders that. Adding an insurer stops being a front-end change. The lookup happens behind the same adapter boundary, so the core still never handles a provider identity itself.
  - **An adapter factory as the only door to a provider** — The platform core resolves an adapter and talks to that. It never learns which insurer it is serving, which is what keeps a tenth integration from touching enrollment logic — and what let provider contracts be introduced behind feature flags and migrated without stopping the product.
  - **Idempotency and duplicate suppression as a requirement, not a repair** — Retries happen, webhooks arrive twice, and consumers run concurrently against the same rows. Intent creation takes an idempotency key, auto-enrollment suppresses the duplicate intent-and-webhook pair, and the eligibility-screening consumer handles serialization conflicts rather than assuming they cannot happen.

### Dietbox — Nutrition software for practitioners and their patients.

- **Role:** Senior Software Engineer, then Head of Technology (2020–2024)
- **Source:** closed — professional work described without the code (Website: https://dietbox.me)
- **Stack:** .NET, Azure, Azure AD B2C, PostgreSQL, Redis, Socket.IO, Azure DevOps
- **What it is:** A Brazilian SaaS used by nutritionists to plan diets and by their patients to follow them. Two audiences with almost nothing in common share one product, one identity system and one platform — and that platform spans a decade-old monolith and a newer generation of services running beside it.
- **What Felipe did:** Principal architect for four years — I set the platform’s patterns and configured the Azure estate, including for services other people wrote. Later the whole technology organization reported to me.
  - The move off .NET Framework on Windows onto .NET 6 on Linux.
  - Identity end to end: the custom Azure AD B2C policies behind both audiences.
  - The portal service, and the shared building blocks the newer services start from.
  - The realtime service, and CI/CD in Azure DevOps.
  - Production availability and incident response.
  - NOT his work: The product’s largest codebase was a team effort — about a sixth of that repository’s commits are mine.
- **Problem it solved:** The nutritionist lives in the tool all day; the patient opens it to read a meal plan. Same product, same identity backbone, opposite expectations. And in 2020 a .NET Framework monolith carried both on Windows App Service, shipping once a day, at night, because that was the only window that felt safe.
- **Results:** 13 people in the org (engineering, QA, UX and support); ~1.7k commits across six services (mine, of ~5.8k total); 1 month → 1.5 weeks lead time (after Scrum and trunk-based development); −21% monthly cloud spend (after an Azure cost pass) — The commit counts come from the repositories. The rest is my own record of the period.
- **Architecture:** Two generations of the same product, sharing one identity backbone.
  - Legacy platform — The .NET Framework monolith the product grew on, and still its largest codebase.
  - Identity — Azure AD B2C with custom policies, one set per audience, over a single directory.
  - Portal service — The newer generation: a layered domain over shared building blocks, with event sourcing where the questions are historical.
  - Realtime — A dedicated socket server, scaled horizontally behind a Redis adapter.
  - Azure — The estate I configured, with delivery through Azure DevOps.
- **What it does:**
  - Diet planning for the practitioner, and the same plan in the patient’s own app.
  - Two sign-up journeys over one identity system — a practitioner subscribing, and a patient invited by the one treating them.
  - Live updates pushed to open clients without a refresh.
  - Subscriptions and recurring billing.
- **Engineering decisions:**
  - **Custom identity policies instead of a hosted login** — Two audiences share a product but not a journey: a practitioner signing up for a subscription, a patient invited by the one treating them. Custom B2C policies gave each its own sign-up, sign-in and password flow, branded per audience, over one identity backbone instead of two user stores to keep in sync.
  - **Shared building blocks before shared services** — The newer services start from a common domain, infrastructure and identity layer rather than each inventing its own. It is what let a small team add a service without each new one arriving in a new style.
  - **Event sourcing in the portal, not everywhere** — The portal’s questions are historical — what changed, when, and by whom — so its state is derived from events. The rest of the platform is not, because the rest of the platform is not asking that, and event sourcing charges rent on every service that adopts it.
  - **Realtime as its own service** — Long-lived connections scale on a different axis from request traffic, and behind a Redis adapter any instance can push to a client connected to any other. Keeping it inside the monolith would have tied both to the same deploy — and the monolith deployed once a night.
- **Leadership on this project:**
  - **From one nightly deploy to several a day** — I brought in Scrum and trunk-based development. A deploy in daylight stopped being an event.
  - **A payment migration nobody noticed** — I planned and ran the move of thousands of active subscribers from Iugu to Pagar.me. Revenue never paused — the kind of change whose measure of success is that nothing happened.
  - **Cloud spend as an engineering problem** — I took a cost pass over the Azure estate — without a feature freeze to pay for it.
  - **Reporting engineering in the executive’s language** — I started bringing DORA metrics and a roadmap to the executive team, so investment in technology was argued with evidence rather than conviction.

### Ulbra Atende — IT service desk for a university, replacing GLPI.

- **Role:** Head of Technology — design & implementation (Apr 2026 – Current)
- **Source:** closed — professional work described without the code
- **Stack:** .NET 10, PostgreSQL 17, RabbitMQ, React 19, OpenIddict, MCP, OpenTelemetry, Docker Swarm
- **What it is:** The IT service desk for ULBRA — a .NET 10 modular monolith that replaced GLPI as the single intake channel for the university's IT department, carrying a request from ticket to SLA to satisfaction survey.
- **What Felipe did:** Principal author, from scratch — the architecture, the backend, the front end, and the deployment.
  - The modular monolith and the boundaries between its contexts.
  - The SLA engine, including pauses that record who stopped the clock and why.
  - The transactional outbox and the notification fan-out it feeds.
  - The OAuth authorization server and the MCP server behind its consent screen.
  - The React front end and the Docker Swarm deployment.
- **Problem it solved:** ULBRA's IT department took requests through GLPI, e-mail, and direct messages at the same time. There was no SLA per team, no audit trail on approvals, and no way to tell whether anyone was satisfied with the outcome. Ulbra Atende replaces GLPI as the single intake channel and makes each of those measurable — three months in, the median ticket closes in about an hour and a half.
- **Results:** ~2.4k tickets handled (85% closed); 200+ users (across ~30 teams); ~6 min median first response (SLA tracked per team); ~5.0 satisfaction score (400+ responses, 1-5 scale) — in ~3 months of production
- **Architecture:** A .NET 10 modular monolith: one deployable, separate bounded contexts — Core, Identity, Notifications and MCP — each layered Domain → Application → Infrastructure with its own Postgres schema. Integration events travel over RabbitMQ through an EF transactional outbox. Attachments live in S3/MinIO, caching in Redis, tracing via OpenTelemetry; integration tests run against real Postgres, RabbitMQ and MinIO through Testcontainers.
  - React 19 SPA — TanStack Router and Query over a Tailwind design system.
  - .NET 10 API — Modular monolith — four bounded contexts in one deployable.
  - PostgreSQL 17 — One schema per module; EF Core migrations applied on startup.
  - RabbitMQ — Integration events published through an EF transactional outbox.
  - Slack · Google Chat · e-mail — Notification fan-out consuming those events.
- **The life of a ticket:** The SLA clock is the thread running through it. It starts on the receiving team’s policy, stops when the ticket is waiting on someone outside the team, and is what the response and resolution targets are measured against. A ticket can also end cancelled, and work needing sign-off waits on an approval before it starts.
  - Open — The clock starts against the receiving team’s SLA policy, and triage routes it to a team and a category.
  - InProgress — An assignee owns it. First response is already measured by this point.
  - Paused — Waiting on the requester or a third party. The clock stops, and who paused it and why is recorded as its own entry.
  - Completed — The work is done and the requester is asked to rate it — which is where the satisfaction score comes from.
- **What it does:**
  - SLA per team, with pauses that record who paused the clock and why.
  - Multi-stage ticket templates, so a recurring request arrives already broken into steps.
  - Approval flow — work that needs a sign-off cannot start without one.
  - Parent/child tickets and explicit dependencies between them.
  - Notifications fan out to Slack, Google Chat and e-mail, per user preference.
  - A dashboard whose cards drill down into the exact listing they summarize.
  - A satisfaction survey on every closed ticket.
- **Engineering decisions:**
  - **A modular monolith, not microservices** — One team, one deploy. The boundary that matters is the module — enforced by project references and a schema per context — not the network. Distributing it would have bought deployment independence nobody needed and paid for it in latency, partial failures, and debugging.
  - **A transactional outbox for every integration event** — The event row is written in the same transaction as the business change. A notification can never fire for a ticket that failed to commit, and never disappears because the broker happened to be down at that moment — the relay delivers it once the transaction lands.
  - **Strongly-typed IDs from a source generator** — Every entity has its own ID struct, rendered as ti_…, tm_…, us_…. Passing a team ID where a ticket ID belongs stops compiling. A whole class of bug moves from runtime to build time, and IDs say what they are in logs and URLs.
  - **Its own OAuth server, and an MCP server behind it** — OpenIddict issues the tokens; the MCP server exposes ticket read/write and lookup tools. Someone connects Claude or ChatGPT to their own account through a consent screen and works tickets in natural language — under exactly the permissions they already have in the UI, with the same scope check on every tool call.

### Ulbra One — Internal ERP replacing legacy systems.

- **Role:** Head of Technology (Jun 2026 – Current)
- **Source:** closed — professional work described without the code
- **Stack:** .NET 10, PostgreSQL 17, EF Core, React, Tailwind, shadcn/ui
- **What it is:** An internal ERP built to take the university off its legacy systems — a modular .NET 10 monolith on PostgreSQL 17 with a React front end, covering core internal business operations. It is in testing, ahead of launch, so this describes what has been built rather than what is running.
- **What Felipe did:** Set the architecture and the conventions, and built alongside one engineer who carries the day-to-day of this codebase.
  - The module boundaries, and the conventions carried over from the service desk.
  - The PostgreSQL schema and the code-first migration path.
  - Review of every change into the codebase.
  - NOT his work: One engineer owns this codebase day to day; much of the implementation is theirs.
- **Problem it solved:** The university runs its internal operations on licensed legacy systems that neither its data nor its processes fit well. Ulbra One is the platform meant to replace them, built in-house so that the business rules live somewhere the team can change.
- **What it does:**
  - A modular monolith organized by business domain rather than by technical layer.
  - PostgreSQL via EF Core, code-first, with snake_case naming applied by convention rather than by attribute.
  - A React and Tailwind front end sharing the design tokens of the service desk.
  - Migrations run on startup, so an environment is never a manual step behind the code.
- **Engineering decisions:**
  - **The same conventions as the service desk, deliberately** — Endpoint shape, result type and migration strategy are copied from Ulbra Atende rather than reconsidered. With three engineers across six systems, an engineer moving between two codebases should not be learning a second set of rules — the consistency is worth more than any local improvement either codebase might have made alone.
  - **A modular monolith, not services** — An ERP is a set of tightly related domains that transact together. Splitting it into services would buy independent deployment at the cost of distributed transactions across modules that genuinely need consistency — and there is no team here to operate that. Modules give the boundaries; the single process keeps the transactions.

### Dell Automated Caller — Automated end-to-end testing for a phone system.

- **Role:** Conception, architecture and implementation (2020)
- **Source:** closed — professional work described without the code
- **Stack:** .NET Core, RabbitMQ, Entity Framework, Twilio, xUnit
- **What it is:** An internal tool that tests an interactive voice system by actually calling it — the test suite dials the phone menu, listens to what it says, and checks it against what was expected, then files the result alongside the rest of the suite.
- **What Felipe did:** I conceived the tool and built it, and later mentored the junior engineer who joined the project.
  - The test scripting language and the validator that rejects a bad script before it costs a call.
  - Similarity-based assertion, with the threshold declared per step.
  - The queue between the request and the call.
  - The telephony integration and the webhook that carries each transcribed response back.
  - Reporting results back into the test-management tool.
- **Problem it solved:** Testing a phone menu meant someone dialling it, pressing the keys, listening to what the system said, and writing down whether it was right — once per scenario, per language, per route. A full cycle was over twenty thousand calls placed by hand across the team, which in practice meant the full cycle almost never ran. Automating it brought the cycle down to about three hours.
- **Results:** 20k+ calls per test cycle (previously placed one at a time, by hand across the team); ~3h to run the full cycle (it had taken about a month); 9 commands in the test DSL (the script is validated before anything is dialled) — Call volume and cycle time as recalled from the project; the command count is verifiable in source.
- **Architecture:** A .NET Core service in DDD layers. The API accepts a script; a validator rejects a malformed one before a call is placed; the run is dispatched over a RabbitMQ publish/subscribe queue; a telephony provider places the call and posts each transcribed response back by webhook; the response is scored against what the script expected; and the outcome is written back to the test-management tool against its plan, suite and work-item identifiers.
  - Test script — An ordered list of commands describing one call.
  - Validator — Rejects a malformed script before anything is dialled.
  - Queue — Publish/subscribe, so a slow call never blocks the request.
  - Telephony provider — Places the call and posts each transcribed response back.
  - Test management — Receives the outcome against its plan, suite and work item.
- **What it does:**
  - A test script is a short list of ordered commands: dial, wait, enter digits, listen, validate, hang up.
  - Placeholders in the script are substituted at run time, so one script covers many data sets.
  - Every spoken response is stored with what was expected, what was heard, and how closely they matched.
  - Results are written back to the test-management tool against the plan, suite and work item they belong to.
  - A malformed script is rejected with a readable list of errors before any call is placed.
- **Engineering decisions:**
  - **Assert on similarity, with the threshold declared per step** — Speech transcription is never character-exact, so comparing for equality fails good tests. Each assertion carries its own tolerance in the script, because how close a transcription lands depends on what was said — a stock prompt transcribes reliably, a product name does not.
  - **The script is a small language, validated before anything is dialled** — A real call costs time and money and cannot be undone. The validator checks that the required commands are present, that single-use commands appear once, that the order is legal, and that each line matches its grammar — reporting every error in plain language before the first digit is dialled.
  - **A queue between the request and the call** — A phone call takes minutes and fails for reasons outside the caller’s control. Publish/subscribe decouples whoever asked for the run from whatever executes it, so a slow or failed call never blocks the request that started it.
  - **Checking more than the audio** — Hearing the right words does not prove the call was routed correctly. Separate validation steps check the voice menu, the telephony routing, and the records both left behind — which is what makes it an end-to-end test rather than an audio assertion.
