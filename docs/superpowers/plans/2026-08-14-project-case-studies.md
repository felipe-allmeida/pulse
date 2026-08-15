# Project Case-Study Sections Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn `/projects/$slug` from an overview-plus-bullets page into a case study — problem, headline numbers, architecture diagram, feature list, engineering decisions — and fill every section in for Ulbra Atende.

**Architecture:** All case-study content is optional data on `ProjectDetailContent` in `web/src/content/projects.ts`. Three new presentational components under `web/src/components/projects/` each render one section and return `null` when their field is absent, so `pulse` and `ulbra-one` keep rendering exactly as they do today until someone fills their fields in. No backend, no network, no state.

**Tech Stack:** React 19, TypeScript, TanStack Router, Tailwind 4, react-i18next, Vitest + Testing Library, lucide-react.

## Global Constraints

- **Rounded numbers only.** Production figures ship as orders of magnitude ("~2.4k", "200+", "~5.0"), never exact counts. Copy exact values from this plan verbatim.
- **No personal data.** No user names, e-mails, ticket titles, ticket bodies, or comment text anywhere — copy or screenshots.
- **Zela is out of scope.** The inspections/routines/shifts sub-product is not mentioned anywhere on the page.
- **Every string is localized `en` + `pt-BR`.** `LocalizedString` is `Record<'en' | 'pt-BR', string>`; both keys are required by the type, and both must be real translations, never the English string duplicated.
- **Confidentiality invariant holds.** `ulbra-atende` stays `visibility: 'private'` with `links: []`. No task adds an external link to it.
- **Exactly one `<h1>` per page.** New sections use `SubsectionHeading` (an `<h2>`), never a heading tag of their own.
- **No animation in case-study components.** Static markup only — no `useEffect`, no timers, no transitions on data.
- **Run commands from `web/`.** `pnpm test`, `pnpm lint`, `pnpm build` (there is no `typecheck` script — `pnpm build` runs `tsc -b` first).

## Deviations from the spec (deliberate, recorded here)

1. **Spec §4.1 suggests reusing `stat-card.tsx`.** It is not reusable: `StatCard` takes a numeric `value`, formats it through `Intl.NumberFormat`, and renders an optional recharts sparkline. Case-study metrics are pre-formatted localized strings with no series. Task 2 builds a separate component that *matches the visual treatment* (`Card` with `border-signal/20 bg-signal-muted/10`, mono value) without sharing the contract. No shared primitive is extracted — one visual similarity between two different contracts does not justify one.
2. **Spec §5 puts "in ~3 months of production" as a `note` on all four metric tiles.** Repeating the same qualifier four times is noise. It becomes a single `metricsNote` field rendered once under the section heading, and each tile's `note` carries a qualifier specific to that tile.
3. **Spec §5 describes MCP + OAuth as a branch off the API node in the diagram.** A branching static diagram costs layout complexity for a point that decision #4 already makes in prose. The diagram stays a linear five-node flow.
4. **Spec §4.3 floats extracting a shared `SignalList` primitive.** Highlights render a list of plain strings; decisions render heading + body pairs. Different shapes — Task 4 repeats the border/dot classes rather than extracting a premature abstraction.

6. **The architecture connector lives inside its `<li>`, not beside it.** An earlier draft returned a `Fragment` per node holding the chevron as a sibling of the `<li>`, which renders `<ol><li/><svg/><li/></ol>` — `<ol>` permits only `<li>` as a direct child. Ruled by the project owner on 2026-08-14: keep the semantic ordered list, move the connector inside the item. A test asserts every direct child of the `<ol>` is an `<li>`.

5. **React keys are array indices in the new components** (`CaseStudyMetrics`, `CaseStudyDecisions`), not the localized string. The repo's existing highlights list keys on `L(highlight)`; a duplicate label there drops a row silently instead of erroring. These lists are static curated content that never reorders, so the index is both safe and unambiguous. Ruled by the project owner on 2026-08-14; pre-existing code is left alone.


---

## File Structure

| File | Responsibility |
|---|---|
| `web/src/content/projects.ts` (modify) | Case-study types + all Ulbra Atende content |
| `web/src/content/content.test.ts` (modify) | Both-locale and non-empty invariants for the new content |
| `web/src/components/projects/case-study-metrics.tsx` (create) | The metrics grid |
| `web/src/components/projects/case-study-metrics.test.tsx` (create) | Its tests |
| `web/src/components/projects/case-study-architecture.tsx` (create) | Summary + static node diagram |
| `web/src/components/projects/case-study-architecture.test.tsx` (create) | Its tests |
| `web/src/components/projects/case-study-decisions.tsx` (create) | Heading + body decision blocks |
| `web/src/components/projects/case-study-decisions.test.tsx` (create) | Its tests |
| `web/src/components/projects/project-detail.tsx` (modify) | Section order and conditional rendering |
| `web/src/routes/project-detail.test.tsx` (modify) | Page-level assertions |
| `web/src/i18n/locales/en/projects.json` (modify) | New section headings (en) |
| `web/src/i18n/locales/pt-BR/projects.json` (modify) | New section headings (pt-BR) |
| `web/public/screenshots/ulbra-atende.png` (create, Task 6) | Dev-environment screenshot |

---

### Task 1: Case-study schema and Ulbra Atende content

Adds the types and every piece of Ulbra Atende copy. Nothing renders it yet — Tasks 2-5 do that. This task also updates the two existing assertions in `project-detail.test.tsx` that match highlight strings this task replaces, so the suite stays green.

**Files:**
- Modify: `web/src/content/projects.ts`
- Modify: `web/src/content/content.test.ts`
- Modify: `web/src/routes/project-detail.test.tsx:57` and `:71`

**Interfaces:**
- Consumes: `LocalizedString` from `web/src/content/types.ts`.
- Produces: exported types `CaseStudyMetric`, `CaseStudyArchitectureNode`, `CaseStudySection`; `ProjectDetailContent` gains optional `problem`, `metrics`, `metricsNote`, `architecture`, `decisions`. Tasks 2-5 import these types by name from `@/content/projects`.

- [ ] **Step 1: Write the failing test**

In `web/src/content/content.test.ts`, add this to the imports at the top of the file:

```ts
import { LOCALES } from './types';
import type { LocalizedString } from './types';
```

Then append to the end of the same file:

```ts
function expectBothLocales(value: LocalizedString, label: string) {
  for (const locale of LOCALES) {
    expect(value[locale], `${label} missing ${locale}`).toBeTruthy();
    expect(value[locale].trim(), `${label} empty in ${locale}`).not.toBe('');
  }
}

it('ulbra-atende has a full case study, localized in every locale', () => {
  const project = projects.find((p) => p.slug === 'ulbra-atende');
  expect(project).toBeDefined();
  const detail = project!.detail;
  expect(detail).toBeDefined();

  expectBothLocales(detail!.problem!, 'problem');
  expectBothLocales(detail!.metricsNote!, 'metricsNote');

  expect(detail!.metrics).toHaveLength(4);
  for (const metric of detail!.metrics!) {
    expectBothLocales(metric.value, 'metric.value');
    expectBothLocales(metric.label, 'metric.label');
    if (metric.note) expectBothLocales(metric.note, 'metric.note');
  }

  expectBothLocales(detail!.architecture!.summary, 'architecture.summary');
  expect(detail!.architecture!.nodes.length).toBeGreaterThanOrEqual(3);
  for (const node of detail!.architecture!.nodes) {
    expect(node.label.trim()).not.toBe('');
    expectBothLocales(node.detail, 'architecture.node.detail');
  }

  expect(detail!.decisions!.length).toBeGreaterThanOrEqual(3);
  for (const decision of detail!.decisions!) {
    expectBothLocales(decision.heading, 'decision.heading');
    expectBothLocales(decision.body, 'decision.body');
  }
});

it('no case-study section is present but empty on any project', () => {
  for (const project of projects) {
    const detail = project.detail;
    if (!detail) continue;
    if (detail.metrics) expect(detail.metrics.length, `${project.slug} metrics`).toBeGreaterThan(0);
    if (detail.decisions) expect(detail.decisions.length, `${project.slug} decisions`).toBeGreaterThan(0);
    if (detail.architecture) {
      expect(detail.architecture.nodes.length, `${project.slug} architecture nodes`).toBeGreaterThan(0);
    }
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd web && pnpm test src/content/content.test.ts`
Expected: FAIL — TypeScript/runtime error, `detail.problem` is undefined on `ulbra-atende`.

- [ ] **Step 3: Add the types**

In `web/src/content/projects.ts`, replace the existing `ProjectDetailContent` interface with:

```ts
/** One headline number on a case-study page. Pre-rounded and pre-formatted. */
export interface CaseStudyMetric {
  /** Display value, already formatted per locale — "~2.4k" / "~2,4 mil". */
  value: LocalizedString;
  /** What the number counts. */
  label: LocalizedString;
  /** Optional qualifier specific to this tile. */
  note?: LocalizedString;
}

/** One node in a project's architecture diagram. */
export interface CaseStudyArchitectureNode {
  /** Short technical label — a product name, so not localized. */
  label: string;
  detail: LocalizedString;
}

/** A titled prose block — used for "why X and not Y" decisions. */
export interface CaseStudySection {
  heading: LocalizedString;
  body: LocalizedString;
}

export interface ProjectDetailContent {
  /** A longer, dedicated-page overview — 1-3 sentences. */
  overview?: LocalizedString;
  /** What the system does, as 2-8 bullet points. */
  highlights?: LocalizedString[];
  /** The situation before the project existed. 2-4 sentences. */
  problem?: LocalizedString;
  /** 3-4 headline numbers. Rounded — never exact production counts. */
  metrics?: CaseStudyMetric[];
  /** One qualifier rendered under the metrics heading, covering the whole grid. */
  metricsNote?: LocalizedString;
  architecture?: {
    summary: LocalizedString;
    nodes: CaseStudyArchitectureNode[];
  };
  /** 3-5 engineering decisions with their rationale. */
  decisions?: CaseStudySection[];
}
```

- [ ] **Step 4: Replace the Ulbra Atende entry**

In `web/src/content/projects.ts`, replace the whole `slug: 'ulbra-atende'` object (currently lines 73-111) with:

```ts
  {
    slug: 'ulbra-atende',
    name: 'Ulbra Atende',
    tagline: {
      en: 'IT service desk for a university, replacing GLPI.',
      'pt-BR': 'Service desk de TI de uma universidade, no lugar do GLPI.',
    },
    description: {
      en: "The IT service desk for a university, replacing GLPI as the single intake channel: SLA per team, approval flows, multi-stage templates, and an MCP server that lets staff work tickets from Claude or ChatGPT under their own permissions.",
      'pt-BR':
        'O service desk de TI de uma universidade, substituindo o GLPI como canal único de entrada: SLA por time, fluxos de aprovação, templates multi-etapa e um servidor MCP que deixa a equipe trabalhar chamados pelo Claude ou ChatGPT com as próprias permissões.',
    },
    tech: [
      '.NET 10',
      'PostgreSQL 17',
      'RabbitMQ',
      'React 19',
      'OpenIddict',
      'MCP',
      'OpenTelemetry',
      'Docker Swarm',
    ],
    role: { en: 'Design & implementation', 'pt-BR': 'Design & implementação' },
    period: { en: 'Professional work', 'pt-BR': 'Trabalho profissional' },
    visibility: 'private',
    links: [],
    detail: {
      overview: {
        en: "The IT service desk for ULBRA — a .NET 10 modular monolith that replaced GLPI as the single intake channel for the university's IT department, carrying a request from ticket to SLA to satisfaction survey.",
        'pt-BR':
          'O service desk de TI da ULBRA — um monólito modular em .NET 10 que substituiu o GLPI como canal único de entrada da TI da universidade, levando um pedido do chamado ao SLA à pesquisa de satisfação.',
      },
      problem: {
        en: "ULBRA's IT department took requests through GLPI, e-mail, and direct messages at the same time. There was no SLA per team, no audit trail on approvals, and no way to tell whether anyone was satisfied with the outcome. Ulbra Atende replaces GLPI as the single intake channel and makes each of those measurable — three months in, the median ticket closes in about an hour and a half.",
        'pt-BR':
          'A TI da ULBRA recebia demanda por GLPI, e-mail e mensagem direta ao mesmo tempo. Não havia SLA por time, nem rastro de aprovação, nem como saber se alguém ficou satisfeito com o resultado. O Ulbra Atende substitui o GLPI como canal único de entrada e torna cada uma dessas coisas mensurável — três meses depois, a mediana de fechamento é de cerca de uma hora e meia.',
      },
      metricsNote: {
        en: 'in ~3 months of production',
        'pt-BR': 'em ~3 meses de produção',
      },
      metrics: [
        {
          value: { en: '~2.4k', 'pt-BR': '~2,4 mil' },
          label: { en: 'tickets handled', 'pt-BR': 'chamados atendidos' },
          note: { en: '85% closed', 'pt-BR': '85% concluídos' },
        },
        {
          value: { en: '200+', 'pt-BR': '200+' },
          label: { en: 'users', 'pt-BR': 'usuários' },
          note: { en: 'across ~30 teams', 'pt-BR': 'em ~30 times' },
        },
        {
          value: { en: '~6 min', 'pt-BR': '~6 min' },
          label: { en: 'median first response', 'pt-BR': 'mediana da 1ª resposta' },
          note: { en: 'SLA tracked per team', 'pt-BR': 'SLA medido por time' },
        },
        {
          value: { en: '~5.0', 'pt-BR': '~5,0' },
          label: { en: 'satisfaction score', 'pt-BR': 'nota de satisfação' },
          note: { en: '400+ responses, 1-5 scale', 'pt-BR': '400+ respostas, escala 1-5' },
        },
      ],
      architecture: {
        summary: {
          en: 'A .NET 10 modular monolith: one deployable, separate bounded contexts — Core, Identity, Notifications and MCP — each layered Domain → Application → Infrastructure with its own Postgres schema. Integration events travel over RabbitMQ through an EF transactional outbox. Attachments live in S3/MinIO, caching in Redis, tracing via OpenTelemetry; integration tests run against real Postgres, RabbitMQ and MinIO through Testcontainers.',
          'pt-BR':
            'Um monólito modular em .NET 10: um único deploy, contextos delimitados separados — Core, Identity, Notifications e MCP — cada um em camadas Domain → Application → Infrastructure com seu próprio schema no Postgres. Eventos de integração passam pelo RabbitMQ através de um outbox transacional do EF. Anexos ficam em S3/MinIO, cache em Redis, tracing por OpenTelemetry; os testes de integração rodam contra Postgres, RabbitMQ e MinIO reais via Testcontainers.',
        },
        nodes: [
          {
            label: 'React 19 SPA',
            detail: {
              en: 'TanStack Router and Query over a Tailwind design system.',
              'pt-BR': 'TanStack Router e Query sobre um design system em Tailwind.',
            },
          },
          {
            label: '.NET 10 API',
            detail: {
              en: 'Modular monolith — four bounded contexts in one deployable.',
              'pt-BR': 'Monólito modular — quatro contextos delimitados num único deploy.',
            },
          },
          {
            label: 'PostgreSQL 17',
            detail: {
              en: 'One schema per module; EF Core migrations applied on startup.',
              'pt-BR': 'Um schema por módulo; migrations do EF Core aplicadas no startup.',
            },
          },
          {
            label: 'RabbitMQ',
            detail: {
              en: 'Integration events published through an EF transactional outbox.',
              'pt-BR': 'Eventos de integração publicados por um outbox transacional do EF.',
            },
          },
          {
            label: 'Slack · Google Chat · e-mail',
            detail: {
              en: 'Notification fan-out consuming those events.',
              'pt-BR': 'Fan-out de notificação consumindo esses eventos.',
            },
          },
        ],
      },
      highlights: [
        {
          en: 'SLA per team, with pauses that record who paused the clock and why.',
          'pt-BR': 'SLA por time, com pausas que registram quem parou o relógio e por quê.',
        },
        {
          en: 'Multi-stage ticket templates, so a recurring request arrives already broken into steps.',
          'pt-BR':
            'Templates de chamado multi-etapa, então um pedido recorrente já chega dividido em passos.',
        },
        {
          en: 'Approval flow — work that needs a sign-off cannot start without one.',
          'pt-BR': 'Fluxo de aprovação — trabalho que exige aval não começa sem ele.',
        },
        {
          en: 'Parent/child tickets and explicit dependencies between them.',
          'pt-BR': 'Chamados pai/filho e dependências explícitas entre eles.',
        },
        {
          en: 'Notifications fan out to Slack, Google Chat and e-mail, per user preference.',
          'pt-BR':
            'Notificações se espalham por Slack, Google Chat e e-mail, conforme a preferência de cada usuário.',
        },
        {
          en: 'A dashboard whose cards drill down into the exact listing they summarize.',
          'pt-BR': 'Um dashboard cujos cards abrem exatamente a listagem que resumem.',
        },
        {
          en: 'A satisfaction survey on every closed ticket.',
          'pt-BR': 'Pesquisa de satisfação em todo chamado concluído.',
        },
      ],
      decisions: [
        {
          heading: {
            en: 'A modular monolith, not microservices',
            'pt-BR': 'Monólito modular, não microsserviços',
          },
          body: {
            en: 'One team, one deploy. The boundary that matters is the module — enforced by project references and a schema per context — not the network. Distributing it would have bought deployment independence nobody needed and paid for it in latency, partial failures, and debugging.',
            'pt-BR':
              'Um time, um deploy. A fronteira que importa é o módulo — garantida por referências de projeto e um schema por contexto — não a rede. Distribuir teria comprado uma independência de deploy que ninguém precisava, pagando em latência, falha parcial e dificuldade de depurar.',
          },
        },
        {
          heading: {
            en: 'A transactional outbox for every integration event',
            'pt-BR': 'Outbox transacional para todo evento de integração',
          },
          body: {
            en: 'The event row is written in the same transaction as the business change. A notification can never fire for a ticket that failed to commit, and never disappears because the broker happened to be down at that moment — the relay delivers it once the transaction lands.',
            'pt-BR':
              'A linha do evento é escrita na mesma transação da mudança de negócio. Uma notificação nunca dispara para um chamado que não commitou, e nunca some porque o broker estava fora naquele instante — o relay entrega assim que a transação fecha.',
          },
        },
        {
          heading: {
            en: 'Strongly-typed IDs from a source generator',
            'pt-BR': 'IDs fortemente tipados por source generator',
          },
          body: {
            en: 'Every entity has its own ID struct, rendered as `ti_…`, `tm_…`, `us_…`. Passing a team ID where a ticket ID belongs stops compiling. A whole class of bug moves from runtime to build time, and IDs say what they are in logs and URLs.',
            'pt-BR':
              'Cada entidade tem seu próprio struct de ID, escrito como `ti_…`, `tm_…`, `us_…`. Passar um ID de time onde se espera um de chamado para de compilar. Uma classe inteira de bug sai do runtime e vai para o build, e o ID diz o que é em log e em URL.',
          },
        },
        {
          heading: {
            en: 'Its own OAuth server, and an MCP server behind it',
            'pt-BR': 'Servidor OAuth próprio, e um servidor MCP atrás dele',
          },
          body: {
            en: 'OpenIddict issues the tokens; the MCP server exposes ticket read/write and lookup tools. Someone connects Claude or ChatGPT to their own account through a consent screen and works tickets in natural language — under exactly the permissions they already have in the UI, with the same scope check on every tool call.',
            'pt-BR':
              'O OpenIddict emite os tokens; o servidor MCP expõe ferramentas de leitura, escrita e consulta de chamados. A pessoa conecta o Claude ou o ChatGPT à própria conta por uma tela de consentimento e trabalha os chamados em linguagem natural — com exatamente as permissões que já tem na interface, e a mesma checagem de escopo em cada chamada de ferramenta.',
          },
        },
      ],
    },
  },
```

- [ ] **Step 5: Update the two stale assertions in the page test**

The old highlight strings this task deleted are asserted in `web/src/routes/project-detail.test.tsx`. Replace line 57:

```ts
    expect(screen.getByText(/role-based routing across support teams/i)).toBeInTheDocument();
```

with:

```ts
    expect(screen.getByText(/pauses that record who paused the clock/i)).toBeInTheDocument();
```

and line 71:

```ts
    expect(screen.getByText(/roteamento baseado em papéis entre times de suporte/i)).toBeInTheDocument();
```

with:

```ts
    expect(screen.getByText(/pausas que registram quem parou o relógio/i)).toBeInTheDocument();
```

- [ ] **Step 6: Run the tests and build**

Run: `cd web && pnpm test && pnpm build`
Expected: PASS — all suites green.

- [ ] **Step 7: Commit**

```bash
git add web/src/content/projects.ts web/src/content/content.test.ts web/src/routes/project-detail.test.tsx
git commit -m "feat(projects): case-study content schema and Ulbra Atende copy"
```

---

### Task 2: `CaseStudyMetrics`

**Files:**
- Create: `web/src/components/projects/case-study-metrics.tsx`
- Create: `web/src/components/projects/case-study-metrics.test.tsx`

**Interfaces:**
- Consumes: `CaseStudyMetric` from `@/content/projects`; `LocalizedString` from `@/content/types`; `useLocalized` from `@/i18n/use-localized`; `Card`, `CardContent` from `@/components/ui/card`.
- Produces: `export function CaseStudyMetrics(props: { metrics: CaseStudyMetric[]; note?: LocalizedString }): ReactElement | null` — Task 5 renders it.

- [ ] **Step 1: Write the failing test**

Create `web/src/components/projects/case-study-metrics.test.tsx`:

```tsx
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CaseStudyMetrics } from '@/components/projects/case-study-metrics';
import type { CaseStudyMetric } from '@/content/projects';
import { renderWithI18n } from '@/test/render-with-i18n';

const metrics: CaseStudyMetric[] = [
  {
    value: { en: '~2.4k', 'pt-BR': '~2,4 mil' },
    label: { en: 'tickets handled', 'pt-BR': 'chamados atendidos' },
    note: { en: '85% closed', 'pt-BR': '85% concluídos' },
  },
  {
    value: { en: '200+', 'pt-BR': '200+' },
    label: { en: 'users', 'pt-BR': 'usuários' },
  },
];

const note = { en: 'in ~3 months of production', 'pt-BR': 'em ~3 meses de produção' };

describe('CaseStudyMetrics', () => {
  it('renders every metric in English, with the shared note once', async () => {
    await renderWithI18n(<CaseStudyMetrics metrics={metrics} note={note} />);

    expect(screen.getByText('~2.4k')).toBeInTheDocument();
    expect(screen.getByText('tickets handled')).toBeInTheDocument();
    expect(screen.getByText('85% closed')).toBeInTheDocument();
    expect(screen.getByText('200+')).toBeInTheDocument();
    expect(screen.getByText('users')).toBeInTheDocument();
    expect(screen.getAllByText('in ~3 months of production')).toHaveLength(1);
  });

  it('renders in pt-BR', async () => {
    await renderWithI18n(<CaseStudyMetrics metrics={metrics} note={note} />, { locale: 'pt-BR' });

    expect(screen.getByText('~2,4 mil')).toBeInTheDocument();
    expect(screen.getByText('chamados atendidos')).toBeInTheDocument();
    expect(screen.getByText('em ~3 meses de produção')).toBeInTheDocument();
  });

  it('renders nothing for an empty list', async () => {
    const { container } = await renderWithI18n(<CaseStudyMetrics metrics={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('omits the note element entirely when no note is given', async () => {
    await renderWithI18n(<CaseStudyMetrics metrics={metrics} />);
    expect(screen.queryByText(/months of production/i)).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd web && pnpm test src/components/projects/case-study-metrics.test.tsx`
Expected: FAIL — cannot resolve `@/components/projects/case-study-metrics`.

- [ ] **Step 3: Write the component**

Create `web/src/components/projects/case-study-metrics.tsx`:

```tsx
import { Card, CardContent } from '@/components/ui/card';
import type { CaseStudyMetric } from '@/content/projects';
import type { LocalizedString } from '@/content/types';
import { useLocalized } from '@/i18n/use-localized';

export interface CaseStudyMetricsProps {
  metrics: CaseStudyMetric[];
  /** One qualifier covering the whole grid — rendered once, above it. */
  note?: LocalizedString;
}

/**
 * The headline-numbers grid on a project case study. Values are already
 * rounded and formatted per locale in content, so nothing here formats
 * numbers — a case study's figures are curated copy, not a live feed.
 * Renders nothing when there are no metrics.
 */
export function CaseStudyMetrics({ metrics, note }: CaseStudyMetricsProps) {
  const L = useLocalized();
  if (metrics.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      {note ? <p className="font-mono text-xs text-muted-foreground">{L(note)}</p> : null}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {metrics.map((metric, index) => (
          <Card key={index} className="gap-0 border-signal/20 bg-signal-muted/10 py-4">
            <CardContent className="flex flex-col gap-1 px-4">
              <span className="font-mono text-2xl font-bold tabular-nums text-signal-strong">
                {L(metric.value)}
              </span>
              <span className="text-sm text-foreground/80">{L(metric.label)}</span>
              {metric.note ? (
                <span className="font-mono text-xs text-muted-foreground">{L(metric.note)}</span>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd web && pnpm test src/components/projects/case-study-metrics.test.tsx`
Expected: PASS — 4 tests.

- [ ] **Step 5: Commit**

```bash
git add web/src/components/projects/case-study-metrics.tsx web/src/components/projects/case-study-metrics.test.tsx
git commit -m "feat(projects): case-study metrics grid"
```

---

### Task 3: `CaseStudyArchitecture`

**Files:**
- Create: `web/src/components/projects/case-study-architecture.tsx`
- Create: `web/src/components/projects/case-study-architecture.test.tsx`

**Interfaces:**
- Consumes: `CaseStudyArchitectureNode` from `@/content/projects`; `LocalizedString` from `@/content/types`; `useLocalized`.
- Produces: `export function CaseStudyArchitecture(props: { summary: LocalizedString; nodes: CaseStudyArchitectureNode[] }): ReactElement | null` — Task 5 renders it.

- [ ] **Step 1: Write the failing test**

Create `web/src/components/projects/case-study-architecture.test.tsx`:

```tsx
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CaseStudyArchitecture } from '@/components/projects/case-study-architecture';
import type { CaseStudyArchitectureNode } from '@/content/projects';
import { renderWithI18n } from '@/test/render-with-i18n';

const summary = {
  en: 'A .NET 10 modular monolith.',
  'pt-BR': 'Um monólito modular em .NET 10.',
};

const nodes: CaseStudyArchitectureNode[] = [
  {
    label: 'React 19 SPA',
    detail: { en: 'TanStack Router and Query.', 'pt-BR': 'TanStack Router e Query.' },
  },
  {
    label: 'PostgreSQL 17',
    detail: { en: 'One schema per module.', 'pt-BR': 'Um schema por módulo.' },
  },
];

describe('CaseStudyArchitecture', () => {
  it('renders the summary and every node in English', async () => {
    await renderWithI18n(<CaseStudyArchitecture summary={summary} nodes={nodes} />);

    expect(screen.getByText('A .NET 10 modular monolith.')).toBeInTheDocument();
    expect(screen.getByText('React 19 SPA')).toBeInTheDocument();
    expect(screen.getByText('TanStack Router and Query.')).toBeInTheDocument();
    expect(screen.getByText('PostgreSQL 17')).toBeInTheDocument();
    expect(screen.getByText('One schema per module.')).toBeInTheDocument();
  });

  it('renders in pt-BR', async () => {
    await renderWithI18n(<CaseStudyArchitecture summary={summary} nodes={nodes} />, {
      locale: 'pt-BR',
    });

    expect(screen.getByText('Um monólito modular em .NET 10.')).toBeInTheDocument();
    expect(screen.getByText('Um schema por módulo.')).toBeInTheDocument();
  });

  it('renders nothing when there are no nodes', async () => {
    const { container } = await renderWithI18n(
      <CaseStudyArchitecture summary={summary} nodes={[]} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('adds no heading of its own, so the page keeps one h1', async () => {
    await renderWithI18n(<CaseStudyArchitecture summary={summary} nodes={nodes} />);
    expect(screen.queryAllByRole('heading')).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd web && pnpm test src/components/projects/case-study-architecture.test.tsx`
Expected: FAIL — cannot resolve `@/components/projects/case-study-architecture`.

- [ ] **Step 3: Write the component**

Create `web/src/components/projects/case-study-architecture.tsx`:

```tsx
import { ChevronRight } from 'lucide-react';
import type { CaseStudyArchitectureNode } from '@/content/projects';
import type { LocalizedString } from '@/content/types';
import { useLocalized } from '@/i18n/use-localized';

export interface CaseStudyArchitectureProps {
  summary: LocalizedString;
  nodes: CaseStudyArchitectureNode[];
}

/**
 * A project's architecture: a summary paragraph over a static left-to-right
 * node flow (stacked on mobile). Deliberately static — the home page's
 * diagram animates because that page *is* a live system; here an animated
 * edge would be decoration pretending to be data.
 */
export function CaseStudyArchitecture({ summary, nodes }: CaseStudyArchitectureProps) {
  const L = useLocalized();
  if (nodes.length === 0) return null;

  return (
    <div className="flex flex-col gap-5">
      <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">{L(summary)}</p>
      <ol className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
        {nodes.map((node, index) => (
          <li key={node.label} className="flex flex-1 items-center gap-2">
            {index > 0 ? (
              <ChevronRight
                aria-hidden
                className="size-4 shrink-0 rotate-90 self-center text-signal/40 sm:rotate-0"
              />
            ) : null}
            <span className="flex flex-1 flex-col gap-1 rounded-lg border border-signal/25 bg-signal-muted/10 p-3">
              <span className="font-mono text-xs font-medium text-signal-strong">{node.label}</span>
              <span className="text-xs leading-relaxed text-muted-foreground">{L(node.detail)}</span>
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd web && pnpm test src/components/projects/case-study-architecture.test.tsx`
Expected: PASS — 4 tests.

- [ ] **Step 5: Commit**

```bash
git add web/src/components/projects/case-study-architecture.tsx web/src/components/projects/case-study-architecture.test.tsx
git commit -m "feat(projects): static case-study architecture diagram"
```

---

### Task 4: `CaseStudyDecisions`

**Files:**
- Create: `web/src/components/projects/case-study-decisions.tsx`
- Create: `web/src/components/projects/case-study-decisions.test.tsx`

**Interfaces:**
- Consumes: `CaseStudySection` from `@/content/projects`; `useLocalized`.
- Produces: `export function CaseStudyDecisions(props: { decisions: CaseStudySection[] }): ReactElement | null` — Task 5 renders it.

- [ ] **Step 1: Write the failing test**

Create `web/src/components/projects/case-study-decisions.test.tsx`:

```tsx
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CaseStudyDecisions } from '@/components/projects/case-study-decisions';
import type { CaseStudySection } from '@/content/projects';
import { renderWithI18n } from '@/test/render-with-i18n';

const decisions: CaseStudySection[] = [
  {
    heading: { en: 'A modular monolith', 'pt-BR': 'Monólito modular' },
    body: { en: 'One team, one deploy.', 'pt-BR': 'Um time, um deploy.' },
  },
  {
    heading: { en: 'Transactional outbox', 'pt-BR': 'Outbox transacional' },
    body: { en: 'The event commits with the write.', 'pt-BR': 'O evento commita com a escrita.' },
  },
];

describe('CaseStudyDecisions', () => {
  it('renders every heading and body in English', async () => {
    await renderWithI18n(<CaseStudyDecisions decisions={decisions} />);

    expect(screen.getByText('A modular monolith')).toBeInTheDocument();
    expect(screen.getByText('One team, one deploy.')).toBeInTheDocument();
    expect(screen.getByText('Transactional outbox')).toBeInTheDocument();
    expect(screen.getByText('The event commits with the write.')).toBeInTheDocument();
  });

  it('renders in pt-BR', async () => {
    await renderWithI18n(<CaseStudyDecisions decisions={decisions} />, { locale: 'pt-BR' });

    expect(screen.getByText('Monólito modular')).toBeInTheDocument();
    expect(screen.getByText('O evento commita com a escrita.')).toBeInTheDocument();
  });

  it('renders nothing for an empty list', async () => {
    const { container } = await renderWithI18n(<CaseStudyDecisions decisions={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders decision headings as h3, below the page h2 sections', async () => {
    await renderWithI18n(<CaseStudyDecisions decisions={decisions} />);
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd web && pnpm test src/components/projects/case-study-decisions.test.tsx`
Expected: FAIL — cannot resolve `@/components/projects/case-study-decisions`.

- [ ] **Step 3: Write the component**

Create `web/src/components/projects/case-study-decisions.tsx`:

```tsx
import type { CaseStudySection } from '@/content/projects';
import { useLocalized } from '@/i18n/use-localized';

export interface CaseStudyDecisionsProps {
  decisions: CaseStudySection[];
}

/**
 * The "why X and not Y" blocks of a case study, sharing the left-rail-and-dot
 * treatment the highlights list uses. Each decision's heading is an `<h3>` so
 * it nests under the section's `<h2>` (`SubsectionHeading`) and the page keeps
 * a single `<h1>`.
 */
export function CaseStudyDecisions({ decisions }: CaseStudyDecisionsProps) {
  const L = useLocalized();
  if (decisions.length === 0) return null;

  return (
    <ul className="flex flex-col gap-6 border-l border-signal/25 pl-6">
      {decisions.map((decision, index) => (
        <li key={index} className="relative flex flex-col gap-1.5">
          <span aria-hidden className="absolute top-2 -left-[1.8125rem] size-2 rounded-full bg-signal" />
          <h3 className="text-sm font-semibold text-foreground">{L(decision.heading)}</h3>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{L(decision.body)}</p>
        </li>
      ))}
    </ul>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd web && pnpm test src/components/projects/case-study-decisions.test.tsx`
Expected: PASS — 4 tests.

- [ ] **Step 5: Commit**

```bash
git add web/src/components/projects/case-study-decisions.tsx web/src/components/projects/case-study-decisions.test.tsx
git commit -m "feat(projects): case-study engineering-decision blocks"
```

---

### Task 5: Wire the sections into `ProjectDetail`

Renders the new sections in the spec's order and adds the section headings to both locale files. `highlightsHeading` changes from "Highlights"/"Destaques" to "What it does"/"O que faz", because the list now sits between the architecture and the decisions and answers that question.

**Files:**
- Modify: `web/src/components/projects/project-detail.tsx`
- Modify: `web/src/i18n/locales/en/projects.json`
- Modify: `web/src/i18n/locales/pt-BR/projects.json`
- Modify: `web/src/routes/project-detail.test.tsx`

**Interfaces:**
- Consumes: `CaseStudyMetrics` (Task 2), `CaseStudyArchitecture` (Task 3), `CaseStudyDecisions` (Task 4).
- Produces: the finished page. Nothing downstream depends on it.

- [ ] **Step 1: Write the failing test**

Append inside the `describe('ProjectDetail', …)` block in `web/src/routes/project-detail.test.tsx`:

```tsx
  it('renders the full case study for ulbra-atende, in section order', async () => {
    await renderDetail('ulbra-atende');

    expect(screen.getByText(/took requests through GLPI/i)).toBeInTheDocument();
    expect(screen.getByText('~2.4k')).toBeInTheDocument();
    expect(screen.getByText('in ~3 months of production')).toBeInTheDocument();
    expect(screen.getByText(/\.NET 10 modular monolith/i)).toBeInTheDocument();
    expect(screen.getByText('RabbitMQ')).toBeInTheDocument();
    expect(screen.getByText(/its own OAuth server/i)).toBeInTheDocument();

    const headings = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
    expect(headings).toEqual([
      'Overview',
      'The problem',
      'By the numbers',
      'Architecture',
      'What it does',
      'Engineering decisions',
    ]);
  });

  it('renders the case study in pt-BR', async () => {
    await renderDetail('ulbra-atende', 'pt-BR');

    expect(screen.getByText(/recebia demanda por GLPI/i)).toBeInTheDocument();
    expect(screen.getByText('~2,4 mil')).toBeInTheDocument();
    expect(screen.getByText('em ~3 meses de produção')).toBeInTheDocument();

    const headings = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
    expect(headings).toEqual([
      'Visão geral',
      'O problema',
      'Em números',
      'Arquitetura',
      'O que faz',
      'Decisões de engenharia',
    ]);
  });

  it('omits every case-study section for a project that has none', async () => {
    await renderDetail('ulbra-one');

    const headings = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
    expect(headings).toEqual(['Overview', 'What it does']);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd web && pnpm test src/routes/project-detail.test.tsx`
Expected: FAIL — the problem text is not in the document; heading list is `['Overview', 'Highlights']`.

- [ ] **Step 3: Add the locale keys**

In `web/src/i18n/locales/en/projects.json`, change `"highlightsHeading"` and add four keys, so the file reads:

```json
{
  "pageTitle": "Projects",
  "pageEyebrow": "/projects",
  "screenshotAlt": "{{name}} screenshot",
  "privateLabel": "Private",
  "viewDetails": "View {{name}} details",
  "backToProjects": "All projects",
  "overviewHeading": "Overview",
  "problemHeading": "The problem",
  "metricsHeading": "By the numbers",
  "architectureHeading": "Architecture",
  "highlightsHeading": "What it does",
  "decisionsHeading": "Engineering decisions",
  "notFoundHeading": "Project not found",
  "notFoundBody": "We couldn't find a project at that address."
}
```

In `web/src/i18n/locales/pt-BR/projects.json`:

```json
{
  "pageTitle": "Projetos",
  "pageEyebrow": "/projects",
  "screenshotAlt": "Captura de tela de {{name}}",
  "privateLabel": "Privado",
  "viewDetails": "Ver detalhes de {{name}}",
  "backToProjects": "Todos os projetos",
  "overviewHeading": "Visão geral",
  "problemHeading": "O problema",
  "metricsHeading": "Em números",
  "architectureHeading": "Arquitetura",
  "highlightsHeading": "O que faz",
  "decisionsHeading": "Decisões de engenharia",
  "notFoundHeading": "Projeto não encontrado",
  "notFoundBody": "Não encontramos um projeto nesse endereço."
}
```

- [ ] **Step 4: Render the sections**

In `web/src/components/projects/project-detail.tsx`, add these imports next to the existing `@/components/projects/*` imports:

```tsx
import { CaseStudyArchitecture } from '@/components/projects/case-study-architecture';
import { CaseStudyDecisions } from '@/components/projects/case-study-decisions';
import { CaseStudyMetrics } from '@/components/projects/case-study-metrics';
```

Then replace the whole block from the `{project.detail?.overview ? (` opening through the closing `) : null}` of the highlights section (currently lines 105-124) with:

```tsx
        {project.detail?.overview ? (
          <section className="flex flex-col gap-3">
            <SubsectionHeading>{t('projects:overviewHeading')}</SubsectionHeading>
            <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">{L(project.detail.overview)}</p>
          </section>
        ) : null}

        {project.detail?.problem ? (
          <section className="flex flex-col gap-3">
            <SubsectionHeading>{t('projects:problemHeading')}</SubsectionHeading>
            <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">{L(project.detail.problem)}</p>
          </section>
        ) : null}

        {project.detail?.metrics && project.detail.metrics.length > 0 ? (
          <section className="flex flex-col gap-3">
            <SubsectionHeading>{t('projects:metricsHeading')}</SubsectionHeading>
            <CaseStudyMetrics metrics={project.detail.metrics} note={project.detail.metricsNote} />
          </section>
        ) : null}

        {project.detail?.architecture && project.detail.architecture.nodes.length > 0 ? (
          <section className="flex flex-col gap-3">
            <SubsectionHeading>{t('projects:architectureHeading')}</SubsectionHeading>
            <CaseStudyArchitecture
              summary={project.detail.architecture.summary}
              nodes={project.detail.architecture.nodes}
            />
          </section>
        ) : null}

        {project.detail?.highlights && project.detail.highlights.length > 0 ? (
          <section className="flex flex-col gap-3">
            <SubsectionHeading>{t('projects:highlightsHeading')}</SubsectionHeading>
            <ul className="flex flex-col gap-3 border-l border-signal/25 pl-6">
              {project.detail.highlights.map((highlight) => (
                <li key={L(highlight)} className="relative text-sm text-muted-foreground">
                  <span aria-hidden className="absolute top-1.5 -left-[1.8125rem] size-2 rounded-full bg-signal" />
                  {L(highlight)}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {project.detail?.decisions && project.detail.decisions.length > 0 ? (
          <section className="flex flex-col gap-3">
            <SubsectionHeading>{t('projects:decisionsHeading')}</SubsectionHeading>
            <CaseStudyDecisions decisions={project.detail.decisions} />
          </section>
        ) : null}
```

- [ ] **Step 5: Run the full suite, lint and build**

Run: `cd web && pnpm test && pnpm lint && pnpm build`
Expected: PASS on all four.

- [ ] **Step 6: Commit**

```bash
git add web/src/components/projects/project-detail.tsx web/src/i18n/locales/en/projects.json web/src/i18n/locales/pt-BR/projects.json web/src/routes/project-detail.test.tsx
git commit -m "feat(projects): render case-study sections on the detail page"
```

---

### Task 6: Dev-environment screenshot

Optional and last — every other section stands on its own, and `ProjectScreenshot` already handles an absent `src`. Skip this task and the page still ships.

This task needs the repo owner: the app sits behind Google OAuth on an internal network, so capture runs through their authenticated Chrome session via the `claude-in-chrome` connector. **Ask before navigating**, and confirm they are on the VPN with a session open against the client's internal dev environment.

**Files:**
- Create: `web/public/screenshots/ulbra-atende.png`
- Modify: `web/src/content/projects.ts` (add `screenshot` to the `ulbra-atende` entry)

**Interfaces:**
- Consumes: `Project.screenshot?: string`, already declared and already handled by `ProjectScreenshot`.
- Produces: nothing new.

- [ ] **Step 1: Confirm the target with the owner**

Ask which screen to capture — the ticket dashboard is the default — and confirm the browser is pointed at **dev**, never production.

- [ ] **Step 2: Capture at desktop width**

Resize the viewport to 1280×800 and capture the dashboard. Do not capture any screen showing a ticket body or a comment thread.

- [ ] **Step 3: Review the image for personal data before it touches the repo**

Open the PNG and read it. Names, e-mail addresses, ticket titles and comment text must all be absent. Dev accounts belong to the development team, but that is not a reason to skip the check. If anything identifying is visible, either recapture a different screen or stop and hand the decision back to the owner — do not commit a partially-redacted image.

- [ ] **Step 4: Save it and wire it up**

Save to `web/public/screenshots/ulbra-atende.png`, then add to the `ulbra-atende` entry in `web/src/content/projects.ts`, next to `visibility`:

```ts
    screenshot: '/screenshots/ulbra-atende.png',
```

- [ ] **Step 5: Verify it renders**

Run: `cd web && pnpm test && pnpm build`
Expected: PASS. Note that `project-detail.test.tsx` asserts no `<img>` renders **for `pulse`**, which has no screenshot — that test stays green.

- [ ] **Step 6: Commit**

```bash
git add web/public/screenshots/ulbra-atende.png web/src/content/projects.ts
git commit -m "feat(projects): dev-environment screenshot for Ulbra Atende"
```

---

## Verification

After Task 5 (or Task 6 if taken), from `web/`:

```bash
pnpm test && pnpm lint && pnpm build
```

Then look at the page: `pnpm dev`, open `/projects/ulbra-atende`, toggle the language, and check `/projects/pulse` and `/projects/ulbra-one` still render exactly as before.
