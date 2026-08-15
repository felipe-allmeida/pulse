# Dell Automated Caller Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Dell Automated Caller as a fifth project, and give case-study pages three new figure types — a script block, a before/after comparison, and a result table.

**Architecture:** Three optional fields on `ProjectDetailContent` (`script`, `comparison`, `table`), each rendered by its own presentational component that returns `null` when absent. Each figure's own localized `caption` is its section heading, so no i18n keys are added. Existing projects render exactly as they do today.

**Tech Stack:** React 19, TypeScript, Tailwind 4, react-i18next, Vitest + Testing Library.

## Global Constraints

- **Dell may be named. Its internal infrastructure may not.** No deployment endpoints, no internal host names, no environment names, no internal database or table names, and no credentials of any kind from the source repository's build configuration. Naming which products those are would itself be the disclosure. None of it belongs in code, copy, tests, or commit messages.
- **Nothing may read as a screenshot of a client product.** Every figure is an illustration of the system's inputs and outputs, drawn from the real grammar and the real data model. The table's note must say its values are illustrative.
- **Two classes of number, distinguished.** "20k+" and "~3h" are the author's recollection; "9" is verifiable in source. The comparison figure carries a `source` footnote saying so.
- **Every localized string has real `en` + `pt-BR`.** `lines` and `rows` are code and data — not localized.
- **`visibility: 'private'`, `links: []`.** No external links.
- **Exactly one `<h1>` per page.** Figure captions render through `SubsectionHeading` (an `<h2>`).
- **Existing projects must not change.** `pulse`, `kota-embed`, `ulbra-atende`, and `ulbra-one` render the same sections after this work as before it.
- **Run commands from `web/`.** `pnpm test`, `pnpm lint`, `pnpm build` (there is no `typecheck` script — `pnpm build` runs `tsc -b` first).

## Deviations from the spec (deliberate, recorded here)

1. **Spec §2 and §4.2 make the comparison an inline SVG.** It is HTML instead. The figure is two horizontal bars; a `div` whose `width` is a percentage states the proportion exactly as truthfully as a `<rect>`, and keeps the labels as real text — crisper at any zoom, selectable, and reachable by a screen reader without `role="img"` plus a `<title>`/`<desc>` pair restating what the markup already says. The "SVG where meaning is proportion" rule earns its keep on real geometry; two boxes are not that.
2. **Spec §4.4 asks for a visual refinement to `case-study-architecture.tsx`.** Verified already satisfied: its node box uses `border-signal/20 bg-signal-muted/10`, the same tokens as the metric tiles' `Card`. There is no task for it, because there is no change to make.
3. **The script's line spans are inline, not `block`.** An earlier draft gave each line `className="block whitespace-pre"` *and* a trailing literal `\n`. Inside a `<pre>`, the newline already forces a break and `display: block` forces another, so every line but the last rendered as two line boxes — a double-spaced block that also copies wrong. jsdom performs no layout, so no DOM test could see it. Inline spans inside `<pre><code>`, relying on the literal newlines, is what every syntax highlighter does and what copies correctly. A test asserts no line span carries `block`.
4. **A zero weight draws no bar at all.** An earlier draft applied the minimum-bar floor unconditionally, so a side whose weight was exactly `0` still rendered at 1.5% — the figure drawing a quantity its own label denied, which is the one thing this component exists not to do. The floor now applies only to non-zero weights, and two tests cover it: a zero side renders `0%`, and two zero sides render nothing.

---

## File Structure

| File | Responsibility |
|---|---|
| `web/src/content/projects.ts` (modify) | Three figure types + the Dell entry |
| `web/src/content/content.test.ts` (modify) | Both-locale sweep and figure invariants |
| `web/src/components/projects/case-study-script.tsx` (create) | The script block |
| `web/src/components/projects/case-study-script.test.tsx` (create) | Its tests |
| `web/src/components/projects/case-study-comparison.tsx` (create) | The before/after bars |
| `web/src/components/projects/case-study-comparison.test.tsx` (create) | Its tests |
| `web/src/components/projects/case-study-table.tsx` (create) | The result table |
| `web/src/components/projects/case-study-table.test.tsx` (create) | Its tests |
| `web/src/components/projects/project-detail.tsx` (modify) | Renders the three new sections |
| `web/src/routes/project-detail.test.tsx` (modify) | Page-level assertions |

---

### Task 1: Figure types and the Dell entry

**Files:**
- Modify: `web/src/content/projects.ts`
- Modify: `web/src/content/content.test.ts`

**Interfaces:**
- Consumes: `LocalizedString` from `./types`.
- Produces: exported types `CaseStudyScript`, `CaseStudyComparison`, `CaseStudyTable`; `ProjectDetailContent` gains optional `script`, `comparison`, `table`. Tasks 2-5 import these by name from `@/content/projects`.

- [ ] **Step 1: Write the failing test**

Append to `web/src/content/content.test.ts`:

```ts
it('dell-automated-caller has a case study with all three figures, localized', () => {
  const project = projects.find((p) => p.slug === 'dell-automated-caller');
  expect(project).toBeDefined();
  expect(project!.visibility).toBe('private');
  expect(project!.links).toHaveLength(0);

  const detail = project!.detail!;
  expectBothLocales(detail.problem!, 'problem');
  expect(detail.metrics).toHaveLength(3);

  const script = detail.script!;
  expectBothLocales(script.caption, 'script.caption');
  expect(script.lines.length).toBeGreaterThan(0);
  for (const line of script.lines) expect(line.trim()).not.toBe('');

  const comparison = detail.comparison!;
  expectBothLocales(comparison.caption, 'comparison.caption');
  for (const side of [comparison.before, comparison.after]) {
    expectBothLocales(side.label, 'comparison.side.label');
    expectBothLocales(side.value, 'comparison.side.value');
    expect(side.weight).toBeGreaterThan(0);
  }
  expectBothLocales(comparison.source!, 'comparison.source');

  const table = detail.table!;
  expectBothLocales(table.caption, 'table.caption');
  expect(table.columns.length).toBeGreaterThan(0);
  for (const column of table.columns) expectBothLocales(column, 'table.column');
  for (const row of table.rows) {
    expect(row, 'every row has one cell per column').toHaveLength(table.columns.length);
  }
  expectBothLocales(table.note!, 'table.note');
});

it('dell-automated-caller is last — it is the oldest work', () => {
  expect(projects[projects.length - 1].slug).toBe('dell-automated-caller');
});

it('publishes no hostname, URL or credential in any project narrative', () => {
  // Deliberately pattern-based rather than a list of the specific internal
  // hosts to keep out: this repository is public, so a guard naming them would
  // publish exactly what it exists to protect — the same trap a name-list guard
  // fell into on an earlier project. `links` is excluded because a public repo
  // link is the one URL that belongs in content.
  for (const project of projects) {
    if (!project.detail) continue;
    const narrative = JSON.stringify(project.detail);
    expect(narrative, `${project.slug} detail contains a URL`).not.toMatch(/https?:\/\//);
    expect(narrative, `${project.slug} detail contains a hostname`).not.toMatch(
      /\b[a-z0-9-]+\.(com|io|net|dev|internal)\b/i,
    );
    expect(narrative, `${project.slug} detail contains a token-like string`).not.toMatch(
      /\b[a-f0-9]{32,}\b/i,
    );
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd web && pnpm test src/content/content.test.ts`
Expected: FAIL — no project with slug `dell-automated-caller`.

- [ ] **Step 3: Add the three figure types**

In `web/src/content/projects.ts`, add these above `ProjectDetailContent`:

```ts
/** A short, real script or config sample, rendered as a code block. */
export interface CaseStudyScript {
  /** Short label above the block — doubles as the section heading. */
  caption: LocalizedString;
  /** Lines of the sample, verbatim. Not localized: it is code. */
  lines: string[];
  /** Optional note under the block. */
  note?: LocalizedString;
}

/** One side of a before/after comparison. */
export interface CaseStudyComparisonSide {
  label: LocalizedString;
  value: LocalizedString;
  /** Relative magnitude, any unit — drives bar length so the figure cannot
   *  draw a proportion the numbers do not claim. */
  weight: number;
}

/** A two-sided before/after figure, drawn to scale. */
export interface CaseStudyComparison {
  /** Doubles as the section heading. */
  caption: LocalizedString;
  before: CaseStudyComparisonSide;
  after: CaseStudyComparisonSide;
  /** Where the numbers come from — rendered as a footnote. */
  source?: LocalizedString;
}

/** A small illustrative table of the system's output. */
export interface CaseStudyTable {
  /** Doubles as the section heading. */
  caption: LocalizedString;
  columns: LocalizedString[];
  /** Row cells, already formatted. Illustrative values, real structure. */
  rows: string[][];
  note?: LocalizedString;
}
```

Then add three fields to `ProjectDetailContent`, after `architecture`:

```ts
  /** A real script or config sample. */
  script?: CaseStudyScript;
  /** A before/after figure drawn to scale. */
  comparison?: CaseStudyComparison;
  /** An illustrative table of the system's output. */
  table?: CaseStudyTable;
```

- [ ] **Step 4: Add the Dell entry**

Append this object to the end of the `projects` array, after `ulbra-one`:

```ts
  {
    slug: 'dell-automated-caller',
    name: 'Dell Automated Caller',
    tagline: {
      en: 'Automated end-to-end testing for a phone system.',
      'pt-BR': 'Teste end-to-end automatizado de um sistema de telefonia.',
    },
    description: {
      en: 'An internal tool that tests an interactive voice system by actually calling it: a script drives a real phone call, the spoken responses are transcribed and checked against what the script expected, and the outcome is reported back into the test-management tool.',
      'pt-BR':
        'Uma ferramenta interna que testa uma URA ligando de verdade para ela: um roteiro conduz uma chamada real, as respostas faladas são transcritas e conferidas contra o que o roteiro esperava, e o resultado volta para a ferramenta de gestão de testes.',
    },
    tech: ['.NET Core', 'RabbitMQ', 'Entity Framework', 'Twilio', 'xUnit'],
    role: {
      en: 'Conception, architecture and implementation — later mentoring the junior engineer who joined the project.',
      'pt-BR':
        'Concepção, arquitetura e implementação — e depois mentoria do engenheiro júnior que entrou no projeto.',
    },
    period: { en: '2020', 'pt-BR': '2020' },
    visibility: 'private',
    links: [],
    detail: {
      overview: {
        en: "An internal tool that tests an interactive voice system by actually calling it — the test suite dials the phone menu, listens to what it says, and checks it against what was expected, then files the result alongside the rest of the suite.",
        'pt-BR':
          'Uma ferramenta interna que testa uma URA ligando de verdade para ela — a suíte disca o menu telefônico, ouve o que ele diz, confere contra o esperado e registra o resultado junto com o resto da suíte.',
      },
      problem: {
        en: 'Testing a phone menu meant a person dialling it, pressing the keys, listening to what the system said, and writing down whether it was right — once per scenario, per language, per route. A full cycle was over twenty thousand calls placed by hand, which in practice meant the full cycle almost never ran. Automating it brought the cycle down to about three hours.',
        'pt-BR':
          'Testar um menu telefônico significava alguém discar, apertar as teclas, ouvir o que o sistema dizia e anotar se estava certo — uma vez por cenário, por idioma, por rota. Um ciclo completo eram mais de vinte mil ligações feitas à mão, o que na prática significava que o ciclo completo quase nunca rodava. Automatizar levou o ciclo para cerca de três horas.',
      },
      metrics: [
        {
          value: { en: '20k+', 'pt-BR': '20 mil+' },
          label: { en: 'calls per test cycle', 'pt-BR': 'ligações por ciclo de teste' },
          note: { en: 'previously placed one at a time, by hand', 'pt-BR': 'antes, uma a uma, à mão' },
        },
        {
          value: { en: '~3h', 'pt-BR': '~3h' },
          label: { en: 'to run the full cycle', 'pt-BR': 'para rodar o ciclo inteiro' },
          note: { en: 'it had taken about a month', 'pt-BR': 'antes levava cerca de um mês' },
        },
        {
          value: { en: '9', 'pt-BR': '9' },
          label: { en: 'commands in the test DSL', 'pt-BR': 'comandos na DSL de teste' },
          note: {
            en: 'the script is validated before anything is dialled',
            'pt-BR': 'o roteiro é validado antes de qualquer discagem',
          },
        },
      ],
      architecture: {
        summary: {
          en: 'A .NET Core service in DDD layers. The API accepts a script; a validator rejects a malformed one before a call is placed; the run is dispatched over a RabbitMQ publish/subscribe queue; a telephony provider places the call and posts each transcribed response back by webhook; the response is scored against what the script expected; and the outcome is written back to the test-management tool against its plan, suite and work-item identifiers.',
          'pt-BR':
            'Um serviço .NET Core em camadas DDD. A API recebe um roteiro; um validador rejeita roteiro malformado antes de gastar uma ligação; a execução é despachada por uma fila publish/subscribe no RabbitMQ; um provedor de telefonia faz a chamada e devolve cada resposta transcrita por webhook; a resposta é pontuada contra o que o roteiro esperava; e o resultado volta para a ferramenta de gestão de testes, amarrado aos identificadores de plano, suíte e item de trabalho.',
        },
        nodes: [
          {
            label: 'Test script',
            detail: {
              en: 'An ordered list of commands describing one call.',
              'pt-BR': 'Uma lista ordenada de comandos descrevendo uma ligação.',
            },
          },
          {
            label: 'Validator',
            detail: {
              en: 'Rejects a malformed script before anything is dialled.',
              'pt-BR': 'Rejeita roteiro malformado antes de qualquer discagem.',
            },
          },
          {
            label: 'Queue',
            detail: {
              en: 'Publish/subscribe, so a slow call never blocks the request.',
              'pt-BR': 'Publish/subscribe, então uma ligação lenta não trava a requisição.',
            },
          },
          {
            label: 'Telephony provider',
            detail: {
              en: 'Places the call and posts each transcribed response back.',
              'pt-BR': 'Faz a chamada e devolve cada resposta transcrita.',
            },
          },
          {
            label: 'Test management',
            detail: {
              en: 'Receives the outcome against its plan, suite and work item.',
              'pt-BR': 'Recebe o resultado amarrado ao plano, à suíte e ao item de trabalho.',
            },
          },
        ],
      },
      script: {
        caption: { en: 'A test script', 'pt-BR': 'Um roteiro de teste' },
        lines: [
          'Setup (Language="en-US")',
          'Dial +1 (000) 000-0000',
          'Wait 3',
          'Hear [Confidence=85%] thank you for calling, please say or enter your service tag',
          'Enter (serialnumber) 1234567#',
          'Hear [WaitBefore=2] one moment while I look that up',
          'Validate IVR',
          'Hang',
        ],
        note: {
          en: 'The grammar is enforced before the call: a missing Dial or Hang, a repeated Validate, or a step out of order fails the script rather than the phone bill. The number above is a documentation placeholder.',
          'pt-BR':
            'A gramática é verificada antes da ligação: um Dial ou Hang ausente, um Validate repetido ou um passo fora de ordem reprovam o roteiro em vez da conta de telefone. O número acima é um placeholder de documentação.',
        },
      },
      comparison: {
        caption: { en: 'One test cycle', 'pt-BR': 'Um ciclo de teste' },
        before: {
          label: { en: 'By hand', 'pt-BR': 'À mão' },
          value: { en: '~1 month', 'pt-BR': '~1 mês' },
          weight: 160,
        },
        after: {
          label: { en: 'Automated', 'pt-BR': 'Automatizado' },
          value: { en: '~3 hours', 'pt-BR': '~3 horas' },
          weight: 3,
        },
        source: {
          en: 'Figures as recalled from the project; the repository does not record them.',
          'pt-BR': 'Números conforme lembrados do projeto; o repositório não os registra.',
        },
      },
      table: {
        caption: { en: 'What a step records', 'pt-BR': 'O que um passo registra' },
        columns: [
          { en: 'Expected', 'pt-BR': 'Esperado' },
          { en: 'Heard', 'pt-BR': 'Ouvido' },
          { en: 'Similarity', 'pt-BR': 'Similaridade' },
        ],
        rows: [
          ['please enter your service tag', 'please enter your service tag', '100%'],
          ['one moment while I look that up', 'one moment while i look that up', '97%'],
          ['transferring you to support', 'transferring you to sales', '81%'],
        ],
        note: {
          en: 'Structure from the real model — every spoken response is stored with what was expected, what was transcribed, and how closely the two matched. Values here are illustrative.',
          'pt-BR':
            'Estrutura do modelo real — toda resposta falada é guardada com o que se esperava, o que foi transcrito e o quanto os dois bateram. Os valores aqui são ilustrativos.',
        },
      },
      highlights: [
        {
          en: 'A test script is a short list of ordered commands: dial, wait, enter digits, listen, validate, hang up.',
          'pt-BR':
            'Um roteiro de teste é uma lista curta de comandos ordenados: discar, esperar, digitar, ouvir, validar, desligar.',
        },
        {
          en: 'Placeholders in the script are substituted at run time, so one script covers many data sets.',
          'pt-BR':
            'Placeholders no roteiro são substituídos em tempo de execução, então um roteiro cobre muitos conjuntos de dados.',
        },
        {
          en: 'Every spoken response is stored with what was expected, what was heard, and how closely they matched.',
          'pt-BR':
            'Toda resposta falada é guardada com o que se esperava, o que foi ouvido e o quanto os dois bateram.',
        },
        {
          en: 'Results are written back to the test-management tool against the plan, suite and work item they belong to.',
          'pt-BR':
            'Os resultados voltam para a ferramenta de gestão de testes amarrados ao plano, à suíte e ao item de trabalho a que pertencem.',
        },
        {
          en: 'A malformed script is rejected with a readable list of errors before any call is placed.',
          'pt-BR':
            'Um roteiro malformado é rejeitado com uma lista legível de erros antes de qualquer ligação.',
        },
      ],
      decisions: [
        {
          heading: {
            en: 'Assert on similarity, with the threshold declared per step',
            'pt-BR': 'Asserção por similaridade, com o limiar declarado em cada passo',
          },
          body: {
            en: 'Speech transcription is never character-exact, so comparing for equality fails good tests. Each assertion carries its own tolerance in the script, because how close a transcription lands depends on what was said — a stock prompt transcribes reliably, a product name does not.',
            'pt-BR':
              'Transcrição de fala nunca é exata caractere a caractere, então comparar por igualdade reprova teste bom. Cada asserção carrega sua própria tolerância no roteiro, porque o quão perto a transcrição chega depende do que foi dito — um prompt padrão transcreve de forma confiável, um nome de produto não.',
          },
        },
        {
          heading: {
            en: 'The script is a small language, validated before anything is dialled',
            'pt-BR': 'O roteiro é uma linguagem pequena, validada antes de qualquer discagem',
          },
          body: {
            en: 'A real call costs time and money and cannot be undone. The validator checks that the required commands are present, that single-use commands appear once, that the order is legal, and that each line matches its grammar — reporting every error in plain language before the first digit is dialled.',
            'pt-BR':
              'Uma ligação real custa tempo e dinheiro e não dá para desfazer. O validador confere que os comandos obrigatórios estão presentes, que os de uso único aparecem uma vez, que a ordem é válida e que cada linha bate com sua gramática — reportando cada erro em linguagem clara antes do primeiro dígito discado.',
          },
        },
        {
          heading: {
            en: 'A queue between the request and the call',
            'pt-BR': 'Uma fila entre a requisição e a ligação',
          },
          body: {
            en: 'A phone call takes minutes and fails for reasons outside the caller’s control. Publish/subscribe decouples whoever asked for the run from whatever executes it, so a slow or failed call never blocks the request that started it.',
            'pt-BR':
              'Uma ligação telefônica leva minutos e falha por motivos fora do controle de quem chamou. Publish/subscribe desacopla quem pediu a execução de quem a executa, então uma ligação lenta ou falha nunca trava a requisição que a iniciou.',
          },
        },
        {
          heading: {
            en: 'Checking more than the audio',
            'pt-BR': 'Conferir mais que o áudio',
          },
          body: {
            en: 'Hearing the right words does not prove the call was routed correctly. Separate validation steps check the voice menu, the telephony routing, and the records both left behind — which is what makes it an end-to-end test rather than an audio assertion.',
            'pt-BR':
              'Ouvir as palavras certas não prova que a ligação foi roteada corretamente. Passos de validação separados conferem o menu de voz, o roteamento telefônico e os registros que os dois deixaram — e é isso que faz dele um teste end-to-end em vez de uma asserção sobre áudio.',
          },
        },
      ],
    },
  },
```

- [ ] **Step 5: Run the tests**

Run: `cd web && pnpm test src/content/content.test.ts && pnpm build`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add web/src/content/projects.ts web/src/content/content.test.ts
git commit -m "feat(projects): case-study figure types and the Dell Automated Caller entry"
```

---

### Task 2: `CaseStudyScript`

**Files:**
- Create: `web/src/components/projects/case-study-script.tsx`
- Create: `web/src/components/projects/case-study-script.test.tsx`

**Interfaces:**
- Consumes: `CaseStudyScript` from `@/content/projects`; `useLocalized` from `@/i18n/use-localized`.
- Produces: `export function CaseStudyScript(props: { script: CaseStudyScriptContent }): ReactElement | null`, where the prop type is the content interface imported under an alias. Task 5 renders it.

- [ ] **Step 1: Write the failing test**

Create `web/src/components/projects/case-study-script.test.tsx`:

```tsx
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CaseStudyScript } from '@/components/projects/case-study-script';
import type { CaseStudyScript as CaseStudyScriptContent } from '@/content/projects';
import { renderWithI18n } from '@/test/render-with-i18n';

const script: CaseStudyScriptContent = {
  caption: { en: 'A test script', 'pt-BR': 'Um roteiro de teste' },
  lines: ['Setup (Language="en-US")', 'Dial +1 (000) 000-0000', 'Hang'],
  note: { en: 'Checked before the call.', 'pt-BR': 'Conferido antes da ligação.' },
};

describe('CaseStudyScript', () => {
  it('renders every line verbatim, in order', async () => {
    const { container } = await renderWithI18n(<CaseStudyScript script={script} />);

    const code = container.querySelector('code');
    expect(code).not.toBeNull();
    expect(code!.textContent).toBe(
      'Setup (Language="en-US")\nDial +1 (000) 000-0000\nHang',
    );
  });

  it('renders the note, localized', async () => {
    await renderWithI18n(<CaseStudyScript script={script} />);
    expect(screen.getByText('Checked before the call.')).toBeInTheDocument();
  });

  it('renders the note in pt-BR', async () => {
    await renderWithI18n(<CaseStudyScript script={script} />, { locale: 'pt-BR' });
    expect(screen.getByText('Conferido antes da ligação.')).toBeInTheDocument();
  });

  it('renders nothing when the script has no lines', async () => {
    const { container } = await renderWithI18n(
      <CaseStudyScript script={{ ...script, lines: [] }} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('adds no heading of its own — the page section supplies it', async () => {
    await renderWithI18n(<CaseStudyScript script={script} />);
    expect(screen.queryAllByRole('heading')).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd web && pnpm test src/components/projects/case-study-script.test.tsx`
Expected: FAIL — cannot resolve `@/components/projects/case-study-script`.

- [ ] **Step 3: Write the component**

Create `web/src/components/projects/case-study-script.tsx`:

```tsx
import type { CaseStudyScript as CaseStudyScriptContent } from '@/content/projects';
import { useLocalized } from '@/i18n/use-localized';

export interface CaseStudyScriptProps {
  script: CaseStudyScriptContent;
}

/**
 * A real script sample from a project, shown as code. The first token of each
 * line is emphasized as its command — done by splitting the string, not by a
 * syntax-highlighting dependency and not by injecting markup, so the block
 * stays selectable, copyable, and readable to a screen reader as plain text.
 * The caption is rendered by the page section as its heading, not here.
 */
export function CaseStudyScript({ script }: CaseStudyScriptProps) {
  const L = useLocalized();
  if (script.lines.length === 0) return null;

  return (
    <figure className="m-0 flex flex-col gap-3">
      <div className="overflow-x-auto rounded-lg border border-signal/20 bg-signal-muted/10 p-4">
        <pre className="m-0 font-mono text-xs leading-relaxed text-muted-foreground">
          <code>
            {script.lines.map((line, index) => {
              const separator = line.indexOf(' ');
              const command = separator === -1 ? line : line.slice(0, separator);
              const rest = separator === -1 ? '' : line.slice(separator);
              return (
                <span key={index}>
                  <span className="text-signal-strong">{command}</span>
                  {rest}
                  {index < script.lines.length - 1 ? '\n' : ''}
                </span>
              );
            })}
          </code>
        </pre>
      </div>
      {script.note ? (
        <figcaption className="max-w-2xl text-xs leading-relaxed text-muted-foreground">
          {L(script.note)}
        </figcaption>
      ) : null}
    </figure>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd web && pnpm test src/components/projects/case-study-script.test.tsx`
Expected: PASS — 5 tests. The `textContent` assertion is the one that matters: it proves the rendered code reads back as the original lines, newlines included, despite being split into spans.

- [ ] **Step 5: Commit**

```bash
git add web/src/components/projects/case-study-script.tsx web/src/components/projects/case-study-script.test.tsx
git commit -m "feat(projects): case-study script block"
```

---

### Task 3: `CaseStudyComparison`

**Files:**
- Create: `web/src/components/projects/case-study-comparison.tsx`
- Create: `web/src/components/projects/case-study-comparison.test.tsx`

**Interfaces:**
- Consumes: `CaseStudyComparison` from `@/content/projects`; `useLocalized`.
- Produces: `export function CaseStudyComparison(props: { comparison: CaseStudyComparisonContent }): ReactElement | null`. Task 5 renders it.

- [ ] **Step 1: Write the failing test**

Create `web/src/components/projects/case-study-comparison.test.tsx`:

```tsx
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CaseStudyComparison } from '@/components/projects/case-study-comparison';
import type { CaseStudyComparison as CaseStudyComparisonContent } from '@/content/projects';
import { renderWithI18n } from '@/test/render-with-i18n';

const comparison: CaseStudyComparisonContent = {
  caption: { en: 'One test cycle', 'pt-BR': 'Um ciclo de teste' },
  before: {
    label: { en: 'By hand', 'pt-BR': 'À mão' },
    value: { en: '~1 month', 'pt-BR': '~1 mês' },
    weight: 160,
  },
  after: {
    label: { en: 'Automated', 'pt-BR': 'Automatizado' },
    value: { en: '~3 hours', 'pt-BR': '~3 horas' },
    weight: 3,
  },
  source: { en: 'As recalled.', 'pt-BR': 'Conforme lembrado.' },
};

function barWidths(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll('[data-bar]')).map(
    (el) => (el as HTMLElement).style.width,
  );
}

describe('CaseStudyComparison', () => {
  it('renders both sides with their labels and values', async () => {
    await renderWithI18n(<CaseStudyComparison comparison={comparison} />);

    expect(screen.getByText('By hand')).toBeInTheDocument();
    expect(screen.getByText('~1 month')).toBeInTheDocument();
    expect(screen.getByText('Automated')).toBeInTheDocument();
    expect(screen.getByText('~3 hours')).toBeInTheDocument();
    expect(screen.getByText('As recalled.')).toBeInTheDocument();
  });

  it('draws bars proportional to weight, the largest filling the track', async () => {
    const { container } = await renderWithI18n(<CaseStudyComparison comparison={comparison} />);

    const widths = barWidths(container);
    expect(widths).toHaveLength(2);
    expect(widths[0]).toBe('100%');
    // 3/160 = 1.875%, floored to a visible minimum so the bar never disappears.
    expect(parseFloat(widths[1])).toBeGreaterThan(0);
    expect(parseFloat(widths[1])).toBeLessThan(10);
  });

  it('scales correctly when the larger side is second', async () => {
    const flipped: CaseStudyComparisonContent = {
      ...comparison,
      before: { ...comparison.before, weight: 3 },
      after: { ...comparison.after, weight: 160 },
    };
    const { container } = await renderWithI18n(<CaseStudyComparison comparison={flipped} />);

    const widths = barWidths(container);
    expect(widths[1]).toBe('100%');
    expect(parseFloat(widths[0])).toBeLessThan(10);
  });

  it('renders in pt-BR', async () => {
    await renderWithI18n(<CaseStudyComparison comparison={comparison} />, { locale: 'pt-BR' });
    expect(screen.getByText('À mão')).toBeInTheDocument();
    expect(screen.getByText('~3 horas')).toBeInTheDocument();
  });

  it('adds no heading of its own', async () => {
    await renderWithI18n(<CaseStudyComparison comparison={comparison} />);
    expect(screen.queryAllByRole('heading')).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd web && pnpm test src/components/projects/case-study-comparison.test.tsx`
Expected: FAIL — cannot resolve `@/components/projects/case-study-comparison`.

- [ ] **Step 3: Write the component**

Create `web/src/components/projects/case-study-comparison.tsx`:

```tsx
import type {
  CaseStudyComparison as CaseStudyComparisonContent,
  CaseStudyComparisonSide,
} from '@/content/projects';
import { useLocalized } from '@/i18n/use-localized';

export interface CaseStudyComparisonProps {
  comparison: CaseStudyComparisonContent;
}

/**
 * Below this, a bar rounds away to nothing and stops reading as a quantity.
 * A weight of exactly zero is exempt: the floor exists to keep a small number
 * visible, never to draw one that isn't there.
 */
const MIN_BAR_PERCENT = 1.5;

/**
 * A before/after figure: two horizontal bars whose lengths come from the same
 * `weight` values the labels quote, so the picture cannot claim a proportion
 * the numbers do not. Plain elements rather than SVG — two boxes are not
 * geometry, and HTML keeps the labels as selectable text that a screen reader
 * reads in order without a `role="img"` description restating them.
 */
export function CaseStudyComparison({ comparison }: CaseStudyComparisonProps) {
  const L = useLocalized();
  const { before, after, source } = comparison;
  const largest = Math.max(before.weight, after.weight);
  if (largest <= 0) return null;

  const row = (side: CaseStudyComparisonSide, tone: string) => {
    const percent = side.weight === 0 ? 0 : Math.max((side.weight / largest) * 100, MIN_BAR_PERCENT);
    return (
      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-sm text-foreground/80">{L(side.label)}</span>
          <span className="font-mono text-sm font-medium tabular-nums text-signal-strong">
            {L(side.value)}
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-signal-muted/20">
          <div data-bar className={`h-full rounded-full ${tone}`} style={{ width: `${percent}%` }} />
        </div>
      </div>
    );
  };

  return (
    <figure className="m-0 flex max-w-2xl flex-col gap-4">
      {row(before, 'bg-signal/40')}
      {row(after, 'bg-signal')}
      {source ? (
        <figcaption className="text-xs leading-relaxed text-muted-foreground">{L(source)}</figcaption>
      ) : null}
    </figure>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd web && pnpm test src/components/projects/case-study-comparison.test.tsx`
Expected: PASS — 6 tests.

- [ ] **Step 5: Commit**

```bash
git add web/src/components/projects/case-study-comparison.tsx web/src/components/projects/case-study-comparison.test.tsx
git commit -m "feat(projects): case-study before/after comparison"
```

---

### Task 4: `CaseStudyTable`

**Files:**
- Create: `web/src/components/projects/case-study-table.tsx`
- Create: `web/src/components/projects/case-study-table.test.tsx`

**Interfaces:**
- Consumes: `CaseStudyTable` from `@/content/projects`; `useLocalized`.
- Produces: `export function CaseStudyTable(props: { table: CaseStudyTableContent }): ReactElement | null`. Task 5 renders it.

- [ ] **Step 1: Write the failing test**

Create `web/src/components/projects/case-study-table.test.tsx`:

```tsx
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CaseStudyTable } from '@/components/projects/case-study-table';
import type { CaseStudyTable as CaseStudyTableContent } from '@/content/projects';
import { renderWithI18n } from '@/test/render-with-i18n';

const table: CaseStudyTableContent = {
  caption: { en: 'What a step records', 'pt-BR': 'O que um passo registra' },
  columns: [
    { en: 'Expected', 'pt-BR': 'Esperado' },
    { en: 'Heard', 'pt-BR': 'Ouvido' },
    { en: 'Similarity', 'pt-BR': 'Similaridade' },
  ],
  rows: [
    ['please enter your service tag', 'please enter your service tag', '100%'],
    ['transferring you to support', 'transferring you to sales', '81%'],
  ],
  note: { en: 'Values are illustrative.', 'pt-BR': 'Os valores são ilustrativos.' },
};

describe('CaseStudyTable', () => {
  it('renders a real table with a column header per column', async () => {
    await renderWithI18n(<CaseStudyTable table={table} />);

    const headers = screen.getAllByRole('columnheader');
    expect(headers.map((h) => h.textContent)).toEqual(['Expected', 'Heard', 'Similarity']);
    for (const header of headers) {
      expect(header).toHaveAttribute('scope', 'col');
    }
  });

  it('renders one row per data row, with every cell', async () => {
    await renderWithI18n(<CaseStudyTable table={table} />);

    // +1 for the header row.
    expect(screen.getAllByRole('row')).toHaveLength(3);
    expect(screen.getByText('transferring you to sales')).toBeInTheDocument();
    expect(screen.getByText('81%')).toBeInTheDocument();
  });

  it('renders the note, which carries the illustrative disclaimer', async () => {
    await renderWithI18n(<CaseStudyTable table={table} />);
    expect(screen.getByText('Values are illustrative.')).toBeInTheDocument();
  });

  it('renders headers and note in pt-BR', async () => {
    await renderWithI18n(<CaseStudyTable table={table} />, { locale: 'pt-BR' });

    expect(screen.getAllByRole('columnheader').map((h) => h.textContent)).toEqual([
      'Esperado',
      'Ouvido',
      'Similaridade',
    ]);
    expect(screen.getByText('Os valores são ilustrativos.')).toBeInTheDocument();
  });

  it('renders nothing when there are no rows', async () => {
    const { container } = await renderWithI18n(<CaseStudyTable table={{ ...table, rows: [] }} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('adds no heading of its own', async () => {
    await renderWithI18n(<CaseStudyTable table={table} />);
    expect(screen.queryAllByRole('heading')).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd web && pnpm test src/components/projects/case-study-table.test.tsx`
Expected: FAIL — cannot resolve `@/components/projects/case-study-table`.

- [ ] **Step 3: Write the component**

Create `web/src/components/projects/case-study-table.tsx`:

```tsx
import type { CaseStudyTable as CaseStudyTableContent } from '@/content/projects';
import { useLocalized } from '@/i18n/use-localized';

export interface CaseStudyTableProps {
  table: CaseStudyTableContent;
}

/**
 * A small illustrative table of what a system records. A real `<table>` with
 * scoped column headers rather than a picture of one, so the values stay
 * selectable and a screen reader announces each cell with its column. Wide
 * content scrolls inside its own container so the page never does.
 * The caption is rendered by the page section as its heading, not here.
 */
export function CaseStudyTable({ table }: CaseStudyTableProps) {
  const L = useLocalized();
  if (table.rows.length === 0) return null;

  return (
    <figure className="m-0 flex flex-col gap-3">
      <div className="overflow-x-auto rounded-lg border border-signal/20 bg-signal-muted/10">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-signal/20">
              {table.columns.map((column, index) => (
                <th
                  key={index}
                  scope="col"
                  className="px-4 py-3 font-mono text-[0.6875rem] font-medium tracking-wide text-signal-strong uppercase"
                >
                  {L(column)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-b border-signal/10 last:border-b-0">
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="px-4 py-3 align-top text-muted-foreground">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {table.note ? (
        <figcaption className="max-w-2xl text-xs leading-relaxed text-muted-foreground">
          {L(table.note)}
        </figcaption>
      ) : null}
    </figure>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd web && pnpm test src/components/projects/case-study-table.test.tsx`
Expected: PASS — 6 tests.

- [ ] **Step 5: Commit**

```bash
git add web/src/components/projects/case-study-table.tsx web/src/components/projects/case-study-table.test.tsx
git commit -m "feat(projects): case-study result table"
```

---

### Task 5: Render the three figures on the detail page

**Files:**
- Modify: `web/src/components/projects/project-detail.tsx`
- Modify: `web/src/routes/project-detail.test.tsx`

**Interfaces:**
- Consumes: `CaseStudyScript` (Task 2), `CaseStudyComparison` (Task 3), `CaseStudyTable` (Task 4).
- Produces: the finished page.

- [ ] **Step 1: Write the failing test**

Append inside the `describe('ProjectDetail', …)` block in `web/src/routes/project-detail.test.tsx`:

```tsx
  it('renders the Dell case study with its three figures, in section order', async () => {
    await renderDetail('dell-automated-caller');

    const h1 = await screen.findAllByRole('heading', { level: 1 });
    expect(h1).toHaveLength(1);
    expect(h1[0]).toHaveTextContent('Dell Automated Caller');

    expect(screen.getByText(/pressing the keys/i)).toBeInTheDocument();
    expect(screen.getByText('Validator')).toBeInTheDocument();
    expect(screen.getByText('~1 month')).toBeInTheDocument();
    expect(screen.getAllByRole('columnheader')).toHaveLength(3);

    const headings = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
    expect(headings).toEqual([
      'Overview',
      'The problem',
      'By the numbers',
      'Architecture',
      'A test script',
      'One test cycle',
      'What a step records',
      'What it does',
      'Engineering decisions',
    ]);

    expect(screen.getByText('Private')).toBeInTheDocument();
    const externalLinks = screen.queryAllByRole('link').filter((l) => l.getAttribute('target') === '_blank');
    expect(externalLinks).toHaveLength(0);
  });

  it('renders the Dell figure headings in pt-BR', async () => {
    await renderDetail('dell-automated-caller', 'pt-BR');

    await screen.findAllByRole('heading', { level: 1 });

    const headings = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
    expect(headings).toEqual([
      'Visão geral',
      'O problema',
      'Em números',
      'Arquitetura',
      'Um roteiro de teste',
      'Um ciclo de teste',
      'O que um passo registra',
      'O que faz',
      'Decisões de engenharia',
    ]);
  });

```

Do **not** add a test asserting `ulbra-atende` still renders its six sections: the existing case `'renders the full case study for ulbra-atende, in section order'` already compares that exact ordered `<h2>` list with `toEqual`, so it fails the moment a figure section leaks onto a project that has no figures. A second copy would add a maintenance burden and no coverage.

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd web && pnpm test src/routes/project-detail.test.tsx`
Expected: FAIL — the figure headings are absent from the `<h2>` list.

- [ ] **Step 3: Render the sections**

In `web/src/components/projects/project-detail.tsx`, add these imports alongside the existing `@/components/projects/*` imports:

```tsx
import { CaseStudyComparison } from '@/components/projects/case-study-comparison';
import { CaseStudyScript } from '@/components/projects/case-study-script';
import { CaseStudyTable } from '@/components/projects/case-study-table';
```

Then insert these three blocks immediately after the architecture section's closing `) : null}` and before the highlights section:

```tsx
        {project.detail?.script && project.detail.script.lines.length > 0 ? (
          <section className="flex flex-col gap-3">
            <SubsectionHeading>{L(project.detail.script.caption)}</SubsectionHeading>
            <CaseStudyScript script={project.detail.script} />
          </section>
        ) : null}

        {project.detail?.comparison ? (
          <section className="flex flex-col gap-3">
            <SubsectionHeading>{L(project.detail.comparison.caption)}</SubsectionHeading>
            <CaseStudyComparison comparison={project.detail.comparison} />
          </section>
        ) : null}

        {project.detail?.table && project.detail.table.rows.length > 0 ? (
          <section className="flex flex-col gap-3">
            <SubsectionHeading>{L(project.detail.table.caption)}</SubsectionHeading>
            <CaseStudyTable table={project.detail.table} />
          </section>
        ) : null}
```

Each guard checks the same emptiness the component checks, so a section heading never renders above a component that returned `null`.

- [ ] **Step 4: Run the full suite, lint and build**

Run: `cd web && pnpm test && pnpm lint && pnpm build`
Expected: PASS on all three.

- [ ] **Step 5: Commit**

```bash
git add web/src/components/projects/project-detail.tsx web/src/routes/project-detail.test.tsx
git commit -m "feat(projects): render script, comparison and table figures"
```

---

## Verification

From `web/`:

```bash
pnpm test && pnpm lint && pnpm build
```

Then look at the page: `pnpm dev`, open `/projects/dell-automated-caller`, toggle the language, and check three things a test cannot:

1. The comparison bars read as wildly disproportionate — that disproportion is the point of the figure.
2. The script block scrolls horizontally on a narrow window instead of widening the page.
3. The table scrolls inside its own container, and its header row stays legible.

Then open `/projects/ulbra-atende` and `/projects/kota-embed` and confirm they look exactly as they did before.
