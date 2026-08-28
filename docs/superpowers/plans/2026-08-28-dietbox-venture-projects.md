# The Dietbox Venture and Its Six Project Cards — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adopt the existing `Venture` model for Dietbox — a venture header carrying the four-year leadership narrative, with the engagement's six systems as project cards underneath it.

**Architecture:** No new types and no new components. `ventures.ts` gains a second entry, `projects.ts` gains five entries and rewrites one, and all six carry `venture: 'dietbox'` contiguously in the array. `groupProjects()`, `pages.ts`, `json-ld.ts`, the sitemap and the `/projects/$slug` route all read the flat array and pick the new cards up on their own — verifying that they do is a task, not an assumption.

**Tech Stack:** TypeScript, React 19, TanStack Router, Tailwind 4, vitest, i18next (en + pt-BR).

**Spec:** `docs/superpowers/specs/2026-08-28-dietbox-venture-projects-design.md`

## Global Constraints

### The dotted-identifier trap — read this before writing any `detail` content

`content.test.ts:418` stringifies each project's **entire `detail` object** and rejects anything matching `/\b[a-z0-9-]+\.[a-z]{2,}\b/i`. It is case-insensitive and it does not know the difference between a hostname and a class name. Almost every identifier gathered from the Dietbox repositories trips it:

| Forbidden inside `detail` | Write instead |
|---|---|
| `Socket.IO` | "the socket server", "the socket library" |
| `Node.js` | "Node" |
| `Craftbox.Diet` | "the monolith's core project" |
| `Dietbox.Payment.API` | "the payment service" |
| `BuildingBlocks.Identity` | "the identity building block" |
| `TrustFrameworkExtensions.xml`, `appsettings.json`, any `name.ext` | "the extensions policy", "the settings file" |
| `chart.js`, `Vue.js` | "a charting library", "Vue" |
| `dietbox.me` and every other hostname | omit entirely |

Safe as written: `.NET 6` (nothing precedes the dot), `net6.0` (digits after the dot), `Iugu`, `Ebanx`, `TSPay`, `Azure AD B2C`, `PrimeVue`, `Pinia`, `Cypress`, `MediatR`, `Vue 3`, `C4`. `Pagar.me` is sanctioned by literal name in `withoutSanctionedPlaceholders` and is the **only** dotted vendor allowed.

`tech[]`, `name`, `tagline`, `description` and `links` are **not** scanned. `Socket.IO` belongs in `tech`, never in a `decisions` body.

### The rest

- **Every user-facing string is localized in both locales** — `en` and `pt-BR`. A missing locale fails `content.test.ts`.
- **No invented metrics.** `metrics` is optional; where no real number exists the section is omitted. Every number in this plan is quoted from a `git log`, a line count, or a design document preserved in the source repository, and its origin is named in the task that uses it.
- **Never read customer data into content.** `C:\Projects\Dietbox\price-adjustment\` holds real subscriber records (`addresses.csv`, `checar-assinantes.csv`, an XLSX of subscriber addresses). `dietbox-iac/terraform.tfstate` and `main.tf` hold a live Azure subscription id. These are read-only context. No row, name, count or identifier derived from them reaches the repository.
- **The migration wording is the author's, not the repositories'.** The author has confirmed a .NET Framework → .NET 6 migration that these repositories do not show (`Craftbox.Diet` is on 4.8 with a `windows-2019` msbuild pipeline; `dietbox-api` is `net6.0` on Linux App Service). Task 2 therefore **preserves the existing wording verbatim** and adds no framework claim of its own in either direction. Do not "correct" it and do not reinforce it with repository evidence.
- **Verification before any completion claim.** `cd web && npm test` must pass. Report the actual output.

### Working directories

- Pulse (edit here): `C:\Projects\pulse\.claude\worktrees\dietbox-projects-pulse-89de94`
- Dietbox sources (read only, never edit, never commit anything from): `C:\Projects\Dietbox`

## File Structure

| File | Responsibility | Tasks |
|---|---|---|
| `web/src/content/ventures.ts` | The `dietbox` venture entry — org-level role, period, team, summary, practices | 1 |
| `web/src/content/projects.ts` | Six contiguous `venture: 'dietbox'` cards | 1–7 |
| `web/src/content/content.test.ts` | Updated dietbox rules, six new per-card rules | 1–7 |
| `web/src/content/ventures.test.ts` | The venture is direct employment (no `engagement`) | 1 |
| `web/public/screenshots/dietbox-b2c.webp` etc. | New capture assets | 8 |
| `src/Pulse.Api/Assistant/projects.generated.md` | Regenerated committed artifact | 9 |

---

### Task 1: The venture, and the leadership narrative moving up to it

Creates the `dietbox` venture and hands it the four `leadership` sections currently on the `dietbox` project. After this task `/projects` renders a Dietbox venture header with exactly one card under it, and no project in the repository carries a `leadership` section.

**Files:**
- Modify: `web/src/content/ventures.ts` (append to the `ventures` array)
- Modify: `web/src/content/projects.ts:537-780` (the `dietbox` entry: add `venture`, delete `detail.leadership`)
- Test: `web/src/content/ventures.test.ts`, `web/src/content/content.test.ts:571`

**Interfaces:**
- Consumes: `Venture` and `ventures` from `web/src/content/ventures.ts`; `CaseStudySection` from `web/src/content/projects.ts`.
- Produces: the venture slug `'dietbox'`, which Tasks 2–7 assign to `project.venture`.

- [ ] **Step 1: Write the failing tests**

Append to `web/src/content/ventures.test.ts`:

```ts
it('Dietbox is direct employment — no engagement qualifier', () => {
  const dietbox = ventureBySlug('dietbox');
  expect(dietbox, 'the Dietbox venture exists').toBeDefined();
  expect(dietbox!.engagement, 'employment needs no qualifier').toBeUndefined();
  expect(dietbox!.url).toBe('https://dietbox.me');
  expect(dietbox!.practices, 'the leadership narrative lives here now').toHaveLength(4);
});
```

In `web/src/content/content.test.ts`, replace the whole of `it('dietbox is the only project with a leadership section, localized and non-empty', ...)` (line 571) with:

```ts
it('no project carries a leadership section — it belongs to the venture', () => {
  // It moved rather than duplicated: the venture header renders `practices`
  // directly above the cards, so a project repeating it would put the same
  // four claims on screen twice, three inches apart.
  expect(projects.filter((p) => p.detail?.leadership).map((p) => p.slug)).toEqual([]);

  const practices = ventureBySlug('dietbox')!.practices!;
  expect(practices).toHaveLength(4);
  for (const section of practices) {
    expectBothLocales(section.heading, 'dietbox practices heading');
    expectBothLocales(section.body, 'dietbox practices body');
  }
});
```

`content.test.ts` already imports `ventures`; add `ventureBySlug` to that import if it is not already there.

- [ ] **Step 2: Run the tests to verify they fail**

```bash
cd web && npx vitest run src/content/ventures.test.ts src/content/content.test.ts
```

Expected: FAIL — `the Dietbox venture exists` (received `undefined`), and `no project carries a leadership section` (received `['dietbox']`).

- [ ] **Step 3: Add the venture**

Append to the `ventures` array in `web/src/content/ventures.ts`, after the `ulbra` entry:

```ts
  {
    slug: 'dietbox',
    name: 'Dietbox',
    url: 'https://dietbox.me',
    role: {
      en: 'Senior Software Engineer → Head of Technology',
      'pt-BR': 'Engenheiro de Software Sênior → Head de Tecnologia',
    },
    period: { en: 'Sep 2020 – Aug 2024', 'pt-BR': 'Set 2020 – Ago 2024' },
    // `engagement` is deliberately absent. It exists to say "client of Pampa
    // Devs" about ULBRA; Dietbox was a job, and a badge reading "Employment"
    // is noise on a page where every other entry is one too.
    summary: {
      en: 'A Brazilian nutrition SaaS: nutritionists build diet plans, their patients follow them, and both audiences share one identity backbone. The platform spans a decade-old monolith and a newer generation of services standing beside it.',
      'pt-BR':
        'Um SaaS brasileiro de nutrição: nutricionistas montam planos alimentares, seus pacientes os seguem, e os dois públicos dividem uma única base de identidade. A plataforma vai de um monolito de dez anos a uma geração mais nova de serviços erguida ao lado dele.',
    },
    team: {
      en: 'Thirteen people — engineering, QA, UX and support.',
      'pt-BR': 'Treze pessoas — engenharia, QA, UX e suporte.',
    },
    practices: [
      /* the four sections moved verbatim from projects.ts — see Step 4 */
    ],
  },
```

- [ ] **Step 4: Move the four leadership sections**

Cut the entire `leadership: [ ... ]` array from the `dietbox` project's `detail` in `projects.ts` and paste its four elements as the `practices` array above, unchanged. They are already written and already localized:

1. `From one nightly deploy to several a day` / `De um deploy noturno a vários por dia`
2. `A payment migration nobody noticed` / `Uma migração de pagamentos que ninguém notou`
3. `Cloud spend as an engineering problem` / `Custo de nuvem como problema de engenharia`
4. `Reporting engineering in the executive's language` / `Reportar engenharia na língua da diretoria`

Do not reword them. They were reviewed as site copy already, and this task is a move.

- [ ] **Step 5: Point the project at the venture**

In the same `dietbox` entry, add `venture: 'dietbox',` immediately after `links` (matching where `venture` sits in the ULBRA entries).

- [ ] **Step 6: Update the venture-project count**

`content.test.ts:137` reads `expect(inVentures, 'all six ULBRA projects').toHaveLength(6);`. Change it to:

```ts
  expect(inVentures, 'six ULBRA projects and one Dietbox card so far').toHaveLength(7);
```

This number rises with each of Tasks 3–7 and lands at 12 in Task 7. Each task updates it and its label.

- [ ] **Step 7: Run the tests**

```bash
cd web && npm test
```

Expected: PASS. If `dietbox has a case study` fails, the `leadership` cut took an adjacent field with it — restore and re-cut.

- [ ] **Step 8: Commit**

```bash
git add web/src/content/ventures.ts web/src/content/ventures.test.ts web/src/content/projects.ts web/src/content/content.test.ts
git commit -m "feat(content): Dietbox becomes a venture"
```

---

### Task 2: The `dietbox` card becomes Dietbox Webapp

Narrows the card from describing a company to describing the legacy monolith. The venture header now carries the org-level narrative, so everything duplicating it leaves the card.

**Files:**
- Modify: `web/src/content/projects.ts` (the `dietbox` entry)
- Test: `web/src/content/content.test.ts:512`, `:559`

**Interfaces:**
- Consumes: `venture: 'dietbox'` from Task 1.
- Produces: the first card of the Dietbox run. Tasks 3–7 insert after it, before `ulbra-atende`.

**Source facts — the only permitted material for this card:**
- `dietbox-webapp` holds `Craftbox.Diet` and its satellites (EntityFramework, Catalogs, Enums, Infrastructure, Resources, Reports, Webjobs) plus a gulp-built front end using Kendo UI.
- Authorship: **597 of 3,867 commits** are the author's (`git -C dietbox-webapp log`), Jul 2020 – Aug 2025. The existing "about a sixth" boundary is accurate.
- `dietbox-iac` (5 of 5 commits the author's) declares the Azure estate in Terraform: Linux web apps for the core, auth, payment, foods and socket services, production staging slots, and VNet integration to the SQL database.
- **Do not** state what framework version the monolith targets, in either direction — see Global Constraints.

- [ ] **Step 1: Write the failing test**

Replace `it('dietbox sits between kota-embed and the ulbra projects', ...)` (line 559) with:

```ts
it('the Dietbox run sits between kota-embed and the ULBRA run', () => {
  const slugs = projects.map((p) => p.slug);
  const dietbox = projects.filter((p) => p.venture === 'dietbox').map((p) => p.slug);
  expect(dietbox[0], 'the webapp card leads the run').toBe('dietbox');
  expect(slugs.indexOf('dietbox')).toBeGreaterThan(slugs.indexOf('kota-embed'));
  expect(slugs.indexOf(dietbox.at(-1)!)).toBeLessThan(slugs.indexOf('ulbra-atende'));
});

it('the webapp card is about the monolith, not about the company', () => {
  const webapp = projects.find((p) => p.slug === 'dietbox')!;
  expect(webapp.name, 'a card named "Dietbox" under a header named "Dietbox" reads as a duplicate').toBe(
    'Dietbox Webapp',
  );
  expect(webapp.detail!.metrics, 'org-level numbers belong to the venture').toHaveLength(2);
});
```

Then relax `it('dietbox has a case study, localized in every locale', ...)` at line 512: change `expect(detail!.metrics).toHaveLength(4)` to `toHaveLength(2)` and `expect(detail!.architecture!.steps).toHaveLength(5)` to `toHaveLength(4)`.

- [ ] **Step 2: Run to verify failure**

```bash
cd web && npx vitest run src/content/content.test.ts
```

Expected: FAIL — `expected 'Dietbox' to be 'Dietbox Webapp'`.

- [ ] **Step 3: Rewrite the card**

In the `dietbox` entry:

- `name: 'Dietbox Webapp'`
- `tagline`:
  ```ts
  {
    en: 'The decade-old monolith the product grew on, and still its largest codebase.',
    'pt-BR': 'O monolito de dez anos em que o produto cresceu, e ainda sua maior base de código.',
  }
  ```
- `tech: ['C#', 'ASP.NET MVC', 'Entity Framework', 'SQL Server', 'Azure App Service', 'Kendo UI', 'Terraform', 'Azure DevOps']`
- `role`, `period`, `visibility`, `links`, `screenshot`, `venture` — unchanged.
- `description`: rewrite from "a Brazilian SaaS where nutritionists…" (that sentence is now the venture's `summary`) to name the monolith: the codebase both audiences were served from, the deploy window it was fighting, and the newer services that grew up beside it.

In `detail`:
- **`overview`** — the monolith as the product's centre of gravity, and what it meant that everything shipped through one pipeline.
- **`contribution`** — narrow `areas` to this repository. Drop the identity, portal and realtime bullets: those are Tasks 3, 5 and 7 now. Keep the delivery and production-availability bullets. **`boundary` stays exactly as written** — `content.test.ts:553` asserts it exists and the "about a sixth of that repository's commits are mine" figure is verified above.
- **`problem`** — keep verbatim. The nightly-deploy paragraph is this card's problem, not the company's.
- **`metrics`** — exactly two, replacing the four org-level tiles:
  ```ts
  metrics: [
    {
      value: { en: '~600', 'pt-BR': '~600' },
      label: { en: 'commits in the monolith', 'pt-BR': 'commits no monolito' },
      note: { en: 'mine, of ~3.9k total', 'pt-BR': 'meus, de ~3,9 mil no total' },
    },
    {
      value: { en: '4 years', 'pt-BR': '4 anos' },
      label: { en: 'in the same codebase', 'pt-BR': 'na mesma base de código' },
      note: { en: '2020 to 2024', 'pt-BR': 'de 2020 a 2024' },
    },
  ],
  ```
- **`metricsNote`** — "The commit counts come from the repository. The rest is my own record of the period." (keep; it is already localized).
- **`architecture`** — replace the five-step platform topology (that view now belongs to the venture) with four steps scoped to the monolith and its edges: the web application, its data layer, the jobs that run beside it, and the Azure estate it deploys onto.
- **`highlights`** — keep the four product-level bullets. They describe what the monolith does.
- **`decisions`** — four. Two are kept and narrowed from the existing set; two are new:
  - *(new)* **The estate as code.** `dietbox-iac` declares the resource groups, the Linux app service plans, the production staging slots and the VNet integration to SQL in Terraform, so the environment a service lands in is reviewable in a diff rather than clicked into existence.
  - *(new)* **A monolith you strangle rather than rewrite.** New capability went into services beside it; the monolith kept the surface it already served. State it as a delivery strategy, without asserting a runtime or framework version.
  - Move the identity, event-sourcing and realtime decisions out — Tasks 3, 5 and 7 own them.
- **`leadership`** — already removed in Task 1. Confirm it is gone.

- [ ] **Step 4: Run the tests**

```bash
cd web && npm test
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add web/src/content/projects.ts web/src/content/content.test.ts
git commit -m "feat(content): the Dietbox card narrows to the webapp it describes"
```

---

### Task 3: Dietbox B2C

The identity backbone, and the author's largest personal ownership in the estate.

**Files:**
- Modify: `web/src/content/projects.ts` (insert after `dietbox`)
- Test: `web/src/content/content.test.ts`

**Interfaces:**
- Consumes: `venture: 'dietbox'`.
- Produces: slug `dietbox-b2c`, second in the run.

**Source facts — verified, and the only permitted material:**
- `dietbox-b2c`: **731 of 1,474 commits** are the author's, May 2021 – Jul 2025.
- Two policy sets, `nutricionista` and `paciente`, totalling **7,216 lines** of Identity Experience Framework XML (`wc -l policies/*/*.xml`).
- Federation profiles for Google, Facebook and Apple, each with an exchange profile mapping into a common subject claim.
- Migration on first sign-in: `CheckIfSocialUserIsMigrated`, `AlternativeSecurityId`, `AAD-UserWriteUsingLogonEmail` — a legacy-store user signs in with old credentials and is written into the directory in the same journey.
- Real session revocation: `AssertRefreshToken` and `CompareRefreshTokenIssuedLaterThanValidFromDate` compare a `validFrom` stamp on the user against the token's issue time, so a password change or an admin revoke signs the account out of every open browser. The repository's own README lists this as requirement #1.
- Gated journeys: separate subscriber and academy sign-up policies, with dedicated pages for the blocked user, the unsubscribed user and the social account with no local match.
- The custom UI is static HTML and CSS under `src/flows`, one set per audience, which Azure serves and fills at runtime.
- Platform side: the auth service and a B2C crosscutting package inside the `dietbox-api` monorepo.

**Trap:** this repository's README, pipelines and settings files carry Azure DevOps URLs, the tenant name and application ids. Nothing is quoted verbatim. Prefer no `script` section at all; if one is included, tenant and ids are placeholders.

- [ ] **Step 1: Write the failing test**

```ts
it('dietbox-b2c carries its two real figures and names both audiences', () => {
  const b2c = projects.find((p) => p.slug === 'dietbox-b2c');
  expect(b2c, 'the B2C card is published').toBeDefined();
  expect(b2c!.venture).toBe('dietbox');

  const detail = b2c!.detail!;
  expectBothLocales(detail.overview!, 'dietbox-b2c overview');
  expectBothLocales(detail.problem!, 'dietbox-b2c problem');

  // Both audiences, because one identity system serving two unrelated
  // journeys is the whole reason this was custom rather than hosted.
  expect(detail.overview!.en).toMatch(/practitioner|nutritionist/i);
  expect(detail.overview!.en).toMatch(/patient/i);

  // The two numbers that exist: the XML line count and the commit share.
  const values = detail.metrics!.map((m) => m.value.en).join(' ');
  expect(values, 'the policy line count').toMatch(/7[.,]?2k|7,216/);
  expect(values, 'the commit share').toMatch(/730|731/);
});
```

- [ ] **Step 2: Run to verify failure**

```bash
cd web && npx vitest run src/content/content.test.ts -t dietbox-b2c
```

Expected: FAIL — `the B2C card is published` (received `undefined`).

- [ ] **Step 3: Add the card**

Insert a full `Project` after `dietbox`, before whatever currently follows it:

```ts
  {
    slug: 'dietbox-b2c',
    name: 'Dietbox B2C',
    tagline: {
      en: 'One identity backbone, two audiences, custom sign-in journeys.',
      'pt-BR': 'Uma base de identidade, dois públicos, jornadas de login customizadas.',
    },
    description: {
      en: 'Custom Azure AD B2C policies for a product whose two audiences share nothing but an account: a practitioner subscribing, and a patient invited by the one treating them. Federated sign-in, silent migration off the legacy store, and revocation that actually signs a session out everywhere.',
      'pt-BR':
        'Políticas customizadas de Azure AD B2C para um produto cujos dois públicos não dividem nada além da conta: a profissional que assina e o paciente convidado por ela. Login federado, migração silenciosa da base legada e revogação que de fato encerra a sessão em todo lugar.',
    },
    tech: ['Azure AD B2C', 'Identity Experience Framework', 'XML', 'OpenID Connect', 'OAuth 2.0', '.NET 6', 'HTML', 'CSS', 'Azure DevOps'],
    role: {
      en: 'Senior Software Engineer, then Head of Technology',
      'pt-BR': 'Engenheiro de Software Sênior, depois Head de Tecnologia',
    },
    period: { en: '2021–2025', 'pt-BR': '2021–2025' },
    visibility: 'private',
    links: [{ label: 'Website', href: 'https://dietbox.me' }],
    venture: 'dietbox',
    // No `screenshot` yet. Task 8 adds it, and only if the capture succeeds —
    // a path pointing at a file that does not exist renders a broken image,
    // which is worse than the generated cover it would have replaced.
    detail: { /* below */ },
  },
```

`detail` carries, in this order:

- **`overview`** — one identity system, two audiences, four years. Must name both the practitioner and the patient (the test asserts it).
- **`contribution`** — `summary` says this is the author's largest personal ownership in the estate; `areas` name the two policy sets, the federation and exchange profiles, the migration journey, the revocation mechanism and the custom UI pages. No `boundary`: at half the commits over four years this was genuinely co-owned, and claiming a boundary where none is honest is worse than omitting the field.
- **`problem`** — a hosted login gives one journey. This product needed a subscriber signing up and paying, a patient arriving by invitation, an academy student, and a receptionist — over one directory, without four user stores to keep in sync.
- **`metrics`** — exactly two, both verified:
  ```ts
  metrics: [
    {
      value: { en: '~7.2k', 'pt-BR': '~7,2 mil' },
      label: { en: 'lines of policy XML', 'pt-BR': 'linhas de XML de política' },
      note: { en: 'across two policy sets', 'pt-BR': 'em dois conjuntos de políticas' },
    },
    {
      value: { en: '~730', 'pt-BR': '~730' },
      label: { en: 'commits', 'pt-BR': 'commits' },
      note: { en: 'mine, of ~1.5k total', 'pt-BR': 'meus, de ~1,5 mil no total' },
    },
  ],
  ```
- **`metricsNote`** — the line count is `wc -l` over the committed policies; the commit share is from the repository.
- **`states`** — the sign-in journey as a `CaseStudyFlow` with a `caption`, derived from the policy's own orchestration steps: credentials or a federated provider → is this a legacy account → write it into the directory → is the account enabled and entitled → issue the token. Every step corresponds to a technical profile that exists.
- **`architecture`** — the identity topology: the two policy sets, the directory beneath them, the auth service that consumes the tokens, and the custom UI pages Azure serves.
- **`decisions`** — four:
  1. **Custom policies instead of a hosted login.** Move this decision here from the old `dietbox` card, where it currently sits; it is this card's, not the monolith's.
  2. **Migration as a side effect of signing in.** Nobody was asked to reset a password or re-register. The user experiences a login; the system experiences a migration.
  3. **Revocation that reaches open sessions.** A token that is merely unrenewable is not revoked. Comparing the token's issue time against a stamp on the user makes "sign this account out everywhere" mean it.
  4. **One directory, several journeys.** Separate policies per audience over one user store, rather than one policy with branches or several stores to reconcile.
- **`highlights`** — four: federated sign-in with three providers; silent migration off the legacy store; per-audience branded pages; entitlement gates (subscriber, academy) enforced in the journey rather than after it.

- [ ] **Step 4: Update the venture-project count**

`content.test.ts` — the `toHaveLength(7)` from Task 1 becomes `toHaveLength(8)`.

- [ ] **Step 5: Run the tests**

```bash
cd web && npm test
```

Expected: PASS. If `publishes no hostname, URL or credential` fails on `dietbox-b2c`, a dotted identifier reached `detail` — re-read the Global Constraints table.

- [ ] **Step 6: Commit**

```bash
git add web/src/content/projects.ts web/src/content/content.test.ts
git commit -m "feat(content): the Dietbox B2C case study"
```

---

### Task 4: Dietbox Payment

Subscriptions and recurring billing: a CQRS payment service behind a Vue checkout.

**Files:**
- Modify: `web/src/content/projects.ts` (insert after `dietbox-b2c`)
- Test: `web/src/content/content.test.ts`

**Interfaces:**
- Consumes: `venture: 'dietbox'`.
- Produces: slug `dietbox-payment`, third in the run.

**Source facts — verified:**
- The payment service lives inside the `dietbox-api` monorepo alongside the auth, foods and jobs services, with its own release pipeline triggered by a `release-payment/*` branch and a path filter excluding the other three services' directories. Four services, one repository, four independent release trains.
- Commands: `Subscribe`, `CreateInvoice`, `CreateInvoicePlan`, `GeneratePaymentLink`, `AddToCart`, `PayExtension`, `SuspendSubscription`, `CreateTransaction`, `DeleteTransaction`, plus voucher and recaptcha paths.
- The webhook handler tree **is** the subscription lifecycle, one directory per event: subscription created, activated, changed, suspended, expired; invoice updated; invoice payment failed; and a marketplace subtree covering invoice paid, invoice released, invoice refunded and subaccount verified.
- Three gateways behind crosscutting packages: Iugu, Ebanx and TSPay.
- Controllers: subscription, transaction, voucher, nutritionist, extensions, webhook.
- The client (`dietbox-payment-client`): Vue 3, Vite, PrimeVue, Pinia, `vue-i18n`, `vuelidate`, recaptcha, Cypress e2e reporting through Allure. Views: subscription, renewal, and four thank-you pages including a student trial.
- Authorship: **100 of 1,153 client commits** are the author's (Feb 2023 – Jul 2024); the service side sits in `dietbox-api`, where the author has **156 of 722**. This was a team's work and the card must say so — the same shape as the existing `kota-embed` boundary.
- Gateway naming: the site's existing wording is Iugu → Pagar.me. `Pagar.me` is the one sanctioned dotted vendor. `TSPay` and `Ebanx` may be named as the gateway integrations present in the code without asserting which one the migration landed on.

- [ ] **Step 1: Write the failing test**

```ts
it('dietbox-payment names the work as a team’s, not the author’s', () => {
  const payment = projects.find((p) => p.slug === 'dietbox-payment');
  expect(payment, 'the payment card is published').toBeDefined();
  expect(payment!.venture).toBe('dietbox');

  const boundary = payment!.detail!.contribution!.boundary;
  expect(boundary, 'a card about a team’s codebase must say so').toBeDefined();
  expectBothLocales(boundary!, 'dietbox-payment boundary');
  expect(boundary!.en).toMatch(/team|others|someone else/i);
  expect(boundary!['pt-BR']).toMatch(/time|outros|outra pessoa/i);
});

it('dietbox-payment draws its lifecycle from the webhook handlers that exist', () => {
  const states = projects.find((p) => p.slug === 'dietbox-payment')!.detail!.states!;
  expectBothLocales(states.caption!, 'dietbox-payment states caption');
  expect(states.steps.length).toBeGreaterThanOrEqual(5);
  for (const step of states.steps) {
    expect(step.label.trim()).not.toBe('');
    expectBothLocales(step.detail, 'dietbox-payment state detail');
  }
});
```

- [ ] **Step 2: Run to verify failure**

```bash
cd web && npx vitest run src/content/content.test.ts -t dietbox-payment
```

Expected: FAIL — `the payment card is published` (received `undefined`).

- [ ] **Step 3: Add the card**

```ts
  {
    slug: 'dietbox-payment',
    name: 'Dietbox Payment',
    tagline: {
      en: 'Subscriptions and recurring billing, behind a checkout of its own.',
      'pt-BR': 'Assinaturas e cobrança recorrente, atrás de um checkout próprio.',
    },
    description: {
      en: 'The service that carries the revenue: subscription commands on one side, a webhook handler per gateway event on the other, and three payment providers behind a common interface — with a Vue checkout in front of it.',
      'pt-BR':
        'O serviço que carrega a receita: comandos de assinatura de um lado, um handler de webhook por evento do gateway do outro, e três provedores de pagamento atrás de uma interface comum — com um checkout em Vue na frente.',
    },
    tech: ['.NET 6', 'C#', 'CQRS', 'Vue 3', 'Vite', 'PrimeVue', 'Pinia', 'Cypress', 'Azure DevOps'],
    role: {
      en: 'Senior Software Engineer, then Head of Technology',
      'pt-BR': 'Engenheiro de Software Sênior, depois Head de Tecnologia',
    },
    period: { en: '2023–2024', 'pt-BR': '2023–2024' },
    visibility: 'private',
    links: [{ label: 'Website', href: 'https://dietbox.me' }],
    venture: 'dietbox',
    // No `screenshot` yet — Task 8 adds it if the capture succeeds. See the
    // note on the B2C card.
    detail: { /* below */ },
  },
```

`detail` carries:

- **`overview`** — what the service is responsible for and why it is separate: money has a different failure mode from everything else in the product.
- **`contribution`** — `summary` names the author's part (the platform patterns the service is built on, the gateway boundary, the release pipeline); `areas` 3–4 bullets; **`boundary` is required** and must name the checkout client and the bulk of the service as a team's work, in both locales. The test asserts the wording.
- **`problem`** — a subscription product where the gateway is a vendor decision, not a domain one, and where the gateway's opinion of a subscription arrives asynchronously by webhook and has to be reconciled with the product's own.
- **`states`** — the subscription lifecycle, `caption` required. Derive the steps from the handler directories: created → activated → changed → payment failed → suspended → expired, plus the marketplace path (invoice paid, released, refunded). Each `label` is a state name, each `detail` says what the system does on arrival. Do not invent a state that has no handler.
- **`architecture`** — checkout client → payment service → gateway package → the gateway's webhooks coming back.
- **`decisions`** — four:
  1. **One repository, four release trains.** Each service has its own branch trigger and a path filter excluding its neighbours, so a payment hotfix does not redeploy auth. A monorepo without a shared deploy.
  2. **The gateway behind a package boundary.** Three providers implement the same interface, which is what let a gateway change be an implementation change rather than a domain one.
  3. **The webhook tree is the state machine.** One handler per gateway event, named for the event, rather than one endpoint switching on a payload field.
  4. **A checkout that is not the app.** The purchase funnel ships separately from the product, on its own cadence.
- **`highlights`** — four, from the controllers and commands: subscription and renewal; vouchers and plan extensions; payment links; marketplace subaccounts.
- **No `metrics`.** The only numbers available are commit shares in a repository the author co-owned at under 10%, which is a contribution fact and belongs in `boundary`, not in a headline tile.

- [ ] **Step 4: Update the venture-project count to 9**

- [ ] **Step 5: Run the tests**

```bash
cd web && npm test
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add web/src/content/projects.ts web/src/content/content.test.ts
git commit -m "feat(content): the Dietbox Payment case study"
```

---

### Task 5: Dietbox Portal

The internal back office, and the newest generation of the platform's architecture.

**Files:**
- Modify: `web/src/content/projects.ts` (insert after `dietbox-payment`)
- Test: `web/src/content/content.test.ts`

**Interfaces:**
- Consumes: `venture: 'dietbox'`.
- Produces: slug `dietbox-portal`, fourth in the run.

**Source facts — verified:**
- Two repositories: the service and a Vue 3 admin client. Authorship: **169 of 360** service commits and **107 of 419** client commits — **276 of 779** together, May 2023 – Jul 2024.
- The service's directories are numbered by layer: building blocks, services, application, domain, infra. The dependency direction is legible from a directory listing.
- Application layer: commands and queries with pipeline behaviours, domain events kept separate from integration events.
- An event-sourcing package sits among the building blocks.
- Three test projects: application unit tests, domain unit tests, and web-app integration tests with an external-resources fixture set.
- **Authentication is the portal's own**, not the customer B2C directory: an identity building block with an ASP.NET Identity data context, a JWT builder and validator, access plus refresh tokens, and a claim-requirement authorization filter. The client keeps the token pair in a persisted store and refreshes against an accounts endpoint. (`@azure/msal-browser` appears in the client's manifest but is not imported anywhere in `src` — it is an unused dependency, and the card must not claim Azure AD sign-in.)
- **Impersonation is a first-class feature**: paired impersonate/unimpersonate commands for both nutritionist and patient, surfaced in the client's navbar and patient view. Support staff act as the user they are helping.
- Eighteen controllers, naming the business administered: nutritionists, patients, subscriptions and their configuration, transactions, vouchers and external vouchers, foods and food groups, tags, marketing, materials, events, gift configuration, customizable cards, universities, metrics, accounts.
- The client's views mirror them, with a dashboard and charts.

- [ ] **Step 1: Write the failing test**

```ts
it('dietbox-portal separates staff identity from customer identity', () => {
  const portal = projects.find((p) => p.slug === 'dietbox-portal');
  expect(portal, 'the portal card is published').toBeDefined();
  expect(portal!.venture).toBe('dietbox');

  // The decision the code actually supports: the back office authenticates
  // against its own store with its own tokens, not against the customer
  // directory. Asserted because an earlier reading of an unused dependency
  // in the client's manifest suggested Azure AD, which is not what runs.
  const decisions = JSON.stringify(portal!.detail!.decisions);
  expect(decisions, 'staff and customers are different populations').toMatch(/staff|back office|internal/i);
  expect(decisions).not.toMatch(/Azure AD(?! B2C)/);
});
```

- [ ] **Step 2: Run to verify failure**

```bash
cd web && npx vitest run src/content/content.test.ts -t dietbox-portal
```

Expected: FAIL — `the portal card is published` (received `undefined`).

- [ ] **Step 3: Add the card**

```ts
  {
    slug: 'dietbox-portal',
    name: 'Dietbox Portal',
    tagline: {
      en: 'The back office, and the newest generation of the platform’s architecture.',
      'pt-BR': 'O back office, e a geração mais nova da arquitetura da plataforma.',
    },
    description: {
      en: 'The internal tool the company runs the product from — subscriptions, vouchers, the food catalogue, marketing — built as a layered service with commands, queries and event sourcing, and an admin client that can act as the user it is helping.',
      'pt-BR':
        'A ferramenta interna com que a empresa opera o produto — assinaturas, vouchers, catálogo de alimentos, marketing — construída como um serviço em camadas com comandos, queries e event sourcing, e um cliente admin capaz de agir como o usuário que está atendendo.',
    },
    tech: ['.NET 6', 'C#', 'CQRS', 'MediatR', 'Event sourcing', 'ASP.NET Identity', 'JWT', 'Vue 3', 'Vuex', 'Azure DevOps'],
    role: {
      en: 'Senior Software Engineer, then Head of Technology',
      'pt-BR': 'Engenheiro de Software Sênior, depois Head de Tecnologia',
    },
    period: { en: '2023–2024', 'pt-BR': '2023–2024' },
    visibility: 'private',
    links: [{ label: 'Website', href: 'https://dietbox.me' }],
    venture: 'dietbox',
    detail: { /* below */ },
  },
```

`screenshot` is deliberately omitted here and added by Task 8 only if that task's capture succeeds — this is the lowest-confidence of the three.

`detail` carries:

- **`overview`** — a back office is where a SaaS company's real operating procedure lives, and this one was the first place the platform's newer patterns were applied end to end.
- **`contribution`** — `summary` names the layered design, the identity building block and the shared building blocks as the author's; `areas` 4–5 bullets. `boundary`: at ~35% of commits across two repositories over a year, name the team.
- **`problem`** — support and operations were reaching into the database and the monolith's admin surface. A back office with its own domain, its own audit trail and its own identity was the alternative.
- **`metrics`** — one real tile is available and it is worth having:
  ```ts
  metrics: [
    {
      value: { en: '~276', 'pt-BR': '~276' },
      label: { en: 'commits across both repositories', 'pt-BR': 'commits nos dois repositórios' },
      note: { en: 'mine, of ~780 total', 'pt-BR': 'meus, de ~780 no total' },
    },
    {
      value: { en: '3', 'pt-BR': '3' },
      label: { en: 'test projects', 'pt-BR': 'projetos de teste' },
      note: { en: 'domain, application, and integration', 'pt-BR': 'domínio, aplicação e integração' },
    },
  ],
  ```
- **`metricsNote`** — both come from the repositories.
- **`architecture`** — the layers, in dependency order: admin client → service → application → domain → infrastructure, with the event store named where it sits.
- **`decisions`** — four:
  1. **Layers numbered on disk.** The dependency direction is visible in a directory listing, so a violation is noticed before it compiles.
  2. **Staff identity is not customer identity.** The back office authenticates against its own store with its own tokens and claim-based authorization. Giving support staff accounts in the customer directory would have meant granting customer-grade identities administrative scopes. *(This is the decision the test asserts. Do not name Azure AD.)*
  3. **Event sourcing here, not everywhere.** The portal's questions are historical — what changed, when, by whom — so its state is derived from events. The rest of the platform is not, because the rest of the platform is not asking that. *(Move this decision here from the old `dietbox` card.)*
  4. **Shared building blocks before shared services.** The newer services start from a common domain, infrastructure and identity layer rather than each inventing its own — which is what let a small team add a service without each one arriving in a new style. *(Also moved from the old `dietbox` card. This is where `dietbox-common` is accounted for.)*
- **`highlights`** — four, including impersonation stated plainly: support staff can act as the nutritionist or patient they are helping, and step back out.

- [ ] **Step 4: Update the venture-project count to 10**

- [ ] **Step 5: Run the tests**

```bash
cd web && npm test
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add web/src/content/projects.ts web/src/content/content.test.ts
git commit -m "feat(content): the Dietbox Portal case study"
```

---

### Task 6: Dietbox Notifications

The card with the best evidence on the site: a design document written before the system existed, preserved in the repository.

**Files:**
- Modify: `web/src/content/projects.ts` (insert after `dietbox-portal`)
- Test: `web/src/content/content.test.ts`

**Interfaces:**
- Consumes: `venture: 'dietbox'`.
- Produces: slug `dietbox-notifications`, fifth in the run.

**Source facts — verified, from `dietbox-notification-service/README.md` and the source tree:**
- Authorship: **19 of 20 commits**, May 2023 – Jan 2024.
- Origin, stated in the README: the official WhatsApp Business API bill in May 2023. The response was a pre-paid, per-nutritionist send quota.
- Stated constraint, quoted in substance: the main product was too complex to safely extend, so this was built as an isolated service with zero impact on it, able to serve other services later.
- Capacity planning from the README: average notification 214 B; ~51k WhatsApp notifications sent in May 2023; ~30k daily queries; 0.3 QPS average and 5 QPS peak; ~1.4 GB of storage over ten years.
- Domain: three models — a notification limit, a log of limit changes, and a record of each notification sent.
- API: two controllers (notify, nutritionist); commands to add a limit and to notify; queries over limits and sent records.
- Layered .NET with crosscutting packages for the WhatsApp provider, Redis and dependency injection.
- The repository holds C4 and data-model diagrams in `assets/`. **They are not published** — internal design artifacts of a former employer. The site's own flow figure renders the same information from localized content.

- [ ] **Step 1: Write the failing test**

```ts
it('dietbox-notifications carries the figures its design document recorded', () => {
  const notif = projects.find((p) => p.slug === 'dietbox-notifications');
  expect(notif, 'the notifications card is published').toBeDefined();
  expect(notif!.venture).toBe('dietbox');

  const detail = notif!.detail!;
  const values = detail.metrics!.map((m) => m.value.en).join(' ');
  expect(values, 'the May 2023 volume').toMatch(/51k|51 ?000|~51/);
  expect(values, 'the peak QPS the design planned for').toMatch(/\b5\b/);

  // The numbers predate the system, so the note must say where they came
  // from — they are a capacity plan, not a production measurement.
  expectBothLocales(detail.metricsNote!, 'dietbox-notifications metricsNote');
  expect(detail.metricsNote!.en).toMatch(/design|plan|estimate/i);
});
```

- [ ] **Step 2: Run to verify failure**

```bash
cd web && npx vitest run src/content/content.test.ts -t dietbox-notifications
```

Expected: FAIL — `the notifications card is published` (received `undefined`).

- [ ] **Step 3: Add the card**

```ts
  {
    slug: 'dietbox-notifications',
    name: 'Dietbox Notifications',
    tagline: {
      en: 'A messaging bill turned into a product constraint.',
      'pt-BR': 'Uma conta de mensageria transformada em restrição de produto.',
    },
    description: {
      en: 'An isolated service that meters outbound messaging: a pre-paid send quota per practitioner, a log of every quota change, and a record of every notification sent. Built beside the product rather than inside it, so a cost problem did not become a platform problem.',
      'pt-BR':
        'Um serviço isolado que mede a mensageria de saída: uma cota pré-paga de envios por profissional, um log de cada mudança de cota e um registro de cada notificação enviada. Construído ao lado do produto, e não dentro dele, para que um problema de custo não virasse um problema de plataforma.',
    },
    tech: ['.NET 6', 'C#', 'CQRS', 'Redis', 'SQL Server', 'WhatsApp Business API', 'Azure DevOps'],
    role: {
      en: 'Head of Technology',
      'pt-BR': 'Head de Tecnologia',
    },
    period: { en: '2023–2024', 'pt-BR': '2023–2024' },
    visibility: 'private',
    links: [{ label: 'Website', href: 'https://dietbox.me' }],
    venture: 'dietbox',
    detail: { /* below */ },
  },
```

`detail` carries:

- **`overview`** — a service that exists because of a number on an invoice, and what it meant to answer that with a domain model rather than a rate limit.
- **`contribution`** — `summary`: nineteen of twenty commits; the design document, the domain and the service are the author's. `areas` 3–4 bullets. **No `boundary`** — this one genuinely was solo, and inventing a boundary would be as dishonest as omitting a real one.
- **`problem`** — the WhatsApp bill in May 2023, and why the answer could not go into the main product: it was too complex to extend safely, and a cost control that risks the product is not a cost control.
- **`metrics`** — four, all from the design document:
  ```ts
  metrics: [
    {
      value: { en: '~51k', 'pt-BR': '~51 mil' },
      label: { en: 'messages a month', 'pt-BR': 'mensagens por mês' },
      note: { en: 'the volume being paid for', 'pt-BR': 'o volume que estava sendo pago' },
    },
    {
      value: { en: '~30k', 'pt-BR': '~30 mil' },
      label: { en: 'queries a day', 'pt-BR': 'consultas por dia' },
      note: { en: '0.3 QPS average', 'pt-BR': '0,3 QPS em média' },
    },
    {
      value: { en: '5', 'pt-BR': '5' },
      label: { en: 'peak QPS planned for', 'pt-BR': 'QPS de pico previsto' },
    },
    {
      value: { en: '~1.4 GB', 'pt-BR': '~1,4 GB' },
      label: { en: 'storage over ten years', 'pt-BR': 'armazenamento em dez anos' },
      note: { en: '214 bytes per notification', 'pt-BR': '214 bytes por notificação' },
    },
  ],
  ```
- **`metricsNote`** — must contain "design" (the test asserts a match on `design|plan|estimate`): these are the figures from the service's own design document, written before it was built, not production measurements taken after.
- **`architecture`** — calling service → notify endpoint → quota check → provider → the sent record.
- **`states`** — a send: requested → quota checked → dispatched or refused → recorded.
- **`decisions`** — four:
  1. **A separate service specifically to be ignorable.** The stated goal was zero impact on the main product. A service that can be switched off without taking the product with it.
  2. **A quota is a domain model, not a rate limit.** A limit, a log of who changed it, and a record of every send — so "why was this blocked" has an answer.
  3. **Capacity planned before the first line.** The volume, the query rate and the ten-year storage footprint were estimated up front, which is why the storage decision was boring.
  4. **One provider first, the interface for more.** WhatsApp was the bill; email, SMS and push were the shape the API was designed to accept later.
- **`highlights`** — four, from the controllers and queries.
- **No `screenshot`.** There is no interface. `ProjectCover` draws it from the architecture steps.

- [ ] **Step 4: Update the venture-project count to 11**

- [ ] **Step 5: Run the tests**

```bash
cd web && npm test
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add web/src/content/projects.ts web/src/content/content.test.ts
git commit -m "feat(content): the Dietbox Notifications case study"
```

---

### Task 7: Dietbox Socket, and the Redis correction

The smallest card, the most nearly solo, and the one that removes a claim the site cannot support.

**Files:**
- Modify: `web/src/content/projects.ts` (insert after `dietbox-notifications`, before `ulbra-atende`)
- Test: `web/src/content/content.test.ts`

**Interfaces:**
- Consumes: `venture: 'dietbox'`.
- Produces: slug `dietbox-socket`, last in the run. After this task the run is complete: `dietbox`, `dietbox-b2c`, `dietbox-payment`, `dietbox-portal`, `dietbox-notifications`, `dietbox-socket`.

**Source facts — verified:**
- Authorship: **33 of 34 commits**, Apr – Jun 2022.
- A socket server on Express. Clients connect with a shared-secret handshake token and are joined to a room named for their user id. A client that ends up in no room is disconnected immediately.
- Event handlers are auto-loaded from a directory — adding a handler is adding a file.
- The platform pushes by posting rooms, an event name and a payload to a notify endpoint; a crosscutting package in the API monorepo is the .NET client for it.
- An info endpoint reports the live connection count; a health endpoint reports its own latency.
- Logging to winston and Application Insights.
- A load-test harness that deliberately holds a share of clients on HTTP long-polling rather than upgrading them.
- Deployed by an Azure DevOps pipeline: install, build, archive, deploy to a Linux web app, one pipeline per branch.
- **There is no Redis in this repository.** `grep -ril redis` returns nothing.

**The correction:** the current `dietbox` card says the realtime service is *"scaled horizontally behind a Redis adapter"* / *"escalado horizontalmente atrás de um adaptador Redis"*. Task 2 removes that architecture step along with the platform-wide topology. Confirm it is gone before adding this card, and do not reintroduce it here.

**Trap:** the service's config module hardcodes a production hostname belonging to an unrelated product. It is not quoted, and no `script` section reproduces it.

- [ ] **Step 1: Write the failing test**

```ts
it('dietbox-socket claims no Redis adapter the repository does not have', () => {
  const socket = projects.find((p) => p.slug === 'dietbox-socket');
  expect(socket, 'the socket card is published').toBeDefined();
  expect(socket!.venture).toBe('dietbox');

  // A regression test for a specific inaccuracy this change removed: the
  // site asserted a Redis-backed horizontal scale-out that the source does
  // not contain. The site's whole premise is being checkable.
  const everything = JSON.stringify(projects.map((p) => p.detail));
  expect(everything, 'no project claims a Redis-backed socket adapter').not.toMatch(
    /redis[^"]{0,40}(adapter|socket)|socket[^"]{0,40}redis/i,
  );
});
```

- [ ] **Step 2: Run to verify failure**

```bash
cd web && npx vitest run src/content/content.test.ts -t dietbox-socket
```

Expected: FAIL — `the socket card is published` (received `undefined`). If the second assertion also fails, Task 2 left the Redis step behind; fix that before continuing.

- [ ] **Step 3: Add the card**

```ts
  {
    slug: 'dietbox-socket',
    name: 'Dietbox Socket',
    tagline: {
      en: 'Live updates as a service of its own, so they ship on their own clock.',
      'pt-BR': 'Atualizações ao vivo como serviço próprio, para subirem no próprio relógio.',
    },
    description: {
      en: 'A small realtime server that holds the open connections: a room per user, a shared-secret handshake, and one endpoint the platform posts to when something needs pushing. Separate from the product because long-lived connections and request traffic do not scale on the same axis — and because the monolith deployed once a night.',
      'pt-BR':
        'Um servidor de tempo real pequeno que mantém as conexões abertas: uma sala por usuário, um handshake com segredo compartilhado e um endpoint para onde a plataforma posta quando algo precisa ser empurrado. Separado do produto porque conexões de longa duração e tráfego de requisição não escalam no mesmo eixo — e porque o monolito subia uma vez por madrugada.',
    },
    tech: ['Node', 'Express', 'Socket.IO', 'Application Insights', 'Azure App Service', 'Azure DevOps'],
    role: { en: 'Senior Software Engineer', 'pt-BR': 'Engenheiro de Software Sênior' },
    period: { en: '2022', 'pt-BR': '2022' },
    visibility: 'private',
    links: [{ label: 'Website', href: 'https://dietbox.me' }],
    venture: 'dietbox',
    detail: { /* below */ },
  },
```

Note `Socket.IO` appears in `tech` only — it is a forbidden string inside `detail`.

`detail` carries:

- **`overview`** — thirty-four commits, two months, and a service that outlived both. What it does and why it is not part of anything else.
- **`contribution`** — `summary`: effectively solo, thirty-three of thirty-four commits. `areas` 3–4 bullets. **No `boundary`.**
- **`problem`** — the monolith deployed once a night. Anything sharing its pipeline shared its cadence, and a realtime channel that can only be changed at 3am is a realtime channel nobody changes. Separately: open connections and request traffic want different instance counts.
- **`architecture`** — four steps: the platform posts to the notify endpoint; the server resolves the rooms; the room fans out to the connected clients; the browser receives without a refresh.
- **`decisions`** — four:
  1. **Realtime as its own deployable.** Two reasons, both real: scaling axis and deploy cadence. *(Move this decision here from the old `dietbox` card, minus the Redis clause.)*
  2. **A room per user id.** Addressing is by identity, not by connection, so the platform pushes to a person without knowing how many tabs they have open.
  3. **Handlers auto-loaded from a directory.** Adding an event is adding a file; there is no registry to forget to update.
  4. **A load test that keeps clients on long-polling.** Not every client upgrades to a websocket, so a load test where all of them do measures a population that does not exist.
- **`highlights`** — four: the push endpoint the platform calls; the live connection count exposed for monitoring; the health endpoint; the shared-secret handshake with immediate disconnect for a client that joins no room.
- **No `metrics`** — the only number is the commit share, and on a thirty-four-commit repository a headline tile reading "33" would be a joke at the card's own expense. It goes in the `contribution` summary instead.
- **No `screenshot`.**

- [ ] **Step 4: Update the venture-project count to 12 — the final value**

```ts
  expect(inVentures, 'six ULBRA projects and six Dietbox projects').toHaveLength(12);
```

- [ ] **Step 5: Run the full suite**

```bash
cd web && npm test
```

Expected: PASS, including `projects sharing a venture are contiguous in the array` — the Dietbox run must be unbroken and must sit entirely before `ulbra-atende`.

- [ ] **Step 6: Commit**

```bash
git add web/src/content/projects.ts web/src/content/content.test.ts
git commit -m "feat(content): the Dietbox Socket case study, and a correction"
```

---

### Task 8: Screenshots

Three cards have a real interface. The rule from `ProjectCover`'s own documentation holds: never a picture of something that does not exist. A capture here is the repository's real markup and real stylesheet, with placeholder data where a live backend would have supplied real data.

**Files:**
- Create, each conditional on its capture succeeding: `web/public/screenshots/dietbox-b2c.webp`, `dietbox-payment.webp`, `dietbox-portal.webp`
- Modify: `web/src/content/projects.ts` (add a `screenshot` field to each card whose capture succeeded, and only those)

**Interfaces:**
- Consumes: the three card slugs from Tasks 3, 4 and 5.
- Produces: `.webp` assets at `/screenshots/<slug>.webp`, matching the existing files' framing — **1120×630, 16:9**, which is what `dietbox.webp` and `ulbra-atende.webp` use.

**Placeholder data rules.** Generic only. No real nutritionist, patient, plan price, invoice, address or account, whether observed in the Dietbox repositories or invented to look plausible. Use obviously neutral values — a name like "Maria Silva", a plan called "Plano Profissional", a generic price. Nothing that could be mistaken for a real record.

- [ ] **Step 1: Capture B2C — highest fidelity, do this one first**

`C:\Projects\Dietbox\dietbox-b2c\src\flows\nutricionista\unified.html` is a static page with a real stylesheet under `../assets/css`. Azure fills a `<div id="api">` at runtime; everything around it is a production file.

Serve the flows directory over HTTP from the scratchpad (never from inside the Dietbox checkout, and never write into it):

```bash
cp -r "C:/Projects/Dietbox/dietbox-b2c/src/flows" "$SCRATCH/b2c-flows"
```

In the copy, inject into the `<div id="api">` the self-asserted sign-in markup B2C renders there — an email field, a password field, a submit button and the forgot-password link — using the class names the page's own stylesheet already targets. Read the stylesheet to get them right rather than guessing.

Open it with `mcp__Claude_Browser__preview_start` at the local URL, size the viewport to 1120×630 with `resize_window`, and capture with `computer {action: "screenshot"}`.

- [ ] **Step 2: Capture Payment**

`C:\Projects\Dietbox\dietbox-payment-client\dist\` is already built. Copy it to the scratchpad and serve it statically. Navigate to the subscription route and screenshot.

The API will be unreachable. Check `read_console_messages` and `read_page`: if the view renders its layout with empty fields, that is an acceptable capture. If it renders an error state or nothing at all, fall back — render the real `SubscriptionView` template and its components with fixture data as a standalone page, using the repository's own stylesheets.

- [ ] **Step 3: Capture Portal — time-boxed, may be abandoned**

`portal/dietbox-portal-client` has `node_modules`. The login view posts to an accounts endpoint that will not answer, and the router guards on a token in the persisted store.

Try, in order, and stop at the first that works: seed the persisted store with a fake token and navigate straight to the dashboard route; or render the dashboard view standalone with fixture data.

**If neither works within a reasonable effort, drop it.** Remove nothing — the card was written in Task 5 without a `screenshot` field, so no change is needed and `ProjectCover` draws it. Say plainly in the commit message that the capture was not attempted successfully rather than shipping a broken screen.

- [ ] **Step 4: Convert and place**

Convert each capture to WebP at 1120×630 and write it to `web/public/screenshots/<slug>.webp`. Compare file sizes against the existing assets (`dietbox.webp` is 104 KB, `ulbra-atende.webp` is 44 KB); anything far larger needs its quality reduced.

- [ ] **Step 5: Wire the cards**

None of the three cards has a `screenshot` field yet — Tasks 3, 4 and 5 deliberately left it off. Add it **only** for slugs whose `.webp` this task actually produced:

```ts
    screenshot: '/screenshots/dietbox-b2c.webp',
```

placed where `screenshot` sits on the other cards (after `visibility`, before `links`). A card whose capture failed keeps no `screenshot` field and renders the generated cover. Never write a path to a file that is not on disk.

- [ ] **Step 6: Verify in the browser**

Start the dev server and look at `/projects`. Every Dietbox card must show either a real screenshot or the generated diagram, and none must show a broken image.

```bash
cd web && npm test
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add web/public/screenshots web/src/content/projects.ts
git commit -m "feat(content): screenshots for the Dietbox cards"
```

---

### Task 9: Regenerate the assistant profile and verify the whole change

The last task exists because three consumers of the project list are asserted in this plan to need no changes. Asserting is not verifying.

**Files:**
- Modify: `src/Pulse.Api/Assistant/projects.generated.md` (regenerated, not hand-edited)

- [ ] **Step 1: Regenerate the assistant profile**

```bash
cd web && npm run gen:assistant
```

- [ ] **Step 2: Inspect the diff**

```bash
git diff --stat src/Pulse.Api/Assistant/
git diff src/Pulse.Api/Assistant/projects.generated.md | head -80
```

Expected: the Dietbox venture introduced before its six projects, and one section per new project. If a project is missing, its entry is not in the array where the generator walks it.

- [ ] **Step 3: Verify the downstream consumers pick the new slugs up**

```bash
cd web && npm test && npm run build
```

Expected: PASS, and the prerender step emits `/projects/dietbox-b2c`, `/projects/dietbox-payment`, `/projects/dietbox-portal`, `/projects/dietbox-notifications` and `/projects/dietbox-socket` in both locales. Check the prerender output directory for those paths. If any is absent, the route or the sitemap is not deriving from the flat array as this plan assumed — that is a real finding and needs a fix, not a workaround.

- [ ] **Step 4: Check the rendered page**

Start the dev server and open `/projects` in both locales. Confirm: two venture sections; the Dietbox header shows the role, the period and the thirteen-person team, with no engagement badge; four practices under it; six cards; and the ULBRA section unchanged below.

- [ ] **Step 5: Lint**

```bash
cd web && npm run lint
```

- [ ] **Step 6: Commit**

```bash
git add src/Pulse.Api/Assistant/projects.generated.md
git commit -m "chore(assistant): regenerate the project profile for the Dietbox venture"
```

---

## Open items carried from the spec

Each is recorded here so it is not lost, and none blocks the tasks above.

1. **Which component was migrated to .NET 6.** The author confirms a migration these repositories do not show. Task 2 preserves the existing wording verbatim and adds no framework claim. If the component is named later, the Webapp card can say which one rather than "the legacy platform".
2. **Pagar.me or TSPay.** The site says Iugu → Pagar.me; the code carries Iugu, Ebanx and TSPay integrations. Task 4 names the gateway integrations that exist without asserting which one the migration landed on, and the venture's second practice keeps the existing wording.
3. **Subscriber scale for the migration.** "Thousands of active subscribers" stays as the existing vague form rather than becoming a guess.
4. **Publishing consent.** Nothing here publishes source, credentials, customer data or internal diagrams. The line was drawn deliberately; the author may still want to draw it somewhere else.
