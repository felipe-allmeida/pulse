<!-- GENERATED from web/src/content/projects.ts by `pnpm gen:assistant`. Do not edit by hand:
     edit the source and regenerate, or the drift test in assistant-profile.test.ts fails. -->

## Project case studies

These are the projects written up on the site, in the order they appear there. Each one is a real
system Felipe worked on; the "What Felipe did" line is the authoritative statement of his part in it.

### Pulse — A live, real-time system embedded in a portfolio.

- **Role:** Design & implementation
- **Source:** public — Live site: https://felipealmeida.tech · GitHub: https://github.com/felipe-allmeida/pulse
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
  - An AI assistant grounded in a maintained profile, streaming answers about me.
  - Deployed with Docker Compose + Caddy behind Terraform-managed infrastructure.
- **Engineering decisions:**
  - **A transactional outbox behind a visit counter** — Nothing about counting visits requires one. The point is not the counter — it is that the pattern is here, wired end to end, in something a reader can watch rather than a diagram they have to trust. On a product this would be over-engineering; on a demonstration it is the deliverable.
  - **Real telemetry, published** — The ops dashboard exposes the system’s actual numbers, which means a reader can catch the site lying about itself. Most portfolios make claims that cannot be checked; this one chose the version that can be.
  - **Prerendered pages over a client-only app** — The site renders its content into HTML at build time, so a first visit does not wait on JavaScript and a crawler sees the same page a person does — and, usefully, a deploy can be verified with a single request rather than a browser.
  - **An assistant grounded in a maintained profile** — The assistant answers from a file I keep current, and says it does not know rather than inventing. Ungrounded, it would be a demonstration of exactly the wrong thing.

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
- **What it is:** The IT service desk for ULBRA — a .NET 10 modular monolith that replaced GLPI as the single intake channel for the university’s IT department, carrying a request from ticket to SLA to satisfaction survey.
- **What Felipe did:** Principal author, from scratch — the architecture, the backend, the front end, and the deployment.
  - The modular monolith and the boundaries between its contexts.
  - The SLA engine, including pauses that record who stopped the clock and why.
  - The transactional outbox and the notification fan-out it feeds.
  - The OAuth authorization server and the MCP server behind its consent screen.
  - The React front end and the Docker Swarm deployment.
  - NOT his work: One engineer now works on this codebase alongside me.
- **Problem it solved:** ULBRA’s IT department took requests through GLPI, e-mail, and direct messages at the same time. There was no SLA per team, no audit trail on approvals, and no way to tell whether anyone was satisfied with the outcome. Ulbra Atende replaces GLPI as the single intake channel and makes each of those measurable — three months in, the median ticket closes in about an hour and a half.
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
- **What Felipe did:** I set the architecture and the conventions, and built alongside one engineer who carries the day-to-day of this codebase.
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

### Ulbra CRM — An inherited CRM taken from no tests to full coverage.

- **Role:** Head of Technology — direction & review (Apr 2026 – Current)
- **Source:** closed — professional work described without the code
- **Stack:** React, TanStack Router, MongoDB, Docker Swarm
- **What it is:** The CRM the university runs on, inherited rather than built: no automated tests, and a codebase whose structure had not kept up with it. It is now fully covered by tests and materially better to use, and the work was done by the team under my direction — I set the direction and reviewed it, and did not write it.
- **What Felipe did:** I set the direction and reviewed the work; the engineering was the team’s.
  - The decision to cover the codebase with tests before changing its behaviour.
  - The routing migration that made filter state survive navigation.
  - Review of the work as it landed.
  - NOT his work: None of this implementation is mine. It was built by the engineers on the team; my part was deciding what to do and reviewing what came back.
- **Problem it solved:** The CRM arrived with no automated tests at all, which made every change a gamble, and with usability debt that the people using it every day absorbed silently. The worst of it: changing screens reloaded the application, so the filters someone had just set were gone. Work that goes through the same three or four filters all day pays that cost on every navigation.
- **Results:** 0% → 100% test coverage
- **Engineering decisions:**
  - **Tests first, behaviour second** — The codebase was unstructured and untested, and the temptation with both is to restructure first. The order was inverted: cover the existing behaviour, then change it. Coverage on code nobody has changed yet is what makes the later restructuring safe rather than hopeful — and it is the reason the number is worth quoting.
  - **Routing as state, not as navigation** — Moving to a router that holds application state in the route turned filters from something the page owned into something the URL owned. The visible win is that a screen change no longer discards them; the quieter one is that a filtered view became a link somebody can send to a colleague.
  - **Directed, not written** — This is the one system in the group I did not build. With three engineers and six systems, my leverage as lead is in deciding what gets done and reviewing what comes back, not in adding a fourth pair of hands to a codebase that already has an owner.

### Ulbra Admin — The numbers the board runs the university on.

- **Role:** Head of Technology — design & implementation (Aug 2026 – Current)
- **Source:** closed — professional work described without the code
- **Stack:** .NET 10, React 19, PostgreSQL, MongoDB, TanStack Router, Docker Swarm
- **What it is:** The dashboards the presidency and the board use to check the university’s numbers. A .NET 10 API and a React 19 front end that read two systems neither of them owns: prospect data from the CRM, and confirmed enrollment from the legacy Oracle platform through a typed HTTP client rather than a database connection.
- **What Felipe did:** I built it end to end — the API, the integrations, the front end and the deployment.
  - The read-only integration with the CRM’s datastore.
  - The typed client that fronts the legacy enrollment system.
  - The dashboards themselves and the React front end.
  - Authentication and the Swarm deployment.
- **Problem it solved:** The people accountable for the university’s numbers could not see them without asking. Enrollment lived in a legacy platform, prospects lived in the CRM, and reconciling the two meant a request to IT and a spreadsheet that was stale by the time it arrived. The question being asked was not complicated; the answer was just never at hand.
- **Architecture:** Two sources, neither of them owned by this system, behind one API.
  - CRM store — Prospect and pipeline data, read-only.
  - Enrollment API — A typed HTTP client over the legacy platform — never the database directly.
  - Admin API — Joins the two and serves the dashboards.
  - Dashboards — What the board actually looks at.
- **What it does:**
  - Prospect and enrollment figures side by side, from the two systems that own them.
  - Reads the CRM’s datastore strictly read-only — the dashboards can never corrupt the system of record.
  - Single sign-on, so access follows the accounts the university already manages.
  - The same design tokens as the service desk, so six systems read as one platform.
- **Engineering decisions:**
  - **Deliberately the simplest architecture in the group** — Single project, no modules, no DDD — written into the codebase as a rule, in a house whose service desk is a modular monolith. This system owns almost no domain: it reads two other systems and draws charts. Giving it aggregates and bounded contexts would be ceremony around a query. The architecture is chosen per problem, and the honest answer here was "less".
  - **Never query the legacy database directly** — Enrollment could have been read straight from the legacy platform’s database, and it would have been faster to write. It goes through a typed API instead, so the definition of "an enrolled student" lives in one place rather than being reimplemented in a SQL query — and so the day the legacy platform is replaced, one client changes rather than every consumer of it.
  - **Read-only by construction** — The connection to the CRM’s datastore is read-only, not by convention but by the credentials it holds. A reporting system that can write to the system of record is one bug away from corrupting the numbers it exists to report.

### Student Dashboard — A screen on a wall that tells students where to be.

- **Role:** Head of Technology — design & implementation (Apr 2026 – Current)
- **Source:** closed — professional work described without the code
- **Stack:** .NET 10, React 19, PostgreSQL, Microsoft Fabric, ODBC, Docker Swarm
- **What it is:** A schedule display installed in the university’s first building, the medical school, where it shows students the day’s classes. One system with two faces: an unattended fullscreen kiosk, and a sign-in-protected admin where staff manage the content it rotates. Academic data comes from the university’s analytics lakehouse.
- **What Felipe did:** I built it end to end — the API, the lakehouse integration, both front ends and the deployment.
  - The lakehouse connection that supplies the schedule.
  - The kiosk display, its rotation and its day/night themes.
  - The content admin and its scheduled playlist.
  - Deployment onto the internal cluster.
- **Problem it solved:** Students arriving at the building had no way to see the day’s schedule without looking it up on a phone, and the university had no way to put anything in front of them at the moment they walked in. A printed sheet answers the first problem badly and the second not at all.
- **What it does:**
  - A fullscreen kiosk sized for the physical panel it runs on, not for a browser window.
  - Rotates between schedule pages and campus content on a fixed cadence.
  - Switches between a day and a night theme by the clock, so it is readable in both.
  - Staff schedule content with start and end dates; it appears and expires on its own.
- **Engineering decisions:**
  - **Polling, not a live connection** — The display asks the server for fresh data on a short interval rather than holding a socket open. A socket is the better answer when a human is watching and latency matters; this is a screen on a wall with nobody in front of it. Polling recovers from a dropped network by itself, and nobody has to walk to the building to restart it.
  - **The analytics lakehouse as the source** — The schedule is read from the university’s analytics platform rather than from the academic system directly. It is the copy that is already shaped for reading, already has access controls the display can be granted narrowly, and — crucially — cannot be affected by a screen in a lobby querying it all day.
  - **One system, two audiences** — The kiosk has no login and no interaction; the admin has both. Splitting them into two deployments was the obvious move and was rejected: they share the content model entirely, and two services would mean two places to change when the shape of a slide changes. The boundary is a route and an auth check, not a process.

### Ulbra Infra — From a person on the box to a repository and a pipeline.

- **Role:** Head of Technology — design & implementation (Apr 2026 – Current)
- **Source:** closed — professional work described without the code
- **Stack:** Docker Swarm, Traefik, GitHub Actions, OpenTelemetry, SigNoz, Prometheus, Grafana, Metabase
- **What it is:** The platform underneath every other system in this group. It began as on-premise servers with no automation at all — deployment meant a person on the machine, installing a runtime and starting the application by hand. It is now a provisioning script, a container orchestrator, a reverse proxy, two observability tools with a declared split, and a delivery loop in which an alert can investigate itself and open a pull request.
- **What Felipe did:** I designed and built the platform, and the delivery model that runs on it.
  - The one-run provisioning script and the cluster it produces.
  - The reverse proxy and the routing convention every application follows.
  - The split between application and host observability.
  - The CI pipeline, and the alert-to-pull-request loop built on top of it.
  - The delivery dashboard that reads the team’s own task tracker.
- **Problem it solved:** Everything ran on-premise with nothing automated around it. Getting an application into production meant connecting to a server, installing a runtime and starting the process by hand — which makes every deployment a memory exercise, every server subtly different from the last, and every outage an archaeology problem. Nothing was measured, so nothing could be improved on purpose.
- **Provision once, then per application:** The server is set up in one run; after that, shipping an application is a repository and a pipeline.
  - Provision — One script: runtime, firewall, cluster, overlay networks.
  - Platform — Reverse proxy and the observability stacks come up with it.
  - Push — CI builds the image and pushes it to the registry.
  - Deploy — The pipeline deploys the stack; the proxy picks up the route from labels.
  - Observe — Traces, logs and metrics flow in from environment variables alone.
- **From an alert to a merged fix:** What the team automated is the investigation, not the judgement.
  - Alert — Application telemetry crosses a threshold.
  - Investigate — A coding agent reads the trace and the code around it.
  - Pull request — A proposed fix arrives as a normal change to review.
  - Review — An engineer accepts, amends or rejects it.
  - Merge — The same pipeline every other change goes through.
- **What it does:**
  - One script takes a bare server to ready: container runtime, firewall, cluster, overlay networks, proxy and monitoring.
  - A new application needs a compose file and a workflow — the routing and the certificate follow from labels.
  - Telemetry is opt-in through environment variables; nothing else has to be wired.
  - An alert can be investigated automatically and arrive as a pull request for a human to judge.
- **Engineering decisions:**
  - **Two observability tools, on a stated boundary** — Application telemetry — logs, traces, metrics — goes to one tool over OpenTelemetry; host metrics like CPU, memory and disk stay in another. Running two looks like drift until you read the rule written into the configuration: applications do not report to the host stack. Each tool is good at one of the two jobs, and the alternative considered and rejected was one tool doing both badly.
  - **Alerts investigate themselves; humans still merge** — When application telemetry raises an alert, a coding agent reads the trace and the surrounding code and opens a pull request with a proposed fix. What was automated is the investigation — the part that is mechanical and slow at three in the morning. The merge is not automated, and deliberately so: a change nobody approved reaching production is a worse failure than a slow fix.
  - **An orchestrator sized for the team** — Kubernetes was the default answer and was not taken. The cluster is small, on-premise, and operated by three engineers who are also writing six applications. Swarm gives multi-node scheduling, rolling updates and overlay networking with a fraction of the operational surface — and the cost of the ceiling it imposes is far below the cost of a control plane nobody has time to run.
  - **The team measures itself with its own pipeline** — A dashboard reads the team’s task tracker through an ETL sidecar, so delivery is visible in the same place the systems’ numbers are. It is a small piece of plumbing carrying a large claim: a working model that is measured can be argued about with evidence, and one that is only asserted cannot.

### Airia Cloud Connector — A reverse tunnel that reaches into a private network without opening it.

- **Role:** R&D Engineer — security, routing and command surface (Jun 2025 – Oct 2025)
- **Source:** closed — professional work described without the code
- **Stack:** .NET 9, SignalR, Redis, JWT, MCP, xUnit, Testcontainers, Helm
- **What it is:** A trimmed, single-file executable that runs inside a customer network and holds an outbound channel open to the cloud platform. Everything the platform needs on the other side of the firewall — an HTTP call, a database query, an MCP tool invocation — travels back down that one channel as a typed command.
- **What Felipe did:** I owned how the connector authenticates, how a request finds the right one, and what it is able to do once it gets there.
  - Mutual TLS between connector and hub — built, and switched off a week later.
  - Routing — resolving which connector in which customer group answers a given request.
  - The database command type, for both relational engines and document stores.
  - MCP support: listing an internal server’s tools and executing them through the tunnel.
  - Per-environment release packaging, and installation as a native Windows service.
  - NOT his work: The repository predates me by three months and several engineers shared it; the hub’s browser-agent surface is someone else’s work.
- **Problem it solved:** An enterprise buys a cloud AI platform, and then the agents it builds there need the systems that actually hold its data — a database, an internal API, an MCP server — all of which sit behind its firewall. The standard answers are a VPN, a site-to-site tunnel, or an inbound rule for the vendor’s address range, and each one asks a security team to open the perimeter for software it does not run. The connector inverts the direction instead: nothing dials in, so there is nothing to open.
- **Architecture:** The connector opens a SignalR connection outward and registers itself under a customer group. The hub keeps that registry in Redis rather than in memory, so any hub instance can find any connector and correlate the reply — which is what lets the hub scale horizontally behind a load balancer. A platform request becomes a typed command envelope, is pushed down the connector’s channel, executed against whatever is on the private side, and the response is tracked back to the instance still holding the caller.
  - Airia platform — Issues an ordinary HTTP request, addressed to a customer group rather than to a host.
  - Cloud Hub — Wraps it as a typed command and looks up which connector should answer.
  - Redis registry — Holds the connector-to-instance map and the pending responses, so the hub can run as more than one replica.
  - Connector — Receives the command on the channel it already opened, from inside the customer network.
  - Internal service — The API, database or MCP server that never became reachable from outside.
- **What it does:**
  - Outbound-only: the connector dials the cloud, never the other way round.
  - Integration tests run against a real Redis through Testcontainers, not a fake.
  - Queries relational engines and document stores on the private side, schema included.
  - Exposes an internal MCP server’s tools to the platform through the same tunnel.
  - Ships as one trimmed, self-contained executable, installable as a Windows service.
- **Engineering decisions:**
  - **Invert the direction rather than open the perimeter** — A persistent outbound connection does everything an inbound rule would, and asks the customer for nothing their egress policy does not already allow. The security review this avoids is not a small one: it is the difference between a deployment a network team approves in an afternoon and one that spends a quarter in committee.
  - **Mutual TLS, built and then switched off** — A bearer token proves the connector to the hub and does nothing to prove the hub to the connector, so client certificates went on both ends, with an explicit clock-skew allowance and a readable error in place of a raw handshake failure. It lasted a week. I merged the change that disabled it myself, the certificate requirement was dropped the next day, and the wiring is still commented out on both sides — the reason is not recorded anywhere I can point to, and I am not going to reconstruct one. What ships is bearer tokens over TLS. The honest lesson is not about the cryptography: a security control that a customer’s ops team has to hold up their end of is only as real as the certificate distribution nobody had built yet.
  - **The connector registry lives in Redis, not in the hub’s memory** — A connector is attached to exactly one hub instance, but a platform request can land on any of them. Keeping the registry and the pending responses in Redis means the instance that receives a request can route it to the instance holding the connection, and the reply finds its way back. Without that, the hub is pinned to a single replica — a strange thing to accept in the one component every customer’s traffic passes through.
  - **One command envelope instead of a proxy per capability** — HTTP came first, and databases and MCP could each have been a second tunnel with its own lifecycle. Making them command types on the existing channel meant authentication, routing, reconnection and response correlation were solved once. When MCP support was added, none of that had to be rebuilt — it was a new command type and a handler.
  - **A trimmed single file, and the serializer that requires** — The connector is installed by someone else’s ops team on a machine nobody on the vendor side can log into, so it ships self-contained: no runtime to install, one file to copy, and later a native Windows service so it survives a reboot without a human. Trimming that binary breaks reflection-based JSON, which is why the command envelope is serialized through a source-generated context — an unglamorous constraint that follows directly from choosing a deployment the customer can actually operate.

### Airia.DataStores.Common — One query surface over six database engines, shipped as a package.

- **Role:** R&D Engineer — author, from the first commit (Jul 2025 – Oct 2025)
- **Source:** closed — professional work described without the code
- **Stack:** .NET 9, PostgreSQL, SQL Server, MySQL, Snowflake, Databricks, MongoDB, xUnit
- **What it is:** A shared library that answers one question for every database an enterprise might point at an AI agent: how do you run a query and read a schema without the caller knowing which engine it is talking to.
- **What Felipe did:** I started this repository and wrote its first version — the interfaces, the providers, the pooling and the package pipeline that publishes it.
  - The provider interface, and the relational implementations behind it.
  - Schema metadata retrieval, as part of the contract rather than an extra.
  - Connection pooling and the factory that hands out pooled stores.
  - The document-store provider and its client wrapper.
  - Unit tests and the publish workflow that versions the package.
  - NOT his work: Other engineers added providers and fixes on top of it after the first release.
- **Problem it solved:** The connector needed to query whatever database a customer happened to run, and the platform needed exactly the same thing from its own side. Written twice, that is two provider matrices, two sets of connection-string quirks and two places for a TLS default to be wrong — and they drift, because nobody fixes a bug in the copy they are not looking at.
- **Architecture:** A caller asks a factory for a store of a given type and hands it connection parameters as a dictionary rather than a pre-built connection string, so nothing upstream has to know each engine’s spelling. The factory returns a pooled store; the store exposes the same two operations — execute a query, describe the tables — whatever driver is underneath. Document stores get a sibling interface, because pretending a collection is a table would be a lie the caller eventually pays for.
  - Caller — The connector or the platform, holding connection parameters and a query.
  - Factory — Resolves the engine type to an implementation.
  - Connection pool — Hands back a live store and reclaims it after use, capped per configuration.
  - Store — Two operations only: execute a query, describe the tables.
  - Engine driver — The vendor client, and the only place an engine’s quirks are allowed to live.
- **What it does:**
  - Six engines behind one interface, with the document store kept honestly separate.
  - Schema description is part of the contract, not something bolted on later.
  - Connection pooling behind the factory, so no caller manages a lifetime it did not open.
  - Connection parameters as a dictionary — the library, not the caller, knows each engine’s spelling.
  - Published as a versioned package, consumed by both the connector and the platform.
- **Engineering decisions:**
  - **Reading the schema is part of the interface** — A human writing SQL already knows the tables. A model does not, and asking it to guess produces queries that fail in ways that look like the database is broken. Making schema description a first-class operation alongside query execution is what turns the library from a connection helper into something an agent can actually be pointed at.
  - **Parameters as a dictionary, never a connection string** — Every engine spells the same idea differently — host versus server, the port that is implied, how encryption is requested. Accepting a built string would push that trivia into every caller and, worse, make each caller responsible for the security defaults. Taking a dictionary keeps one place where a wrong default can be fixed for everybody.
  - **A published package, not shared source** — The connector and the platform are separate repositories on separate release cadences. Copying the source would have been faster on day one and would have guaranteed divergence by month two. A versioned package makes the shared thing an actual dependency: an upgrade is a deliberate act with a number attached, and a fix reaches both consumers or neither.
  - **Pooling belongs to the library, and its ceiling is configuration** — Callers that open connections directly leak them under load, and the leak surfaces as an unrelated timeout somewhere else. Putting the pool behind the factory makes the correct thing the default thing. The maximum is a setting rather than a constant because the right ceiling for a connector on one customer machine is not the right ceiling for the platform — and the first default shipped turned out to be too low, and was raised five-fold.

### Secure Posture Management — An inventory of every AI agent an enterprise is already running.

- **Role:** R&D Engineer — domain model, persistence and a provider (Jul 2025 – Oct 2025)
- **Source:** closed — professional work described without the code
- **Stack:** .NET 9, Entity Framework Core, PostgreSQL, Azure AI Foundry, AWS Bedrock, xUnit
- **What it is:** Posture management inside the platform: a set of provider connections that are refreshed on a schedule, the agents and components they discover, and the violations feed that says which of them did something a policy forbids.
- **What Felipe did:** I built the domain model and the persistence under this feature, and added one of the cloud providers it discovers through.
  - The entities — connection, agent, component, settings — and their database context.
  - A repository layer over that context, so query logic stopped living in services.
  - The Azure model-service provider, alongside the ones already supported.
  - An execution identifier on the violations feed, tying a violation to the run behind it.
  - NOT his work: This was a large feature owned across several teams — the discovery scanners, the risk scoring and the interface were other people’s work. Mine is the layer they read and write through.
- **Problem it solved:** An enterprise does not adopt AI in one place. It arrives through a workflow automation tool one team installed, a cloud model service another team already pays for, an assistant builder bundled into software it licenses, and personal subscriptions nobody approved. Governing that starts with a list, and before this feature there was no list — only the parts each team happened to know about.
- **Architecture:** A tenant configures a connection per provider, each with its own typed configuration rather than a shared bag of settings. A scheduled job refreshes those connections and writes back what it found as components and agents, so the inventory has an age rather than being whatever the last person clicked. The violations feed sits on top and, since this work, carries the execution identifier that links a violation to the run that produced it.
  - Provider connection — One per platform an enterprise runs AI on, each with a typed configuration of its own.
  - Scheduled refresh — Re-reads every connection on a timer, so the inventory ages instead of going stale silently.
  - Components and agents — What was discovered, persisted through a repository layer rather than ad-hoc queries.
  - Violations feed — What broke a policy, each row traceable to the execution that caused it.
- **What it does:**
  - Discovery across several agent platforms, each behind its own typed connection.
  - A scheduled refresh, so the inventory has a known age.
  - A repository layer over the database context, keeping query logic out of services.
  - Violations traceable to the execution that produced them.
- **Engineering decisions:**
  - **A typed configuration per provider, not one settings blob** — Every provider authenticates differently and exposes a different shape of thing to discover. A single loosely-typed settings object would have made every consumer guess which keys apply to which provider, and made adding one a matter of hoping nothing downstream cared. A closed set of typed configurations means the compiler names the work required to support a new platform.
  - **A repository layer, added after the fact and on purpose** — The first version queried the database context straight from the services, which is fine until three teams are writing services against the same entities and each invents its own idea of what "the agents for this tenant" means. Moving those queries behind repositories gave the feature one definition of each read, and gave the unit tests something to stand on that is not a database.
  - **A scheduled refresh instead of a webhook per provider** — Webhooks would be fresher, and would require every provider to support them, every customer to configure them, and the platform to be reachable from each one — which is the same perimeter problem the connector exists to avoid. Polling on a schedule is less elegant and works everywhere, and an inventory whose age is known is more useful than one that is silently missing whatever event was dropped.
  - **A violation you can trace to a run** — A feed saying a policy was broken is an alert; a feed saying which execution broke it is an investigation. Carrying the execution identifier through to the violation row is a one-column change that moves the feed from something a security team watches to something they can act on.

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
