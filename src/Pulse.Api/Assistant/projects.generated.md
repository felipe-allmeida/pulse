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

### Dietbox Webapp — The decade-old monolith the product grew on, and still its largest codebase.

- **Role:** Senior Software Engineer, then Head of Technology (2020–2024)
- **Source:** closed — professional work described without the code (Website: https://dietbox.me)
- **Stack:** C#, ASP.NET MVC, Entity Framework, SQL Server, Azure App Service, Kendo UI, Azure DevOps
- **What it is:** The monolith is the product's centre of gravity: for years it was the only codebase, carrying both the nutritionist and the patient experience through the same release. Everything the product did shipped through this one pipeline, on the one schedule that pipeline allowed.
- **What Felipe did:** Principal architect for four years — I set the platform’s patterns and configured the Azure estate, including for services other people wrote. Later the whole technology organization reported to me.
  - The build and release pipeline in Azure DevOps, shipping the core project together with its satellites and its gulp-built, Kendo UI front end.
  - Production availability and incident response.
  - NOT his work: The product’s largest codebase was a team effort — about a sixth of that repository’s commits are mine.
- **Problem it solved:** The nutritionist lives in the tool all day; the patient opens it to read a meal plan. Same product, same identity backbone, opposite expectations. And in 2020 a .NET Framework monolith carried both on Windows App Service, shipping once a day, at night, because that was the only window that felt safe.
- **Results:** ~600 commits in the monolith (mine, of ~3.9k total); 4 years in the same codebase (2020 to 2024) — The commit counts come from the repository. The rest is my own record of the period.
- **Architecture:** The core project, its data, the scheduled job beside it, and the Azure app it deploys onto.
  - Web application — The core project and its satellites — catalogs, enums, shared infrastructure, resources and reports — behind a gulp-built front end using Kendo UI.
  - Data layer — Entity Framework over SQL Server, the store the monolith reads and writes through.
  - Background jobs — A webjob project for scheduled work — a single daily job — sitting in the repository but outside the solution the release builds, and published on its own.
  - Azure App Service — A Windows app with a staging slot: the release deploys the built artifact to the slot, then swaps the slot into production.
- **What it does:**
  - Diet planning for the practitioner, and the same plan in the patient’s own app.
  - Two sign-up journeys over one identity system — a practitioner subscribing, and a patient invited by the one treating them.
  - Live updates pushed to open clients without a refresh.
  - Subscriptions and recurring billing.
- **Engineering decisions:**
  - **One core, many satellites** — The core project doesn't carry catalogs, enums, shared infrastructure, resources and reports itself — each lives in its own satellite project. A change to reference data doesn't touch the same project as a change to the request path.
  - **The release builds a target, not the solution** — The release pipeline restores the solution but builds a single target — the site project — and archives only what that target publishes. The webjob project sitting beside it in the repository is not in the solution at all: it still targets 4.7.2 where the site targets 4.8, carries its own daily-schedule publish settings, and has not been touched since 2021. Naming a target rather than a solution is what keeps a project in that state from riding into a release nobody meant to include it in.
  - **Release by slot swap, not by overwrite** — The pipeline builds once and deploys that one artifact to the app’s staging slot; production changes by swapping the slot in, not by writing over the site while it is serving. What goes live is a build that was already running before it took traffic, and the way back is the same swap in the other direction. That is what a deploy has to be before it can happen in daylight rather than at night.
  - **A monolith you strangle, not rewrite** — New capability went into the services beside the monolith, not into the monolith itself. It kept the surface it already served, without a rewrite competing for the same hours as the features shipping everywhere else.

### Dietbox B2C — One identity backbone, two audiences, custom sign-in journeys.

- **Role:** Senior Software Engineer, then Head of Technology (2021–2024)
- **Source:** closed — professional work described without the code (Website: https://dietbox.me)
- **Stack:** Azure AD B2C, Identity Experience Framework, XML, OpenID Connect, OAuth 2.0, .NET 6, HTML, CSS, Azure DevOps
- **What it is:** One Azure AD B2C identity system carrying two audiences that share nothing but the account: a nutritionist subscribing and paying, and a patient arriving by invitation from the one treating them. Three years of custom sign-in journeys, federated providers, silent migration off the legacy store, and session revocation that reaches every open browser.
- **What Felipe did:** This is the author’s largest personal ownership in the Dietbox estate: half the commits over three years, across both audiences’ sign-in journeys.
  - The two policy sets — one for the practitioner, one for the patient — each its own sign-up, sign-in and password-reset journey.
  - Federation with Google, Facebook and Apple, each mapped through its own exchange profile into a common subject claim.
  - The first-sign-in migration that moves a legacy-store user into the directory during the same journey they log in with.
  - Session revocation: a stamp on the user compared against the token’s issue time, so a password change or an admin revoke signs the account out everywhere.
  - The custom sign-in pages, one set per audience, served and filled in at runtime.
- **Problem it solved:** A hosted login gives a product one journey. This one needed several: a subscriber signing up and paying, a patient arriving by invitation with no password to set, an academy student, and a receptionist acting on someone else’s behalf — all over one directory, without four separate user stores to keep in sync.
- **Results:** ~7.2k lines of policy XML (across two policy sets); ~730 commits (mine, of ~1.5k total) — The line count is a plain line count over the committed policy files; the commit share comes from the repository.
- **Architecture:** Two independent policy sets sit above one directory, and everything downstream trusts the tokens they issue.
  - Practitioner policies — Sign-up, sign-in, subscriber and academy journeys for the nutritionist audience.
  - Patient policies — Sign-up and sign-in for the patient audience, invited rather than self-registering.
  - Directory — One user store beneath both policy sets, holding local and federated accounts alike.
  - Auth service — Validates the tokens this system issues. Reads and writes against the directory itself go through a shared gateway package that several services in the platform take a dependency on.
  - Custom UI pages — Static markup, one set per audience, served by the identity platform and filled in at runtime.
- **The sign-in journey:** Every step below corresponds to a technical profile that exists in the policy — this is the orchestration as written, not a simplification of it.
  - Sign-in — Local credentials, or a federated provider — Google, Facebook or Apple — exchanged into a common subject claim.
  - Legacy check — Is this a legacy-store user who has not yet been migrated?
  - Migration — If so, the account is written into the directory with an alternative security identifier linking it back to the legacy credential — in the same journey as the sign-in, not a separate step.
  - Entitlement — Is the account enabled, and does it belong to a gated journey — subscriber, academy — that requires an active entitlement?
  - Token — A token is issued, stamped with the time the user’s security record was last valid from.
- **What it does:**
  - Federated sign-in with three providers, each exchanged into a common subject claim.
  - Silent migration off the legacy store during the user’s own sign-in journey.
  - Per-audience branded pages, one set for the practitioner and one for the patient.
  - Entitlement gates for subscriber and academy journeys, enforced inside the sign-in flow rather than after it.
- **Engineering decisions:**
  - **Custom policies instead of a hosted login** — A hosted login gives one journey. This product needed a subscriber signing up and paying, a patient arriving by invitation, an academy student, and a receptionist — over one directory, without four user stores to keep in sync. Writing the policy directly was the only way to get gated journeys and a first-sign-in migration without forking the user base.
  - **Migration as a side effect of signing in** — Nobody was asked to reset a password or re-register. The user experiences a login; the system experiences a migration, writing the account into the directory and linking it back to the legacy credential in the same journey.
  - **Revocation that reaches open sessions** — A token that is merely unrenewable is not revoked. Comparing the token’s issue time against a stamp on the user record is what makes "sign this account out everywhere" actually mean it, rather than "stop this account from getting a new token next time."
  - **One directory, several journeys** — Separate policies per audience over one shared user store, rather than one policy branching on audience or several stores that would have to be reconciled. The audiences share an identity, not a form.

### Dietbox Payment — Subscriptions and recurring billing, behind a checkout of its own.

- **Role:** Head of Technology (2023–2024)
- **Source:** closed — professional work described without the code (Website: https://dietbox.me)
- **Stack:** .NET 6, C#, CQRS, Vue 3, Vite, PrimeVue, Pinia, Cypress, Azure DevOps
- **What it is:** The service responsible for the money: subscription commands on one side, a webhook handler for every event a payment gateway raises on the other, and two gateway integrations in between — Iugu and TSPay, each in a crosscutting package of its own. It is kept separate because money has a different failure mode from everything else in the product — its own release train, in a repository it shares with the platform’s other services.
- **What Felipe did:** As principal architect across the estate, I set the patterns this service is built on: the path-filtered release pipeline that lets it ship on its own train, and the crosscutting-package convention every third-party integration is wrapped in before a service takes a dependency on it. The commands, the webhook handlers and the checkout itself were the team’s to write.
  - The release pipeline’s path filter, so a payment hotfix ships on its own branch without redeploying the other four services.
  - The crosscutting package each gateway integration lives in, and the one shared project that pulls them in for whichever service needs them.
  - The Azure estate this service deploys onto, configured the same way as its neighbours.
  - NOT his work: The subscription commands, the webhook handlers and the checkout client are a team’s work: the author holds roughly a tenth of the checkout client’s commits, across February 2023 to July 2024, and about a fifth of the service’s, whose repository does not begin until October 2023 — the bulk of both belongs to other engineers.
- **Problem it solved:** A subscription doesn’t live only in the product’s own database — it also lives in whichever gateway is processing it, and that gateway’s opinion of the subscription’s state arrives asynchronously, by webhook, on its own schedule. Two gateways were live at once while subscribers were being moved between them, each with its own event names, its own payload shape and its own idea of what a subscription is. And every one of those webhook deliveries has to be reconciled with what the product already believes happened, not simply trusted.
- **Architecture:** A Vue checkout out front, CQRS commands and controllers in the middle, and two gateway integrations each in a package of its own — with each gateway closing the loop asynchronously through a webhook endpoint of its own.
  - Checkout client — The Vue checkout — subscription, renewal and thank-you views — calls the service’s commands: subscribe, create an invoice, generate a payment link.
  - Payment service — Subscription, transaction, voucher, extension and webhook controllers sit in front of the CQRS commands that do the work.
  - Gateway packages — Iugu and TSPay each live in a crosscutting package with an interface of their own, reached through the one shared project every service in this repository references.
  - Gateway webhooks — Each gateway posts its own opinion of the subscription back to an endpoint of its own, where a factory maps that gateway’s event names onto commands — one handler directory per event.
- **The subscription lifecycle:** Every step below is a directory in the webhook handler tree, named for the gateway event it answers.
  - Created — The gateway has created the subscription on its side; the service records it before the first invoice exists.
  - Activated — The subscription’s first payment cleared; the service marks it active and the customer’s access follows.
  - Changed — A plan, a price or a payment method changed on the gateway’s side; the service updates its own record to match.
  - Payment failed — An invoice on the subscription failed to charge on the gateway’s side; the service records the failure.
  - Suspended — The gateway has suspended the subscription; the service mirrors the state, and access follows it.
  - Expired — The subscription has run its course and the gateway has closed it; the service marks the record accordingly.
  - Invoice paid — A marketplace invoice has been paid; the service records the payment against the subaccount it belongs to.
  - Invoice released — The marketplace has released the funds from a paid invoice to the subaccount holder.
  - Invoice refunded — A marketplace invoice has been refunded; the service reverses what it recorded against the subaccount.
- **What it does:**
  - Subscribing and renewing, with a suspend path when a payment lapses.
  - Vouchers and plan extensions, adjusting a subscription without cancelling and re-creating it.
  - Payment links generated on demand, for a charge outside the regular checkout flow.
  - Marketplace subaccounts, with their own invoice-paid, released and refunded events.
- **Engineering decisions:**
  - **One repository, five release trains** — The payment service shares its repository with the core, auth, foods and jobs services, and each of the five ships on its own release train: its own pipeline file, its own branch trigger, and a path filter naming the other four services’ directories as reasons not to build. A payment hotfix does not redeploy auth. A monorepo without a shared deploy.
  - **A package per gateway, not one interface for all** — Iugu and TSPay do not share an interface — they have nothing in common to share. Each sits in its own crosscutting package with its own vocabulary, its own webhook endpoint and its own command factory, and a handler asks for the gateway it actually needs by name. Which gateway a subscription belongs to is a value in the domain, not a detail hidden from it, and that is what made moving subscribers between the two possible one at a time: a TSPay webhook can still reach into Iugu to suspend the old subscription of a nutritionist who has just been moved across.
  - **The webhook tree is the state machine** — There is one handler per gateway event, named for the event itself — subscription created, invoice paid, invoice refunded — rather than one endpoint switching on a payload field. The directory structure is the lifecycle, readable without opening a single file.
  - **A checkout that is not the app** — The purchase funnel ships as its own client — its own Vue app, its own Cypress suite reporting through Allure — separately from the rest of the product, on its own cadence.

### Dietbox Portal — The back office, and the newest generation of the platform’s architecture.

- **Role:** Head of Technology (2023–2024)
- **Source:** closed — professional work described without the code (Website: https://dietbox.me)
- **Stack:** .NET 6, C#, CQRS, MediatR, EF Core, SQL Server, ASP.NET Identity, JWT, Vue 3, Vuex, Azure DevOps
- **What it is:** A back office is where a SaaS company’s real operating procedure lives — the subscriptions, the vouchers, the food catalogue, marketing — and this was the first place the platform’s newer patterns were carried through end to end: layers numbered on disk, commands and queries behind a pipeline behaviour that logs every one of them, and a domain that raises its own events and has them dispatched the moment its changes are saved.
- **What Felipe did:** The layered design this service is built on — the numbered directories, the command/query pipeline, and where the domain-event dispatch sits inside it — the identity building block, and the shared building blocks the platform’s newer services now start from, are the author’s. The eighteen business-domain controllers and the admin client’s views were the team’s to build out.
  - The numbered directory layout — building blocks, services, application, domain, infrastructure — and the dependency direction it makes legible before a file is opened.
  - The identity building block: its own user store, a JWT builder and validator, access and refresh tokens, and claim-based authorization.
  - The message and event base types among the shared building blocks, and the dispatch that publishes what an aggregate raised once the unit of work has saved it.
  - The shared building blocks — domain, infrastructure and identity — the platform’s newer services start from instead of each inventing its own.
  - The client’s persisted token pair and its refresh flow against the accounts endpoint.
  - NOT his work: Across the service and the admin client together, roughly a third of the commits are the author’s — the rest, including most of the eighteen business-domain controllers and the client’s views, is the team’s.
- **Problem it solved:** Support and operations were reaching straight into the product database, or into the monolith’s own admin surface, to do what the business runs on day to day — adjusting a subscription, issuing a voucher, updating the food catalogue. A back office with its own domain, its own staff identity and its own command surface was the alternative: the same operations, but as named commands logged on the way through, behind sign-in that isn’t the customer’s.
- **Results:** ~276 commits across both repositories (mine, of ~780 total); 3 test projects (domain, application, and integration) — Both figures come from the two repositories’ own commit history.
- **Architecture:** An admin client in front, a service exposing the eighteen controllers, an application layer of commands and queries behind a logging pipeline behaviour, a domain layer underneath, and infrastructure at the bottom — where saving a change is also what releases the events that change raised.
  - Admin client — The Vue 3 client — dashboard, charts, and the eighteen controllers’ views — including the impersonate controls in the navbar and the patient view.
  - Service — Controllers behind the claim-requirement authorization filter, validating the access token before a request reaches a command or query.
  - Application — Commands and queries behind a pipeline behaviour that logs each one by name, and the handlers that turn a domain event into the integration event other services consume.
  - Domain — The business rules for the eighteen areas administered — nutritionists, patients, subscriptions, vouchers, the food catalogue, and the rest — raising the events the layers above and below both care about.
  - Infrastructure — An EF Core context over SQL Server: it writes the aggregate’s current state, then hands the events that aggregate collected while changing to MediatR, once the write has already landed.
- **What it does:**
  - Impersonation as a first-class feature: support can act as the nutritionist or patient they’re helping, from the client’s navbar or the patient view, and step back out.
  - Eighteen controllers spanning the business administered: nutritionists and patients, subscriptions and their configuration, transactions, vouchers, the food catalogue, tags, marketing, materials, events, universities, metrics, accounts.
  - A dashboard with charts mirroring those same domains, so the numbers support looks at come from the same commands that changed them.
  - Domain events kept separate from integration events, so a change another service needs to hear about is an explicit publication, not a side effect of one that only matters inside this one.
- **Engineering decisions:**
  - **Layers numbered on disk** — The service’s directories are numbered by layer — building blocks, services, application, domain, infrastructure — so the dependency direction is legible from a directory listing alone, before a single file is open. A layer importing from the wrong direction is a violation visible in the file tree, not just in a code review.
  - **Staff identity is not customer identity** — The back office authenticates against its own store — an identity building block with its own user database, a JWT builder and validator, access and refresh tokens, and claim-based authorization — not the customer directory. Giving support staff accounts in the customer identity system would have meant handing customer-grade identities administrative scopes; keeping the two separate keeps a back-office session a different thing from a customer session, by construction.
  - **Events dispatched at save time, not stored** — An aggregate collects the events it raises while a command changes it; the unit of work writes the row, then publishes those events through MediatR after that write has committed. Nothing is replayed and no state is rebuilt from a log — the table still holds the current row. What this buys is that a consequence of an operation is a subscriber to something the domain said, rather than one more paragraph inside the command that said it.
  - **Shared building blocks before shared services** — The newer services, this one included, start from a common domain, infrastructure and identity layer instead of each inventing its own — the same message and event base types, the same identity building block, the same base entities. That shared foundation is what let a small team add a service without each one arriving in a different style.

### Dietbox Notifications — A messaging bill turned into a product constraint.

- **Role:** Head of Technology (2023–2024)
- **Source:** closed — professional work described without the code (Website: https://dietbox.me)
- **Stack:** .NET 6, C#, CQRS, SQL Server, WhatsApp Business API, Azure DevOps
- **What it is:** This service exists because of a number on an invoice: the official WhatsApp messaging bill in May 2023. The answer was not a rate limit bolted onto the existing product, but a small domain of its own — a quota, a log of who changed it, and a record of every send.
- **What Felipe did:** The design document, the domain and the service are the author’s: nineteen of the twenty commits, from the first estimate to the running service.
  - The capacity-planning document itself — the volume, query-rate and storage estimates the service was built to meet.
  - The domain model: a notification limit per practitioner, a log of every change to it, and a record of every notification sent.
  - The two controllers and their commands and queries — adding a limit, sending a notification, and querying both limits and sent records.
  - The crosscutting packages behind the layers: the WhatsApp provider integration and dependency injection.
- **Problem it solved:** The official WhatsApp Business API bill arrived in May 2023, and the product had no way to meter what it was spending on it. The obvious place to add a limit was the main product itself — but the main product was already too complex to extend safely, and a cost control that risks the product it is protecting is not a cost control. The alternative was a service with zero impact on the product, able to serve other notification channels later.
- **Results:** ~51k messages a month (the volume being paid for); ~30k queries a day (0.3 QPS average); 5 peak QPS planned for; ~1.4 GB storage over ten years (214 bytes per notification) — These four figures come from the service’s own design document, written before a line of it existed — a capacity plan, not a production measurement taken afterward.
- **Architecture:** A calling service reaches the notify endpoint, which checks the practitioner’s quota before anything is sent, hands the message to the provider, and records the result either way.
  - Calling service — Another service in the platform requests a notification on a practitioner’s behalf.
  - Notify endpoint — The notify controller receives the request and dispatches the send command.
  - Quota check — The practitioner’s limit is read before the send proceeds — no quota, no message.
  - Provider — The WhatsApp integration sends the message through the official API, behind the crosscutting provider package.
  - Sent record — The outcome — sent or refused — is written to the record every notification leaves behind.
- **A notification, from request to record:**
  - Requested — A calling service asks for a notification to be sent to a practitioner.
  - Quota checked — The practitioner’s remaining limit is read against the request.
  - Dispatched or refused — Within quota, the message goes to the WhatsApp provider; over quota, the send is refused before it costs anything.
  - Recorded — Either outcome is written to the log of notifications sent, so the answer to "why was this blocked" already exists.
- **What it does:**
  - A notify controller and commands to send a notification and to add a practitioner’s limit.
  - A nutritionist controller and queries over that practitioner’s current limit and history of sent notifications.
  - Three domain models: the notification limit itself, a log of every change to it, and a record of every notification sent.
  - A layered service with crosscutting packages for the WhatsApp provider and dependency injection, kept separate from the domain they support.
- **Engineering decisions:**
  - **A separate service specifically to be ignorable** — The stated goal was zero impact on the main product. Isolating the notification service meant it could be switched off, redeployed or rewritten without taking the product down with it — the opposite of bolting a limiter onto code that was already too complex to touch safely.
  - **A quota is a domain model, not a rate limit** — A bare counter would have answered "can this send happen." Instead, the limit, a log of every change to it, and a record of every send together answer a harder question: why was this one blocked, and who changed the limit that blocked it.
  - **Capacity planned before the first line** — The monthly volume, the query rate and the ten-year storage footprint were estimated in the design document before the service was built, which is why the storage decision — how much space this would ever need — was a boring, already-answered question rather than a surprise.
  - **One provider first, the interface for more** — WhatsApp was the bill that started this, so it is the only provider that sends today — but email, SMS and push were the shape the domain and the API were designed to accept later, without the quota model or the sent record needing to change.

### Dietbox Socket — Live updates as a service of its own, so they ship on their own clock.

- **Role:** Senior Software Engineer (2022)
- **Source:** closed — professional work described without the code (Website: https://dietbox.me)
- **Stack:** Node, Express, Socket.IO, Application Insights, Azure App Service, Azure DevOps
- **What it is:** Thirty-four commits over two months in 2022, for a service that has outlived both: a socket server that holds every open connection, joins each client to a room named for its user id, and exposes one endpoint the rest of the platform posts to when something needs pushing out. It sits outside the product because a long-lived connection and a request are not the same kind of traffic.
- **What Felipe did:** Effectively a solo build: thirty-three of the thirty-four commits, from the handshake to the load-test harness that proved it held up.
  - The socket server itself: the shared-secret handshake, room assignment by user id, and an immediate disconnect for a client that ends up joined to no room.
  - The notify endpoint the rest of the platform posts to, and the info and health endpoints used to watch the service itself.
  - The handler-loading convention: an event handler is a file, picked up automatically from a directory.
  - The load-test harness, built to deliberately hold a share of clients on long-polling instead of letting all of them upgrade.
- **Problem it solved:** The monolith deployed once a night, and anything sharing its pipeline shared its cadence — a realtime channel that can only change at three in the morning is a realtime channel nobody changes. Separately, open connections and request traffic do not want the same instance count: one scales with how many people are online, the other with how many requests arrive.
- **Architecture:** The platform posts a room, an event name and a payload to the notify endpoint; the server resolves who is in that room right now and pushes the event straight to them.
  - Platform — Another service in the platform posts a room, an event name and a payload to the notify endpoint.
  - Room resolved — The server looks up which connections are actually joined to that room right now.
  - Fan-out — The event is pushed to every client currently joined to the room.
  - Browser — The client receives the event and updates without a refresh.
- **What it does:**
  - The notify endpoint the rest of the platform posts to when something needs pushing out.
  - An info endpoint reporting the live connection count, for monitoring.
  - A health endpoint reporting its own latency.
  - A shared-secret handshake that disconnects a client immediately if it ends up joined to no room.
- **Engineering decisions:**
  - **Realtime as its own deployable** — Two reasons, both real: open connections and request traffic scale on different axes, and the product deployed once a night — a channel that can only change at three in the morning is one nobody changes. Splitting it into its own service let each axis scale on its own terms and let this one ship on its own clock.
  - **A room per user id** — Addressing is by identity, not by connection, so the platform can push to a person without knowing how many tabs, devices or reconnects that person currently has open.
  - **Handlers auto-loaded from a directory** — Adding an event is adding a file — there is no registry to remember to update, and no handler that exists in the code but was never wired in.
  - **A load test that keeps clients on long-polling** — Not every client upgrades to a websocket. A load test where all of them do measures a population that does not exist, so the harness deliberately holds a share of clients on HTTP long-polling instead.

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
