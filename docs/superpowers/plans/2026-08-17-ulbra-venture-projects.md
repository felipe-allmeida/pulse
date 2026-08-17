# ULBRA Venture and Project List Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Introduce a reusable `Venture` — an organization that contains projects — and fill it for ULBRA with six case studies, a timeline entry, and the development model that explains how three engineers shipped six systems.

**Architecture:** A venture is a separate content file (`ventures.ts`); `Project` gains one field, `venture?: string`, pointing at a venture slug. The projects array stays flat and ordered — a pure `groupProjects()` function walks it and folds consecutive same-venture projects into a group, which `/projects` renders as a section with a header. Nothing nests, so `pages.ts`, `json-ld.ts`, the assistant generator and the existing tests keep consuming a flat list.

**Tech Stack:** TypeScript, React 19, TanStack Router, Tailwind 4, vitest, i18next (en + pt-BR).

**Spec:** `docs/superpowers/specs/2026-08-17-ulbra-venture-projects-design.md`

## Global Constraints

- **Every user-facing string is localized in both locales** — `en` and `pt-BR`. `LocalizedString` is `Record<Locale, string>` from `web/src/content/types.ts`. A missing locale fails `content.test.ts`.
- **No hostname, URL, credential or hash in any project narrative.** `content.test.ts:222` enforces this. The ULBRA repositories are full of them (`signoz.ulbra.ai`, `grafana.ulbra.ai`, the SSH host alias `crmulbra`). Every code sample is rewritten with placeholder domains such as `app.example.internal` before it is committed.
- **No invented metrics.** `metrics` is optional. Where no real number exists, the section is omitted. The only new figure with a real number is Ulbra CRM's test coverage (0% → 100%).
- **No repository links on private projects.** All six ULBRA projects are `visibility: 'private'` with `links: []`.
- **Run all commands from `web/`.** Tests: `pnpm test`. A single file: `pnpm vitest run src/content/content.test.ts`.
- **`role` and `period` on every ULBRA project** become `Head of Technology` / `Apr 2026 – Current` (or the project's own dates), replacing today's `Software engineer` / `Professional work`.
- **Start date is `Apr 2026`.** The spec's open question 1: the author stated 5 May 2026, but his own first commits are 9 Apr (`infra`), 18 Apr (`ulbra-sau`), 28 Apr (`ulbra-student-dashboard`). `Apr 2026` covers both readings. If the author later confirms 5 May, change it in `profile.ts` and `ventures.ts` only — no other file carries the date.

---

### Task 1: The venture model and the ULBRA venture

**Files:**
- Create: `web/src/content/ventures.ts`
- Test: `web/src/content/ventures.test.ts`

**Interfaces:**
- Consumes: `LocalizedString`, `LOCALES` from `web/src/content/types.ts`; `CaseStudySection` from `web/src/content/projects.ts`.
- Produces: `interface Venture`, `const ventures: Venture[]`, `function ventureBySlug(slug: string): Venture | undefined`.

- [ ] **Step 1: Write the failing test**

Create `web/src/content/ventures.test.ts`:

```ts
import { expect, it } from 'vitest';
import { ventures, ventureBySlug } from './ventures';
import { LOCALES } from './types';
import type { LocalizedString } from './types';

function expectBothLocales(value: LocalizedString, label: string) {
  for (const locale of LOCALES) {
    expect(value[locale], `${label} missing ${locale}`).toBeTruthy();
  }
}

it('every venture string is localized in every locale', () => {
  expect(ventures.length).toBeGreaterThan(0);
  for (const venture of ventures) {
    expect(venture.slug.trim(), 'venture slug').not.toBe('');
    expect(venture.name.trim(), 'venture name').not.toBe('');
    expectBothLocales(venture.role, `${venture.slug} role`);
    expectBothLocales(venture.period, `${venture.slug} period`);
    expectBothLocales(venture.summary, `${venture.slug} summary`);
    if (venture.engagement) expectBothLocales(venture.engagement, `${venture.slug} engagement`);
    if (venture.team) expectBothLocales(venture.team, `${venture.slug} team`);
  }
});

it('venture slugs are unique and resolvable', () => {
  const slugs = ventures.map((v) => v.slug);
  expect(new Set(slugs).size).toBe(slugs.length);
  for (const slug of slugs) expect(ventureBySlug(slug)?.slug).toBe(slug);
  expect(ventureBySlug('nope')).toBeUndefined();
});

it('every venture url is absolute https', () => {
  for (const venture of ventures) {
    if (venture.url === undefined) continue;
    expect(venture.url, `${venture.slug}: ${venture.url}`).toMatch(/^https:\/\//);
  }
});

it('no venture practices section is present but empty', () => {
  for (const venture of ventures) {
    if (!venture.practices) continue;
    expect(venture.practices.length, `${venture.slug} practices`).toBeGreaterThan(0);
    for (const section of venture.practices) {
      expectBothLocales(section.heading, `${venture.slug} practices heading`);
      expectBothLocales(section.body, `${venture.slug} practices body`);
    }
  }
});

it('ULBRA is held as a client engagement, and says whose', () => {
  const ulbra = ventureBySlug('ulbra');
  expect(ulbra, 'the ULBRA venture exists').toBeDefined();
  expect(ulbra!.engagement!.en).toMatch(/pampa devs/i);
  expect(ulbra!.engagement!['pt-BR']).toMatch(/pampa devs/i);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/content/ventures.test.ts`
Expected: FAIL — `Failed to resolve import "./ventures"`.

- [ ] **Step 3: Write the implementation**

Create `web/src/content/ventures.ts`:

```ts
import type { CaseStudySection } from './projects';
import type { LocalizedString } from './types';

/**
 * An organization that contains projects.
 *
 * The projects index used to mix two granularities without saying so: one card
 * described a company (Dietbox, four years, a leadership section) while two
 * described individual systems, with no card for the organization they belonged
 * to. A venture is the missing level.
 *
 * Projects point at a venture by slug rather than nesting inside it.
 * `projects.ts` is consumed as a flat list by `lib/aio/pages.ts`,
 * `lib/aio/json-ld.ts`, the `projects.generated.md` generator and the content
 * tests; nesting would rewrite all four to buy nothing the key does not.
 */
export interface Venture {
  slug: string;
  name: string;
  /**
   * The organization's own site, when there is a verified one. Same rule as
   * `profile.experience[].url`: absent rather than guessed. `ulbra.br` was
   * checked with a request — it answers 200 and redirects to the `www` form
   * committed here.
   */
  url?: string;
  role: LocalizedString;
  period: LocalizedString;
  /**
   * How the engagement is held. Optional: direct employment needs no
   * qualifier. This is not a boolean, because the two cases in hand are not
   * the same case — ROLÊ was a side venture run alongside a day job, ULBRA is
   * a client of the author's own studio, and one word would be wrong for one
   * of them.
   */
  engagement?: LocalizedString;
  /** 1–2 sentences: what the organization is and what the mandate is. */
  summary: LocalizedString;
  /** The team led, when there is one. */
  team?: LocalizedString;
  /**
   * How the organization works — reuses the `decisions` shape. Venture-level
   * because it explains every project underneath at once; the machinery that
   * implements it lives in the `ulbra-infra` case study, where it runs.
   */
  practices?: CaseStudySection[];
}

export const ventures: Venture[] = [
  {
    slug: 'ulbra',
    name: 'ULBRA',
    url: 'https://www.ulbra.br',
    role: { en: 'Head of Technology', 'pt-BR': 'Head de Tecnologia' },
    period: { en: 'Apr 2026 – Current', 'pt-BR': 'Abr 2026 – Atual' },
    engagement: { en: 'Client of Pampa Devs', 'pt-BR': 'Cliente da Pampa Devs' },
    summary: {
      en: "The university's internal technology platform, built from scratch by a small team: an IT service desk in production, an ERP replacing the legacy systems, a CRM taken over and rebuilt, administrative dashboards, and the datacenter automation all of it deploys onto.",
      'pt-BR':
        'A plataforma de tecnologia interna da universidade, construída do zero por um time pequeno: um service desk de TI em produção, um ERP substituindo os sistemas legados, um CRM assumido e reconstruído, dashboards administrativos e a automação de datacenter em que tudo isso é publicado.',
    },
    team: {
      en: 'Three engineers — two inherited on arrival, one hired in May 2026.',
      'pt-BR': 'Três engenheiros — dois herdados na chegada, um contratado em maio de 2026.',
    },
    practices: [
      {
        heading: { en: 'Work enters through one queue', 'pt-BR': 'O trabalho entra por uma fila só' },
        body: {
          en: 'Tasks and bugs go to Linear, which is also what the coding agents read to pick work up. One engineer owns each of the service desk, the ERP and the CRM; the lead is across all six systems.',
          'pt-BR':
            'Tarefas e bugs vão para o Linear, que é também de onde os agentes de código retiram trabalho. Um engenheiro cuida do service desk, outro do ERP e outro do CRM; a liderança atravessa os seis sistemas.',
        },
      },
      {
        heading: { en: 'The team specifies and reviews', 'pt-BR': 'O time especifica e revisa' },
        body: {
          en: 'Implementation is largely generated. What the three engineers spend their day on is writing the spec before the work starts and reviewing what comes back — the throughput came from moving human attention off typing, not from adding people.',
          'pt-BR':
            'A implementação é em boa parte gerada. O que os três engenheiros fazem no dia é escrever a especificação antes do trabalho começar e revisar o que volta — a vazão veio de deslocar a atenção humana da digitação, não de somar gente.',
        },
      },
      {
        heading: { en: 'Delivery is measured from the same queue', 'pt-BR': 'A entrega é medida da mesma fila' },
        body: {
          en: "A Metabase instance reads Linear through an ETL sidecar, so the team's own throughput is visible in the same place the systems' numbers are. The working model is instrumented rather than asserted.",
          'pt-BR':
            'Uma instância do Metabase lê o Linear por um sidecar de ETL, então a vazão do próprio time fica visível no mesmo lugar em que estão os números dos sistemas. O modelo de trabalho é instrumentado, não apenas afirmado.',
        },
      },
    ],
  },
];

export function ventureBySlug(slug: string): Venture | undefined {
  return ventures.find((venture) => venture.slug === slug);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/content/ventures.test.ts`
Expected: PASS, 5 tests.

- [ ] **Step 5: Commit**

```bash
git add web/src/content/ventures.ts web/src/content/ventures.test.ts
git commit -m "feat(content): a venture is an organization that contains projects"
```

---

### Task 2: Tag the existing ULBRA projects, and correct their role and period

**Files:**
- Modify: `web/src/content/projects.ts` — add `venture?: string` to `Project` (after line 128, beside `screenshot`); update `ulbra-atende` (line 775) and `ulbra-one` (line 1015)
- Modify: `web/src/content/content.test.ts` — add referential integrity and contiguity tests

**Interfaces:**
- Consumes: `ventures`, `ventureBySlug` from Task 1.
- Produces: `Project.venture?: string`. Every later task's project literal sets `venture: 'ulbra'`.

- [ ] **Step 1: Write the failing test**

Append to `web/src/content/content.test.ts`, and add `import { ventures } from './ventures';` to the imports at the top:

```ts
it('every project venture resolves to a real venture', () => {
  const slugs = new Set(ventures.map((v) => v.slug));
  for (const project of projects) {
    if (project.venture === undefined) continue;
    expect(slugs.has(project.venture), `${project.slug} points at unknown venture ${project.venture}`).toBe(true);
  }
});

it('projects sharing a venture are contiguous in the array', () => {
  // The index groups by walking the array in order, so a split run would
  // silently render two headers for one venture.
  const seen = new Set<string>();
  let previous: string | undefined;
  for (const project of projects) {
    if (project.venture !== previous) {
      if (project.venture !== undefined) {
        expect(seen.has(project.venture), `${project.venture} is split into two runs`).toBe(false);
        seen.add(project.venture);
      }
      previous = project.venture;
    }
  }
});

/*
  Replaces the per-slug list in `pulse is public with a repo link; ulbra
  projects are private with no repo link`, which named `ulbra-atende` and
  `ulbra-one` by hand and so would silently skip every project added after it.
  Delete the `for (const slug of ['ulbra-atende', 'ulbra-one'])` loop from that
  test and leave its `pulse` assertions in place.
*/
it('every venture project is private with no repository link', () => {
  const inVentures = projects.filter((p) => p.venture !== undefined);
  expect(inVentures.length).toBeGreaterThan(0);
  for (const project of inVentures) {
    expect(project.visibility, `${project.slug} visibility`).toBe('private');
    expect(
      project.links.some((l) => /github\.com|gitlab|repo/i.test(l.href)),
      `${project.slug} links to a repository`,
    ).toBe(false);
  }
});

it('every ulbra project is led as Head of Technology, not as a nameless engineer', () => {
  const ulbra = projects.filter((p) => p.venture === 'ulbra');
  expect(ulbra.length).toBeGreaterThan(0);
  for (const project of ulbra) {
    expect(project.role.en, `${project.slug} role`).toMatch(/head of technology/i);
    expect(project.period, `${project.slug} has no period`).toBeDefined();
    expect(project.period!.en, `${project.slug} period is a non-answer`).not.toMatch(/professional work/i);
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/content/content.test.ts`
Expected: FAIL — `every ulbra project is led as Head of Technology` fails with `expected 'Software engineer' to match /head of technology/i`.

- [ ] **Step 3: Write the implementation**

In `web/src/content/projects.ts`, add the field to `interface Project`, immediately after `screenshot?: string;`:

```ts
  /**
   * The venture this project was built inside, by slug. Absent for independent
   * work. Projects sharing a venture must be contiguous in this array — the
   * index groups by walking it in order.
   */
  venture?: string;
```

In the `ulbra-atende` literal, replace the `role` / `period` / `visibility` lines:

```ts
    role: { en: 'Head of Technology — design & implementation', 'pt-BR': 'Head de Tecnologia — design & implementação' },
    period: { en: 'Apr 2026 – Current', 'pt-BR': 'Abr 2026 – Atual' },
    venture: 'ulbra',
    visibility: 'private',
```

In the `ulbra-one` literal, replace the same three lines:

```ts
    role: { en: 'Head of Technology', 'pt-BR': 'Head de Tecnologia' },
    period: { en: 'Jun 2026 – Current', 'pt-BR': 'Jun 2026 – Atual' },
    venture: 'ulbra',
    visibility: 'private',
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/content/content.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add web/src/content/projects.ts web/src/content/content.test.ts
git commit -m "feat(content): tag the ULBRA projects with their venture and real role"
```

---

### Task 3: The grouping function

**Files:**
- Create: `web/src/lib/project-groups.ts`
- Test: `web/src/lib/project-groups.test.ts`

**Interfaces:**
- Consumes: `Project` from `web/src/content/projects.ts`.
- Produces: `type ProjectGroup`, `function groupProjects(projects: Project[]): ProjectGroup[]`. Task 4 renders its output; Task 11 reuses it for the static shell.

- [ ] **Step 1: Write the failing test**

Create `web/src/lib/project-groups.test.ts`:

```ts
import { expect, it } from 'vitest';
import { groupProjects } from './project-groups';
import { projects } from '@/content/projects';
import type { Project } from '@/content/projects';

function stub(slug: string, venture?: string): Project {
  return {
    slug,
    name: slug,
    tagline: { en: slug, 'pt-BR': slug },
    description: { en: slug, 'pt-BR': slug },
    tech: [],
    role: { en: 'role', 'pt-BR': 'role' },
    links: [],
    visibility: 'private',
    venture,
  };
}

it('a run of ungrouped projects becomes one standalone group', () => {
  const groups = groupProjects([stub('a'), stub('b')]);
  expect(groups).toHaveLength(1);
  expect(groups[0].kind).toBe('standalone');
  expect(groups[0].projects.map((p) => p.slug)).toEqual(['a', 'b']);
});

it('a run sharing a venture becomes one venture group carrying its slug', () => {
  const groups = groupProjects([stub('a', 'ulbra'), stub('b', 'ulbra')]);
  expect(groups).toHaveLength(1);
  expect(groups[0]).toMatchObject({ kind: 'venture', ventureSlug: 'ulbra' });
  expect(groups[0].projects.map((p) => p.slug)).toEqual(['a', 'b']);
});

it('groups keep array order and split at every boundary', () => {
  const groups = groupProjects([stub('a'), stub('b', 'ulbra'), stub('c', 'ulbra'), stub('d')]);
  expect(groups.map((g) => [g.kind, g.projects.map((p) => p.slug)])).toEqual([
    ['standalone', ['a']],
    ['venture', ['b', 'c']],
    ['standalone', ['d']],
  ]);
});

it('two different ventures never merge', () => {
  const groups = groupProjects([stub('a', 'ulbra'), stub('b', 'dietbox')]);
  expect(groups).toHaveLength(2);
});

it('an empty list produces no groups', () => {
  expect(groupProjects([])).toEqual([]);
});

it('every project survives the grouping exactly once', () => {
  const flattened = groupProjects(projects).flatMap((g) => g.projects.map((p) => p.slug));
  expect(flattened).toEqual(projects.map((p) => p.slug));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/lib/project-groups.test.ts`
Expected: FAIL — `Failed to resolve import "./project-groups"`.

- [ ] **Step 3: Write the implementation**

Create `web/src/lib/project-groups.ts`:

```ts
import type { Project } from '@/content/projects';

/**
 * A run of consecutive projects that render together: either loose cards, or
 * the projects of one venture under a shared header.
 */
export type ProjectGroup =
  | { kind: 'standalone'; projects: Project[] }
  | { kind: 'venture'; ventureSlug: string; projects: Project[] };

/**
 * Folds the flat, ordered project list into renderable runs.
 *
 * Order is preserved exactly, which is the point: the ULBRA group renders
 * where its projects already sit — after Dietbox, before the Dell tool — so
 * the chronological ordering the content tests assert survives the grouping.
 * A venture whose projects are not contiguous would produce two headers for
 * one venture; `content.test.ts` forbids that rather than this function
 * silently repairing it.
 */
export function groupProjects(projects: Project[]): ProjectGroup[] {
  const groups: ProjectGroup[] = [];

  for (const project of projects) {
    const last = groups.at(-1);
    const continues =
      last !== undefined &&
      (project.venture === undefined
        ? last.kind === 'standalone'
        : last.kind === 'venture' && last.ventureSlug === project.venture);

    if (continues) {
      last.projects.push(project);
      continue;
    }

    groups.push(
      project.venture === undefined
        ? { kind: 'standalone', projects: [project] }
        : { kind: 'venture', ventureSlug: project.venture, projects: [project] },
    );
  }

  return groups;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/lib/project-groups.test.ts`
Expected: PASS, 6 tests.

- [ ] **Step 5: Commit**

```bash
git add web/src/lib/project-groups.ts web/src/lib/project-groups.test.ts
git commit -m "feat(web): fold the project list into venture runs"
```

---

### Task 4: The venture section on `/projects`

**Files:**
- Create: `web/src/components/projects/venture-section.tsx`
- Test: `web/src/components/projects/venture-section.test.tsx`
- Modify: `web/src/routes/projects.tsx`
- Modify: `web/src/i18n/locales/en/projects.json`, `web/src/i18n/locales/pt-BR/projects.json`

**Interfaces:**
- Consumes: `groupProjects`, `ProjectGroup` (Task 3); `Venture`, `ventureBySlug` (Task 1); the existing `ProjectCard`, `CaseStudyDecisions`, `SubsectionHeading`.
- Produces: `VentureSection({ venture, projects })`.

- [ ] **Step 1: Write the failing test**

Create `web/src/components/projects/venture-section.test.tsx`.

`VentureSection` renders `ProjectCard`, which renders a TanStack `<Link>`, so the component needs a router in the test — and it calls `useTranslation`, so it needs the i18n provider. Both come from the harness `project-card.test.tsx` already uses in this directory: `renderWithI18n` from `@/test/render-with-i18n`, wrapped around a `RouterProvider` built with a memory history. A bare `render()` from `@testing-library/react` throws.

```tsx
import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithI18n } from '@/test/render-with-i18n';
import { VentureSection } from './venture-section';
import type { Venture } from '@/content/ventures';
import type { Project } from '@/content/projects';

const venture: Venture = {
  slug: 'ulbra',
  name: 'ULBRA',
  url: 'https://www.ulbra.br',
  role: { en: 'Head of Technology', 'pt-BR': 'Head de Tecnologia' },
  period: { en: 'Apr 2026 – Current', 'pt-BR': 'Abr 2026 – Atual' },
  engagement: { en: 'Client of Pampa Devs', 'pt-BR': 'Cliente da Pampa Devs' },
  summary: { en: 'The internal platform.', 'pt-BR': 'A plataforma interna.' },
  team: { en: 'Three engineers.', 'pt-BR': 'Três engenheiros.' },
  practices: [
    {
      heading: { en: 'One queue', 'pt-BR': 'Uma fila' },
      body: { en: 'Work enters through Linear.', 'pt-BR': 'O trabalho entra pelo Linear.' },
    },
  ],
};

const project: Project = {
  slug: 'ulbra-atende',
  name: 'Ulbra Atende',
  tagline: { en: 'Service desk.', 'pt-BR': 'Service desk.' },
  description: { en: 'A service desk.', 'pt-BR': 'Um service desk.' },
  tech: ['.NET 10'],
  role: { en: 'Head of Technology', 'pt-BR': 'Head de Tecnologia' },
  links: [],
  visibility: 'private',
  venture: 'ulbra',
};

function renderSection(v: Venture = venture) {
  const rootRoute = createRootRoute({
    component: () => <VentureSection venture={v} projects={[project]} />,
  });
  const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', component: () => null });
  const detailRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/projects/$slug',
    component: () => null,
  });
  const routeTree = rootRoute.addChildren([indexRoute, detailRoute]);
  const router = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: ['/'] }) });

  return renderWithI18n(<RouterProvider router={router} />);
}

describe('VentureSection', () => {
  it('names the venture and links it', async () => {
    await renderSection();
    const link = await screen.findByRole('link', { name: 'ULBRA' });
    expect(link).toHaveAttribute('href', 'https://www.ulbra.br');
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('states the engagement, so the reader does not read it as employment', async () => {
    await renderSection();
    expect(await screen.findByText(/client of pampa devs/i)).toBeInTheDocument();
  });

  it('renders the venture practices', async () => {
    await renderSection();
    expect(await screen.findByText('One queue')).toBeInTheDocument();
    expect(screen.getByText('Work enters through Linear.')).toBeInTheDocument();
  });

  it('renders a card per project', async () => {
    await renderSection();
    expect(await screen.findByRole('heading', { name: 'Ulbra Atende' })).toBeInTheDocument();
  });

  it('renders the name as plain text when the venture has no url', async () => {
    await renderSection({ ...venture, url: undefined });
    expect(screen.queryByRole('link', { name: 'ULBRA' })).not.toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'ULBRA' })).toBeInTheDocument();
  });

  it('keeps one heading level between the venture and its practices', async () => {
    await renderSection();
    // h1 (page) → h2 (venture) → h3 (each practice). The practices label is
    // deliberately not a heading, so it cannot collide with the venture's h2.
    expect(await screen.findByRole('heading', { level: 2, name: 'ULBRA' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'One queue' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /how the team works/i })).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/components/projects/venture-section.test.tsx`
Expected: FAIL — `Failed to resolve import "./venture-section"`.

- [ ] **Step 3: Add the i18n key**

In `web/src/i18n/locales/en/projects.json`, add after `"leadershipHeading"`:

```json
  "venturePracticesHeading": "How the team works",
```

In `web/src/i18n/locales/pt-BR/projects.json`, add the same key in the same position:

```json
  "venturePracticesHeading": "Como o time trabalha",
```

- [ ] **Step 4: Write the implementation**

Create `web/src/components/projects/venture-section.tsx`:

```tsx
import { useTranslation } from 'react-i18next';
import { CaseStudyDecisions } from '@/components/projects/case-study-decisions';
import { ProjectCard } from '@/components/projects/project-card';
import type { Project } from '@/content/projects';
import type { Venture } from '@/content/ventures';
import { useLocalized } from '@/i18n/use-localized';

export interface VentureSectionProps {
  venture: Venture;
  projects: Project[];
}

/**
 * One venture's projects under a shared header.
 *
 * The header exists because six cards from one client, dropped loose into the
 * grid, read as six unrelated systems and drown the rest of the portfolio. It
 * carries what the cards individually cannot: whose organization this is, on
 * what terms, and how a team of three shipped all of it.
 *
 * `engagement` is rendered next to the name rather than buried in the summary.
 * A reader scanning the page should not have to infer that this is a client of
 * the author's studio rather than an employer.
 */
export function VentureSection({ venture, projects }: VentureSectionProps) {
  const { t } = useTranslation('projects');
  const L = useLocalized();

  return (
    <section aria-label={venture.name} className="flex flex-col gap-6 rounded-2xl border border-signal/15 bg-signal-muted/5 p-6 sm:p-8">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            {venture.url ? (
              <a
                href={venture.url}
                target="_blank"
                rel="noreferrer"
                className="transition-colors hover:text-signal-strong"
              >
                {venture.name}
              </a>
            ) : (
              venture.name
            )}
          </h2>
          {venture.engagement ? (
            <span className="rounded-full border border-signal/30 px-2.5 py-0.5 font-mono text-xs text-muted-foreground">
              {L(venture.engagement)}
            </span>
          ) : null}
        </div>

        <p className="font-mono text-xs text-muted-foreground">
          {L(venture.role)} · {L(venture.period)}
          {venture.team ? ` · ${L(venture.team)}` : ''}
        </p>

        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">{L(venture.summary)}</p>
      </div>

      {venture.practices ? (
        <div className="flex flex-col gap-3">
          {/*
            A label, not a heading. The venture's name is this section's `<h2>`
            and `CaseStudyDecisions` emits an `<h3>` per practice, so a second
            `<h2>` here would put a group label at the same outline level as
            the thing it groups.
          */}
          <p className="font-mono text-xs tracking-wide text-muted-foreground uppercase">
            {t('projects:venturePracticesHeading')}
          </p>
          <CaseStudyDecisions sections={venture.practices} />
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {projects.map((project) => (
          <ProjectCard key={project.slug} project={project} />
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm vitest run src/components/projects/venture-section.test.tsx`
Expected: PASS, 5 tests.

- [ ] **Step 6: Wire it into the route**

Replace the grid block in `web/src/routes/projects.tsx` (lines 25–33) with:

```tsx
        <div className="flex flex-col gap-10">
          {groupProjects(projects).map((group, index) =>
            group.kind === 'venture' ? (
              <VentureSection
                key={group.ventureSlug}
                venture={ventureBySlug(group.ventureSlug)!}
                projects={group.projects}
              />
            ) : (
              <div key={`standalone-${index}`} className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {group.projects.map((project) => (
                  <ProjectCard
                    key={project.slug}
                    project={project}
                    className={project.slug === FEATURED_PROJECT_SLUG ? 'md:col-span-2' : undefined}
                  />
                ))}
              </div>
            ),
          )}
        </div>
```

Add to the imports at the top of the same file:

```tsx
import { VentureSection } from '@/components/projects/venture-section';
import { ventureBySlug } from '@/content/ventures';
import { groupProjects } from '@/lib/project-groups';
```

- [ ] **Step 7: Run the whole suite**

Run: `pnpm test`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add web/src/components/projects/venture-section.tsx web/src/components/projects/venture-section.test.tsx web/src/routes/projects.tsx web/src/i18n/locales/en/projects.json web/src/i18n/locales/pt-BR/projects.json
git commit -m "feat(web): group a venture's projects under one header"
```

---

### Task 5: ULBRA on the About timeline

**Files:**
- Modify: `web/src/content/profile.ts` — new first `experience` entry, `bio`, the Leadership skill group
- Modify: `web/src/content/content.test.ts` — rewrite the open-ended-period test (line 60), extend the side-venture label test (line 37)

**Interfaces:**
- Consumes: nothing new.
- Produces: the ULBRA row. Task 11 quotes the same facts into `profile.md` and the FAQ.

- [ ] **Step 1: Write the failing test**

In `web/src/content/content.test.ts`, replace the whole `only the current role has an open-ended period` test with:

```ts
/**
 * Two roles are open-ended at once and both are true: ULBRA is a client of
 * Pampa Devs, so the studio engagement and the Head of Technology mandate run
 * simultaneously. What is still worth asserting is that every *closed* role
 * carries a real date range rather than a word like "Recent".
 */
it('open-ended periods end in Current; every closed role carries real dates', () => {
  const isOpenEnded = (period: string) => /(^|– )Current$/.test(period);

  const open = profile.experience.filter((e) => isOpenEnded(e.period.en));
  expect(open.length, 'at least one role is current').toBeGreaterThan(0);
  expect(profile.experience[0], 'a current role leads the timeline').toBe(open[0]);

  for (const entry of profile.experience.filter((e) => !isOpenEnded(e.period.en))) {
    expect(entry.period.en, `${entry.org} has no dated period`).toMatch(
      /^[A-Z][a-z]{2} \d{4} – [A-Z][a-z]{2} \d{4}$/,
    );
  }
});

it('ULBRA is on the timeline, named as an engagement rather than a ninth employer', () => {
  const ulbra = profile.experience.find((e) => e.org === 'ULBRA');
  expect(ulbra, 'the ULBRA mandate is on the timeline').toBeDefined();
  expect(ulbra!.role.en, 'the role must name whose engagement this is').toMatch(/pampa devs/i);
  expect(ulbra!.role['pt-BR']).toMatch(/pampa devs/i);
  expect(ulbra!.url).toBe('https://www.ulbra.br');
});

it('the bio names the current mandate', () => {
  expect(profile.bio.en).toMatch(/ulbra/i);
  expect(profile.bio['pt-BR']).toMatch(/ulbra/i);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/content/content.test.ts`
Expected: FAIL — `the ULBRA mandate is on the timeline` fails with `expected undefined not to be undefined`.

- [ ] **Step 3: Write the implementation**

In `web/src/content/profile.ts`, insert as the **first** element of `experience` (before the Pampa Devs entry at line 103):

```ts
    /*
      ULBRA is a client of Pampa Devs, not a ninth employer — the role says so,
      the same way the ROLÊ row says "side venture". Both rows are open-ended
      because both are true at once: the studio holds the contract and this is
      the mandate inside it.

      The period starts in April rather than at the May contract date because
      the first commits — `infra` on 9 Apr, the service desk on 18 Apr — are
      the author's own, and a timeline that postdates its own evidence is the
      one thing a checkable page must not do.
    */
    {
      role: {
        en: 'Head of Technology (engagement via Pampa Devs)',
        'pt-BR': 'Head de Tecnologia (contrato via Pampa Devs)',
      },
      org: 'ULBRA',
      url: 'https://www.ulbra.br',
      period: { en: 'Apr 2026 – Current', 'pt-BR': 'Abr 2026 – Atual' },
      summary: {
        en: "Leads a three-engineer team building the university's internal platform from scratch — an IT service desk in production, an ERP replacing the legacy systems, a CRM taken over and rebuilt to full test coverage, administrative dashboards for the board, and the datacenter automation all of it deploys onto. Introduced a spec-first, AI-assisted delivery model in which the team's time goes to specification and code review.",
        'pt-BR':
          'Lidera um time de três engenheiros construindo do zero a plataforma interna da universidade — um service desk de TI em produção, um ERP substituindo os sistemas legados, um CRM assumido e reconstruído até cobertura total de testes, dashboards administrativos para a diretoria e a automação de datacenter em que tudo isso é publicado. Introduziu um modelo de entrega assistido por IA e guiado por especificação, em que o tempo do time vai para especificar e revisar código.',
      },
    },
```

Replace the last sentence of `bio.en` — `'Currently freelancing through Pampa Devs — his software studio — and open to new roles.'` — with:

```
Currently freelancing through Pampa Devs — his software studio — where he is Head of Technology for ULBRA, leading three engineers across the university's internal platform, and open to new roles.
```

And the matching `bio['pt-BR']` sentence — `'Atualmente atuando como freelancer pela Pampa Devs — seu estúdio de software — e aberto a novas oportunidades.'` — with:

```
Atualmente atuando como freelancer pela Pampa Devs — seu estúdio de software —, onde é Head de Tecnologia da ULBRA, liderando três engenheiros na plataforma interna da universidade, e aberto a novas oportunidades.
```

In the Leadership skills group (line 92), add one item after `'DORA metrics'`:

```ts
        'AI-assisted delivery',
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/content/content.test.ts`
Expected: PASS.

- [ ] **Step 5: Check the About page tests still hold**

Run: `pnpm vitest run src/routes/about.test.tsx`
Expected: PASS. If a test asserts an exact timeline row count, update the number — a new row is the intended change.

- [ ] **Step 6: Commit**

```bash
git add web/src/content/profile.ts web/src/content/content.test.ts
git commit -m "feat(web): put the ULBRA mandate on the timeline"
```

---

### Task 6: Ulbra One — correct the status, and write the case study

**Files:**
- Modify: `web/src/content/projects.ts` — the `ulbra-one` literal (line 1015)
- Modify: `web/src/content/content.test.ts` — remove the `ulbra-one` exception (line 241)

**Interfaces:**
- Consumes: `ProjectDetailContent`, `ProjectContribution`, `CaseStudySection` — all already in `projects.ts`.
- Produces: nothing later tasks depend on.

- [ ] **Step 1: Write the failing test**

In `web/src/content/content.test.ts`, replace the `every project except ulbra-one states what the author did` test with:

```ts
it('every project states what the author did', () => {
  for (const project of projects) {
    const contribution = project.detail?.contribution;
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

it('ulbra-one is described as pre-launch, not as delivered', () => {
  const one = projects.find((p) => p.slug === 'ulbra-one')!;
  expect(one.detail!.overview!.en).toMatch(/testing|pre-launch|not yet/i);
  expect(one.detail!.metrics, 'no production metrics before production').toBeUndefined();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/content/content.test.ts`
Expected: FAIL — `ulbra-one has no contribution`.

- [ ] **Step 3: Write the implementation**

Replace the `ulbra-one` `description` and `detail` in `web/src/content/projects.ts` with:

```ts
    description: {
      en: 'An internal ERP replacing the university’s legacy systems — a modular .NET monolith on PostgreSQL with a React front end. In testing, ahead of launch.',
      'pt-BR':
        'Um ERP interno substituindo os sistemas legados da universidade — um monólito modular em .NET sobre PostgreSQL com front-end em React. Em teste, antes do lançamento.',
    },
    tech: ['.NET 10', 'PostgreSQL 17', 'EF Core', 'React', 'Tailwind', 'shadcn/ui'],
    role: { en: 'Head of Technology', 'pt-BR': 'Head de Tecnologia' },
    period: { en: 'Jun 2026 – Current', 'pt-BR': 'Jun 2026 – Atual' },
    venture: 'ulbra',
    visibility: 'private',
    screenshot: '/screenshots/ulbra-one.png',
    links: [],
    detail: {
      overview: {
        en: 'An internal ERP built to take the university off its legacy systems — a modular .NET 10 monolith on PostgreSQL 17 with a React front end, covering core internal business operations. It is in testing, ahead of launch, so this describes what has been built rather than what is running.',
        'pt-BR':
          'Um ERP interno construído para tirar a universidade dos sistemas legados — um monólito modular em .NET 10 sobre PostgreSQL 17 com front-end em React, cobrindo as operações internas centrais. Está em teste, antes do lançamento, então o que segue descreve o que foi construído, não o que está em produção.',
      },
      contribution: {
        summary: {
          en: 'Set the architecture and the conventions, and built alongside one engineer who carries the day-to-day of this codebase.',
          'pt-BR':
            'Definiu a arquitetura e as convenções e construiu junto com um engenheiro que toca o dia a dia deste código.',
        },
        areas: [
          {
            en: 'The module boundaries, and the conventions carried over from the service desk.',
            'pt-BR': 'As fronteiras entre módulos e as convenções trazidas do service desk.',
          },
          {
            en: 'The PostgreSQL schema and the code-first migration path.',
            'pt-BR': 'O schema PostgreSQL e o caminho de migrations code-first.',
          },
          {
            en: 'Review of every change into the codebase.',
            'pt-BR': 'Revisão de toda mudança que entra no código.',
          },
        ],
        boundary: {
          en: 'One engineer owns this codebase day to day; much of the implementation is theirs.',
          'pt-BR':
            'Um engenheiro cuida deste código no dia a dia; boa parte da implementação é dele.',
        },
      },
      problem: {
        en: 'The university runs its internal operations on licensed legacy systems that neither its data nor its processes fit well. Ulbra One is the platform meant to replace them, built in-house so that the business rules live somewhere the team can change.',
        'pt-BR':
          'A universidade opera seus processos internos sobre sistemas legados licenciados em que nem os dados nem os processos se encaixam bem. O Ulbra One é a plataforma que deve substituí-los, construída em casa para que as regras de negócio fiquem onde o time pode mudá-las.',
      },
      highlights: [
        {
          en: 'A modular monolith organized by business domain rather than by technical layer.',
          'pt-BR': 'Um monólito modular organizado por domínio de negócio, não por camada técnica.',
        },
        {
          en: 'PostgreSQL via EF Core, code-first, with snake_case naming applied by convention rather than by attribute.',
          'pt-BR':
            'PostgreSQL via EF Core, code-first, com nomenclatura snake_case aplicada por convenção e não por atributo.',
        },
        {
          en: 'A React and Tailwind front end sharing the design tokens of the service desk.',
          'pt-BR': 'Front-end React e Tailwind compartilhando os design tokens do service desk.',
        },
        {
          en: 'Migrations run on startup, so an environment is never a manual step behind the code.',
          'pt-BR':
            'As migrations rodam na inicialização, então nenhum ambiente fica um passo manual atrás do código.',
        },
      ],
      decisions: [
        {
          heading: {
            en: 'The same conventions as the service desk, deliberately',
            'pt-BR': 'As mesmas convenções do service desk, de propósito',
          },
          body: {
            en: 'Endpoint shape, result type and migration strategy are copied from Ulbra Atende rather than reconsidered. With three engineers across six systems, an engineer moving between two codebases should not be learning a second set of rules — the consistency is worth more than any local improvement either codebase might have made alone.',
            'pt-BR':
              'Formato de endpoint, tipo de retorno e estratégia de migration são copiados do Ulbra Atende em vez de repensados. Com três engenheiros para seis sistemas, quem troca de código não deveria estar aprendendo um segundo conjunto de regras — a consistência vale mais do que qualquer melhoria local que um dos dois pudesse ter feito sozinho.',
          },
        },
        {
          heading: {
            en: 'A modular monolith, not services',
            'pt-BR': 'Um monólito modular, não serviços',
          },
          body: {
            en: 'An ERP is a set of tightly related domains that transact together. Splitting it into services would buy independent deployment at the cost of distributed transactions across modules that genuinely need consistency — and there is no team here to operate that. Modules give the boundaries; the single process keeps the transactions.',
            'pt-BR':
              'Um ERP é um conjunto de domínios fortemente relacionados que transacionam juntos. Quebrá-lo em serviços compraria deploy independente ao custo de transações distribuídas entre módulos que realmente precisam de consistência — e não há time aqui para operar isso. Os módulos dão as fronteiras; o processo único mantém as transações.',
          },
        },
      ],
    },
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/content/content.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add web/src/content/projects.ts web/src/content/content.test.ts
git commit -m "feat(projects): Ulbra One as a case study, and pre-launch rather than shipped"
```

---

### Task 7: Ulbra CRM

**Files:**
- Modify: `web/src/content/projects.ts` — new literal, inserted immediately after `ulbra-one`
- Modify: `web/src/content/content.test.ts` — assert the boundary names the team

**Interfaces:**
- Consumes: the same detail types.
- Produces: slug `ulbra-crm`.

- [ ] **Step 1: Write the failing test**

Append to `web/src/content/content.test.ts`:

```ts
it('ulbra-crm names the work as the team’s, not the author’s', () => {
  const crm = projects.find((p) => p.slug === 'ulbra-crm');
  expect(crm, 'the CRM is published').toBeDefined();
  const boundary = crm!.detail!.contribution!.boundary!;
  expect(boundary.en, 'the boundary must say the team implemented it').toMatch(/team|engineers/i);
  expect(crm!.detail!.contribution!.summary.en).toMatch(/direct|led|set/i);
});

it('ulbra-crm carries the coverage figure, the one real number it has', () => {
  const metrics = projects.find((p) => p.slug === 'ulbra-crm')!.detail!.metrics!;
  expect(metrics.length).toBeGreaterThan(0);
  expect(metrics.some((m) => /100%/.test(m.value.en))).toBe(true);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/content/content.test.ts`
Expected: FAIL — `the CRM is published: expected undefined not to be undefined`.

- [ ] **Step 3: Write the implementation**

Insert into `web/src/content/projects.ts`, immediately after the closing `},` of the `ulbra-one` literal:

```ts
  {
    slug: 'ulbra-crm',
    name: 'Ulbra CRM',
    tagline: {
      en: 'An inherited CRM taken from no tests to full coverage.',
      'pt-BR': 'Um CRM herdado levado de zero testes a cobertura total.',
    },
    description: {
      en: "The university's CRM platform, inherited with no automated tests and little structure. Rebuilt under the author's direction to full test coverage, with a front-end migration that stopped every screen change from throwing away the user's filters.",
      'pt-BR':
        'A plataforma de CRM da universidade, herdada sem testes automatizados e com pouca estrutura. Reconstruída sob a direção do autor até cobertura total de testes, com uma migração de front-end que acabou com a perda dos filtros do usuário a cada troca de tela.',
    },
    tech: ['React', 'TanStack Router', 'MongoDB', 'Docker Swarm'],
    role: { en: 'Head of Technology — direction & review', 'pt-BR': 'Head de Tecnologia — direção & revisão' },
    period: { en: 'Apr 2026 – Current', 'pt-BR': 'Abr 2026 – Atual' },
    venture: 'ulbra',
    visibility: 'private',
    links: [],
    detail: {
      overview: {
        en: "The CRM the university runs on, inherited rather than built: no automated tests, and a codebase whose structure had not kept up with it. It is now fully covered by tests and materially better to use, and the work was done by the team under the author's direction — he set the direction and reviewed it, and did not write it.",
        'pt-BR':
          'O CRM em que a universidade opera, herdado e não construído: sem testes automatizados e com uma estrutura que não acompanhou o próprio crescimento. Hoje está totalmente coberto por testes e sensivelmente melhor de usar, e o trabalho foi feito pelo time sob a direção do autor — ele definiu a direção e revisou, não escreveu.',
      },
      contribution: {
        summary: {
          en: 'Set the direction and reviewed the work; the engineering was the team’s.',
          'pt-BR': 'Definiu a direção e revisou o trabalho; a engenharia foi do time.',
        },
        areas: [
          {
            en: 'The decision to cover the codebase with tests before changing its behaviour.',
            'pt-BR': 'A decisão de cobrir o código com testes antes de mudar seu comportamento.',
          },
          {
            en: 'The routing migration that made filter state survive navigation.',
            'pt-BR': 'A migração de rotas que fez o estado dos filtros sobreviver à navegação.',
          },
          { en: 'Review of the work as it landed.', 'pt-BR': 'Revisão do trabalho conforme entrava.' },
        ],
        boundary: {
          en: 'None of this implementation is the author’s. It was built by the engineers on the team; his part was deciding what to do and reviewing what came back.',
          'pt-BR':
            'Nada desta implementação é do autor. Foi construída pelos engenheiros do time; a parte dele foi decidir o que fazer e revisar o que voltava.',
        },
      },
      problem: {
        en: 'The CRM arrived with no automated tests at all, which made every change a gamble, and with usability debt that the people using it every day absorbed silently. The worst of it: changing screens reloaded the application, so the filters someone had just set were gone. Work that goes through the same three or four filters all day pays that cost on every navigation.',
        'pt-BR':
          'O CRM chegou sem nenhum teste automatizado, o que tornava toda mudança uma aposta, e com uma dívida de usabilidade que quem usava todo dia absorvia em silêncio. O pior sintoma: trocar de tela recarregava a aplicação, então os filtros recém-configurados sumiam. Um trabalho que passa pelos mesmos três ou quatro filtros o dia inteiro paga esse custo a cada navegação.',
      },
      metrics: [
        {
          value: { en: '0% → 100%', 'pt-BR': '0% → 100%' },
          label: { en: 'test coverage', 'pt-BR': 'cobertura de testes' },
        },
        {
          value: { en: '0', 'pt-BR': '0' },
          label: { en: 'filter resets per navigation', 'pt-BR': 'perdas de filtro por navegação' },
          note: { en: 'was: every one', 'pt-BR': 'antes: todas' },
        },
      ],
      decisions: [
        {
          heading: { en: 'Tests first, behaviour second', 'pt-BR': 'Primeiro os testes, depois o comportamento' },
          body: {
            en: 'The codebase was unstructured and untested, and the temptation with both is to restructure first. The order was inverted: cover the existing behaviour, then change it. Coverage on code nobody has changed yet is what makes the later restructuring safe rather than hopeful — and it is the reason the number is worth quoting.',
            'pt-BR':
              'O código estava desestruturado e sem testes, e a tentação diante dos dois é reestruturar primeiro. A ordem foi invertida: cobrir o comportamento existente e só então mudá-lo. Cobertura sobre código que ninguém mexeu ainda é o que torna a reestruturação posterior segura em vez de esperançosa — e é a razão de o número valer a pena ser citado.',
          },
        },
        {
          heading: { en: 'Routing as state, not as navigation', 'pt-BR': 'Rotas como estado, não como navegação' },
          body: {
            en: 'Moving to a router that holds application state in the route turned filters from something the page owned into something the URL owned. The visible win is that a screen change no longer discards them; the quieter one is that a filtered view became a link somebody can send to a colleague.',
            'pt-BR':
              'Migrar para um roteador que guarda o estado da aplicação na própria rota transformou os filtros de algo que a página possuía em algo que a URL possui. O ganho visível é que trocar de tela não os descarta mais; o silencioso é que uma visão filtrada virou um link que alguém pode mandar para um colega.',
          },
        },
        {
          heading: { en: 'Directed, not written', 'pt-BR': 'Dirigido, não escrito' },
          body: {
            en: 'This is the one system in the group the author did not build. With three engineers and six systems, the lead’s leverage is in deciding what gets done and reviewing what comes back, not in adding a fourth pair of hands to a codebase that already has an owner.',
            'pt-BR':
              'Este é o único sistema do grupo que o autor não construiu. Com três engenheiros e seis sistemas, a alavanca da liderança está em decidir o que é feito e revisar o que volta, não em somar um quarto par de mãos a um código que já tem dono.',
          },
        },
      ],
    },
  },
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/content/content.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add web/src/content/projects.ts web/src/content/content.test.ts
git commit -m "feat(projects): Ulbra CRM, directed rather than written"
```

---

### Task 8: Ulbra Admin

**Files:**
- Modify: `web/src/content/projects.ts` — new literal, immediately after `ulbra-crm`

**Interfaces:**
- Consumes: the same detail types. Produces slug `ulbra-admin`.

- [ ] **Step 1: Write the failing test**

Append to `web/src/content/content.test.ts`:

```ts
it('ulbra-admin explains why it is architecturally the opposite of the service desk', () => {
  const admin = projects.find((p) => p.slug === 'ulbra-admin');
  expect(admin, 'the admin platform is published').toBeDefined();
  const decisions = admin!.detail!.decisions!;
  expect(decisions.length).toBeGreaterThan(0);
  const bodies = decisions.map((d) => d.body.en).join(' ');
  expect(bodies, 'the simplicity decision states its reason').toMatch(/no modules|no ddd|simple/i);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/content/content.test.ts`
Expected: FAIL — `the admin platform is published: expected undefined not to be undefined`.

- [ ] **Step 3: Write the implementation**

Insert into `web/src/content/projects.ts` immediately after the `ulbra-crm` literal:

```ts
  {
    slug: 'ulbra-admin',
    name: 'Ulbra Admin',
    tagline: {
      en: 'The numbers the board runs the university on.',
      'pt-BR': 'Os números com que a diretoria conduz a universidade.',
    },
    description: {
      en: 'Administrative dashboards for the presidency and the board, reading enrollment from the legacy Oracle system through a typed API and prospect data from the CRM — deliberately the simplest architecture in the group.',
      'pt-BR':
        'Dashboards administrativos para a presidência e a diretoria, lendo matrícula do sistema Oracle legado através de uma API tipada e dados de captação do CRM — deliberadamente a arquitetura mais simples do grupo.',
    },
    tech: ['.NET 10', 'React 19', 'PostgreSQL', 'MongoDB', 'TanStack Router', 'Docker Swarm'],
    role: { en: 'Head of Technology — design & implementation', 'pt-BR': 'Head de Tecnologia — design & implementação' },
    period: { en: 'Aug 2026 – Current', 'pt-BR': 'Ago 2026 – Atual' },
    venture: 'ulbra',
    visibility: 'private',
    links: [],
    detail: {
      overview: {
        en: 'The dashboards the presidency and the board use to check the university’s numbers. A .NET 10 API and a React 19 front end that read two systems neither of them owns: prospect data from the CRM, and confirmed enrollment from the legacy Oracle platform through a typed HTTP client rather than a database connection.',
        'pt-BR':
          'Os dashboards que a presidência e a diretoria usam para conferir os números da universidade. Uma API em .NET 10 e um front-end React 19 que leem dois sistemas que não lhes pertencem: dados de captação vindos do CRM e matrícula confirmada da plataforma Oracle legada, por um cliente HTTP tipado e não por conexão de banco.',
      },
      contribution: {
        summary: {
          en: 'Built it end to end — the API, the integrations, the front end and the deployment.',
          'pt-BR': 'Construiu de ponta a ponta — a API, as integrações, o front-end e o deploy.',
        },
        areas: [
          { en: 'The read-only integration with the CRM’s datastore.', 'pt-BR': 'A integração somente-leitura com a base do CRM.' },
          { en: 'The typed client that fronts the legacy enrollment system.', 'pt-BR': 'O cliente tipado que fica à frente do sistema legado de matrícula.' },
          { en: 'The dashboards themselves and the React front end.', 'pt-BR': 'Os próprios dashboards e o front-end React.' },
          { en: 'Authentication and the Swarm deployment.', 'pt-BR': 'Autenticação e o deploy em Swarm.' },
        ],
      },
      problem: {
        en: 'The people accountable for the university’s numbers could not see them without asking. Enrollment lived in a legacy platform, prospects lived in the CRM, and reconciling the two meant a request to IT and a spreadsheet that was stale by the time it arrived. The question being asked was not complicated; the answer was just never at hand.',
        'pt-BR':
          'Quem responde pelos números da universidade não conseguia vê-los sem pedir. A matrícula ficava numa plataforma legada, a captação no CRM, e cruzar as duas significava um chamado para a TI e uma planilha que já chegava desatualizada. A pergunta não era complicada; a resposta é que nunca estava à mão.',
      },
      highlights: [
        {
          en: 'Prospect and enrollment figures side by side, from the two systems that own them.',
          'pt-BR': 'Números de captação e de matrícula lado a lado, vindos dos dois sistemas que os detêm.',
        },
        {
          en: 'Reads the CRM’s datastore strictly read-only — the dashboards can never corrupt the system of record.',
          'pt-BR':
            'Lê a base do CRM estritamente em modo leitura — os dashboards não têm como corromper o sistema de origem.',
        },
        {
          en: 'Single sign-on, so access follows the accounts the university already manages.',
          'pt-BR': 'Login único, então o acesso segue as contas que a universidade já administra.',
        },
        {
          en: 'The same design tokens as the service desk, so six systems read as one platform.',
          'pt-BR': 'Os mesmos design tokens do service desk, para que seis sistemas leiam como uma plataforma só.',
        },
      ],
      architecture: {
        summary: {
          en: 'Two sources, neither of them owned by this system, behind one API.',
          'pt-BR': 'Duas fontes, nenhuma delas própria deste sistema, atrás de uma API.',
        },
        steps: [
          { label: 'CRM store', detail: { en: 'Prospect and pipeline data, read-only.', 'pt-BR': 'Dados de captação e funil, somente leitura.' } },
          { label: 'Enrollment API', detail: { en: 'A typed HTTP client over the legacy platform — never the database directly.', 'pt-BR': 'Um cliente HTTP tipado sobre a plataforma legada — nunca o banco diretamente.' } },
          { label: 'Admin API', detail: { en: 'Joins the two and serves the dashboards.', 'pt-BR': 'Junta as duas e serve os dashboards.' } },
          { label: 'Dashboards', detail: { en: 'What the board actually looks at.', 'pt-BR': 'O que a diretoria de fato olha.' } },
        ],
      },
      decisions: [
        {
          heading: {
            en: 'Deliberately the simplest architecture in the group',
            'pt-BR': 'Deliberadamente a arquitetura mais simples do grupo',
          },
          body: {
            en: 'Single project, no modules, no DDD — written into the codebase as a rule, in a house whose service desk is a modular monolith. This system owns almost no domain: it reads two other systems and draws charts. Giving it aggregates and bounded contexts would be ceremony around a query. The architecture is chosen per problem, and the honest answer here was "less".',
            'pt-BR':
              'Projeto único, sem módulos, sem DDD — escrito no código como regra, numa casa cujo service desk é um monólito modular. Este sistema quase não tem domínio próprio: ele lê dois outros sistemas e desenha gráficos. Dar-lhe agregados e contextos delimitados seria cerimônia em volta de uma consulta. A arquitetura é escolhida por problema, e a resposta honesta aqui era "menos".',
          },
        },
        {
          heading: {
            en: 'Never query the legacy database directly',
            'pt-BR': 'Nunca consultar o banco legado diretamente',
          },
          body: {
            en: 'Enrollment could have been read straight from the legacy platform’s database, and it would have been faster to write. It goes through a typed API instead, so the definition of "an enrolled student" lives in one place rather than being reimplemented in a SQL query — and so the day the legacy platform is replaced, one client changes rather than every consumer of it.',
            'pt-BR':
              'A matrícula poderia ser lida direto do banco da plataforma legada, e teria sido mais rápido de escrever. Ela passa por uma API tipada, para que a definição de "aluno matriculado" viva em um lugar só em vez de ser reimplementada numa consulta SQL — e para que, no dia em que a plataforma legada for substituída, mude um cliente e não todos os consumidores.',
          },
        },
        {
          heading: { en: 'Read-only by construction', 'pt-BR': 'Somente leitura por construção' },
          body: {
            en: 'The connection to the CRM’s datastore is read-only, not by convention but by the credentials it holds. A reporting system that can write to the system of record is one bug away from corrupting the numbers it exists to report.',
            'pt-BR':
              'A conexão com a base do CRM é somente leitura, não por convenção mas pelas credenciais que ela carrega. Um sistema de relatórios capaz de escrever no sistema de origem está a um bug de corromper os números que existe para reportar.',
          },
        },
      ],
    },
  },
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/content/content.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add web/src/content/projects.ts web/src/content/content.test.ts
git commit -m "feat(projects): Ulbra Admin, and why it is the simplest system in the group"
```

---

### Task 9: Student Dashboard

**Files:**
- Modify: `web/src/content/projects.ts` — new literal, immediately after `ulbra-admin`

**Interfaces:**
- Consumes: the same detail types. Produces slug `ulbra-student-dashboard`.

- [ ] **Step 1: Write the failing test**

Append to `web/src/content/content.test.ts`:

```ts
it('the student dashboard says where it is actually installed', () => {
  const dashboard = projects.find((p) => p.slug === 'ulbra-student-dashboard');
  expect(dashboard, 'the student dashboard is published').toBeDefined();
  expect(dashboard!.detail!.overview!.en).toMatch(/medic/i);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/content/content.test.ts`
Expected: FAIL — `the student dashboard is published: expected undefined not to be undefined`.

- [ ] **Step 3: Write the implementation**

Insert into `web/src/content/projects.ts` immediately after the `ulbra-admin` literal:

```ts
  {
    slug: 'ulbra-student-dashboard',
    name: 'Student Dashboard',
    tagline: {
      en: 'A screen on a wall that tells students where to be.',
      'pt-BR': 'Uma tela na parede que diz aos alunos onde estar.',
    },
    description: {
      en: 'A class-schedule display installed in the medical school building, plus the admin behind it: an unattended kiosk that rotates schedules and campus content, switching themes between day and night.',
      'pt-BR':
        'Um painel de horários de aula instalado no prédio da medicina, e a administração por trás dele: um totem desassistido que alterna horários e conteúdo do campus, trocando de tema entre dia e noite.',
    },
    tech: ['.NET 10', 'React 19', 'PostgreSQL', 'Microsoft Fabric', 'ODBC', 'Docker Swarm'],
    role: { en: 'Head of Technology — design & implementation', 'pt-BR': 'Head de Tecnologia — design & implementação' },
    period: { en: 'Apr 2026 – Current', 'pt-BR': 'Abr 2026 – Atual' },
    venture: 'ulbra',
    visibility: 'private',
    links: [],
    detail: {
      overview: {
        en: 'A schedule display installed in the university’s first building, the medical school, where it shows students the day’s classes. One system with two faces: an unattended fullscreen kiosk, and a sign-in-protected admin where staff manage the content it rotates. Academic data comes from the university’s analytics lakehouse.',
        'pt-BR':
          'Um painel de horários instalado no prédio 1 da universidade, o da medicina, onde mostra aos alunos as aulas do dia. Um sistema com duas faces: um totem em tela cheia, desassistido, e uma administração protegida por login em que a equipe gerencia o conteúdo que ele alterna. Os dados acadêmicos vêm do lakehouse analítico da universidade.',
      },
      contribution: {
        summary: {
          en: 'Built it end to end — the API, the lakehouse integration, both front ends and the deployment.',
          'pt-BR': 'Construiu de ponta a ponta — a API, a integração com o lakehouse, os dois front-ends e o deploy.',
        },
        areas: [
          { en: 'The lakehouse connection that supplies the schedule.', 'pt-BR': 'A conexão com o lakehouse que alimenta o horário.' },
          { en: 'The kiosk display, its rotation and its day/night themes.', 'pt-BR': 'O painel do totem, sua rotação e seus temas de dia e noite.' },
          { en: 'The content admin and its scheduled playlist.', 'pt-BR': 'A administração de conteúdo e sua playlist agendada.' },
          { en: 'Deployment onto the internal cluster.', 'pt-BR': 'O deploy no cluster interno.' },
        ],
      },
      problem: {
        en: 'Students arriving at the building had no way to see the day’s schedule without looking it up on a phone, and the university had no way to put anything in front of them at the moment they walked in. A printed sheet answers the first problem badly and the second not at all.',
        'pt-BR':
          'Alunos chegando ao prédio não tinham como ver o horário do dia sem consultar o celular, e a universidade não tinha como colocar nada à frente deles no momento em que entravam. Uma folha impressa responde mal à primeira necessidade e não responde à segunda.',
      },
      highlights: [
        {
          en: 'A fullscreen kiosk sized for the physical panel it runs on, not for a browser window.',
          'pt-BR': 'Um modo tela cheia dimensionado para o painel físico em que roda, não para uma janela de navegador.',
        },
        {
          en: 'Rotates between schedule pages and campus content on a fixed cadence.',
          'pt-BR': 'Alterna entre páginas de horário e conteúdo do campus numa cadência fixa.',
        },
        {
          en: 'Switches between a day and a night theme by the clock, so it is readable in both.',
          'pt-BR': 'Troca entre tema diurno e noturno pelo relógio, para ser legível nos dois.',
        },
        {
          en: 'Staff schedule content with start and end dates; it appears and expires on its own.',
          'pt-BR': 'A equipe agenda conteúdo com data de início e fim; ele aparece e expira sozinho.',
        },
      ],
      decisions: [
        {
          heading: { en: 'Polling, not a live connection', 'pt-BR': 'Polling, não conexão persistente' },
          body: {
            en: 'The display asks the server for fresh data on a short interval rather than holding a socket open. A socket is the better answer when a human is watching and latency matters; this is a screen on a wall with nobody in front of it. Polling recovers from a dropped network by itself, and nobody has to walk to the building to restart it.',
            'pt-BR':
              'O painel pede dados novos ao servidor em intervalos curtos em vez de manter um socket aberto. Socket é a melhor resposta quando há alguém olhando e a latência importa; aqui é uma tela na parede sem ninguém à frente. O polling se recupera sozinho de uma queda de rede, e ninguém precisa ir até o prédio reiniciar nada.',
          },
        },
        {
          heading: { en: 'The analytics lakehouse as the source', 'pt-BR': 'O lakehouse analítico como fonte' },
          body: {
            en: 'The schedule is read from the university’s analytics platform rather than from the academic system directly. It is the copy that is already shaped for reading, already has access controls the display can be granted narrowly, and — crucially — cannot be affected by a screen in a lobby querying it all day.',
            'pt-BR':
              'O horário é lido da plataforma analítica da universidade e não do sistema acadêmico diretamente. É a cópia já modelada para leitura, que já tem controle de acesso concedível de forma restrita ao painel e que — o ponto decisivo — não é afetada por uma tela no saguão consultando o dia inteiro.',
          },
        },
        {
          heading: { en: 'One system, two audiences', 'pt-BR': 'Um sistema, dois públicos' },
          body: {
            en: 'The kiosk has no login and no interaction; the admin has both. Splitting them into two deployments was the obvious move and was rejected: they share the content model entirely, and two services would mean two places to change when the shape of a slide changes. The boundary is a route and an auth check, not a process.',
            'pt-BR':
              'O totem não tem login nem interação; a administração tem os dois. Separá-los em dois deploys era o movimento óbvio e foi descartado: eles compartilham inteiramente o modelo de conteúdo, e dois serviços significariam dois lugares para mudar quando o formato de um slide mudasse. A fronteira é uma rota e uma verificação de acesso, não um processo.',
          },
        },
      ],
    },
  },
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/content/content.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add web/src/content/projects.ts web/src/content/content.test.ts
git commit -m "feat(projects): the student schedule display, installed and unattended"
```

---

### Task 10: Infra — the platform, and the delivery machine

**Files:**
- Modify: `web/src/content/projects.ts` — new literal, immediately after `ulbra-student-dashboard` and before `dell-automated-caller`

**Interfaces:**
- Consumes: `CaseStudyScript`, `CaseStudyFlow`, the detail types. Produces slug `ulbra-infra`.

**This is the task the no-hostname rule exists for.** The source repository's docs carry two internal domains and an SSH host alias. Every sample below already uses placeholders; keep it that way.

- [ ] **Step 1: Write the failing test**

Append to `web/src/content/content.test.ts`:

```ts
it('ulbra-infra describes the delivery loop and leaks no address', () => {
  const infra = projects.find((p) => p.slug === 'ulbra-infra');
  expect(infra, 'the infrastructure work is published').toBeDefined();

  const decisions = infra!.detail!.decisions!.map((d) => d.body.en).join(' ');
  expect(decisions, 'the alert-to-PR loop is explained').toMatch(/alert/i);

  // The narrative test at the top of this file covers prose; the script block
  // is verbatim lines and needs its own check.
  for (const line of infra!.detail!.script!.lines) {
    expect(line, `script leaks a real host: ${line}`).not.toMatch(/ulbra\.(ai|br)/i);
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/content/content.test.ts`
Expected: FAIL — `the infrastructure work is published: expected undefined not to be undefined`.

- [ ] **Step 3: Write the implementation**

Insert into `web/src/content/projects.ts` immediately after the `ulbra-student-dashboard` literal:

```ts
  {
    slug: 'ulbra-infra',
    name: 'Ulbra Infra',
    tagline: {
      en: 'From a person on the box to a repository and a pipeline.',
      'pt-BR': 'De uma pessoa no servidor a um repositório e um pipeline.',
    },
    description: {
      en: 'The internal datacenter platform every other system here deploys onto: one script takes a bare server to ready, applications ship from a repository through CI, and an alert can open its own pull request.',
      'pt-BR':
        'A plataforma de datacenter interno em que todos os outros sistemas daqui são publicados: um script leva um servidor cru até pronto, as aplicações sobem de um repositório via CI, e um alerta pode abrir seu próprio pull request.',
    },
    tech: ['Docker Swarm', 'Traefik', 'GitHub Actions', 'OpenTelemetry', 'SigNoz', 'Prometheus', 'Grafana', 'Metabase'],
    role: { en: 'Head of Technology — design & implementation', 'pt-BR': 'Head de Tecnologia — design & implementação' },
    period: { en: 'Apr 2026 – Current', 'pt-BR': 'Abr 2026 – Atual' },
    venture: 'ulbra',
    visibility: 'private',
    links: [],
    detail: {
      overview: {
        en: 'The platform underneath every other system in this group. It began as on-premise servers with no automation at all — deployment meant a person on the machine, installing a runtime and starting the application by hand. It is now a provisioning script, a container orchestrator, a reverse proxy, two observability tools with a declared split, and a delivery loop in which an alert can investigate itself and open a pull request.',
        'pt-BR':
          'A plataforma sob todos os outros sistemas deste grupo. Começou como servidores on-premise sem nenhuma automação — publicar significava uma pessoa na máquina, instalando um runtime e subindo a aplicação na mão. Hoje é um script de provisionamento, um orquestrador de contêineres, um proxy reverso, duas ferramentas de observabilidade com uma divisão declarada e um ciclo de entrega em que um alerta pode investigar a si mesmo e abrir um pull request.',
      },
      contribution: {
        summary: {
          en: 'Designed and built the platform, and the delivery model that runs on it.',
          'pt-BR': 'Desenhou e construiu a plataforma e o modelo de entrega que roda sobre ela.',
        },
        areas: [
          { en: 'The one-run provisioning script and the cluster it produces.', 'pt-BR': 'O script de provisionamento em uma execução e o cluster que ele produz.' },
          { en: 'The reverse proxy and the routing convention every application follows.', 'pt-BR': 'O proxy reverso e a convenção de roteamento que toda aplicação segue.' },
          { en: 'The split between application and host observability.', 'pt-BR': 'A divisão entre observabilidade de aplicação e de host.' },
          { en: 'The CI pipeline, and the alert-to-pull-request loop built on top of it.', 'pt-BR': 'O pipeline de CI e o ciclo alerta-para-pull-request construído sobre ele.' },
          { en: 'The delivery dashboard that reads the team’s own task tracker.', 'pt-BR': 'O painel de entrega que lê o próprio rastreador de tarefas do time.' },
        ],
      },
      problem: {
        en: 'Everything ran on-premise with nothing automated around it. Getting an application into production meant connecting to a server, installing a runtime and starting the process by hand — which makes every deployment a memory exercise, every server subtly different from the last, and every outage an archaeology problem. Nothing was measured, so nothing could be improved on purpose.',
        'pt-BR':
          'Tudo rodava on-premise sem nenhuma automação em volta. Colocar uma aplicação em produção significava conectar num servidor, instalar um runtime e subir o processo na mão — o que torna todo deploy um exercício de memória, todo servidor sutilmente diferente do anterior e toda queda um problema de arqueologia. Nada era medido, então nada podia ser melhorado de propósito.',
      },
      highlights: [
        {
          en: 'One script takes a bare server to ready: container runtime, firewall, cluster, overlay networks, proxy and monitoring.',
          'pt-BR':
            'Um script leva um servidor cru até pronto: runtime de contêiner, firewall, cluster, redes overlay, proxy e monitoramento.',
        },
        {
          en: 'A new application needs a compose file and a workflow — the routing and the certificate follow from labels.',
          'pt-BR':
            'Uma aplicação nova precisa de um compose e um workflow — o roteamento e o certificado saem dos labels.',
        },
        {
          en: 'Telemetry is opt-in through environment variables; nothing else has to be wired.',
          'pt-BR': 'A telemetria é opcional por variáveis de ambiente; nada mais precisa ser ligado.',
        },
        {
          en: 'An alert can be investigated automatically and arrive as a pull request for a human to judge.',
          'pt-BR':
            'Um alerta pode ser investigado automaticamente e chegar como um pull request para um humano julgar.',
        },
      ],
      architecture: {
        caption: { en: 'Provision once, then per application', 'pt-BR': 'Provisiona uma vez, depois por aplicação' },
        summary: {
          en: 'The server is set up in one run; after that, shipping an application is a repository and a pipeline.',
          'pt-BR':
            'O servidor é configurado numa execução; depois disso, publicar uma aplicação é um repositório e um pipeline.',
        },
        steps: [
          { label: 'Provision', detail: { en: 'One script: runtime, firewall, cluster, overlay networks.', 'pt-BR': 'Um script: runtime, firewall, cluster, redes overlay.' } },
          { label: 'Platform', detail: { en: 'Reverse proxy and the observability stacks come up with it.', 'pt-BR': 'O proxy reverso e as stacks de observabilidade sobem junto.' } },
          { label: 'Push', detail: { en: 'CI builds the image and pushes it to the registry.', 'pt-BR': 'A CI constrói a imagem e envia para o registry.' } },
          { label: 'Deploy', detail: { en: 'The pipeline deploys the stack; the proxy picks up the route from labels.', 'pt-BR': 'O pipeline publica a stack; o proxy pega a rota pelos labels.' } },
          { label: 'Observe', detail: { en: 'Traces, logs and metrics flow in from environment variables alone.', 'pt-BR': 'Traces, logs e métricas chegam só pelas variáveis de ambiente.' } },
        ],
      },
      states: {
        caption: { en: 'From an alert to a merged fix', 'pt-BR': 'De um alerta a uma correção mesclada' },
        summary: {
          en: 'What the team automated is the investigation, not the judgement.',
          'pt-BR': 'O que o time automatizou é a investigação, não o julgamento.',
        },
        steps: [
          { label: 'Alert', detail: { en: 'Application telemetry crosses a threshold.', 'pt-BR': 'A telemetria da aplicação cruza um limiar.' } },
          { label: 'Investigate', detail: { en: 'A coding agent reads the trace and the code around it.', 'pt-BR': 'Um agente de código lê o trace e o código em volta.' } },
          { label: 'Pull request', detail: { en: 'A proposed fix arrives as a normal change to review.', 'pt-BR': 'Uma correção proposta chega como uma mudança normal para revisar.' } },
          { label: 'Review', detail: { en: 'An engineer accepts, amends or rejects it.', 'pt-BR': 'Um engenheiro aceita, ajusta ou rejeita.' } },
          { label: 'Merge', detail: { en: 'The same pipeline every other change goes through.', 'pt-BR': 'O mesmo pipeline por onde passa qualquer outra mudança.' } },
        ],
      },
      script: {
        caption: { en: 'What an application declares', 'pt-BR': 'O que uma aplicação declara' },
        lines: [
          'services:',
          '  my-app:',
          '    image: registry.example.internal/my-app:latest',
          '    networks: [proxy, monitoring]',
          '    environment:',
          '      - OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4317',
          '      - OTEL_SERVICE_NAME=my-app',
          '    deploy:',
          '      labels:',
          '        - "traefik.enable=true"',
          '        - "traefik.http.routers.myapp.rule=Host(`my-app.example.internal`)"',
        ],
        note: {
          en: 'Hostnames are placeholders. Routing, certificates and telemetry all follow from this block — there is no second place to register an application.',
          'pt-BR':
            'Os hostnames são fictícios. Roteamento, certificados e telemetria saem todos deste bloco — não há um segundo lugar onde registrar uma aplicação.',
        },
      },
      decisions: [
        {
          heading: {
            en: 'Two observability tools, on a stated boundary',
            'pt-BR': 'Duas ferramentas de observabilidade, numa fronteira declarada',
          },
          body: {
            en: 'Application telemetry — logs, traces, metrics — goes to one tool over OpenTelemetry; host metrics like CPU, memory and disk stay in another. Running two looks like drift until you read the rule written into the configuration: applications do not report to the host stack. Each tool is good at one of the two jobs, and the alternative considered and rejected was one tool doing both badly.',
            'pt-BR':
              'A telemetria de aplicação — logs, traces, métricas — vai para uma ferramenta via OpenTelemetry; métricas de host como CPU, memória e disco ficam em outra. Manter as duas parece deriva até se ler a regra escrita na configuração: aplicações não reportam para a stack de host. Cada ferramenta é boa em um dos dois trabalhos, e a alternativa considerada e descartada era uma só fazendo os dois mal.',
          },
        },
        {
          heading: { en: 'Alerts investigate themselves; humans still merge', 'pt-BR': 'Alertas se investigam; humanos ainda mesclam' },
          body: {
            en: 'When application telemetry raises an alert, a coding agent reads the trace and the surrounding code and opens a pull request with a proposed fix. What was automated is the investigation — the part that is mechanical and slow at three in the morning. The merge is not automated, and deliberately so: a change nobody approved reaching production is a worse failure than a slow fix.',
            'pt-BR':
              'Quando a telemetria de aplicação dispara um alerta, um agente de código lê o trace e o código em volta e abre um pull request com uma correção proposta. O que foi automatizado é a investigação — a parte mecânica e lenta às três da manhã. O merge não é automatizado, e de propósito: uma mudança que ninguém aprovou chegando em produção é uma falha pior do que uma correção lenta.',
          },
        },
        {
          heading: { en: 'An orchestrator sized for the team', 'pt-BR': 'Um orquestrador do tamanho do time' },
          body: {
            en: 'Kubernetes was the default answer and was not taken. The cluster is small, on-premise, and operated by three engineers who are also writing six applications. Swarm gives multi-node scheduling, rolling updates and overlay networking with a fraction of the operational surface — and the cost of the ceiling it imposes is far below the cost of a control plane nobody has time to run.',
            'pt-BR':
              'Kubernetes era a resposta padrão e não foi adotado. O cluster é pequeno, on-premise, e operado por três engenheiros que também escrevem seis aplicações. O Swarm dá agendamento multi-nó, rolling update e rede overlay com uma fração da superfície operacional — e o custo do teto que ele impõe é muito menor que o de um control plane que ninguém tem tempo de operar.',
          },
        },
        {
          heading: { en: 'The team measures itself with its own pipeline', 'pt-BR': 'O time se mede com o próprio pipeline' },
          body: {
            en: 'A dashboard reads the team’s task tracker through an ETL sidecar, so delivery is visible in the same place the systems’ numbers are. It is a small piece of plumbing carrying a large claim: a working model that is measured can be argued about with evidence, and one that is only asserted cannot.',
            'pt-BR':
              'Um painel lê o rastreador de tarefas do time por um sidecar de ETL, então a entrega fica visível no mesmo lugar em que estão os números dos sistemas. É um encanamento pequeno carregando uma afirmação grande: um modelo de trabalho que é medido pode ser discutido com evidência, e um que é apenas afirmado, não.',
          },
        },
      ],
    },
  },
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/content/content.test.ts`
Expected: PASS.

- [ ] **Step 5: Run the whole suite and the linter**

Run: `pnpm test && pnpm lint`
Expected: PASS. The ordering tests (`dietbox sits between kota-embed and the ulbra projects`, `dell-automated-caller is last`) must still pass — the four new projects were inserted before Dell.

- [ ] **Step 6: Commit**

```bash
git add web/src/content/projects.ts web/src/content/content.test.ts
git commit -m "feat(projects): the ULBRA platform, and the loop from alert to pull request"
```

---

### Task 11: Carry the venture into the static shell and the assistant

**Files:**
- Modify: `web/src/lib/aio/pages.ts` — `projectsPage`
- Modify: `web/src/lib/aio/aio.test.ts`
- Modify: `web/src/content/faq.ts`
- Modify: `src/Pulse.Api/Assistant/profile.md`
- Regenerate: `src/Pulse.Api/Assistant/projects.generated.md`

**Interfaces:**
- Consumes: `groupProjects` (Task 3), `ventureBySlug` (Task 1), every project literal from Tasks 6–10.
- Produces: nothing further.

- [ ] **Step 1: Write the failing test**

Append to `web/src/lib/aio/aio.test.ts`:

```ts
it('the projects index tells a crawler that the ULBRA systems are one engagement', () => {
  for (const locale of LOCALES) {
    const page = buildPages(locale).find((p) => p.routePath === '/projects')!;
    const headings = page.sections.map((s) => s.heading);
    expect(headings, `${locale} names the venture`).toContain('ULBRA');

    const venture = page.sections.find((s) => s.heading === 'ULBRA')!;
    expect(venture.paragraphs?.[0], `${locale} venture summary`).toBeTruthy();
    expect(venture.bullets?.length, `${locale} venture practices`).toBeGreaterThan(0);

    // The venture is introduced before the projects it contains.
    expect(headings.indexOf('ULBRA')).toBeLessThan(headings.indexOf('Ulbra Atende'));
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/lib/aio/aio.test.ts`
Expected: FAIL — `en names the venture: expected [...] to contain 'ULBRA'`.

- [ ] **Step 3: Write the implementation**

In `web/src/lib/aio/pages.ts`, add to the imports:

```ts
import { ventureBySlug } from '../../content/ventures';
import { groupProjects } from '../project-groups';
```

Add to `COPY`:

```ts
  venturePractices: { en: 'How the team works', 'pt-BR': 'Como o time trabalha' },
```

Replace the `sections:` value inside `projectsPage` with a call to a new helper, and add the helper directly above `projectsPage`:

```ts
/**
 * The index as a crawler sees it: a venture is introduced before the projects
 * it contains, so six systems from one client read as one engagement rather
 * than as six unrelated entries.
 */
function projectsIndexSections(locale: Locale): AioSection[] {
  const L = localizer(locale);
  const sections: AioSection[] = [];

  const projectSection = (p: Project): AioSection => ({
    heading: p.name,
    paragraphs: [L(p.description)],
    bullets: [`${L(COPY.stack)}: ${p.tech.join(', ')}`, `${L(COPY.role)}: ${L(p.role)}`],
  });

  for (const group of groupProjects(projects)) {
    if (group.kind === 'venture') {
      const venture = ventureBySlug(group.ventureSlug);
      if (venture) {
        sections.push({
          heading: venture.name,
          paragraphs: [
            L(venture.summary),
            [L(venture.role), L(venture.period), venture.engagement ? L(venture.engagement) : undefined, venture.team ? L(venture.team) : undefined]
              .filter(Boolean)
              .join(' · '),
          ],
          bullets: (venture.practices ?? []).map(
            (section) => `${L(section.heading)} — ${L(section.body)}`,
          ),
        });
      }
    }
    for (const p of group.projects) sections.push(projectSection(p));
  }

  return sections;
}
```

And in `projectsPage`, replace the `sections:` line with:

```ts
    sections: projectsIndexSections(locale),
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/lib/aio/aio.test.ts`
Expected: PASS.

- [ ] **Step 5: Update the FAQ**

In `web/src/content/faq.ts`, replace the `answer` of the `current-work` entry. The old text describes the ULBRA systems without naming the client or the role, so it reads as solo studio work:

```ts
    answer: {
      en: 'He is Head of Technology for ULBRA, a Brazilian university, on an engagement through his own software studio Pampa Devs. He leads three engineers building the university’s internal platform in .NET and React — an IT service desk in production, an ERP replacing the legacy systems, a CRM rebuilt to full test coverage, administrative dashboards, and the datacenter automation all of it deploys onto. He remains open to full-time roles.',
      'pt-BR':
        'É Head de Tecnologia da ULBRA, uma universidade brasileira, em um contrato através do seu próprio estúdio de software, a Pampa Devs. Lidera três engenheiros construindo a plataforma interna da universidade em .NET e React — um service desk de TI em produção, um ERP substituindo os sistemas legados, um CRM reconstruído até cobertura total de testes, dashboards administrativos e a automação de datacenter em que tudo isso é publicado. Segue aberto a posições full-time.',
    },
```

- [ ] **Step 6: Update the assistant's hand-written half**

`src/Pulse.Api/Assistant/profile.md` is pasted into the system prompt verbatim, so it is prose. Three edits.

Replace the current-work bullet (line 19):

```markdown
- Currently Head of Technology at **ULBRA** (a Brazilian university), on an engagement through his own studio **Pampa Devs** — leading three engineers building the university's internal platform in .NET & React: an IT service desk in production, an ERP replacing the legacy systems, a CRM rebuilt to full test coverage, administrative dashboards, and the datacenter automation all of it deploys onto. He introduced a spec-first, AI-assisted delivery model there: work enters through one tracker, implementation is largely generated, and the team's time goes to writing specs and reviewing code.
```

Add a row to the experience list, immediately above the Pampa Devs row (line 34):

```markdown
- **Head of Technology, ULBRA** (Apr 2026 – current, engagement via Pampa Devs, https://www.ulbra.br) — leads a three-engineer team building the university's internal platform from scratch: service desk, ERP, CRM, administrative dashboards, and the datacenter automation underneath them.
```

Replace the answer under **What is Felipe's current situation?** (line 85):

```markdown
He is Head of Technology at ULBRA, a Brazilian university, on an engagement through his studio Pampa Devs — leading three engineers across the university's internal platform — and open to full-time roles.
```

Leave **Does Felipe have leadership experience?** as it is; Task 5 already puts the ULBRA mandate on the timeline the assistant quotes from, and duplicating it here creates a second place to update.

- [ ] **Step 7: Regenerate the assistant's project half**

Run: `pnpm gen:assistant`
Then: `pnpm vitest run src/lib/aio/assistant-profile.test.ts`
Expected: PASS. This test fails on drift by design — if it fails, the generator was not run.

- [ ] **Step 8: Run everything**

```bash
cd web && pnpm test && pnpm lint && pnpm build
```

Expected: PASS, and the build emits static documents for the four new project slugs in both locales (`dist/projects/ulbra-crm.html`, `dist/pt/projects/ulbra-crm.html`, and so on for `ulbra-admin`, `ulbra-student-dashboard`, `ulbra-infra`).

Then, from the repository root, confirm the API still builds with the regenerated resource:

```bash
dotnet build src/Pulse.Api/Pulse.Api.csproj
```

- [ ] **Step 9: Commit**

```bash
git add web/src/lib/aio/pages.ts web/src/lib/aio/aio.test.ts web/src/content/faq.ts src/Pulse.Api/Assistant/profile.md src/Pulse.Api/Assistant/projects.generated.md
git commit -m "feat(aio): the venture reaches the static shell and the assistant"
```

---

## Verify before opening a pull request

- [ ] `cd web && pnpm test` — all suites pass
- [ ] `cd web && pnpm lint` — clean
- [ ] `cd web && pnpm build` — succeeds, with the eight new static documents present
- [ ] `dotnet build src/Pulse.Api/Pulse.Api.csproj` — succeeds
- [ ] `cd web && pnpm dev`, open `/projects`: the ULBRA group renders between Dietbox and the Dell tool, with its header, practices and six cards. `pulse` is still featured and full width.
- [ ] Open `/pt/projects` and confirm the same, in Portuguese.
- [ ] Open `/about`: ULBRA leads the timeline, labelled as an engagement via Pampa Devs.
- [ ] `grep -rniE 'ulbra\.(ai|br)|crmulbra' web/src/content/projects.ts` returns nothing but the venture URL is untouched in `ventures.ts` — the narrative must carry no internal address.

## Carried forward — decisions still open

These are recorded in the spec and do not block any task. Each has a committed value that is honest today; revisit when the author confirms.

1. **Start date.** `Apr 2026` is committed, covering both the stated 5 May contract date and the author's own April commits. Lives in `profile.ts` and `ventures.ts` only.
2. **ULBRA's scale.** No headcount or campus count is published, because none was supplied. The Atende `problem` section would be stronger with one.
3. **Ulbra Atende's metrics.** Still labelled `~3 months of production`; the figures are now roughly four months old.
4. **Metrics for One, Admin, Student Dashboard and Infra.** Omitted, per the spec. Infra's before/after `comparison` figure in particular is written as prose because drawing it to scale needs two numbers that do not exist yet.
5. **Publication consent.** The development model is a client's internal process. The author is that client's Head of Technology and the call is his; it should be made deliberately.
6. **How autonomous the alert loop is.** Written as "the investigation is automated, the merge is not", which is the conservative reading of what the author described. If the agent runs unattended on every alert, Task 10's second decision block understates it and should be corrected.
