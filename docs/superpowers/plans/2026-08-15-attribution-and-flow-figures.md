# Attribution Section + Flow Figures Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the cramped horizontal architecture diagram with a stacked row flow, add a "What I did" section stating each project's actual contribution, and give Kota Embed and Ulbra Atende a state-machine figure of their own.

**Architecture:** One flow primitive drives two content fields — `architecture` (topology) and `states` (lifecycle) — so the state machine reuses the rewritten diagram instead of duplicating it. A `contribution` field renders as its own section. All four changes land in the same files.

**Tech Stack:** React 19, TypeScript, Tailwind 4, react-i18next, Vitest + Testing Library.

## Global Constraints

- **Every localized string has real `en` + `pt-BR`.** `label` on a flow step is a product or state name and is deliberately not localized.
- **The state labels are the real enum values** from each system's source, not invented ones. Do not "improve" them into friendlier words — their being checkable is the point.
- **No client infrastructure, credentials, partner names, or personal data.** Domain vocabulary (a status name, a team concept) is fine; endpoints, hosts, environment names and insurer names are not.
- **No sentence may appear twice on one page in either locale.** The English copy differentiates the SLA pause between the contribution area and the highlights bullet by verb; the pt-BR must too, or a page-level assertion has nowhere to anchor and gets loosened to compensate.
- **Attribution states its boundary.** Where the `boundary` field is present it must render; silence about a boundary reads as a claim over everything.
- **The contribution section never restates a job title.** `role` already carries the title and renders in the header and on the card; repeating one here produced two different titles for the same job on one page. This section describes the work, not the position.
- **Exactly one `<h1>` per page.** Section headings are `SubsectionHeading` (`<h2>`); nothing inside a figure renders a heading.
- **`ulbra-one` must render exactly the sections it renders today** — it gains neither field.
- **Run commands from `web/`.** `pnpm test`, `pnpm lint`, `pnpm build` (there is no `typecheck` script — `pnpm build` runs `tsc -b`).
- **A known flake:** `src/routes/index.test.tsx` and sometimes `entry-prerender.test.ts` time out under machine load and pass in isolation. Do not change their timeouts.

---

## File Structure

| File | Responsibility |
|---|---|
| `web/src/content/projects.ts` (modify) | New types, the architecture migration, and all new content |
| `web/src/content/content.test.ts` (modify) | Both-locale sweep and field invariants |
| `web/src/components/projects/case-study-flow.tsx` (create) | The stacked row flow |
| `web/src/components/projects/case-study-flow.test.tsx` (create) | Its tests |
| `web/src/components/projects/case-study-architecture.tsx` (delete) | Superseded |
| `web/src/components/projects/case-study-architecture.test.tsx` (delete) | Superseded |
| `web/src/components/projects/project-contribution.tsx` (create) | The "What I did" body |
| `web/src/components/projects/project-contribution.test.tsx` (create) | Its tests |
| `web/src/components/projects/project-detail.tsx` (modify) | New sections and order |
| `web/src/routes/project-detail.test.tsx` (modify) | Page-level assertions |
| `web/src/i18n/locales/{en,pt-BR}/projects.json` (modify) | The "What I did" heading |

---

### Task 1: The flow primitive and the architecture migration

Atomic by necessity: renaming the type, migrating the content, and swapping the component cannot land separately without breaking the build in between.

**Files:**
- Modify: `web/src/content/projects.ts`
- Create: `web/src/components/projects/case-study-flow.tsx`
- Create: `web/src/components/projects/case-study-flow.test.tsx`
- Delete: `web/src/components/projects/case-study-architecture.tsx`
- Delete: `web/src/components/projects/case-study-architecture.test.tsx`
- Modify: `web/src/components/projects/project-detail.tsx`

**Interfaces:**
- Produces: `CaseStudyFlowStep` (was `CaseStudyArchitectureNode`), `CaseStudyFlow`; `ProjectDetailContent.architecture` becomes `CaseStudyFlow`. `export function CaseStudyFlow(props: { flow: CaseStudyFlowContent }): ReactElement | null`. Tasks 3-4 consume these.

- [ ] **Step 1: Write the failing test**

Create `web/src/components/projects/case-study-flow.test.tsx`:

```tsx
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CaseStudyFlow } from '@/components/projects/case-study-flow';
import type { CaseStudyFlow as CaseStudyFlowContent } from '@/content/projects';
import { renderWithI18n } from '@/test/render-with-i18n';

const flow: CaseStudyFlowContent = {
  caption: { en: 'The life of a thing', 'pt-BR': 'A vida de uma coisa' },
  summary: { en: 'How it moves.', 'pt-BR': 'Como ela anda.' },
  steps: [
    { label: 'Processing', detail: { en: 'Recorded and validated.', 'pt-BR': 'Registrado e validado.' } },
    { label: 'Enrolled', detail: { en: 'The policy exists.', 'pt-BR': 'A apólice existe.' } },
  ],
};

describe('CaseStudyFlow', () => {
  it('renders the summary and every step in order', async () => {
    await renderWithI18n(<CaseStudyFlow flow={flow} />);

    expect(screen.getByText('How it moves.')).toBeInTheDocument();
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent('Processing');
    expect(items[0]).toHaveTextContent('Recorded and validated.');
    expect(items[1]).toHaveTextContent('Enrolled');
  });

  it('renders in pt-BR', async () => {
    await renderWithI18n(<CaseStudyFlow flow={flow} />, { locale: 'pt-BR' });
    expect(screen.getByText('Como ela anda.')).toBeInTheDocument();
    expect(screen.getByText('A apólice existe.')).toBeInTheDocument();
  });

  it('renders without a summary', async () => {
    const { summary, ...rest } = flow;
    await renderWithI18n(<CaseStudyFlow flow={rest} />);
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('renders nothing when there are no steps', async () => {
    const { container } = await renderWithI18n(<CaseStudyFlow flow={{ ...flow, steps: [] }} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the same elements at every width — nothing is hidden by breakpoint', async () => {
    const { container } = await renderWithI18n(<CaseStudyFlow flow={flow} />);
    const hidden = container.querySelectorAll('[class*="hidden"], [class*="sm:block"], [class*="sm:hidden"]');
    expect(hidden, 'a breakpoint-toggled element means two layouts to review').toHaveLength(0);
  });

  it('renders only li elements as direct children of the list', async () => {
    const { container } = await renderWithI18n(<CaseStudyFlow flow={flow} />);
    const list = container.querySelector('ol');
    expect(list).not.toBeNull();
    expect(Array.from(list!.children).filter((el) => el.tagName !== 'LI')).toHaveLength(0);
  });

  it('adds no heading of its own — the page section supplies it', async () => {
    await renderWithI18n(<CaseStudyFlow flow={flow} />);
    expect(screen.queryAllByRole('heading')).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd web && pnpm test src/components/projects/case-study-flow.test.tsx`
Expected: FAIL — cannot resolve `@/components/projects/case-study-flow`.

- [ ] **Step 3: Add the types and migrate the content**

In `web/src/content/projects.ts`, replace the `CaseStudyArchitectureNode` interface with:

```ts
/** One step in a flow — a topology node or a lifecycle state. */
export interface CaseStudyFlowStep {
  /** Short label: a product name or a state name, so not localized. */
  label: string;
  detail: LocalizedString;
}

/** A named sequence of steps: what calls what, or what happens next. */
export interface CaseStudyFlow {
  /** Doubles as the section heading. Optional only for `architecture`, which
   *  falls back to the shared "Architecture" heading; a `states` flow without
   *  one does not render, because "Architecture" would be the wrong title. */
  caption?: LocalizedString;
  summary?: LocalizedString;
  steps: CaseStudyFlowStep[];
}
```

In `ProjectDetailContent`, replace the inline `architecture` shape with:

```ts
  /** How the system is put together — what calls what. */
  architecture?: CaseStudyFlow;
```

Then in each of the three projects that have an `architecture` (`kota-embed`, `ulbra-atende`, `dell-automated-caller`), rename the `nodes:` key to `steps:`. Do not change any label or detail text.

- [ ] **Step 4: Write the component**

Create `web/src/components/projects/case-study-flow.tsx`:

```tsx
import type { CaseStudyFlow as CaseStudyFlowContent } from '@/content/projects';
import { useLocalized } from '@/i18n/use-localized';

export interface CaseStudyFlowProps {
  flow: CaseStudyFlowContent;
}

/**
 * A sequence of steps — a topology (what calls what) or a lifecycle (what
 * happens next) — as stacked rows on the same left rail the decisions and
 * highlights lists use.
 *
 * Deliberately one layout at every width. The earlier version put the steps
 * in a row on `sm+` and stacked them below, which meant two layouts, only one
 * of which anyone looked at — and five boxes across a prose column left each
 * one too narrow to hold its own label. Here the label column simply wraps
 * above the detail on a narrow screen: same elements, same order, no second
 * arrangement to maintain. The caption is rendered by the page section as its
 * heading, not here.
 */
export function CaseStudyFlow({ flow }: CaseStudyFlowProps) {
  const L = useLocalized();
  if (flow.steps.length === 0) return null;

  return (
    <div className="flex flex-col gap-5">
      {flow.summary ? (
        <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">{L(flow.summary)}</p>
      ) : null}
      <ol className="flex flex-col gap-4 border-l border-signal/25 pl-6">
        {flow.steps.map((step, index) => (
          <li key={index} className="relative flex flex-col gap-1 sm:flex-row sm:gap-4">
            <span aria-hidden className="absolute top-1.5 -left-[1.8125rem] size-2 rounded-full bg-signal" />
            <span className="font-mono text-xs font-medium text-signal-strong sm:w-40 sm:shrink-0 sm:pt-0.5">
              {step.label}
            </span>
            <span className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{L(step.detail)}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
```

- [ ] **Step 5: Swap the component on the page**

In `web/src/components/projects/project-detail.tsx`, replace the import of `CaseStudyArchitecture` with:

```tsx
import { CaseStudyFlow } from '@/components/projects/case-study-flow';
```

and replace the architecture section's body with:

```tsx
        {project.detail?.architecture && project.detail.architecture.steps.length > 0 ? (
          <section className="flex flex-col gap-3">
            <SubsectionHeading>
              {project.detail.architecture.caption
                ? L(project.detail.architecture.caption)
                : t('projects:architectureHeading')}
            </SubsectionHeading>
            <CaseStudyFlow flow={project.detail.architecture} />
          </section>
        ) : null}
```

- [ ] **Step 6: Delete the superseded component**

```bash
git rm web/src/components/projects/case-study-architecture.tsx web/src/components/projects/case-study-architecture.test.tsx
```

- [ ] **Step 7: Run everything**

Run: `cd web && pnpm test && pnpm lint && pnpm build`
Expected: PASS. The existing page tests still assert the architecture section renders and its step labels appear — they should pass untouched, which is the migration's proof.

- [ ] **Step 8: Commit**

```bash
git add -A web/src
git commit -m "refactor(projects): one stacked flow primitive replaces the architecture row"
```

---

### Task 2: `ProjectContribution`

**Files:**
- Create: `web/src/components/projects/project-contribution.tsx`
- Create: `web/src/components/projects/project-contribution.test.tsx`
- Modify: `web/src/content/projects.ts` (the type only)

**Interfaces:**
- Produces: `ProjectContribution` type; `export function ProjectContribution(props: { contribution: ProjectContributionContent }): ReactElement | null`. Task 4 renders it.

- [ ] **Step 1: Write the failing test**

Create `web/src/components/projects/project-contribution.test.tsx`:

```tsx
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ProjectContribution } from '@/components/projects/project-contribution';
import type { ProjectContribution as ProjectContributionContent } from '@/content/projects';
import { renderWithI18n } from '@/test/render-with-i18n';

const contribution: ProjectContributionContent = {
  summary: { en: 'I owned the core.', 'pt-BR': 'O núcleo foi meu.' },
  areas: [
    { en: 'The intent workflows.', 'pt-BR': 'Os fluxos de intent.' },
    { en: 'The public API contract.', 'pt-BR': 'O contrato da API pública.' },
  ],
  boundary: { en: 'The front end was built by others.', 'pt-BR': 'O front-end foi feito por outros.' },
};

describe('ProjectContribution', () => {
  it('renders summary, every area, and the boundary', async () => {
    await renderWithI18n(<ProjectContribution contribution={contribution} />);

    expect(screen.getByText('I owned the core.')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByText('The public API contract.')).toBeInTheDocument();
    expect(screen.getByText('The front end was built by others.')).toBeInTheDocument();
  });

  it('renders in pt-BR', async () => {
    await renderWithI18n(<ProjectContribution contribution={contribution} />, { locale: 'pt-BR' });
    expect(screen.getByText('O núcleo foi meu.')).toBeInTheDocument();
    expect(screen.getByText('O front-end foi feito por outros.')).toBeInTheDocument();
  });

  it('renders a summary-only contribution without an empty list', async () => {
    const { container } = await renderWithI18n(
      <ProjectContribution contribution={{ summary: contribution.summary }} />,
    );
    expect(screen.getByText('I owned the core.')).toBeInTheDocument();
    expect(container.querySelector('ul')).toBeNull();
  });

  it('omits the boundary when there is none', async () => {
    const { areas, summary } = contribution;
    await renderWithI18n(<ProjectContribution contribution={{ summary, areas }} />);
    expect(screen.queryByText(/built by others/i)).not.toBeInTheDocument();
  });

  it('adds no heading of its own', async () => {
    await renderWithI18n(<ProjectContribution contribution={contribution} />);
    expect(screen.queryAllByRole('heading')).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd web && pnpm test src/components/projects/project-contribution.test.tsx`
Expected: FAIL — cannot resolve `@/components/projects/project-contribution`.

- [ ] **Step 3: Add the type**

In `web/src/content/projects.ts`, above `ProjectDetailContent`:

```ts
/** What the author actually did on a project. */
export interface ProjectContribution {
  /** One or two sentences naming the contribution. */
  summary: LocalizedString;
  /** The specific areas owned — 2-5 items. */
  areas?: LocalizedString[];
  /** What was explicitly someone else's. Omit when the author built it all. */
  boundary?: LocalizedString;
}
```

and add to `ProjectDetailContent`, immediately after `overview`:

```ts
  /** What the author actually did — rendered as its own section. */
  contribution?: ProjectContribution;
```

- [ ] **Step 4: Write the component**

Create `web/src/components/projects/project-contribution.tsx`:

```tsx
import type { ProjectContribution as ProjectContributionContent } from '@/content/projects';
import { useLocalized } from '@/i18n/use-localized';

export interface ProjectContributionProps {
  contribution: ProjectContributionContent;
}

/**
 * What the author did on a project, as its own section rather than a line in
 * the header — on a portfolio this is the part a reader came for, and a mono
 * caption under the tagline is the easiest thing on the page to skip.
 *
 * `boundary` renders set apart and muted: it qualifies the claim above it
 * rather than adding to it. Deliberately not italicised — italics reads as an
 * aside, and this is the one line in the section that must not be skimmed past. Leaving a shared project's boundary unstated reads
 * as a claim over the whole thing, which is the failure this section exists to
 * prevent.
 */
export function ProjectContribution({ contribution }: ProjectContributionProps) {
  const L = useLocalized();

  return (
    <div className="flex flex-col gap-4">
      <p className="max-w-2xl text-base leading-relaxed text-foreground/80">{L(contribution.summary)}</p>
      {contribution.areas && contribution.areas.length > 0 ? (
        <ul className="flex flex-col gap-2 border-l border-signal/25 pl-6">
          {contribution.areas.map((area, index) => (
            <li key={index} className="relative text-sm text-muted-foreground">
              <span aria-hidden className="absolute top-1.5 -left-[1.8125rem] size-2 rounded-full bg-signal" />
              {L(area)}
            </li>
          ))}
        </ul>
      ) : null}
      {contribution.boundary ? (
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {L(contribution.boundary)}
        </p>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd web && pnpm test src/components/projects/project-contribution.test.tsx`
Expected: PASS — 5 tests.

- [ ] **Step 6: Commit**

```bash
git add web/src/components/projects/project-contribution.tsx web/src/components/projects/project-contribution.test.tsx web/src/content/projects.ts
git commit -m "feat(projects): contribution section component"
```

---

### Task 3: The content

**Files:**
- Modify: `web/src/content/projects.ts`
- Modify: `web/src/content/content.test.ts`

**Interfaces:**
- Consumes: `ProjectContribution` and `CaseStudyFlow` from Tasks 1-2.
- Produces: `contribution` on four projects; `states` on `kota-embed` and `ulbra-atende`.

- [ ] **Step 1: Write the failing test**

Append to `web/src/content/content.test.ts`:

```ts
it('every project except ulbra-one states what the author did', () => {
  for (const project of projects) {
    const contribution = project.detail?.contribution;
    if (project.slug === 'ulbra-one') {
      expect(contribution, 'ulbra-one is out of scope for now').toBeUndefined();
      continue;
    }
    expect(contribution, `${project.slug} has no contribution`).toBeDefined();
    expectBothLocales(contribution!.summary, `${project.slug} contribution.summary`);
    for (const area of contribution!.areas ?? []) {
      expectBothLocales(area, `${project.slug} contribution.area`);
    }
    if (contribution!.boundary) {
      expectBothLocales(contribution!.boundary, `${project.slug} contribution.boundary`);
    }
  }
});

it('kota-embed names the front end as someone else’s work', () => {
  const kota = projects.find((p) => p.slug === 'kota-embed');
  expect(kota!.detail!.contribution!.boundary, 'the boundary is the honesty claim').toBeDefined();
});

it('the state-machine figures are localized and non-empty', () => {
  for (const slug of ['kota-embed', 'ulbra-atende']) {
    const states = projects.find((p) => p.slug === slug)!.detail!.states!;
    expectBothLocales(states.caption!, `${slug} states.caption`);
    expectBothLocales(states.summary!, `${slug} states.summary`);
    expect(states.steps.length).toBeGreaterThanOrEqual(4);
    for (const step of states.steps) {
      expect(step.label.trim()).not.toBe('');
      expectBothLocales(step.detail, `${slug} states.step.detail`);
    }
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd web && pnpm test src/content/content.test.ts`
Expected: FAIL — `contribution` is undefined on `pulse`.

- [ ] **Step 3: Add `states` to the type**

In `web/src/content/projects.ts`, add to `ProjectDetailContent` immediately after `architecture`:

```ts
  /** How one unit of work moves through the system, state by state. */
  states?: CaseStudyFlow;
```

- [ ] **Step 4: Add the contribution content**

Add a `contribution` to each project's `detail`, immediately after its `overview`.

`pulse`:

```ts
      contribution: {
        summary: {
          en: 'Sole author — the design, the event-driven backend, the front end, and the infrastructure it runs on.',
          'pt-BR':
            'Autor único — o design, o backend orientado a eventos, o front-end e a infraestrutura em que roda.',
        },
        areas: [
          { en: 'The realtime presence pipeline and its world map.', 'pt-BR': 'O pipeline de presença em tempo real e seu mapa-múndi.' },
          { en: 'The transactional outbox and the event-driven backend behind it.', 'pt-BR': 'O outbox transacional e o backend orientado a eventos por trás dele.' },
          { en: 'The public ops dashboard and the metrics it exposes.', 'pt-BR': 'O dashboard de operações público e as métricas que ele expõe.' },
          { en: 'The AI assistant and the profile that grounds it.', 'pt-BR': 'O assistente de IA e o perfil que o fundamenta.' },
          { en: 'Deployment, from container build to the machine it lands on.', 'pt-BR': 'O deploy, do build do container à máquina onde ele roda.' },
        ],
      },
```

`kota-embed`:

```ts
      contribution: {
        summary: {
          en: 'I owned the multi-tenant core — the part that turns an enrollment request into a policy across nine insurers that each behave differently.',
          'pt-BR':
            'O núcleo multi-tenant foi meu — a parte que transforma um pedido de adesão numa apólice, através de nove seguradoras que se comportam de formas diferentes.',
        },
        areas: [
          { en: 'The intent state machines behind enrollment, quoting, amendment and renewal.', 'pt-BR': 'As máquinas de estado de intent por trás de adesão, cotação, alteração e renovação.' },
          { en: 'Adaptive requirements: asking a service what a case must collect instead of hardcoding a form per insurer.', 'pt-BR': 'Requisitos adaptativos: perguntar a um serviço o que um caso precisa coletar, em vez de codificar um formulário por seguradora.' },
          { en: 'The versioned public API contract and its webhooks.', 'pt-BR': 'O contrato versionado da API pública e seus webhooks.' },
          { en: 'Provider contracts introduced behind feature flags and migrated without stopping the product.', 'pt-BR': 'Contratos de provedor introduzidos atrás de feature flags e migrados sem parar o produto.' },
          { en: 'Idempotency and duplicate suppression, and the integration suite that covers them.', 'pt-BR': 'Idempotência e supressão de duplicatas, e a suíte de integração que cobre as duas.' },
        ],
        boundary: {
          en: 'The front end — the embedded flow and its SDK — was built by others; I have no commits in it.',
          'pt-BR':
            'O front-end — o fluxo embutido e seu SDK — foi feito por outros; não tenho commits nele.',
        },
      },
```

`ulbra-atende`:

```ts
      contribution: {
        summary: {
          en: 'Principal author, from scratch — the architecture, the backend, the front end, and the deployment.',
          'pt-BR':
            'Autor principal, do zero — a arquitetura, o backend, o front-end e o deploy.',
        },
        areas: [
          { en: 'The modular monolith and the boundaries between its contexts.', 'pt-BR': 'O monólito modular e as fronteiras entre seus contextos.' },
          { en: 'The SLA engine, including pauses that record who stopped the clock and why.', 'pt-BR': 'O motor de SLA, incluindo pausas que registram quem interrompeu a contagem e por quê.' },
          { en: 'The transactional outbox and the notification fan-out it feeds.', 'pt-BR': 'O outbox transacional e o fan-out de notificação que ele alimenta.' },
          { en: 'The OAuth authorization server and the MCP server behind its consent screen.', 'pt-BR': 'O servidor de autorização OAuth e o servidor MCP atrás da sua tela de consentimento.' },
          { en: 'The React front end and the Docker Swarm deployment.', 'pt-BR': 'O front-end em React e o deploy em Docker Swarm.' },
        ],
      },
```

`dell-automated-caller`:

```ts
      contribution: {
        summary: {
          en: 'I conceived the tool and built it, and later mentored the junior engineer who joined the project.',
          'pt-BR':
            'Concebi a ferramenta e a construí, e depois fui mentor do engenheiro júnior que entrou no projeto.',
        },
        areas: [
          { en: 'The test scripting language and the validator that rejects a bad script before it costs a call.', 'pt-BR': 'A linguagem de roteiro de teste e o validador que rejeita roteiro ruim antes de custar uma ligação.' },
          { en: 'Similarity-based assertion, with the threshold declared per step.', 'pt-BR': 'Asserção por similaridade, com o limiar declarado em cada passo.' },
          { en: 'The queue between the request and the call.', 'pt-BR': 'A fila entre a requisição e a ligação.' },
          { en: 'The telephony integration and the webhook that carries each transcribed response back.', 'pt-BR': 'A integração de telefonia e o webhook que traz cada resposta transcrita de volta.' },
          { en: 'Reporting results back into the test-management tool.', 'pt-BR': 'O reporte dos resultados de volta para a ferramenta de gestão de testes.' },
        ],
      },
```

- [ ] **Step 5: Add the two state-machine figures**

In `kota-embed`'s `detail`, immediately after `architecture`:

```ts
      states: {
        caption: { en: 'The life of an enrollment', 'pt-BR': 'A vida de uma adesão' },
        summary: {
          en: 'An enrollment cannot finish inside one request — an insurer may answer in minutes or in days — so its in-between state is a persisted entity the system can query, resume and report on. These are the statuses it actually moves through; it can also end ineligible, or not undertaken at all.',
          'pt-BR':
            'Uma adesão não termina dentro de uma requisição — uma seguradora pode responder em minutos ou em dias — então o estado intermediário dela é uma entidade persistida que o sistema consulta, retoma e reporta. Estes são os status pelos quais ela realmente passa; ela também pode terminar inelegível, ou nem ser realizada.',
        },
        steps: [
          {
            label: 'Processing',
            detail: {
              en: 'The request is recorded against its idempotency key and validated, before anything external is called.',
              'pt-BR': 'O pedido é registrado sob sua chave de idempotência e validado, antes de qualquer chamada externa.',
            },
          },
          {
            label: 'ActionRequired',
            detail: {
              en: 'Something is missing that only a person can supply. The intent says so and waits, instead of failing.',
              'pt-BR': 'Falta algo que só uma pessoa pode fornecer. O intent declara isso e espera, em vez de falhar.',
            },
          },
          {
            label: 'PendingConfirmation',
            detail: {
              en: 'Everything the insurer and the region require is gathered; the requester confirms before it is sent.',
              'pt-BR': 'Tudo o que a seguradora e a região exigem está reunido; quem pediu confirma antes do envio.',
            },
          },
          {
            label: 'Enrolling',
            detail: {
              en: 'Handed to the insurer through its adapter, which answers on its own schedule.',
              'pt-BR': 'Entregue à seguradora pelo adapter dela, que responde no tempo dela.',
            },
          },
          {
            label: 'Enrolled',
            detail: {
              en: 'The policy exists. The platform reports it back to whoever asked.',
              'pt-BR': 'A apólice existe. A plataforma reporta de volta a quem pediu.',
            },
          },
        ],
      },
```

In `ulbra-atende`'s `detail`, immediately after `architecture`:

```ts
      states: {
        caption: { en: 'The life of a ticket', 'pt-BR': 'A vida de um chamado' },
        summary: {
          en: 'The SLA clock is the thread running through it. It starts on the receiving team’s policy, stops when the ticket is waiting on someone outside the team, and is what every number on this page is measured against. A ticket can also end cancelled, and work needing sign-off waits on an approval before it starts.',
          'pt-BR':
            'O relógio do SLA é o fio que atravessa tudo. Ele começa pela política do time que recebe, para quando o chamado depende de alguém fora do time, e é contra ele que todo número desta página é medido. Um chamado também pode terminar cancelado, e trabalho que exige aval espera uma aprovação antes de começar.',
        },
        steps: [
          {
            label: 'Open',
            detail: {
              en: 'The clock starts against the receiving team’s SLA policy, and triage — by a person or by the AI assist — routes it.',
              'pt-BR': 'O relógio começa contra a política de SLA do time que recebe, e a triagem — por uma pessoa ou pela IA — faz o roteamento.',
            },
          },
          {
            label: 'InProgress',
            detail: {
              en: 'An assignee owns it. First response is already measured by this point.',
              'pt-BR': 'Alguém assume. A primeira resposta já foi medida a esta altura.',
            },
          },
          {
            label: 'Paused',
            detail: {
              en: 'Waiting on the requester or a third party. The clock stops, and who paused it and why is recorded as its own entry.',
              'pt-BR': 'Esperando quem abriu ou um terceiro. O relógio para, e quem pausou e por quê fica registrado como uma entrada própria.',
            },
          },
          {
            label: 'Completed',
            detail: {
              en: 'The work is done and the requester is asked to rate it — which is where the satisfaction score comes from.',
              'pt-BR': 'O trabalho acabou e quem abriu é convidado a avaliar — que é de onde vem a nota de satisfação.',
            },
          },
        ],
      },
```

- [ ] **Step 6: Run the tests**

Run: `cd web && pnpm test src/content/content.test.ts && pnpm build`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add web/src/content/projects.ts web/src/content/content.test.ts
git commit -m "feat(projects): contribution for four projects, state figures for two"
```

---

### Task 4: Render the new sections

**Files:**
- Modify: `web/src/components/projects/project-detail.tsx`
- Modify: `web/src/i18n/locales/en/projects.json`
- Modify: `web/src/i18n/locales/pt-BR/projects.json`
- Modify: `web/src/routes/project-detail.test.tsx`

- [ ] **Step 1: Write the failing test**

Append inside the `describe('ProjectDetail', …)` block in `web/src/routes/project-detail.test.tsx`:

```tsx
  it('renders the contribution and states sections for kota-embed, in order', async () => {
    await renderDetail('kota-embed');
    await screen.findAllByRole('heading', { level: 1 });

    expect(screen.getByText(/I owned the multi-tenant core/i)).toBeInTheDocument();
    expect(screen.getByText(/no commits in it/i)).toBeInTheDocument();
    expect(screen.getByText('PendingConfirmation')).toBeInTheDocument();

    const headings = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
    expect(headings).toEqual([
      'Overview',
      'What I did',
      'The problem',
      'By the numbers',
      'Architecture',
      'The life of an enrollment',
      'What it does',
      'Engineering decisions',
    ]);
  });

  it('renders the contribution heading in pt-BR', async () => {
    await renderDetail('kota-embed', 'pt-BR');
    await screen.findAllByRole('heading', { level: 1 });

    const headings = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
    expect(headings[1]).toBe('O que eu fiz');
    expect(headings[5]).toBe('A vida de uma adesão');
  });

  it('renders no contribution section for a project without one', async () => {
    await renderDetail('ulbra-one');
    await screen.findAllByRole('heading', { level: 1 });

    const headings = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
    expect(headings).toEqual(['Overview', 'What it does']);
  });
```

Update the two existing heading-order assertions in the same file. `ulbra-atende`'s becomes:

```tsx
    expect(headings).toEqual([
      'Overview',
      'What I did',
      'The problem',
      'By the numbers',
      'Architecture',
      'The life of a ticket',
      'What it does',
      'Engineering decisions',
    ]);
```

and its pt-BR counterpart:

```tsx
    expect(headings).toEqual([
      'Visão geral',
      'O que eu fiz',
      'O problema',
      'Em números',
      'Arquitetura',
      'A vida de um chamado',
      'O que faz',
      'Decisões de engenharia',
    ]);
```

`dell-automated-caller`'s becomes:

```tsx
    expect(headings).toEqual([
      'Overview',
      'What I did',
      'The problem',
      'By the numbers',
      'Architecture',
      'A test script',
      'One test cycle',
      'What a step records',
      'What it does',
      'Engineering decisions',
    ]);
```

and its pt-BR counterpart gains `'O que eu fiz'` in second position, leaving the rest of that array as it is.

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd web && pnpm test src/routes/project-detail.test.tsx`
Expected: FAIL — `What I did` is absent from the heading list.

- [ ] **Step 3: Add the i18n key**

In `web/src/i18n/locales/en/projects.json`, after `"overviewHeading"`:

```json
  "contributionHeading": "What I did",
```

In `web/src/i18n/locales/pt-BR/projects.json`, in the same position:

```json
  "contributionHeading": "O que eu fiz",
```

- [ ] **Step 4: Render the sections**

In `web/src/components/projects/project-detail.tsx`, add the import:

```tsx
import { ProjectContribution } from '@/components/projects/project-contribution';
```

Insert immediately after the overview section and before the problem section:

```tsx
        {project.detail?.contribution ? (
          <section className="flex flex-col gap-3">
            <SubsectionHeading>{t('projects:contributionHeading')}</SubsectionHeading>
            <ProjectContribution contribution={project.detail.contribution} />
          </section>
        ) : null}
```

And insert immediately after the architecture section, before the script section:

```tsx
        {project.detail?.states?.caption && project.detail.states.steps.length > 0 ? (
          <section className="flex flex-col gap-3">
            <SubsectionHeading>{L(project.detail.states.caption)}</SubsectionHeading>
            <CaseStudyFlow flow={project.detail.states} />
          </section>
        ) : null}
```

- [ ] **Step 5: Run the full suite, lint and build**

Run: `cd web && pnpm test && pnpm lint && pnpm build`
Expected: PASS on all three.

- [ ] **Step 6: Commit**

```bash
git add web/src/components/projects/project-detail.tsx web/src/i18n/locales web/src/routes/project-detail.test.tsx
git commit -m "feat(projects): render the contribution and state-machine sections"
```

---

## Verification

From `web/`:

```bash
pnpm test && pnpm lint && pnpm build
```

Then look at the pages: `pnpm dev`, and check three things a test cannot:

1. On `/projects/kota-embed`, the flow rows read cleanly at desktop width — no label wrapping mid-phrase, no hyphenation — and the same layout survives a narrow window with the label simply stacking above its detail.
2. The contribution section reads as the answer to "what did you do here", and the boundary line reads as a qualification rather than an afterthought.
3. `/projects/ulbra-one` is unchanged.
