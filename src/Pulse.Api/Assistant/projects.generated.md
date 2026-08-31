<!-- GENERATED from web/src/content/projects.ts by `pnpm gen:assistant`. Do not edit by hand:
     edit the source and regenerate, or the drift test in assistant-profile.test.ts fails. -->

## Project case studies

These are the projects written up on the site, in the order they appear there. Each one is a real
system Felipe worked on; the "What Felipe did" line is the authoritative statement of his part in it.

### Dietbox Webapp — None of today’s APIs existed. All of it started in here.

- **Role:** Senior Software Engineer, then Head of Technology (2020–2024)
- **Source:** closed — professional work described without the code (Website: https://dietbox.me)
- **Stack:** C#, ASP.NET MVC, Entity Framework, SQL Server, Azure App Service, Kendo UI, Azure DevOps
- **What it is:** When I arrived, this was the product. The nutritionist’s tool, the patient’s, subscriptions, food data, sign-in — one codebase, one release, one schedule. None of the services that run beside it now existed yet. Over four years I took the logic out of it a piece at a time and stood each piece up as an API of its own, leaving the monolith serving whatever had not moved. It is still the product’s largest codebase.
- **What Felipe did:** Principal architect for four years. I ran the extraction — what came out of the monolith, in what order, and what shape it took on the other side — set the platform’s patterns, and configured the Azure estate, including for services other people wrote. Later the whole technology organization reported to me.
  - The build and release pipeline in Azure DevOps, shipping the core project together with its satellites and its gulp-built, Kendo UI front end.
  - Production availability and incident response.
  - NOT his work: The product’s largest codebase was a team effort — about a sixth of that repository’s commits are mine.
- **Problem it solved:** The nutritionist lives in the tool all day; the patient opens it to read a meal plan. Same product, opposite expectations. In 2020 a .NET Framework monolith carried both on Windows App Service — and sign-in, subscriptions and the food data with them — shipping once a day, at night, because that was the only window that felt safe. Anything the product needed to do differently had to be done inside it.
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
  - **A monolith you strangle, not rewrite** — The monolith was not ported and not rewritten. Logic came out of it a piece at a time — sign-in, payments, food data, the back office, notifications, realtime — and each piece became an API running beside it, while the monolith kept serving whatever had not moved yet. A rewrite would have competed for the same hours as the features shipping everywhere else, and the product could not stop while it happened.

### Dietbox B2C — One login for all of the product’s systems.

- **Role:** Senior Software Engineer, then Head of Technology (2021–2024)
- **Source:** closed — professional work described without the code (Website: https://dietbox.me)
- **Stack:** Azure AD B2C, Identity Experience Framework, XML, OpenID Connect, OAuth 2.0, .NET 6, HTML, CSS, Azure DevOps
- **What it is:** One account gets a person into every part of the product. The nutritionist signs in once and reaches her mobile app, the web product and the checkout with the same credentials; the patient signs in once and reaches the Android app, the iOS app and the web product. Five clients across three platforms, over two audiences that share nothing but the login — a nutritionist subscribing and paying, and a patient arriving by invitation from the one treating her. Three years of custom sign-in journeys, federated providers, silent migration off the legacy store, and session revocation that reaches every open browser.
- **What Felipe did:** This is the most of me there is anywhere in the Dietbox estate: I wrote half the commits over three years, across both audiences’ sign-in journeys.
  - The two policy sets — one for the practitioner, one for the patient — each its own sign-up, sign-in and password-reset journey.
  - Federation with Google, Facebook and Apple, each mapped through its own exchange profile into a common subject claim.
  - The first-sign-in migration that moves a legacy-store user into the directory during the same journey they log in with.
  - Session revocation: a stamp on the user compared against the token’s issue time, so a password change or an admin revoke signs the account out everywhere.
  - The custom sign-in pages, one set per audience, served and filled in at runtime.
- **Problem it solved:** A hosted login gives a product one journey. This one needed several: a subscriber signing up and paying, a patient arriving by invitation with no password to set, an academy student, and a receptionist acting on someone else’s behalf — all over one directory, without four separate user stores to keep in sync.
- **Results:** ~7.2k lines of policy XML (across two policy sets); ~730 commits (mine, of ~1.5k total) — The line count is a plain line count over the committed policy files; the commit share comes from the repository.
- **Architecture:** Two independent policy sets sit above one directory, and everything downstream trusts the tokens they issue.
  - Clients — Two patient apps, the nutritionist’s app, the web product and the checkout — every one of them starts here.
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
  - Sign-up and sign-in for each audience, on its own policy and its own branded pages.
  - Two further gated sign-ins for the nutritionist on top of the ordinary one — subscribers, and academy students — each a policy of its own.
  - Password reset, password change and profile edit, each an entry point of its own, per audience.
  - A direct credential exchange for the native apps, alongside the browser redirect the web clients use — same directory, same rules, two shapes.
  - Refresh-token redemption as a journey of its own, one per entitlement, so a renewed token is re-checked rather than assumed still valid.
  - Federated sign-in with three providers, each exchanged into a common subject claim.
  - Silent migration off the legacy store during the user’s own sign-in journey.
  - Per-audience branded pages, one set for the practitioner and one for the patient.
  - Entitlement gates for subscriber and academy journeys, enforced inside the sign-in flow rather than after it.
- **Engineering decisions:**
  - **Custom policies instead of a hosted login** — A hosted login gives one journey. This product needed a subscriber signing up and paying, a patient arriving by invitation, an academy student, and a receptionist — over one directory, without four user stores to keep in sync. Writing the policy directly was the only way to get gated journeys and a first-sign-in migration without forking the user base.
  - **Migration as a side effect of signing in** — Nobody was asked to reset a password or re-register. The account is written into the directory and linked back to the legacy credential during the same sign-in the user was already doing.
  - **Revocation that reaches open sessions** — Revoking an account has to end the sessions that are already open, not only stop the next token from being issued. The policy compares the token’s issue time against a stamp on the user record, so moving that stamp stops an open session working.
  - **Two ways in, because a phone cannot open a redirect** — Three of the five clients are native apps, and a native app signing a user in through a browser redirect is a bad experience and a worse one to recover from. So the same directory answers two shapes of request: the redirect journey the web product and the checkout use, and a direct credential exchange the apps use, each with its own refresh-token redemption. The entitlement checks and the migration behaviour live in the policy, not in the client, so the two shapes cannot drift into two different sets of rules.
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
  - NOT his work: The subscription commands, the webhook handlers and the checkout client were a team’s work: I hold roughly a tenth of the checkout client’s commits, across February 2023 to July 2024, and about a fifth of the service’s, whose repository does not begin until October 2023 — the bulk of both belongs to other engineers.
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

### Dietbox Portal — The back office that handed the product’s daily operations to the operations team.

- **Role:** Head of Technology (2023–2024)
- **Source:** closed — professional work described without the code (Website: https://dietbox.me)
- **Stack:** .NET 6, C#, CQRS, MediatR, EF Core, SQL Server, ASP.NET Identity, JWT, Vue 3, Vuex, Azure DevOps
- **What it is:** Until 2023, any change to the product’s data went through the technology team: adjusting a subscription, correcting a record, loading a food table. The portal put those actions on screens, with the product’s own rules in front of them and a sign-in separate from the customer’s. The operations team started doing them directly — forty-four actions across ten areas.
- **What Felipe did:** I decided what operations should be able to do without us, and built what it takes to let them do it safely: the staff identity and permissions the whole thing runs behind, the command surface under the screens, and the design the rest of the team built the eighteen business areas on top of.
  - Choosing the actions: which requests we were tired of receiving, and which of those were safe to hand over.
  - The identity building block: its own user store, a JWT builder and validator, access and refresh tokens, and claim-based authorization.
  - Impersonation, in both directions and both ways back out, and the rule that it lives behind a staff account rather than a customer one.
  - The design the team built the eighteen business areas on top of, so a new area was a day rather than an argument.
  - NOT his work: Across the service and the admin client together, roughly a third of the commits are mine — the rest, including most of the eighteen business-domain controllers and the client’s views, is the team’s.
- **Problem it solved:** Support could not adjust a subscription, marketing could not publish a banner, and nobody outside engineering could load a new food table. Each was a request to the technology team, and an engineer running the change by hand against the product database or the monolith’s admin surface — no rules in front of it and no name on it afterwards.
- **Results:** ~276 commits across both repositories (mine, of ~780 total); 44 actions ops could take alone (across ten areas of the product) — The commit share comes from the two repositories. The forty-four is a count of the write actions the service exposes — the commands behind the screens ops uses.
- **Architecture:** Someone on the operations team picks an action on a screen, and it travels as a named command through the product’s own rules before it reaches the product’s data.
  - Ops — Someone on the operations team, signed in with a staff account, on the Vue screens for the ten areas — including the impersonate controls in the navbar and the patient view.
  - Permissions — The token decides which of the actions this person is allowed at all — a claim-requirement filter in front of every controller.
  - Command — The action runs as one of the forty-four commands, logged by name on the way through, rather than as an edit to a table.
  - Rules — The same rules the product itself enforces stand in front of the write — which is the difference between ops doing this and an engineer doing it by hand.
  - Database — The change lands in the same database the product serves from — which is exactly why it goes through the rules above rather than around them.
- **What it does:**
  - Impersonation as a first-class feature: support can act as the nutritionist or patient they’re helping, from the client’s navbar or the patient view, and step back out.
  - Subscriptions: cancel one, grant a special one, change a plan’s limits, and move a nutritionist onto the new payment gateway.
  - The food catalogue: create, edit, retire and bulk-activate foods and food groups — or import a whole table from a file, which used to be an engineer with a script.
  - Vouchers, external vouchers and gift configuration, created and retired by whoever is running the campaign.
  - Marketing: featured banners, the customizable cards on the product’s own screens, and the material library.
  - Nutritionist and patient records: update details, correct an email, and clear a cache that is serving something stale.
  - A dashboard whose numbers come from the same commands that changed them, so ops reads its own results.
- **Engineering decisions:**
  - **Handing over the actions instead of answering the requests** — The cheaper option was to keep answering the requests as they came. Answering does not get faster with repetition, though, and each request costs engineering time on work that is not engineering. The screens built here are the requests that arrived often enough to be worth replacing.
  - **Staff identity is not customer identity** — The back office authenticates against its own store — an identity building block with its own user database, a JWT builder and validator, access and refresh tokens, and claim-based authorization — not the customer directory. Giving support staff accounts in the customer identity system would have meant handing customer-grade identities administrative scopes; keeping the two separate keeps a back-office session a different thing from a customer session, by construction.
  - **An action, not a database edit** — Ops invokes one of forty-four named actions, each with the product’s own rules in front of it, and each logged by name as it passes through a pipeline behaviour. The manual route it replaced — an engineer writing an update statement against the database — ran none of those rules and left no record of having run.
  - **Support sees the screen, instead of a description of it** — Part of what reached engineering was not a change request but a reproduction problem — someone unable to see what a customer was describing. Impersonation answers that directly: support steps into the nutritionist’s or the patient’s own session, sees what they see, and steps back out. It concentrates a lot of access in one feature, which is why it sits behind the staff identity rather than anywhere near a customer account.

### Dietbox Notifications — Everything the product sends out, moved into a service of its own.

- **Role:** Head of Technology (2023–2024)
- **Source:** closed — professional work described without the code (Website: https://dietbox.me)
- **Stack:** .NET 6, C#, CQRS, SQL Server, WhatsApp Business API, Azure DevOps
- **What it is:** This service exists because of a number on an invoice: the official WhatsApp messaging bill in May 2023. The answer was not a rate limit bolted onto the existing product, but a small service of its own that took over sending — and, because it owned every send, could account for them.
- **What Felipe did:** I wrote the design document, the domain and the service: nineteen of the twenty commits, from the first estimate to the running service.
  - The capacity-planning document itself — the volume, query-rate and storage estimates the service was built to meet.
  - The domain model, and the record of every notification sent that sits at the middle of it.
  - The two controllers and their commands and queries — sending a notification, and reading back what was sent.
  - The crosscutting packages behind the layers: the WhatsApp provider integration and dependency injection.
- **Problem it solved:** The official WhatsApp Business API bill arrived in May 2023, and nothing in the product could say what it was spending it on — sends went out from several places and were recorded in none. The obvious place to fix that was the main product itself, but the main product was already too complex to extend safely. The alternative was to move sending out entirely: one service that owns the channel, records every message, and can be changed without risking the product it serves.
- **Results:** ~51k messages a month (the volume being paid for); ~30k queries a day (0.3 QPS average); 5 peak QPS planned for; ~1.4 GB storage over ten years (214 bytes per notification) — These four figures come from the service’s own design document, written before a line of it existed — a capacity plan, not a production measurement taken afterward.
- **Architecture:** A calling service reaches the notify endpoint, which hands the message to the WhatsApp provider and records the result either way — so every message the product sends leaves a row behind it.
  - Calling service — Another service in the platform requests a notification on a practitioner’s behalf.
  - Notify endpoint — The notify controller receives the request and dispatches the send command.
  - Send command — The send is handled as a named command, so the request and the record of it are the same story.
  - Provider — The WhatsApp integration sends the message through the official API, behind the crosscutting provider package.
  - Sent record — The outcome — sent or refused — is written to the record every notification leaves behind.
- **A notification, from request to record:**
  - Requested — A calling service asks for a notification to be sent to a practitioner.
  - Accepted — The request is validated and turned into a send command against that practitioner.
  - Dispatched — The message goes to the WhatsApp provider, behind the crosscutting package that wraps it.
  - Recorded — Either outcome is written to the record of notifications sent, so "did this message actually go out" has an answer that does not depend on asking the provider.
- **What it does:**
  - A notify controller and the command that sends a practitioner’s notification.
  - A nutritionist controller and queries over that practitioner’s history of sent notifications.
  - A record of every notification sent, which is what makes the spend answerable after the fact.
  - A layered service with crosscutting packages for the WhatsApp provider and dependency injection, kept separate from the domain they support.
- **Engineering decisions:**
  - **A separate service specifically to be ignorable** — The stated goal was zero impact on the main product. Isolating the notification service meant it could be switched off, redeployed or rewritten without taking the product down with it — the opposite of bolting a limiter onto code that was already too complex to touch safely.
  - **The metering was built and never switched on** — A per-practitioner limit and a log of who changed it are in the domain, built so the cost could eventually be charged back to whoever generated it. That part was never put to use — what the service did every day was send and record. The decision stays on the card because the limit is still in the code, and leaving it out would describe a service that was never built.
  - **Capacity planned before the first line** — The monthly volume, the query rate and the ten-year storage footprint were estimated in the design document before the service was built, which is why the storage decision — how much space this would ever need — was a boring, already-answered question rather than a surprise.
  - **One provider first, the interface for more** — WhatsApp was the bill that started this, so it is the only provider that sends today — but email, SMS and push were the shape the domain and the API were designed to accept later, without the sent record needing to change.

### Dietbox Realtime — Chat between a nutritionist and her patient, and anything else that has to arrive now.

- **Role:** Senior Software Engineer (2022)
- **Source:** closed — professional work described without the code (Website: https://dietbox.me)
- **Stack:** Node, Express, Socket.IO, Application Insights, Azure App Service, Azure DevOps
- **What it is:** This exists so two people can talk inside the product. A nutritionist and her patient each hold an open connection, and a message sent from one lands on the other’s screen without either of them reloading anything. The same channel carries the platform’s own notifications — anything that has to reach someone now rather than at their next page load. Thirty-four commits over two months in 2022, for a service that outlived both.
- **What Felipe did:** I built this one effectively alone: thirty-three of the thirty-four commits, from the chat relay to the load-test harness that proved it held up.
  - The chat relay: a message emitted by one client is pushed straight into the recipient’s room, so it reaches an open screen rather than waiting for a reload.
  - The socket server underneath both: the shared-secret handshake, room assignment by user id, the notify endpoint the platform posts to, and the info and health endpoints used to watch it.
  - The handler-loading convention: an event handler is a file, picked up automatically from a directory.
  - The load-test harness, built to deliberately hold a share of clients on long-polling instead of letting all of them upgrade.
- **Problem it solved:** A nutritionist and her patient had no way to talk inside the product, and anything the platform needed to tell someone waited until that person reloaded the page. Putting the open connections inside the monolith was not an option: it deployed once a night, so anything sharing that pipeline could only be changed then. Open connections also scale with how many people are online, while requests scale with how many arrive.
- **Architecture:** Two things arrive the same way: a chat message emitted by one of the two people talking, or a push from another service in the platform. Either resolves to a room, and whoever is in that room right now gets it.
  - Origin — Either one of the two people talking emits a chat message, or another service in the platform posts a room, an event name and a payload to the notify endpoint.
  - Room resolved — The server looks up which connections are actually joined to that room right now.
  - Fan-out — The event is pushed to every client currently joined to the room.
  - Browser — The client receives the event and updates without a refresh.
- **What it does:**
  - Chat between a nutritionist and her patient, carried over the connection both of them already hold open.
  - Notifications the platform pushes to a person, landing on whatever screen they already have open.
  - An info endpoint reporting the live connection count, and a health endpoint reporting its own latency.
  - A shared-secret handshake that disconnects a client immediately if it ends up joined to no room.
- **Engineering decisions:**
  - **Realtime as its own deployable** — Two reasons, both real: open connections and request traffic scale on different axes, and the product deployed once a night, which set the pace for anything inside it. Splitting it into its own service let each axis scale on its own terms and let this one ship on its own schedule.
  - **A room per user id** — Addressing is by identity, not by connection, so the platform can push to a person without knowing how many tabs, devices or reconnects that person currently has open.
  - **Handlers auto-loaded from a directory** — Adding an event is adding a file — there is no registry to remember to update, and no handler that exists in the code but was never wired in.
  - **A load test that keeps clients on long-polling** — Not every client upgrades to a websocket. A load test where all of them do measures a population that does not exist, so the harness deliberately holds a share of clients on HTTP long-polling instead.

### Ulbra Atende — IT service desk for a university, replacing GLPI.

- **Role:** Head of Technology — design & implementation (Apr 2026 – Current)
- **Source:** closed — professional work described without the code
- **Stack:** .NET 10, PostgreSQL 17, RabbitMQ, React 19, OpenIddict, MCP, OpenTelemetry, Docker Swarm
- **What it is:** The IT service desk for ULBRA — a .NET 10 modular monolith that replaced GLPI as the single intake channel for the university’s IT department, carrying a request from ticket to SLA to satisfaction survey.
- **What Felipe did:** I built it from scratch — the architecture, the backend, the front end, and the deployment.
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

### Ulbra One — The ERP being built to take the university off Senior.

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

### Ulbra CRM — Where the university works the leads for its next intake of students.

- **Role:** Head of Technology — direction & review (Apr 2026 – Current)
- **Source:** closed — professional work described without the code
- **Stack:** React, TanStack Router, MongoDB, Docker Swarm
- **What it is:** Prospective students arrive as leads — from a campaign, a form, an event — and someone works each one until it becomes an enrolment or does not. This is where that happens. I inherited it rather than built it: no automated tests, and a structure that had not kept up with the product. It is now fully covered by tests and materially better to work in, and that work was the team’s — I set the direction and reviewed it, and did not write it.
- **What Felipe did:** I set the direction and reviewed the work; the engineering was the team’s.
  - The decision to cover the codebase with tests before changing its behaviour.
  - The routing migration that made filter state survive navigation.
  - Review of the work as it landed.
  - NOT his work: None of this implementation is mine. It was built by the engineers on the team; my part was deciding what to do and reviewing what came back.
- **Problem it solved:** The CRM arrived with no automated tests at all, which made every change a gamble, and with usability debt that the people using it every day absorbed silently. The worst of it: changing screens reloaded the application, so the filters someone had just set were gone. Work that goes through the same three or four filters all day pays that cost on every navigation.
- **Results:** 0% → 100% test coverage
- **Engineering decisions:**
  - **Tests first, behaviour second** — The codebase was unstructured and untested. Coverage came first and the restructuring second: tests written against the behaviour as it already worked, then the behaviour changed underneath them. That order is why the coverage number is worth quoting at all.
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

### Pampa Devs — My studio’s site, and the tool it sends proposals with.

- **Role:** Founder — design & implementation (2020 – Current)
- **Source:** closed — professional work described without the code (Live site: https://www.pampadevs.com)
- **Stack:** Vue 3, TypeScript, Vite, Vue Router, Vue I18n, SCSS, Azure Static Web Apps
- **What it is:** Pampa Devs is my software studio, and this is where a prospective client meets it. The site carries the service catalogue, a blog in two languages, and three landing pages aimed at particular services. Two parts of it are not what a studio site usually does: the services are demonstrated by working versions of themselves rather than by screenshots, and a commercial proposal is rendered as a page here instead of attached to an email.
- **What Felipe did:** I built it and I keep it running — about two thirds of the commits over six years.
  - The site itself: the catalogue, the landing pages, the blog and the two locales it all renders in.
  - The embedded demos — the storefront, the chat assistant, the checkout and the lead form.
  - The proposal renderer: diagnosis, strategy, timeline, cost, return and architecture as sections of a page.
  - NOT his work: Two engineers from the studio worked on it with me; roughly a third of the commits are theirs.
- **Problem it solved:** A studio selling websites, online stores and automations to small businesses has to show that it can build them, to people who do not read code. Screenshots of past work prove less than they look like they do — the reader cannot tell what is a real product and what is a mockup made for the pitch.
- **What it does:**
  - A storefront demo you can actually use: pick a size, add to the cart, watch the total change.
  - A chat assistant demo that answers, and a lead form that walks through to its confirmation.
  - A blog with posts written in both languages, not one language machine-translated into the other.
  - Client proposals as pages: diagnosis, strategy, timeline, cost, return, before and after, architecture.
- **Engineering decisions:**
  - **Demonstrating the services instead of describing them** — The storefront, the chat assistant and the checkout on the services page are working front ends, not images. Someone deciding whether to buy an online store can put something in a cart before deciding. It costs more to build than a screenshot, and it is the part of the site that does the selling.
  - **A proposal is a page, not a document** — A commercial proposal is a view on this site, assembled from the same sections every time: the diagnosis, the strategy, how the work runs, the timeline, the cost, the expected return, a before and after, the architecture, and the questions clients ask. The client opens a link. Changing the offer means changing a page, not re-exporting a file and hoping the right version was attached.
  - **Static, and deployed as static** — There is no server behind it. The blog posts are files in the repository, the demos run in the browser, and the whole thing is published as a static site with a rewrite rule for client-side routing. A marketing site that goes down because a backend went down is a cost with no matching benefit.

### Pulse — A live, real-time system embedded in a portfolio.

- **Role:** Design & implementation
- **Source:** public — Live site: https://felipealmeida.tech · GitHub: https://github.com/felipe-allmeida/pulse
- **Stack:** .NET 10, SignalR, RabbitMQ, Redis, Postgres, React 19, Docker, Terraform
- **What it is:** A self-hosted portfolio that doubles as a live systems demo: presence, visits, and metrics travel through a real event-driven backend in real time, not canned data.
- **What Felipe did:** I built this one alone — the design, the event-driven backend, the front end, and the infrastructure it runs on.
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
  - **A transactional outbox behind a visit counter** — Nothing about counting visits requires one. It is here because the pattern is what the site exists to demonstrate, wired end to end and running where a reader can watch it instead of reading a diagram. On a product it would be over-engineering.
  - **Real telemetry, published** — The ops dashboard exposes the system’s actual numbers, which means a reader can catch the site lying about itself. Most portfolios make claims that cannot be checked; this one chose the version that can be.
  - **Prerendered pages over a client-only app** — The site renders its content into HTML at build time, so a first visit does not wait on JavaScript and a crawler sees the same page a person does — and, usefully, a deploy can be verified with a single request rather than a browser.
  - **An assistant grounded in a maintained profile** — The assistant answers from a file I keep current, and says it does not know rather than inventing. Ungrounded, it would be a demonstration of exactly the wrong thing.

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
