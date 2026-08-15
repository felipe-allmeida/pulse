# Product Links + Pulse Case Study Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a project link to its public product site even when its source is private, and give Pulse the case study it lacks.

**Architecture:** No schema change — `Project.links` already exists. Two components stop treating links and the private-lock indicator as alternatives, and Pulse gains problem, architecture and decisions content. Three tasks.

**Tech Stack:** React 19, TypeScript, Tailwind 4, react-i18next, Vitest + Testing Library.

## Global Constraints

- **`visibility` describes the source, not the product.** A private project may link to its public product site; it may not link to a repository. Both halves stay tested.
- **Only real, reachable URLs.** `https://pulse.felipealmeida.tech`, `https://kota.io`, `https://dietbox.me` were each checked and returned 200. Do not add any other URL, and do not invent a link for a project this plan does not give one.
- **Every localized string has real `en` + `pt-BR`.** Link labels are the exception and stay in content beside their `href`: a label belongs next to the thing it names, and `Project.links` has always carried plain strings. Do not add i18n keys for them.
- **Exactly one `<h1>` per page.**
- **The other five projects must render exactly the sections they render today.**
- **Run commands from `web/`.** `pnpm test`, `pnpm lint`, `pnpm build` (there is no `typecheck` script — `pnpm build` runs `tsc -b`).
- **A known flake:** `src/routes/index.test.tsx` and sometimes `entry-prerender.test.ts` time out under machine load and pass in isolation. Do not change their timeouts.

---

## File Structure

| File | Responsibility |
|---|---|
| `web/src/components/projects/project-card.tsx` (modify) | Render links and the lock together |
| `web/src/components/projects/project-detail.tsx` (modify) | Same, plus nothing else |
| `web/src/components/projects/project-card.test.tsx` (modify) | Card-level assertions |
| `web/src/routes/project-detail.test.tsx` (modify) | Page-level assertions |
| `web/src/content/projects.ts` (modify) | The three product links, and Pulse's new content |
| `web/src/content/content.test.ts` (modify) | Link invariants |

---

### Task 1: Links and the lock stop being alternatives

**Files:**
- Modify: `web/src/components/projects/project-card.tsx:73-93`
- Modify: `web/src/components/projects/project-detail.tsx:83-103`
- Modify: `web/src/components/projects/project-card.test.tsx`
- Modify: `web/src/routes/project-detail.test.tsx`

**Interfaces:**
- Consumes: `Project.links` and `Project.visibility`, both unchanged.
- Produces: no signature change. Both components now render every link they are given, and render the lock whenever the project is private.

- [ ] **Step 1: Write the failing tests**

`project-card.test.tsx` builds its own fixtures rather than reading the real content, so add a private-with-link case. Append inside its existing `describe`:

```tsx
  it('renders a private project’s product link beside the lock, not instead of it', async () => {
    await renderCard({
      ...privateProject,
      links: [{ label: 'Website', href: 'https://example.com' }],
    });

    const link = screen.getByRole('link', { name: /website/i });
    expect(link).toHaveAttribute('href', 'https://example.com');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', expect.stringContaining('noreferrer'));
    expect(screen.getByText('Private')).toBeInTheDocument();
  });

  it('renders only the lock for a private project with no links', async () => {
    await renderCard({ ...privateProject, links: [] });

    expect(screen.getByText('Private')).toBeInTheDocument();
    const external = screen.queryAllByRole('link').filter((l) => l.getAttribute('target') === '_blank');
    expect(external).toHaveLength(0);
  });
```

`privateProject` and `renderCard(project, locale?)` are the file's existing fixture and helper — use them as written above. The fixtures are hand-built, not read from real content, which is why a fourth project landing in `projects.ts` never breaks this file.

Append to `web/src/routes/project-detail.test.tsx`, inside its `describe`:

```tsx
  it('renders the live-site link and the repository link for pulse', async () => {
    await renderDetail('pulse');
    await screen.findAllByRole('heading', { level: 1 });

    expect(screen.getByRole('link', { name: /github/i })).toHaveAttribute(
      'href',
      'https://github.com/felipe-allmeida/pulse',
    );
    expect(screen.getByRole('link', { name: /live site/i })).toHaveAttribute(
      'href',
      'https://pulse.felipealmeida.tech',
    );
  });

  it('renders kota-embed’s website link beside its Private indicator', async () => {
    await renderDetail('kota-embed');
    await screen.findAllByRole('heading', { level: 1 });

    expect(screen.getByRole('link', { name: /website/i })).toHaveAttribute('href', 'https://kota.io');
    expect(screen.getByText('Private')).toBeInTheDocument();
  });
```

The existing `ulbra-atende` tests assert that a private project renders **zero** `target="_blank"` links. Those must keep passing untouched — `ulbra-atende` gets no link in this work, so they are the regression guard proving the change did not start rendering links where there are none.

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd web && pnpm test src/components/projects/project-card.test.tsx src/routes/project-detail.test.tsx`
Expected: FAIL — the private-project link is not rendered, and pulse has no live-site link yet.

- [ ] **Step 3: Render links and the lock together**

In `web/src/components/projects/project-card.tsx`, replace the block at lines 73-93 with:

```tsx
      <div className="relative z-10 flex flex-wrap items-center gap-3 pt-1">
        {project.links.map((link) => (
          <a
            key={link.href}
            href={link.href}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-signal/30 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-signal/60 hover:text-signal-strong"
          >
            <ExternalLink aria-hidden className="size-3.5" />
            {link.label}
          </a>
        ))}
        {project.visibility === 'private' ? (
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <Lock aria-hidden className="size-3.5" />
            {t('projects:privateLabel')}
          </span>
        ) : null}
      </div>
```

In `web/src/components/projects/project-detail.tsx`, replace the block at lines 83-103 with:

```tsx
          <div className="flex flex-wrap items-center gap-3">
            {project.links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-signal/30 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-signal/60 hover:text-signal-strong"
              >
                <ExternalLink aria-hidden className="size-3.5" />
                {link.label}
              </a>
            ))}
            {project.visibility === 'private' ? (
              <span className="inline-flex w-fit items-center gap-1.5 text-xs text-muted-foreground">
                <Lock aria-hidden className="size-3.5" />
                {t('projects:privateLabel')}
              </span>
            ) : null}
          </div>
```

Update both components' JSDoc where it says links render only for public projects. The card's says "the external links (only for `visibility: 'public'`)"; replace that parenthetical with "a project's own links render whatever its visibility — `visibility` describes the source, not the product, so a private project may still point at a public product site". Make the equivalent edit in `project-detail.tsx`'s comment.

- [ ] **Step 4: Add the three product links**

In `web/src/content/projects.ts`:

`pulse` — add the live site beside the repository:

```ts
    links: [
      { label: 'Live site', href: 'https://pulse.felipealmeida.tech' },
      { label: 'GitHub', href: 'https://github.com/felipe-allmeida/pulse' },
    ],
```

`kota-embed`:

```ts
    links: [{ label: 'Website', href: 'https://kota.io' }],
```

`ulbra-atende`, `ulbra-one` and `dell-automated-caller` keep `links: []`. They have no public address.

- [ ] **Step 5: Run the tests**

Run: `cd web && pnpm test && pnpm lint && pnpm build`
Expected: PASS. In particular the existing `ulbra-atende` assertions — that a private project renders zero `target="_blank"` links — must pass untouched.

- [ ] **Step 6: Commit**

```bash
git add web/src/components/projects web/src/content/projects.ts web/src/routes/project-detail.test.tsx
git commit -m "feat(projects): a private project can link to its public product"
```

---

### Task 2: Link invariants in the content test

**Files:**
- Modify: `web/src/content/content.test.ts`

- [ ] **Step 1: Write the failing test**

Append to `web/src/content/content.test.ts`:

```ts
it('every project link is absolute and https', () => {
  for (const project of projects) {
    for (const link of project.links) {
      expect(link.href, `${project.slug}: ${link.href}`).toMatch(/^https:\/\//);
      expect(link.label.trim(), `${project.slug} has an unlabelled link`).not.toBe('');
    }
  }
});

it('no private project links to a repository', () => {
  // `visibility` describes the source, not the product: a private project may
  // point at its public product site, but never at the code.
  for (const project of projects.filter((p) => p.visibility === 'private')) {
    for (const link of project.links) {
      expect(link.href, `${project.slug} links to a repository`).not.toMatch(
        /github\.com|gitlab\.|bitbucket\.|\/repo/i,
      );
    }
  }
});

it('pulse points at both its source and the running site', () => {
  const pulse = projects.find((p) => p.slug === 'pulse')!;
  expect(pulse.links.some((l) => /github\.com/.test(l.href))).toBe(true);
  expect(pulse.links.some((l) => l.href === 'https://pulse.felipealmeida.tech')).toBe(true);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd web && pnpm test src/content/content.test.ts`
Expected: the first two pass already; the third FAILS until Task 1's Step 4 landed. If Task 1 is already committed, all three pass — in that case confirm the third by temporarily removing the live-site link, watching it fail, and restoring it. Note that in your report.

- [ ] **Step 3: Commit**

```bash
git add web/src/content/content.test.ts
git commit -m "test(projects): pin the link invariants"
```

---

### Task 3: The Pulse case study

**Files:**
- Modify: `web/src/content/projects.ts`
- Modify: `web/src/routes/project-detail.test.tsx`

**Interfaces:**
- Consumes: `CaseStudyFlow` and `CaseStudySection`, both already exported.
- Produces: `pulse.detail` gains `problem`, `architecture` and `decisions`.

- [ ] **Step 1: Write the failing test**

Append inside the `describe` in `web/src/routes/project-detail.test.tsx`:

```tsx
  it('renders the full Pulse case study in section order', async () => {
    await renderDetail('pulse');
    await screen.findAllByRole('heading', { level: 1 });

    expect(screen.getByText(/watch a system work/i)).toBeInTheDocument();
    expect(screen.getByText('Outbox')).toBeInTheDocument();
    expect(screen.getByText(/A transactional outbox behind a visit counter/i)).toBeInTheDocument();

    const headings = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
    expect(headings).toEqual([
      'Overview',
      'What I did',
      'The problem',
      'Architecture',
      'What it does',
      'Engineering decisions',
    ]);
  });

  it('renders the Pulse case study in pt-BR', async () => {
    await renderDetail('pulse', 'pt-BR');
    await screen.findAllByRole('heading', { level: 1 });

    const headings = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
    expect(headings).toEqual([
      'Visão geral',
      'O que eu fiz',
      'O problema',
      'Arquitetura',
      'O que faz',
      'Decisões de engenharia',
    ]);
  });
```

Note there is no "By the numbers" heading: Pulse deliberately has no `metrics`. Its live ops dashboard carries real figures, and freezing a snapshot into copy would replace a checkable claim with one that ages.

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd web && pnpm test src/routes/project-detail.test.tsx`
Expected: FAIL — the heading list is `['Overview', 'What I did', 'What it does']`.

- [ ] **Step 3: Add the content**

In `web/src/content/projects.ts`, in `pulse.detail`, add `problem` immediately after `contribution`:

```ts
      problem: {
        en: 'A CV asserts seniority and a repository demands that someone read it; neither lets a stranger watch a system work. Pulse closes that gap by being both the portfolio and the thing being demonstrated. The constraint it was built against was not a user need but an evidentiary one — make the claim checkable in the thirty seconds someone actually spends.',
        'pt-BR':
          'Um currículo afirma senioridade e um repositório exige que alguém o leia; nenhum dos dois deixa um estranho ver um sistema funcionando. O Pulse fecha essa lacuna sendo ao mesmo tempo o portfólio e a coisa demonstrada. A restrição contra a qual ele foi construído não era uma necessidade de usuário, e sim de evidência — tornar a afirmação conferível nos trinta segundos que alguém de fato gasta.',
      },
```

Then `architecture` immediately after `problem`:

```ts
      architecture: {
        summary: {
          en: 'A .NET backend behind a React client. A new connection resolves the visitor’s rough location and publishes a visit event through a transactional outbox, flushed in the same save as the write. A worker drains that outbox over RabbitMQ and appends the audit trail in Postgres. SignalR carries live presence — the connection count, and reactions — while the world map reads the accumulated visits by polling, so what a visitor sees never waits on the queue. Tracing runs through OpenTelemetry, and the whole thing ships as containers behind Caddy.',
          'pt-BR':
            'Um backend .NET por trás de um cliente React. Uma conexão nova resolve a localização aproximada do visitante e publica um evento de visita por um outbox transacional, descarregado no mesmo save da escrita. Um worker drena esse outbox via RabbitMQ e acrescenta a trilha de auditoria no Postgres. O SignalR carrega a presença ao vivo — a contagem de conexões e as reações — enquanto o mapa-múndi lê as visitas acumuladas por polling. O tracing passa por OpenTelemetry, e tudo sobe como containers atrás do Caddy.',
        },
        steps: [
          {
            label: 'Browser',
            detail: {
              en: 'A React client holding a SignalR connection open.',
              'pt-BR': 'Um cliente React mantendo uma conexão SignalR aberta.',
            },
          },
          {
            label: 'API',
            detail: {
              en: 'Presence over SignalR, a public REST surface, and the assistant’s endpoint.',
              'pt-BR': 'Presença por SignalR, uma superfície REST pública e o endpoint do assistente.',
            },
          },
          {
            label: 'Outbox',
            detail: {
              en: 'The event is written in the same transaction as the visit it describes.',
              'pt-BR': 'O evento é gravado na mesma transação da visita que ele descreve.',
            },
          },
          {
            label: 'Worker',
            detail: {
              en: 'Drains the outbox over RabbitMQ, appends the visit to the audit trail.',
              'pt-BR': 'Drena o outbox via RabbitMQ, acrescenta a visita à trilha de auditoria.',
            },
          },
          {
            label: 'World map',
            detail: {
              en: 'The resolved visit arrives as presence on the world map.',
              'pt-BR': 'A visita resolvida chega como presença no mapa-múndi.',
            },
          },
        ],
      },
```

Then `decisions` at the end of `pulse.detail`, after `highlights`:

```ts
      decisions: [
        {
          heading: {
            en: 'A transactional outbox behind a visit counter',
            'pt-BR': 'Um outbox transacional atrás de um contador de visitas',
          },
          body: {
            en: 'Nothing about counting visits requires one. The point is not the counter — it is that the pattern is here, wired end to end, in something a reader can watch rather than a diagram they have to trust. On a product this would be over-engineering; on a demonstration it is the deliverable.',
            'pt-BR':
              'Nada em contar visitas exige um. O ponto não é o contador — é que o padrão está aqui, ligado de ponta a ponta, em algo que o leitor pode ver funcionando em vez de um diagrama em que precisa acreditar. Num produto isso seria over-engineering; numa demonstração é a entrega.',
          },
        },
        {
          heading: {
            en: 'Real telemetry, published',
            'pt-BR': 'Telemetria real, publicada',
          },
          body: {
            en: 'The ops dashboard exposes the system’s actual numbers, which means a reader can catch the site lying about itself. Most portfolios make claims that cannot be checked; this one chose the version that can be.',
            'pt-BR':
              'O dashboard de operações expõe os números reais do sistema, o que significa que um leitor pode flagrar o site mentindo sobre si mesmo. A maioria dos portfólios faz afirmações que não dá para conferir; este escolheu a versão que dá.',
          },
        },
        {
          heading: {
            en: 'Prerendered pages over a client-only app',
            'pt-BR': 'Páginas pré-renderizadas em vez de app só no cliente',
          },
          body: {
            en: 'The site renders its content into HTML at build time, so a first visit does not wait on JavaScript and a crawler sees the same page a person does — and, usefully, a deploy can be verified with a single request rather than a browser.',
            'pt-BR':
              'O site renderiza seu conteúdo em HTML no build, então a primeira visita não espera JavaScript e um crawler vê a mesma página que uma pessoa — e, de quebra, um deploy pode ser verificado com uma única requisição em vez de um navegador.',
          },
        },
        {
          heading: {
            en: 'An assistant grounded in a maintained profile',
            'pt-BR': 'Um assistente fundamentado num perfil mantido',
          },
          body: {
            en: 'The assistant answers from a file the author keeps current, and says it does not know rather than inventing. Ungrounded, it would be a demonstration of exactly the wrong thing.',
            'pt-BR':
              'O assistente responde a partir de um arquivo que o autor mantém atualizado, e diz que não sabe em vez de inventar. Sem fundamento, ele seria a demonstração exatamente do oposto.',
          },
        },
      ],
```

- [ ] **Step 4: Run everything**

Run: `cd web && pnpm test && pnpm lint && pnpm build`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add web/src/content/projects.ts web/src/routes/project-detail.test.tsx
git commit -m "feat(projects): the Pulse case study"
```

---

## Verification

From `web/`:

```bash
pnpm test && pnpm lint && pnpm build
```

Then `pnpm dev` and check three things a test cannot:

1. `/projects` — Kota's card shows a Website link *and* the Private lock, side by side, and it reads as "the source is closed, the product is not" rather than as a contradiction.
2. `/projects/pulse` — the page now has a problem, an architecture flow and four decisions, and the decisions read as deliberate rather than defensive.
3. `/projects/ulbra-atende` — unchanged, still no links, still locked.
