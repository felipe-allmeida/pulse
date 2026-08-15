# Kota Embed Case Study Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Kota Embed as a fourth project on `/projects`, filling the case-study fields built for Ulbra Atende — proving the schema is reusable without changing it.

**Architecture:** Content only. `ProjectDetailContent` already carries every field this needs, and `ProjectDetail` already renders each section conditionally. One new entry in `web/src/content/projects.ts`, plus one small fix to the metrics grid so a three-metric case study does not leave a hole in a four-column row.

**Tech Stack:** React 19, TypeScript, Tailwind 4, react-i18next, Vitest + Testing Library.

## Global Constraints

- **The product is named; its insurance partners are not.** "Kota" and "Embed" appear. The nine insurers are described by count and behavior, never by name.
- **Numbers are structural, not operational.** 9 insurer integrations, 3 regulatory regions, 7 intent workflow types — nothing sourced from the former employer's production systems.
- **Nothing internal reaches any file.** This repository is public. No issue identifiers, no repository paths, no commit counts, no insurer names, no internal hostnames — not in code, not in copy, not in commit messages.
- **Authorship is stated, not implied.** The `role` field says the contribution was backend, on the platform team, with the front end by others. Do not soften or drop it.
- **Every string is localized `en` + `pt-BR`**, both real translations, never the English duplicated.
- **`visibility: 'private'`, `links: []`.** No external links.
- **Exactly one `<h1>` per page.**
- **Run commands from `web/`.** `pnpm test`, `pnpm lint`, `pnpm build` (there is no `typecheck` script — `pnpm build` runs `tsc -b` first).

## Deviation from the spec (deliberate, recorded here)

Spec §6 puts "any change to the case-study components" out of scope. Task 1 makes one anyway: `CaseStudyMetrics` hardcodes `sm:grid-cols-4`, which was right when the only caller had exactly four metrics. Kota has three, which would render a three-wide row with an empty fourth cell — a row that reads as unfinished. The fix is to derive the column count from the metric count. It is two lines and it is what makes this content render correctly, so it belongs in this plan rather than in a follow-up that ships a visual defect in the meantime.

---

## File Structure

| File | Responsibility |
|---|---|
| `web/src/components/projects/case-study-metrics.tsx` (modify) | Column count follows metric count |
| `web/src/components/projects/case-study-metrics.test.tsx` (modify) | Covers the three-metric layout |
| `web/src/content/projects.ts` (modify) | The Kota Embed entry |
| `web/src/content/content.test.ts` (modify) | Both-locale sweep over the new entry |
| `web/src/routes/project-detail.test.tsx` (modify) | Page-level assertions for the new page |

---

### Task 1: Metrics grid columns follow the metric count

**Files:**
- Modify: `web/src/components/projects/case-study-metrics.tsx:25`
- Modify: `web/src/components/projects/case-study-metrics.test.tsx`

**Interfaces:**
- Consumes: `CaseStudyMetric` from `@/content/projects` — unchanged.
- Produces: no signature change. `CaseStudyMetrics({ metrics, note })` keeps its exact props; only the rendered grid class changes.

- [ ] **Step 1: Write the failing test**

Append inside the existing `describe('CaseStudyMetrics', …)` block in `web/src/components/projects/case-study-metrics.test.tsx`:

```tsx
  it('lays out three metrics in three columns, not four', async () => {
    const three: CaseStudyMetric[] = [
      { value: { en: '9', 'pt-BR': '9' }, label: { en: 'insurers', 'pt-BR': 'seguradoras' } },
      { value: { en: '3', 'pt-BR': '3' }, label: { en: 'regions', 'pt-BR': 'regiões' } },
      { value: { en: '7', 'pt-BR': '7' }, label: { en: 'workflows', 'pt-BR': 'fluxos' } },
    ];
    const { container } = await renderWithI18n(<CaseStudyMetrics metrics={three} />);

    const grid = container.querySelector('[class*="grid-cols"]');
    expect(grid).not.toBeNull();
    expect(grid!.className).toContain('sm:grid-cols-3');
    expect(grid!.className).not.toContain('sm:grid-cols-4');
  });

  it('keeps four columns for four metrics', async () => {
    const four: CaseStudyMetric[] = [
      { value: { en: '1', 'pt-BR': '1' }, label: { en: 'a', 'pt-BR': 'a' } },
      { value: { en: '2', 'pt-BR': '2' }, label: { en: 'b', 'pt-BR': 'b' } },
      { value: { en: '3', 'pt-BR': '3' }, label: { en: 'c', 'pt-BR': 'c' } },
      { value: { en: '4', 'pt-BR': '4' }, label: { en: 'd', 'pt-BR': 'd' } },
    ];
    const { container } = await renderWithI18n(<CaseStudyMetrics metrics={four} />);

    const grid = container.querySelector('[class*="grid-cols"]');
    expect(grid!.className).toContain('sm:grid-cols-4');
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd web && pnpm test src/components/projects/case-study-metrics.test.tsx`
Expected: FAIL — the three-metric test finds `sm:grid-cols-4`; the four-metric test already passes.

- [ ] **Step 3: Make the column count follow the metric count**

In `web/src/components/projects/case-study-metrics.tsx`, replace line 25:

```tsx
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
```

with:

```tsx
      <div className={cn('grid grid-cols-2 gap-3', metrics.length === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-4')}>
```

Add the `cn` import alongside the existing imports at the top of the file:

```tsx
import { cn } from '@/lib/utils';
```

The full class strings are written out rather than interpolated (`sm:grid-cols-${n}`) because Tailwind scans source for complete class names — an interpolated one is never generated, and the grid would silently fall back to one column.

Then extend the component's JSDoc, replacing the line `* Renders nothing when there are no metrics.` with:

```tsx
 * Renders nothing when there are no metrics. The grid runs four across by
 * default and three across for a three-metric case study, so a short set
 * fills its row instead of leaving a hole on the right.
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd web && pnpm test src/components/projects/case-study-metrics.test.tsx`
Expected: PASS — 7 tests.

- [ ] **Step 5: Commit**

```bash
git add web/src/components/projects/case-study-metrics.tsx web/src/components/projects/case-study-metrics.test.tsx
git commit -m "fix(projects): metrics grid columns follow the metric count"
```

---

### Task 2: The Kota Embed entry

**Files:**
- Modify: `web/src/content/projects.ts`
- Modify: `web/src/content/content.test.ts`
- Modify: `web/src/routes/project-detail.test.tsx`

**Interfaces:**
- Consumes: `Project`, `ProjectDetailContent`, `CaseStudyMetric`, `CaseStudyArchitectureNode`, `CaseStudySection` — all already exported from `web/src/content/projects.ts`. No type changes.
- Produces: a project with slug `kota-embed`, positioned second in the `projects` array.

- [ ] **Step 1: Write the failing tests**

Append to `web/src/content/content.test.ts`:

```ts
it('kota-embed has a case study, localized in every locale', () => {
  const project = projects.find((p) => p.slug === 'kota-embed');
  expect(project).toBeDefined();
  expect(project!.visibility).toBe('private');
  expect(project!.links).toHaveLength(0);

  const detail = project!.detail;
  expectBothLocales(detail!.problem!, 'problem');

  expect(detail!.metrics).toHaveLength(3);
  for (const metric of detail!.metrics!) {
    expectBothLocales(metric.value, 'metric.value');
    expectBothLocales(metric.label, 'metric.label');
    if (metric.note) expectBothLocales(metric.note, 'metric.note');
  }

  expectBothLocales(detail!.architecture!.summary, 'architecture.summary');
  expect(detail!.architecture!.nodes).toHaveLength(5);
  for (const node of detail!.architecture!.nodes) {
    expect(node.label.trim()).not.toBe('');
    expectBothLocales(node.detail, 'architecture.node.detail');
  }

  expect(detail!.decisions).toHaveLength(4);
  for (const decision of detail!.decisions!) {
    expectBothLocales(decision.heading, 'decision.heading');
    expectBothLocales(decision.body, 'decision.body');
  }
});

it('kota-embed sits between pulse and the ulbra projects', () => {
  const slugs = projects.map((p) => p.slug);
  expect(slugs.indexOf('kota-embed')).toBe(1);
  expect(slugs.indexOf('kota-embed')).toBeLessThan(slugs.indexOf('ulbra-atende'));
});

it('describes insurers by count, never by name', () => {
  // Deliberately NOT a list of the partner names to grep for: this repository
  // is public, so a guard spelling them out would publish exactly what it
  // exists to keep out. The rule is enforced by review and by the Global
  // Constraints; what is testable here is the shape the copy uses instead.
  const kota = projects.find((p) => p.slug === 'kota-embed');
  const serialized = JSON.stringify(kota);
  expect(serialized).toContain('insurer');
  expect(serialized).toMatch(/nine insurers|nove seguradoras/);
});
```

Append inside the `describe('ProjectDetail', …)` block in `web/src/routes/project-detail.test.tsx`:

```tsx
  it('renders the Kota Embed case study in section order, with no external link', async () => {
    await renderDetail('kota-embed');

    const h1 = await screen.findAllByRole('heading', { level: 1 });
    expect(h1).toHaveLength(1);
    expect(h1[0]).toHaveTextContent('Kota Embed');

    expect(screen.getByText(/looks like a form/i)).toBeInTheDocument();
    expect(screen.getByText('Adapter factory')).toBeInTheDocument();
    expect(screen.getByText(/Intents instead of request\/response/i)).toBeInTheDocument();

    const headings = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
    expect(headings).toEqual([
      'Overview',
      'The problem',
      'By the numbers',
      'Architecture',
      'What it does',
      'Engineering decisions',
    ]);

    expect(screen.getByText('Private')).toBeInTheDocument();
    const externalLinks = screen.queryAllByRole('link').filter((l) => l.getAttribute('target') === '_blank');
    expect(externalLinks).toHaveLength(0);
  });

  it('renders the Kota Embed case study in pt-BR', async () => {
    await renderDetail('kota-embed', 'pt-BR');

    expect(screen.getByText(/parece um formulário/i)).toBeInTheDocument();
    expect(screen.getByText('Privado')).toBeInTheDocument();

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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd web && pnpm test src/content/content.test.ts src/routes/project-detail.test.tsx`
Expected: FAIL — no project with slug `kota-embed`.

- [ ] **Step 3: Add the entry**

In `web/src/content/projects.ts`, insert this object into the `projects` array immediately after the `pulse` entry's closing `},` and before the `ulbra-atende` entry:

```ts
  {
    slug: 'kota-embed',
    name: 'Kota Embed',
    tagline: {
      en: "Health insurance enrollment, embedded inside other companies' platforms.",
      'pt-BR': 'Adesão a plano de saúde, embutida dentro das plataformas de outras empresas.',
    },
    description: {
      en: 'A multi-tenant .NET service behind an embedded enrollment flow: employers offer health insurance to their employees without leaving the software they already use, while the backend integrates with nine insurers across three regulatory regions.',
      'pt-BR':
        'Um serviço .NET multi-tenant por trás de um fluxo de adesão embutido: empregadores oferecem plano de saúde aos funcionários sem sair do software que já usam, enquanto o backend integra com nove seguradoras em três regiões regulatórias.',
    },
    tech: ['.NET', 'PostgreSQL', 'EF Core', 'AWS', 'OpenTelemetry', 'Multi-tenant', 'Webhooks'],
    role: {
      en: 'Backend engineer, platform team — the multi-tenant core, its intent workflows, the public API contract, and integration testing. Front end by others.',
      'pt-BR':
        'Engenheiro backend, time de plataforma — o núcleo multi-tenant, seus fluxos de intent, o contrato da API pública e os testes de integração. Front-end por outros.',
    },
    period: { en: 'Professional work', 'pt-BR': 'Trabalho profissional' },
    visibility: 'private',
    links: [],
    detail: {
      overview: {
        en: 'Kota Embed lets employers offer health insurance to their employees without leaving the software they already use — the enrollment flow runs embedded in a third-party platform, backed by a multi-tenant .NET service that integrates directly with insurers.',
        'pt-BR':
          'O Kota Embed permite que empregadores ofereçam plano de saúde aos funcionários sem sair do software que já usam — o fluxo de adesão roda embutido numa plataforma de terceiro, apoiado por um serviço .NET multi-tenant que integra direto com as seguradoras.',
      },
      problem: {
        en: 'Enrolling someone in health insurance looks like a form. It is not. Each insurer wants different data in a different shape on its own schedule; some answer over HTTP, others by exchanging files over SFTP. Regulatory disclosure obligations differ by region. And all of it happens inside an iframe hosted on another company’s platform, where the user expects it to feel immediate. A form hardcoded per insurer does not survive the second insurer.',
        'pt-BR':
          'Inscrever alguém num plano de saúde parece um formulário. Não é. Cada seguradora quer dados diferentes, em formato diferente, no tempo dela; umas respondem por HTTP, outras trocando arquivos por SFTP. As obrigações regulatórias de disclosure mudam conforme a região. E tudo isso acontece dentro de um iframe hospedado na plataforma de outra empresa, onde o usuário espera que seja imediato. Um formulário hardcoded por seguradora não sobrevive à segunda seguradora.',
      },
      metrics: [
        {
          value: { en: '9', 'pt-BR': '9' },
          label: { en: 'insurer integrations', 'pt-BR': 'integrações de seguradora' },
          note: { en: 'HTTP APIs and SFTP file exchange', 'pt-BR': 'APIs HTTP e troca de arquivos por SFTP' },
        },
        {
          value: { en: '3', 'pt-BR': '3' },
          label: { en: 'regulatory regions', 'pt-BR': 'regiões regulatórias' },
          note: { en: 'disclosure rules differ per region', 'pt-BR': 'as regras de disclosure mudam por região' },
        },
        {
          value: { en: '7', 'pt-BR': '7' },
          label: { en: 'intent workflow types', 'pt-BR': 'tipos de fluxo de intent' },
          note: { en: 'enrollment, quote, amendment, renewal', 'pt-BR': 'adesão, cotação, alteração, renovação' },
        },
      ],
      architecture: {
        summary: {
          en: 'A .NET modular monolith split by bounded context: the multi-tenant platform core, one module per insurer, plus compliance, webhooks, and financial reporting. The core never calls an insurer directly — every provider call goes through an adapter factory, so the code that runs an enrollment does not know which insurer it is talking to. Long-running work is modeled as an intent: a persisted state machine rather than a request held open.',
          'pt-BR':
            'Um monólito modular em .NET dividido por contexto delimitado: o núcleo multi-tenant da plataforma, um módulo por seguradora, mais compliance, webhooks e relatório financeiro. O núcleo nunca chama uma seguradora direto — toda chamada a provedor passa por uma adapter factory, então o código que roda uma adesão não sabe com qual seguradora está falando. Trabalho de longa duração é modelado como intent: uma máquina de estados persistida, e não uma requisição mantida aberta.',
        },
        nodes: [
          {
            label: 'Third-party platform',
            detail: {
              en: 'The host application, embedding the enrollment flow in an iframe.',
              'pt-BR': 'A aplicação hospedeira, embutindo o fluxo de adesão num iframe.',
            },
          },
          {
            label: 'Public API',
            detail: {
              en: 'Versioned contract and signed webhooks for the platforms doing the embedding.',
              'pt-BR': 'Contrato versionado e webhooks assinados para as plataformas que embutem o fluxo.',
            },
          },
          {
            label: 'Platform core',
            detail: {
              en: 'Employers, employees, eligibility, and the intent state machines.',
              'pt-BR': 'Empregadores, funcionários, elegibilidade e as máquinas de estado dos intents.',
            },
          },
          {
            label: 'Adapter factory',
            detail: {
              en: 'The single door to every insurer, keeping the core provider-agnostic.',
              'pt-BR': 'A única porta para cada seguradora, mantendo o núcleo agnóstico de provedor.',
            },
          },
          {
            label: 'Insurer integrations',
            detail: {
              en: 'One module per insurer, over HTTP or scheduled SFTP file exchange.',
              'pt-BR': 'Um módulo por seguradora, por HTTP ou troca agendada de arquivos via SFTP.',
            },
          },
        ],
      },
      highlights: [
        {
          en: 'Multi-tenant by construction: platform → employer → employee → group, isolated per tenant.',
          'pt-BR': 'Multi-tenant por construção: plataforma → empregador → funcionário → grupo, isolados por tenant.',
        },
        {
          en: 'Enrollment, quoting, amendment, renewal, policy import, and dependant management, each as its own workflow.',
          'pt-BR':
            'Adesão, cotação, alteração, renovação, importação de apólice e gestão de dependentes, cada uma como seu próprio fluxo.',
        },
        {
          en: 'Eligibility computed from provider rules rather than stored as a flag.',
          'pt-BR': 'Elegibilidade calculada a partir das regras do provedor, em vez de guardada como flag.',
        },
        {
          en: 'Policy and plan data aggregated across insurers into a single response.',
          'pt-BR': 'Dados de apólice e plano agregados entre seguradoras numa resposta única.',
        },
        {
          en: 'A versioned public API and signed webhooks for the platforms doing the embedding.',
          'pt-BR': 'Uma API pública versionada e webhooks assinados para as plataformas que embutem o fluxo.',
        },
        {
          en: 'Insurer integrations over both HTTP APIs and scheduled SFTP file exchange.',
          'pt-BR': 'Integrações de seguradora tanto por API HTTP quanto por troca agendada de arquivos via SFTP.',
        },
      ],
      decisions: [
        {
          heading: {
            en: 'Intents instead of request/response',
            'pt-BR': 'Intent em vez de request/response',
          },
          body: {
            en: 'An enrollment cannot finish inside one call — an insurer may take minutes or days. Modeling it as a persisted state machine with its own status makes the in-between state something the system can query, resume, and report on, instead of a transaction held open and hoped for.',
            'pt-BR':
              'Uma adesão não termina dentro de uma chamada — uma seguradora pode levar minutos ou dias. Modelar isso como máquina de estados persistida, com status próprio, transforma o estado intermediário em algo que o sistema consulta, retoma e reporta, em vez de uma transação mantida aberta na esperança.',
          },
        },
        {
          heading: {
            en: 'Adaptive requirements instead of a form per insurer',
            'pt-BR': 'Requisitos adaptativos em vez de um formulário por seguradora',
          },
          body: {
            en: 'What a given case must collect depends on the insurer and the regulatory region at once. Rather than encoding nine forms, the platform asks a requirements service what this case needs and renders that. Adding an insurer stops being a front-end change.',
            'pt-BR':
              'O que um caso precisa coletar depende da seguradora e da região regulatória ao mesmo tempo. Em vez de codificar nove formulários, a plataforma pergunta a um serviço de requisitos o que aquele caso exige e renderiza isso. Adicionar uma seguradora deixa de ser mudança de front-end.',
          },
        },
        {
          heading: {
            en: 'An adapter factory as the only door to a provider',
            'pt-BR': 'Uma adapter factory como única porta para o provedor',
          },
          body: {
            en: 'The platform core resolves an adapter and talks to that. It never learns which insurer it is serving, which is what keeps a ninth integration from touching enrollment logic — and what let provider contracts be introduced behind feature flags and migrated without stopping the product.',
            'pt-BR':
              'O núcleo da plataforma resolve um adapter e fala com ele. Nunca fica sabendo qual seguradora está atendendo, e é isso que impede uma nona integração de tocar na lógica de adesão — e o que permitiu introduzir contratos de provedor atrás de feature flags e migrar sem parar o produto.',
          },
        },
        {
          heading: {
            en: 'Idempotency and duplicate suppression as a requirement, not a repair',
            'pt-BR': 'Idempotência e supressão de duplicata como requisito, não conserto',
          },
          body: {
            en: 'Retries happen, webhooks arrive twice, and consumers run concurrently against the same rows. Intent creation takes an idempotency key, auto-enrollment suppresses the duplicate intent-and-webhook pair, and the screening consumer handles serialization conflicts rather than assuming they cannot happen.',
            'pt-BR':
              'Retry acontece, webhook chega duas vezes e consumidores rodam concorrentes sobre as mesmas linhas. A criação de intent aceita chave de idempotência, a adesão automática suprime o par intent-e-webhook duplicado, e o consumer de screening trata conflito de serialização em vez de assumir que ele não ocorre.',
          },
        },
      ],
    },
  },
```

- [ ] **Step 4: Run the tests**

Run: `cd web && pnpm test src/content/content.test.ts src/routes/project-detail.test.tsx`
Expected: PASS.

- [ ] **Step 5: Run the full suite, lint and build**

Run: `cd web && pnpm test && pnpm lint && pnpm build`
Expected: PASS on all three. Note that `project-card.test.tsx` builds its own fixtures rather than reading the real `projects` array, so a fourth project does not disturb it.

- [ ] **Step 6: Commit**

```bash
git add web/src/content/projects.ts web/src/content/content.test.ts web/src/routes/project-detail.test.tsx
git commit -m "feat(projects): Kota Embed case study"
```

---

## Verification

From `web/`:

```bash
pnpm test && pnpm lint && pnpm build
```

Then look at the page: `pnpm dev`, open `/projects/kota-embed`, toggle the language, and confirm the three metric tiles fill their row rather than leaving a gap on the right. Check `/projects` shows four cards, and that `/projects/ulbra-atende` still renders its four metrics four across.
