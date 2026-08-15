# Dietbox case study Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add Dietbox as a sixth project, and give case-study pages a `leadership` section so a project can describe what changed under someone's direction, not only what they built.

**Architecture:** Content-only for the project itself — one entry in `web/src/content/projects.ts`, no new component. The leadership section is one optional field reusing the existing `CaseStudyDecisions` renderer and one new i18n key, rendered last on the detail page.

**Tech Stack:** React 19, TypeScript, Tailwind 4, react-i18next, Vitest + Testing Library. All commands run from `web/`.

**Source spec:** `docs/superpowers/specs/2026-08-15-dietbox-case-study-design.md`

---

## Before you start

**Read this section fully. Two things here will fail the review if you skip them.**

### The source repositories are out of scope

Do not open, read, grep, list, quote, paraphrase or commit anything from the Dietbox
source repositories. The reason was communicated to the author privately and is
deliberately not recorded here, because this document is published.

Everything you need is already in this plan — every number and every structural claim
below was verified against the source while writing it, and does not need re-verifying.

If you believe you need a fact that is not in this plan, **stop and ask** rather than
going looking.

### What may and may not be published

| May | May not |
|---|---|
| The company, the product, `https://dietbox.me` | Any colleague's name — the repos have a dozen contributors and none of them are the subject of this page |
| The architecture as described below | Any hostname, connection string, resource name, subscription or tenant id |
| The commit counts in this plan | Internal service names not listed below |
| Iugu and Pagar.me as payment providers | Anything from a settings, pipeline or environment file |

`visibility: 'private'` and `links: [{ label: 'Website', href: 'https://dietbox.me' }]`.
The source is closed; the product is not. The existing tests enforce that a private
project carries no repository link — do not weaken them.

### Two corrections to the spec

The spec was written before the repositories were counted. **This plan supersedes it**
on both points:

| Spec says | Truth | Use |
|---|---|---|
| ~1.5k commits of ~4.7k total | 1,716 of 5,762 across the six services | **~1.7k of ~5.8k** |
| 18% of the largest repository | 583 of 3,290 = 17.7% | **"about a sixth"** |

The spec also writes the contribution summary as *"Two roles over four years — senior
engineer first, then Head of Technology."* **Do not use that sentence.** A locked rule
from earlier in this project says the contribution section never restates a job title,
because `project.role` already carries it and the page would print it twice. The
summary below says the same thing in terms of scope instead.

---

## Task 1: The Dietbox content entry

Everything except the leadership section, which needs a schema change and lands in
Task 2.

**Files:**

- Modify: `web/src/content/projects.ts` — insert a new entry after `kota-embed`, before `ulbra-atende` (currently line 525)
- Test: `web/src/content/content.test.ts`

**Step 1: Write the failing tests**

Append to `web/src/content/content.test.ts`:

```ts
it('dietbox has a case study, localized in every locale', () => {
  const dietbox = projects.find((project) => project.slug === 'dietbox');
  expect(dietbox).toBeDefined();
  const detail = dietbox?.detail;
  expect(detail).toBeDefined();

  for (const locale of locales) {
    expect(detail?.overview?.[locale]).toBeTruthy();
    expect(detail?.problem?.[locale]).toBeTruthy();
    expect(detail?.metrics?.every((metric) => metric.value[locale] && metric.label[locale])).toBe(true);
    expect(detail?.architecture?.steps.every((step) => step.detail[locale])).toBe(true);
    expect(detail?.highlights?.every((highlight) => highlight[locale])).toBe(true);
    expect(detail?.decisions?.every((section) => section.heading[locale] && section.body[locale])).toBe(true);
    expect(dietbox?.tagline[locale]).toBeTruthy();
    expect(dietbox?.description[locale]).toBeTruthy();
    expect(dietbox?.role[locale]).toBeTruthy();
  }

  expect(detail?.metrics).toHaveLength(4);
  expect(detail?.architecture?.steps).toHaveLength(5);
  expect(detail?.decisions).toHaveLength(4);
});

it('dietbox states what the author did, including what was shared work', () => {
  const contribution = projects.find((project) => project.slug === 'dietbox')?.detail?.contribution;
  expect(contribution).toBeDefined();
  for (const locale of locales) {
    expect(contribution?.summary[locale]).toBeTruthy();
    expect(contribution?.areas?.every((area) => area[locale])).toBe(true);
    // The largest codebase was a team effort; the page has to say so.
    expect(contribution?.boundary?.[locale]).toBeTruthy();
  }
});

it('dietbox sits between kota-embed and the ulbra projects', () => {
  const slugs = projects.map((project) => project.slug);
  expect(slugs.indexOf('dietbox')).toBeGreaterThan(slugs.indexOf('kota-embed'));
  expect(slugs.indexOf('dietbox')).toBeLessThan(slugs.indexOf('ulbra-atende'));
});

it('dietbox links to its product, not its source', () => {
  const dietbox = projects.find((project) => project.slug === 'dietbox');
  expect(dietbox?.visibility).toBe('private');
  expect(dietbox?.links).toEqual([{ label: 'Website', href: 'https://dietbox.me' }]);
});
```

Check the top of the file for how `projects` and `locales` are already imported — reuse
those imports, do not add duplicates.

**Step 2: Run the tests to verify they fail**

```bash
cd web && pnpm vitest run src/content/content.test.ts
```

Expected: FAIL — `expect(dietbox).toBeDefined()` receives `undefined`.

**Step 3: Add the entry**

Insert into the `projects` array immediately after the `kota-embed` entry:

```ts
  {
    slug: 'dietbox',
    name: 'Dietbox',
    tagline: {
      en: 'Nutrition software for practitioners and their patients.',
      'pt-BR': 'Software de nutrição para profissionais e seus pacientes.',
    },
    description: {
      en: 'A Brazilian SaaS where nutritionists build diet plans and their patients follow them — two audiences over one identity backbone and one platform.',
      'pt-BR': 'Um SaaS brasileiro em que nutricionistas montam planos alimentares e seus pacientes os seguem — dois públicos sobre uma única base de identidade e uma única plataforma.',
    },
    tech: ['.NET', 'Azure', 'Azure AD B2C', 'PostgreSQL', 'Redis', 'Socket.io', 'Azure DevOps'],
    role: {
      en: 'Senior Software Engineer, then Head of Technology',
      'pt-BR': 'Engenheiro de Software Sênior, depois Head de Tecnologia',
    },
    period: { en: '2020–2024', 'pt-BR': '2020–2024' },
    links: [{ label: 'Website', href: 'https://dietbox.me' }],
    visibility: 'private',
    detail: {
      overview: {
        en: 'A Brazilian SaaS used by nutritionists to plan diets and by their patients to follow them. Two audiences with almost nothing in common share one product, one identity system and one platform — and that platform spans a decade-old monolith and a newer generation of services running beside it.',
        'pt-BR': 'Um SaaS brasileiro usado por nutricionistas para montar dietas e por seus pacientes para segui-las. Dois públicos com quase nada em comum dividem um produto, um sistema de identidade e uma plataforma — e essa plataforma vai de um monolito de dez anos a uma geração mais nova de serviços rodando ao lado dele.',
      },
      contribution: {
        summary: {
          en: 'Principal architect for four years — the platform’s patterns and the Azure estate were his, including in the services other people wrote. Later, the whole technology organisation reported to him.',
          'pt-BR': 'Arquiteto principal por quatro anos — os padrões da plataforma e o ambiente Azure eram dele, inclusive nos serviços escritos por outras pessoas. Depois, toda a área de tecnologia passou a se reportar a ele.',
        },
        areas: [
          {
            en: 'Moving the platform off .NET Framework on Windows and onto .NET 6 on Linux.',
            'pt-BR': 'Tirar a plataforma do .NET Framework no Windows e levá-la para .NET 6 no Linux.',
          },
          {
            en: 'Identity end to end: the custom Azure AD B2C policies behind both audiences — sign-up, sign-in and password reset, branded per audience.',
            'pt-BR': 'Identidade de ponta a ponta: as políticas customizadas de Azure AD B2C por trás dos dois públicos — cadastro, login e recuperação de senha, com marca própria para cada um.',
          },
          {
            en: 'The portal service, and the shared building blocks the newer services start from.',
            'pt-BR': 'O serviço de portal e os blocos compartilhados dos quais os serviços mais novos partem.',
          },
          {
            en: 'The realtime service, and CI/CD in Azure DevOps.',
            'pt-BR': 'O serviço de tempo real e o CI/CD no Azure DevOps.',
          },
          {
            en: 'Production availability and incident response.',
            'pt-BR': 'Disponibilidade em produção e resposta a incidentes.',
          },
        ],
        boundary: {
          en: 'The product’s largest codebase was a team effort: about a sixth of its commits are his, and the patterns behind the rest were.',
          'pt-BR': 'A maior base de código do produto foi trabalho de time: cerca de um sexto dos commits são dele — e os padrões por trás do resto também.',
        },
      },
      problem: {
        en: 'The nutritionist lives in the tool all day; the patient opens it to read a meal plan. Same product, same identity backbone, opposite expectations. And in 2020 a .NET Framework monolith carried both on Windows App Service, shipping once a day, at night, because that was the only window that felt safe.',
        'pt-BR': 'A nutricionista vive na ferramenta o dia inteiro; o paciente abre para ler um plano alimentar. Mesmo produto, mesma base de identidade, expectativas opostas. E em 2020 um monolito .NET Framework carregava os dois no Windows App Service, com deploy uma vez por dia, de madrugada, porque era a única janela que parecia segura.',
      },
      metrics: [
        {
          value: { en: '13', 'pt-BR': '13' },
          label: { en: 'people in the org', 'pt-BR': 'pessoas na área' },
          note: { en: 'engineering, QA, UX and support', 'pt-BR': 'engenharia, QA, UX e suporte' },
        },
        {
          value: { en: '~1.7k', 'pt-BR': '~1,7 mil' },
          label: { en: 'commits across six services', 'pt-BR': 'commits em seis serviços' },
          note: { en: 'his own, of ~5.8k total', 'pt-BR': 'dele, de ~5,8 mil no total' },
        },
        {
          value: { en: '1 month → 1.5 weeks', 'pt-BR': '1 mês → 1,5 semana' },
          label: { en: 'lead time', 'pt-BR': 'lead time' },
          note: {
            en: 'after Scrum and trunk-based development',
            'pt-BR': 'depois de Scrum e desenvolvimento baseado em tronco',
          },
        },
        {
          value: { en: '−21%', 'pt-BR': '−21%' },
          label: { en: 'monthly cloud spend', 'pt-BR': 'custo mensal de nuvem' },
          note: { en: 'after an Azure cost pass', 'pt-BR': 'depois de uma revisão de custos no Azure' },
        },
      ],
      metricsNote: {
        en: 'The commit counts come from the repositories. The rest is the author’s own record of the period.',
        'pt-BR': 'Os números de commit vêm dos repositórios. O resto é o registro do próprio autor sobre o período.',
      },
      architecture: {
        summary: {
          en: 'Two generations of the same product, sharing one identity backbone.',
          'pt-BR': 'Duas gerações do mesmo produto, dividindo uma única base de identidade.',
        },
        steps: [
          {
            label: 'Legacy platform',
            detail: {
              en: 'The .NET Framework monolith the product grew on, and still its largest codebase.',
              'pt-BR': 'O monolito .NET Framework em que o produto cresceu, e ainda sua maior base de código.',
            },
          },
          {
            label: 'Identity',
            detail: {
              en: 'Azure AD B2C with custom policies: a separate sign-up, sign-in and password flow per audience, over one directory rather than two user stores.',
              'pt-BR': 'Azure AD B2C com políticas customizadas: um fluxo próprio de cadastro, login e senha para cada público, sobre um único diretório em vez de duas bases de usuários.',
            },
          },
          {
            label: 'Portal service',
            detail: {
              en: 'The newer generation: a layered domain over shared building blocks, with event sourcing where the questions are historical.',
              'pt-BR': 'A geração mais nova: um domínio em camadas sobre blocos compartilhados, com event sourcing onde as perguntas são históricas.',
            },
          },
          {
            label: 'Realtime',
            detail: {
              en: 'Socket.io behind a Redis adapter, so any instance can push to a client connected to any other.',
              'pt-BR': 'Socket.io atrás de um adaptador Redis, para que qualquer instância consiga enviar a um cliente conectado em outra.',
            },
          },
          {
            label: 'Azure',
            detail: {
              en: 'The estate the author configured and later cost-tuned, with delivery through Azure DevOps.',
              'pt-BR': 'O ambiente que o autor configurou e depois otimizou em custo, com entrega via Azure DevOps.',
            },
          },
        ],
      },
      highlights: [
        {
          en: 'Diet planning for the practitioner, and the same plan in the patient’s own app.',
          'pt-BR': 'Montagem de plano alimentar para a profissional, e o mesmo plano no app do paciente.',
        },
        {
          en: 'Two sign-up journeys over one identity system — a practitioner subscribing, a patient invited by theirs.',
          'pt-BR': 'Dois caminhos de cadastro sobre um único sistema de identidade — a profissional que assina, o paciente que é convidado pela dela.',
        },
        {
          en: 'Live updates pushed to open clients without a refresh.',
          'pt-BR': 'Atualizações em tempo real enviadas a clientes abertos, sem recarregar.',
        },
        {
          en: 'Subscriptions and payments, including a provider migration run without interrupting revenue.',
          'pt-BR': 'Assinaturas e pagamentos, incluindo uma troca de provedor feita sem interromper a receita.',
        },
      ],
      decisions: [
        {
          heading: {
            en: 'Custom identity policies instead of a hosted login',
            'pt-BR': 'Políticas de identidade customizadas em vez de um login pronto',
          },
          body: {
            en: 'Two audiences share a product but not a journey: a practitioner signing up for a subscription, a patient invited by theirs. Custom B2C policies gave each its own sign-up, sign-in and password flow, branded per audience, over one identity backbone instead of two user stores to keep in sync.',
            'pt-BR': 'Dois públicos dividem um produto, mas não um caminho: a profissional que assina, o paciente que é convidado por ela. Políticas customizadas de B2C deram a cada um seu próprio fluxo de cadastro, login e senha, com marca própria, sobre uma única base de identidade em vez de duas bases de usuários para manter sincronizadas.',
          },
        },
        {
          heading: {
            en: 'Shared building blocks before shared services',
            'pt-BR': 'Blocos compartilhados antes de serviços compartilhados',
          },
          body: {
            en: 'The newer services start from a common domain, infrastructure and identity layer rather than each inventing its own. It is what let a small team add a service without the fourth one being written in a fourth style.',
            'pt-BR': 'Os serviços mais novos partem de uma camada comum de domínio, infraestrutura e identidade em vez de cada um inventar a sua. É o que permitiu a um time pequeno adicionar um serviço sem que o quarto fosse escrito num quarto estilo.',
          },
        },
        {
          heading: { en: 'Event sourcing in the portal, not everywhere', 'pt-BR': 'Event sourcing no portal, não em tudo' },
          body: {
            en: 'The portal’s questions are historical — what changed, when, and by whom — so its state is derived from events. The rest of the platform is not, because the rest of the platform is not asking that, and event sourcing charges rent on every service that adopts it.',
            'pt-BR': 'As perguntas do portal são históricas — o que mudou, quando e por quem —, então seu estado é derivado de eventos. O resto da plataforma não é, porque o resto da plataforma não faz essa pergunta, e event sourcing cobra aluguel de todo serviço que o adota.',
          },
        },
        {
          heading: { en: 'Realtime as its own service', 'pt-BR': 'Tempo real como serviço próprio' },
          body: {
            en: 'Long-lived connections scale on a different axis from request traffic, and behind a Redis adapter any instance can push to a client connected to any other. Keeping it inside the monolith would have tied both to the same deploy — and the monolith deployed once a night.',
            'pt-BR': 'Conexões de longa duração escalam num eixo diferente do tráfego de requisições, e atrás de um adaptador Redis qualquer instância consegue enviar a um cliente conectado em outra. Mantê-lo dentro do monolito teria amarrado os dois ao mesmo deploy — e o monolito subia uma vez por madrugada.',
          },
        },
      ],
    },
  },
```

**Step 4: Run the tests to verify they pass**

```bash
cd web && pnpm vitest run src/content/content.test.ts
```

Expected: PASS, including the pre-existing sweeps — `no case-study section is present but empty on any project`, `publishes no hostname, URL or credential in any project narrative`, `every project link is absolute and https`, `no private project links to a repository`, and `every project except ulbra-one states what the author did` now all cover Dietbox too. If any of those fail, **fix the content, not the test.**

**Step 5: Commit**

```bash
git add web/src/content/projects.ts web/src/content/content.test.ts && git commit -m "feat(projects): Dietbox case study"
```

---

## Task 2: The leadership section

**Files:**

- Modify: `web/src/content/projects.ts` — one field on `ProjectDetailContent`, and Dietbox's content for it
- Modify: `web/src/i18n/locales/en/projects.json`, `web/src/i18n/locales/pt-BR/projects.json`
- Modify: `web/src/components/projects/project-detail.tsx` — one section after the decisions block (currently ends line 199)
- Test: `web/src/routes/project-detail.test.tsx`, `web/src/content/content.test.ts`

**Step 1: Write the failing tests**

Append to `web/src/routes/project-detail.test.tsx`, inside the existing `describe`:

```ts
it('renders the Dietbox case study in section order, with leadership last', async () => {
  await renderDetail('dietbox');

  await screen.findAllByRole('heading', { level: 1 });
  expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  expect(screen.getByText(/lives in the tool all day/i)).toBeInTheDocument();
  expect(screen.getByText('~1.7k')).toBeInTheDocument();
  expect(screen.getByText(/a separate sign-up, sign-in and password flow/i)).toBeInTheDocument();
  expect(screen.getByText(/without interrupting revenue/i)).toBeInTheDocument();

  const websiteLink = screen.getByRole('link', { name: /website/i });
  expect(websiteLink).toHaveAttribute('href', 'https://dietbox.me');
  expect(screen.getByText('Private')).toBeInTheDocument();

  const headings = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
  expect(headings).toEqual([
    'Overview',
    'What I did',
    'The problem',
    'By the numbers',
    'Architecture',
    'What it does',
    'Engineering decisions',
    'What changed under my direction',
  ]);
});

it('renders the Dietbox case study in pt-BR', async () => {
  await renderDetail('dietbox', 'pt-BR');

  await screen.findAllByRole('heading', { level: 1 });
  expect(screen.getByText('Privado')).toBeInTheDocument();

  const headings = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
  expect(headings).toEqual([
    'Visão geral',
    'O que eu fiz',
    'O problema',
    'Em números',
    'Arquitetura',
    'O que faz',
    'Decisões de engenharia',
    'O que mudou sob minha direção',
  ]);
});

it('renders no leadership section for a project that has none', async () => {
  await renderDetail('ulbra-atende');

  await screen.findAllByRole('heading', { level: 1 });
  const headings = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
  expect(headings).not.toContain('What changed under my direction');
});
```

And append to `web/src/content/content.test.ts`:

```ts
it('dietbox is the only project with a leadership section, localized and non-empty', () => {
  const withLeadership = projects.filter((project) => project.detail?.leadership);
  expect(withLeadership.map((project) => project.slug)).toEqual(['dietbox']);

  const leadership = withLeadership[0]?.detail?.leadership;
  expect(leadership).toHaveLength(4);
  for (const locale of locales) {
    expect(leadership?.every((section) => section.heading[locale] && section.body[locale])).toBe(true);
  }
});
```

**Step 2: Run the tests to verify they fail**

```bash
cd web && pnpm vitest run src/routes/project-detail.test.ts src/content/content.test.ts
```

Expected: FAIL — the heading arrays are missing their last entry, and `detail.leadership` is not a known property (a TypeScript error is a legitimate failure here).

**Step 3: Add the field**

In `web/src/content/projects.ts`, add to `ProjectDetailContent` after `decisions`:

```ts
  /** What changed under the author's direction — reuses the decisions shape. */
  leadership?: CaseStudySection[];
```

**Step 4: Add the i18n key**

`web/src/i18n/locales/en/projects.json`, after `"decisionsHeading"`:

```json
  "leadershipHeading": "What changed under my direction",
```

`web/src/i18n/locales/pt-BR/projects.json`, after `"decisionsHeading"`:

```json
  "leadershipHeading": "O que mudou sob minha direção",
```

**Step 5: Render it**

In `web/src/components/projects/project-detail.tsx`, immediately after the `decisions`
section and before the closing `</div>`:

```tsx
        {project.detail?.leadership && project.detail.leadership.length > 0 ? (
          <section className="flex flex-col gap-3">
            <SubsectionHeading>{t('projects:leadershipHeading')}</SubsectionHeading>
            <CaseStudyDecisions decisions={project.detail.leadership} />
          </section>
        ) : null}
```

No new import — `CaseStudyDecisions` is already imported for the decisions section.

**Step 6: Add Dietbox's leadership content**

In the `dietbox` entry, after `decisions`:

```ts
      leadership: [
        {
          heading: { en: 'From one nightly deploy to several a day', 'pt-BR': 'De um deploy noturno a vários por dia' },
          body: {
            en: 'The team shipped once a day, at night, because that was the only window that felt safe. Scrum and trunk-based development took lead time from about a month to a week and a half, and made a daylight deploy ordinary rather than an event.',
            'pt-BR': 'O time subia uma vez por dia, de madrugada, porque era a única janela que parecia segura. Scrum e desenvolvimento baseado em tronco levaram o lead time de cerca de um mês para uma semana e meia, e transformaram o deploy em horário comercial em rotina, não em evento.',
          },
        },
        {
          heading: { en: 'A payment migration nobody noticed', 'pt-BR': 'Uma migração de pagamentos que ninguém notou' },
          body: {
            en: 'Thousands of active subscribers moved from Iugu to Pagar.me, planned and executed without interrupting revenue — the kind of change whose measure of success is that nothing happened.',
            'pt-BR': 'Milhares de assinantes ativos migrados de Iugu para Pagar.me, planejado e executado sem interromper a receita — o tipo de mudança cuja medida de sucesso é não ter acontecido nada.',
          },
        },
        {
          heading: { en: 'Cloud spend as an engineering problem', 'pt-BR': 'Custo de nuvem como problema de engenharia' },
          body: {
            en: 'A cost pass over the Azure estate cut monthly spend by 21%, without a feature freeze to pay for it.',
            'pt-BR': 'Uma revisão de custos no ambiente Azure cortou 21% do gasto mensal, sem congelar entregas para pagar a conta.',
          },
        },
        {
          heading: {
            en: 'Reporting engineering in the executive’s language',
            'pt-BR': 'Reportar engenharia na língua da diretoria',
          },
          body: {
            en: 'DORA metrics and a roadmap presented to the executive team, so investment in technology was argued with evidence rather than conviction.',
            'pt-BR': 'Métricas DORA e um roadmap apresentados à diretoria, para que investimento em tecnologia fosse defendido com evidência em vez de convicção.',
          },
        },
      ],
```

**Step 7: Run the tests to verify they pass**

```bash
cd web && pnpm vitest run src/routes/project-detail.test.ts src/content/content.test.ts
```

Expected: PASS.

**Step 8: Commit**

```bash
git add web/src/content/projects.ts web/src/i18n/locales web/src/components/projects/project-detail.tsx web/src/routes/project-detail.test.tsx web/src/content/content.test.ts && git commit -m "feat(projects): leadership section, first used by Dietbox"
```

---

## Task 3: Full verification

**Step 1: Whole suite**

```bash
cd web && pnpm test
```

Expected: all files pass. Two known flakes under machine load — `src/routes/index.test.tsx`
and occasionally `src/entry-prerender.test.ts` time out at 5000ms and pass in isolation.
**Do not raise their timeouts.** Re-run the single file to confirm before reporting.

**Step 2: Build (this is the typecheck — there is no `pnpm typecheck`)**

```bash
cd web && pnpm build
```

Expected: `tsc -b` clean, then a successful Vite build and prerender.

**Step 3: Confirm the page prerenders**

```bash
grep -c "What changed under my direction" web/dist/projects/dietbox.html
```

Expected: `1` or more. A `0` means the route was not prerendered — report it rather than
working around it.

(Pages are emitted flat as `projects/<slug>.html`, not `projects/<slug>/index.html`. An
earlier draft of this plan had the nested path and it does not exist.)

**Step 4: Secret sweep**

```bash
git diff main...HEAD | grep -inE "password|secret|token|apikey|api_key|client_secret|connectionstring|\.azurewebsites\.|\.database\.windows\.net|InstrumentationKey|[a-f0-9]{32}" || echo "CLEAN"
```

Expected: `CLEAN`. Anything else is a stop-and-report, not a fix-and-continue.

**Step 5: Colleague-name sweep**

No contributor's name may appear. The diff should contain no personal name other than
the author's own:

```bash
git diff main...HEAD -- web/src/content/projects.ts | grep -E "^\+" | grep -viE "felipe" | grep -oE "\b[A-Z][a-z]{2,}\s+[A-Z][a-z]{2,}\b" | sort -u
```

Expected: only product, technology and place names (e.g. `Azure DevOps`, `Socket.io`).
A human first-name/last-name pair is a stop-and-report.

**Step 6: Commit anything outstanding**

```bash
git status --short
```

Expected: clean.

---

## Out of scope

- Ulbra One's case study, still the only project with no case study at all.
- Any script, table or comparison figure for Dietbox. The lead-time change is a natural
  fit for the comparison figure later; it is left out now so this page's first version is
  readable rather than exhaustive.
- A screenshot. The product sits behind its customers' logins, so the card falls back to
  the generated `ProjectCover`, as the other private projects do.
