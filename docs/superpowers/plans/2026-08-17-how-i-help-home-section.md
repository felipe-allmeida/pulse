# "How can I help you?" Home Section Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the home page's "Send a pulse" button with a "How can I help you?" section carrying four founder-facing problems, each with a mini diagram and a collapsed layer of concrete examples plus one technical line.

**Architecture:** A new `web/src/components/home/help/` directory with three components — a section (`how-i-help.tsx`), a card (`help-card.tsx`), and the mini diagram (`help-diagram.tsx`). All copy lives in the existing `home` i18n namespace under a new `help.*` block. The section renders between `Hero` and `EngineeringShowcase` in `routes/index.tsx`; `send-pulse.tsx` and its `sendPulse.*` copy are deleted.

**Tech Stack:** React 19, TypeScript, Tailwind v4, react-i18next, lucide-react, Vitest + Testing Library, oxlint.

**Spec:** `docs/superpowers/specs/2026-08-17-how-i-help-home-design.md`

## Global Constraints

- **Every user-visible string is translated in both `en` and `pt-BR`.** No hardcoded copy in components.
- **Portuguese is the original, English is the translation.** When the two disagree, the pt-BR wording is authoritative.
- **No jargon on the card surface.** Headline and body must contain no technical terms. Technical vocabulary appears only in the `tech` line inside the collapsed layer.
- **Motion respects `prefers-reduced-motion`,** and the animated element carries `data-motion="static" | "animated"` — the convention `architecture-diagram.tsx`, `hero-map.tsx` and `pill.tsx` already follow.
- **Components must survive SSR.** `pnpm -C web build` prerenders via `vite build --ssr src/entry-prerender.tsx`. Never touch `window`, `document` or `IntersectionObserver` during render — only inside `useEffect`.
- **This project uses pnpm, and commands run from the repo root** via `-C web`, exactly as CI does (`.github/workflows/ci.yml`). Tests: `pnpm -C web test`. A single file: `pnpm -C web test src/path/to/file.test.tsx`. Lint: `pnpm -C web lint`. Typecheck: `pnpm -C web exec tsc --noEmit`. Build: `pnpm -C web build`. Never `npm`.
- **Tests are co-located** as `<name>.test.tsx` beside the component, and render through `renderWithI18n` from `@/test/render-with-i18n`.

---

### Task 1: The copy

Adds the whole `help.*` block to both locale files. Nothing renders it yet — this task exists on its own because the copy is the part most likely to be sent back for revision, and a reviewer should be able to reject wording without rejecting the components.

**Files:**
- Modify: `web/src/i18n/locales/pt-BR/home.json`
- Modify: `web/src/i18n/locales/en/home.json`
- Create: `web/src/i18n/help-copy.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: the `home:help.*` key tree used by every later task. Card keys, in render order: `repetitive`, `spreadsheet`, `ai`, `idea`. Each card has `headline`, `body`, `examples` (array of 3 strings), `tech`, and `diagram.{from,via,to}`. Section-level keys: `eyebrow`, `heading`, `lede`, `examplesLabel`, `techLabel`, `cta.ask`, `cta.book`.

- [ ] **Step 1: Write the failing test**

Create `web/src/i18n/help-copy.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { resources } from '@/i18n';

const CARD_KEYS = ['repetitive', 'spreadsheet', 'ai', 'idea'] as const;

type HelpBlock = {
  eyebrow: string;
  heading: string;
  lede: string;
  examplesLabel: string;
  techLabel: string;
  cards: Record<
    (typeof CARD_KEYS)[number],
    {
      headline: string;
      body: string;
      examples: string[];
      tech: string;
      diagram: { from: string; via: string; to: string };
    }
  >;
  cta: { ask: string; book: string };
};

const locales = {
  en: (resources.en.home as unknown as { help: HelpBlock }).help,
  'pt-BR': (resources['pt-BR'].home as unknown as { help: HelpBlock }).help,
};

describe('home:help copy', () => {
  for (const [locale, help] of Object.entries(locales)) {
    describe(locale, () => {
      it('has every section-level string, non-empty', () => {
        for (const key of ['eyebrow', 'heading', 'lede', 'examplesLabel', 'techLabel'] as const) {
          expect(help[key], `${locale}.help.${key}`).toBeTypeOf('string');
          expect(help[key].length, `${locale}.help.${key}`).toBeGreaterThan(0);
        }
        expect(help.cta.ask.length).toBeGreaterThan(0);
        expect(help.cta.book.length).toBeGreaterThan(0);
      });

      it('has all four cards, in order, each complete', () => {
        expect(Object.keys(help.cards)).toEqual([...CARD_KEYS]);

        for (const key of CARD_KEYS) {
          const card = help.cards[key];
          expect(card.headline.length, `${locale}.${key}.headline`).toBeGreaterThan(0);
          expect(card.body.length, `${locale}.${key}.body`).toBeGreaterThan(0);
          expect(card.tech.length, `${locale}.${key}.tech`).toBeGreaterThan(0);
          expect(card.examples, `${locale}.${key}.examples`).toHaveLength(3);
          for (const example of card.examples) expect(example.length).toBeGreaterThan(0);
          for (const node of ['from', 'via', 'to'] as const) {
            expect(card.diagram[node].length, `${locale}.${key}.diagram.${node}`).toBeGreaterThan(0);
          }
        }
      });
    });
  }

  // The whole point of the section: a founder reads the surface, and the
  // engineering vocabulary is quarantined in the collapsed `tech` line.
  it('keeps technical vocabulary out of every headline and body, in both locales', () => {
    const JARGON = /\b(API|webhook|MCP|SignalR|RabbitMQ|Postgres|outbox|deploy|pull request|Kubernetes|Docker|\.NET)\b/i;

    for (const [locale, help] of Object.entries(locales)) {
      for (const key of CARD_KEYS) {
        const card = help.cards[key];
        expect(card.headline, `${locale}.${key}.headline is jargon-free`).not.toMatch(JARGON);
        expect(card.body, `${locale}.${key}.body is jargon-free`).not.toMatch(JARGON);
      }
      expect(help.lede, `${locale}.lede is jargon-free`).not.toMatch(JARGON);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm -C web test src/i18n/help-copy.test.ts`
Expected: FAIL — reading `help` of the home resource is `undefined`, so `help.eyebrow` throws `TypeError: Cannot read properties of undefined`.

- [ ] **Step 3: Add the pt-BR copy**

In `web/src/i18n/locales/pt-BR/home.json`, add this `help` block as a new top-level key (place it directly after `"showcase"`, so file order roughly follows page order). Leave `sendPulse` in place for now — Task 5 removes it together with its component.

```json
  "help": {
    "eyebrow": "o que eu resolvo",
    "heading": "Como eu posso te ajudar?",
    "lede": "Eu não vendo tecnologia. Eu resolvo o processo que hoje só anda quando alguém lembra de fazer na mão.",
    "examplesLabel": "exemplos",
    "techLabel": "por trás disso:",
    "cards": {
      "repetitive": {
        "headline": "Seu time gasta o dia em trabalho que a máquina faria.",
        "body": "Pedido que chega no WhatsApp e alguém redigita no sistema. Relatório montado à mão toda segunda. A conferência que ninguém tem tempo de fazer. Isso vira uma rotina que roda sozinha, no horário, sem esquecer.",
        "examples": [
          "O pedido do WhatsApp entrando no sistema sozinho",
          "O relatório de segunda pronto no domingo à noite",
          "Uma conferência entre duas bases rodando de madrugada, avisando só o que divergiu"
        ],
        "tech": "Filas e workers, agendamento, integrações por API e webhook, testes automatizados de ponta a ponta.",
        "diagram": { "from": "na mão", "via": "rotina", "to": "pronto" }
      },
      "spreadsheet": {
        "headline": "Alguém da sua equipe passa o dia preenchendo planilha.",
        "body": "A planilha pode continuar existindo — ela só não precisa ser preenchida na mão. O dado nasce onde ele já acontece e chega lá sozinho. Daí vira um painel que se atualiza sozinho, que dá pra filtrar e cruzar na hora, e que age quando um número cruza o limite que você definiu.",
        "examples": [
          "A venda fechada entrando no painel no instante em que acontece",
          "O caixa se atualizando sozinho, em vez de fechar no dia 5",
          "Estoque abaixo do mínimo avisando quem compra, sem ninguém olhar"
        ],
        "tech": "Ingestão contínua pela API da ferramenta de origem, modelagem e agregação dos dados, painel interativo, e regras de gatilho disparando webhook, fila ou notificação.",
        "diagram": { "from": "planilha", "via": "painel", "to": "ação" }
      },
      "ai": {
        "headline": "Você quer IA no que a empresa já faz, não numa demo.",
        "body": "Um assistente que responde em cima dos seus documentos e dos seus dados, respeitando quem pode ver o quê. E, quando faz sentido, sua equipe resolvendo as coisas por dentro do Claude ou do ChatGPT.",
        "examples": [
          "“Quanto sobrou do contrato da X?” respondido sem abrir o sistema",
          "A política interna respondida a partir do documento que já existe, com a fonte citada",
          "O chamado aberto, classificado e encaminhado direto de um e-mail"
        ],
        "tech": "Servidor MCP sobre o sistema, identidade e permissão resolvidas por usuário, base de conhecimento da empresa indexada.",
        "diagram": { "from": "seus dados", "via": "assistente", "to": "resposta" }
      },
      "idea": {
        "headline": "A ideia ainda não saiu do papel.",
        "body": "Você sabe o que quer construir e precisa de alguém que construa — e que depois lidere o time que vai continuar. Do primeiro protótipo que dá pra mostrar pra cliente até a equipe que toca sozinha.",
        "examples": [
          "Um MVP no ar em semanas, pra validar com cliente de verdade",
          "O primeiro engenheiro contratado e integrado",
          "A decisão de arquitetura tomada agora que não trava vocês daqui a um ano"
        ],
        "tech": "12+ anos em .NET e React, arquitetura orientada a eventos, Head of Technology de times de 3 a 13 pessoas.",
        "diagram": { "from": "ideia", "via": "produto", "to": "time" }
      }
    },
    "cta": {
      "ask": "Me conta o seu caso",
      "book": "Conversar comigo"
    }
  },
```

- [ ] **Step 4: Add the en copy**

In `web/src/i18n/locales/en/home.json`, in the same position:

```json
  "help": {
    "eyebrow": "what i solve",
    "heading": "How can I help you?",
    "lede": "I don't sell technology. I fix the process that today only moves when someone remembers to do it by hand.",
    "examplesLabel": "examples",
    "techLabel": "behind it:",
    "cards": {
      "repetitive": {
        "headline": "Your team spends the day doing work a machine would do.",
        "body": "An order arrives on WhatsApp and someone retypes it into the system. Monday's report gets assembled by hand. The reconciliation nobody has time for. That becomes a routine that runs on its own, on schedule, without forgetting.",
        "examples": [
          "The WhatsApp order entering the system on its own",
          "Monday's report ready on Sunday night",
          "A nightly reconciliation across two databases that reports only what disagreed"
        ],
        "tech": "Queues and workers, scheduling, API and webhook integrations, end-to-end automated testing.",
        "diagram": { "from": "by hand", "via": "routine", "to": "done" }
      },
      "spreadsheet": {
        "headline": "Someone on your team spends the day filling in a spreadsheet.",
        "body": "The spreadsheet can stay — it just doesn't need to be filled in by hand. The data is born where it already happens and arrives there on its own. From there it becomes a dashboard that updates itself, that you can filter and cross on the spot, and that acts when a number crosses a limit you set.",
        "examples": [
          "A closed sale landing on the dashboard the moment it happens",
          "Cash position updating itself instead of closing on the 5th",
          "Stock below minimum alerting whoever buys, with nobody watching"
        ],
        "tech": "Continuous ingestion from the source tool's API, data modelling and aggregation, interactive dashboard, and trigger rules firing a webhook, queue or notification.",
        "diagram": { "from": "spreadsheet", "via": "dashboard", "to": "action" }
      },
      "ai": {
        "headline": "You want AI in what the company already does, not in a demo.",
        "body": "An assistant that answers on top of your documents and your data, respecting who is allowed to see what. And, where it makes sense, your team getting things done from inside Claude or ChatGPT.",
        "examples": [
          "“How much is left on the X contract?” answered without opening the system",
          "An internal policy answered from the document that already exists, with the source cited",
          "A ticket opened, classified and routed straight from an email"
        ],
        "tech": "An MCP server over the system, identity and permissions resolved per user, an indexed company knowledge base.",
        "diagram": { "from": "your data", "via": "assistant", "to": "answer" }
      },
      "idea": {
        "headline": "The idea hasn't left the drawing board yet.",
        "body": "You know what you want to build and you need someone to build it — and then to lead the team that keeps building. From the first prototype worth showing a customer to the team that runs on its own.",
        "examples": [
          "An MVP live in weeks, to validate with real customers",
          "The first engineer hired and onboarded",
          "The architecture decision taken now that doesn't trap you a year from now"
        ],
        "tech": "12+ years in .NET and React, event-driven architecture, Head of Technology for teams of 3 to 13.",
        "diagram": { "from": "idea", "via": "product", "to": "team" }
      }
    },
    "cta": {
      "ask": "Tell me your case",
      "book": "Talk to me"
    }
  },
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm -C web test src/i18n/help-copy.test.ts`
Expected: PASS — 5 tests.

- [ ] **Step 6: Commit**

```bash
git add web/src/i18n/locales/en/home.json web/src/i18n/locales/pt-BR/home.json web/src/i18n/help-copy.test.ts
git commit -m "feat(web): copy for the \"How can I help you?\" home section"
```

---

### Task 2: The mini diagram

Four small three-node diagrams — `from → via → to` — reusing the visual grammar of `architecture-diagram.tsx` (mono labels, signal accent, a dot travelling the edge). Each plays its traversal once when it scrolls into view.

**Files:**
- Create: `web/src/components/home/help/help-diagram.tsx`
- Test: `web/src/components/home/help/help-diagram.test.tsx`

**Interfaces:**
- Consumes: `home:help.cards.<variant>.diagram.{from,via,to}` from Task 1; `useReducedMotion` from `@/hooks/use-reduced-motion`.
- Produces: `export type HelpCardKey = 'repetitive' | 'spreadsheet' | 'ai' | 'idea'` and `export function HelpDiagram({ variant }: { variant: HelpCardKey })`. Tasks 3 and 4 both import `HelpCardKey` from this module — it is the single source for the four card identifiers.

- [ ] **Step 1: Write the failing test**

Create `web/src/components/home/help/help-diagram.test.tsx`:

```tsx
import { screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithI18n } from '@/test/render-with-i18n';
import { HelpDiagram } from './help-diagram';

function mockMatchMedia(matches: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

/**
 * jsdom has no IntersectionObserver. This stub records the callback so a
 * test can decide when the diagram "enters the viewport".
 */
let triggerIntersection: ((isIntersecting: boolean) => void) | null = null;

function stubIntersectionObserver() {
  triggerIntersection = null;
  class Stub {
    constructor(private cb: IntersectionObserverCallback) {
      triggerIntersection = (isIntersecting: boolean) =>
        this.cb([{ isIntersecting } as IntersectionObserverEntry], this as unknown as IntersectionObserver);
    }
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
    takeRecords = vi.fn(() => []);
    root = null;
    rootMargin = '';
    thresholds = [];
  }
  vi.stubGlobal('IntersectionObserver', Stub);
}

describe('HelpDiagram', () => {
  beforeEach(() => {
    mockMatchMedia(false);
    stubIntersectionObserver();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders the three localized node labels for its variant', async () => {
    await renderWithI18n(<HelpDiagram variant="spreadsheet" />);

    expect(screen.getByText('spreadsheet')).toBeInTheDocument();
    expect(screen.getByText('dashboard')).toBeInTheDocument();
    expect(screen.getByText('action')).toBeInTheDocument();
  });

  it('renders pt-BR node labels', async () => {
    await renderWithI18n(<HelpDiagram variant="spreadsheet" />, { locale: 'pt-BR' });

    expect(screen.getByText('planilha')).toBeInTheDocument();
    expect(screen.getByText('painel')).toBeInTheDocument();
    expect(screen.getByText('ação')).toBeInTheDocument();
  });

  it('gives each variant its own triple of three distinct icons', async () => {
    const { container: repetitive } = await renderWithI18n(<HelpDiagram variant="repetitive" />);
    const { container: idea } = await renderWithI18n(<HelpDiagram variant="idea" />);

    // lucide-react stamps every icon with a `lucide-<name>` class — the only
    // stable handle on *which* icon rendered. The exact names are not
    // asserted: they change across lucide majors, and what matters is that
    // each card gets three different icons and no two cards share a triple.
    const iconsOf = (root: HTMLElement) =>
      Array.from(root.querySelectorAll('svg')).map(
        (svg) => Array.from(svg.classList).find((c) => c.startsWith('lucide-')) ?? '',
      );

    expect(iconsOf(repetitive)).toHaveLength(3);
    expect(new Set(iconsOf(repetitive)).size, 'three distinct icons within a card').toBe(3);
    expect(new Set(iconsOf(idea)).size, 'three distinct icons within a card').toBe(3);
    expect(iconsOf(repetitive)).not.toEqual(iconsOf(idea));
  });

  it('starts idle and plays the traversal once when it scrolls into view', async () => {
    const { container } = await renderWithI18n(<HelpDiagram variant="ai" />);
    const diagram = container.querySelector('[data-motion]') as HTMLElement;

    expect(diagram).toHaveAttribute('data-motion', 'animated');
    expect(diagram).toHaveAttribute('data-traversal', 'idle');

    triggerIntersection?.(true);

    await vi.waitFor(() => expect(diagram).toHaveAttribute('data-traversal', 'playing'));
  });

  it('stays static under prefers-reduced-motion, even once in view', async () => {
    mockMatchMedia(true);

    const { container } = await renderWithI18n(<HelpDiagram variant="ai" />);
    const diagram = container.querySelector('[data-motion]') as HTMLElement;

    expect(diagram).toHaveAttribute('data-motion', 'static');

    triggerIntersection?.(true);

    expect(diagram).toHaveAttribute('data-traversal', 'idle');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm -C web test src/components/home/help/help-diagram.test.tsx`
Expected: FAIL — `Failed to resolve import "./help-diagram"`.

- [ ] **Step 3: Write the implementation**

Create `web/src/components/home/help/help-diagram.tsx`:

```tsx
import { useEffect, useRef, useState } from 'react';
import {
  BarChart3,
  BellRing,
  Bot,
  CheckCircle2,
  FileText,
  Hand,
  Lightbulb,
  MessageSquare,
  Package,
  Table,
  Users,
  Workflow,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

export type HelpCardKey = 'repetitive' | 'spreadsheet' | 'ai' | 'idea';

/** Ordered as rendered on the page. */
export const HELP_CARD_KEYS: readonly HelpCardKey[] = ['repetitive', 'spreadsheet', 'ai', 'idea'] as const;

const EDGE_DURATION_MS = 550;
const EDGE_STAGGER_MS = 350;
const TRAVERSAL_TOTAL_MS = EDGE_STAGGER_MS + EDGE_DURATION_MS;

/**
 * The icon triple per card: what the work looks like by hand, what takes it
 * over, what comes out. Deliberately literal — these are read at 16px next
 * to a three-word label, not decoded.
 */
const ICONS: Record<HelpCardKey, [typeof Hand, typeof Hand, typeof Hand]> = {
  repetitive: [Hand, Workflow, CheckCircle2],
  spreadsheet: [Table, BarChart3, BellRing],
  ai: [FileText, Bot, MessageSquare],
  idea: [Lightbulb, Package, Users],
};

/**
 * A small "by hand → on its own" diagram, one per help card. Three nodes and
 * two edges, in the same visual grammar as `ArchitectureDiagram` (mono
 * labels, signal accent, a dot travelling the edge) so the section reads as
 * part of this site rather than as a marketing block pasted onto it.
 *
 * The traversal plays once, when the diagram scrolls into view — the card is
 * not interactive, so there is no click to hang it off. Under
 * `prefers-reduced-motion` it never plays and the edges carry a static dot,
 * the same fallback the architecture diagram uses.
 */
export function HelpDiagram({ variant }: { variant: HelpCardKey }) {
  const { t } = useTranslation('home');
  const reducedMotion = useReducedMotion();
  const [traversing, setTraversing] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const playedRef = useRef(false);

  useEffect(() => {
    if (reducedMotion || playedRef.current) return;
    const node = rootRef.current;
    if (!node || typeof IntersectionObserver !== 'function') return;

    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting) || playedRef.current) return;
      playedRef.current = true;
      setTraversing(true);
      observer.disconnect();
    });

    observer.observe(node);
    return () => observer.disconnect();
  }, [reducedMotion]);

  useEffect(() => {
    if (!traversing) return;
    const timeout = setTimeout(() => setTraversing(false), TRAVERSAL_TOTAL_MS);
    return () => clearTimeout(timeout);
  }, [traversing]);

  const icons = ICONS[variant];
  const nodes = (['from', 'via', 'to'] as const).map((node, index) => ({
    key: node,
    Icon: icons[index],
    label: t(`home:help.cards.${variant}.diagram.${node}`),
  }));

  return (
    <div
      ref={rootRef}
      data-motion={reducedMotion ? 'static' : 'animated'}
      data-traversal={traversing ? 'playing' : 'idle'}
      className="flex items-center gap-0 font-mono"
    >
      {nodes.map((node, index) => (
        <div key={node.key} className="flex items-center">
          <div className="flex w-16 flex-col items-center gap-1.5 text-center">
            <div className="flex size-8 items-center justify-center rounded-full border border-signal/40 bg-background text-signal-strong">
              <node.Icon className="size-4" aria-hidden="true" />
            </div>
            <div className="text-[10px] leading-tight text-muted-foreground">{node.label}</div>
          </div>

          {index < nodes.length - 1 && (
            <div className="relative mt-[-18px] h-px w-6 shrink-0 bg-signal/25 sm:w-8">
              {reducedMotion ? (
                <span
                  aria-hidden="true"
                  className="absolute top-1/2 left-1/2 size-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-signal/60"
                />
              ) : (
                traversing && (
                  <span
                    aria-hidden="true"
                    className="absolute top-1/2 left-0 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-signal shadow-[0_0_8px_2px_var(--color-signal)]"
                    style={{
                      animation: `signal-edge ${EDGE_DURATION_MS}ms ease-in-out 1`,
                      animationDelay: `${index * EDGE_STAGGER_MS}ms`,
                    }}
                  />
                )
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
```

Note: `signal-edge` is the existing keyframe animation used by `architecture-diagram.tsx` — already defined in `web/src/styles.css`, nothing to add.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm -C web test src/components/home/help/help-diagram.test.tsx`
Expected: PASS — 5 tests.

- [ ] **Step 5: Lint**

Run: `pnpm -C web lint`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add web/src/components/home/help/help-diagram.tsx web/src/components/home/help/help-diagram.test.tsx
git commit -m "feat(web): the by-hand-to-on-its-own mini diagram for help cards"
```

---

### Task 3: The card

One card: diagram, headline, body, and a `<details>` disclosure holding the three examples plus the dimmed technical line.

**Files:**
- Create: `web/src/components/home/help/help-card.tsx`
- Test: `web/src/components/home/help/help-card.test.tsx`

**Interfaces:**
- Consumes: `HelpDiagram` and `HelpCardKey` from Task 2; `home:help.*` from Task 1.
- Produces: `export function HelpCard({ variant }: { variant: HelpCardKey })`. It reads all of its own copy from i18n — the caller passes only the variant.

- [ ] **Step 1: Write the failing test**

Create `web/src/components/home/help/help-card.test.tsx`:

```tsx
import { screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithI18n } from '@/test/render-with-i18n';
import { HelpCard } from './help-card';

vi.mock('./help-diagram', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./help-diagram')>();
  return { ...actual, HelpDiagram: ({ variant }: { variant: string }) => <div data-testid={`diagram-${variant}`} /> };
});

describe('HelpCard', () => {
  beforeEach(() => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })) as unknown as typeof window.matchMedia;
  });

  it('renders the headline and body for its variant', async () => {
    await renderWithI18n(<HelpCard variant="spreadsheet" />);

    expect(
      screen.getByText('Someone on your team spends the day filling in a spreadsheet.'),
    ).toBeInTheDocument();
    expect(screen.getByText(/The spreadsheet can stay/)).toBeInTheDocument();
  });

  it('renders its diagram', async () => {
    await renderWithI18n(<HelpCard variant="ai" />);

    expect(screen.getByTestId('diagram-ai')).toBeInTheDocument();
  });

  it('puts the examples and the technical line inside a disclosure that starts closed', async () => {
    const { container } = await renderWithI18n(<HelpCard variant="idea" />);

    const details = container.querySelector('details') as HTMLDetailsElement;
    expect(details).toBeInTheDocument();
    expect(details.open, 'the card opens showing only founder-facing copy').toBe(false);

    expect(within(details).getByText(/examples/i)).toBeInTheDocument();
    expect(within(details).getByText('The first engineer hired and onboarded')).toBeInTheDocument();
    expect(within(details).getByText(/12\+ years in \.NET and React/)).toBeInTheDocument();
  });

  it('renders all three examples as a list', async () => {
    const { container } = await renderWithI18n(<HelpCard variant="repetitive" />);

    const items = container.querySelectorAll('details li');
    expect(items).toHaveLength(3);
    expect(items[0]).toHaveTextContent('The WhatsApp order entering the system on its own');
  });

  it('renders pt-BR copy', async () => {
    await renderWithI18n(<HelpCard variant="repetitive" />, { locale: 'pt-BR' });

    expect(
      screen.getByText('Seu time gasta o dia em trabalho que a máquina faria.'),
    ).toBeInTheDocument();
    expect(screen.getByText(/exemplos/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm -C web test src/components/home/help/help-card.test.tsx`
Expected: FAIL — `Failed to resolve import "./help-card"`.

- [ ] **Step 3: Write the implementation**

Create `web/src/components/home/help/help-card.tsx`:

```tsx
import { ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { HelpDiagram, type HelpCardKey } from '@/components/home/help/help-diagram';

/**
 * One offer, in two layers. The surface — diagram, headline, body — is
 * written for a founder and carries no technical vocabulary at all. The
 * `<details>` underneath holds three concrete examples and closes with one
 * dimmed line of real engineering terms, for whoever the founder forwards
 * this to.
 *
 * Native `<details>`/`<summary>` rather than a custom disclosure: keyboard
 * accessible with no code of ours, works with JavaScript disabled, and
 * leaves the collapsed copy in the DOM for crawlers — which matters, since
 * this site is deliberately built to be read by answer engines.
 */
export function HelpCard({ variant }: { variant: HelpCardKey }) {
  const { t } = useTranslation('home');

  const examples = t(`home:help.cards.${variant}.examples`, { returnObjects: true }) as string[];

  return (
    <div className="flex h-full flex-col gap-4 rounded-lg border border-signal/20 bg-signal-muted/10 p-5">
      <HelpDiagram variant={variant} />

      <h3 className="text-lg font-semibold tracking-tight text-balance text-foreground">
        {t(`home:help.cards.${variant}.headline`)}
      </h3>

      <p className="max-w-[60ch] flex-1 text-sm leading-relaxed text-muted-foreground">
        {t(`home:help.cards.${variant}.body`)}
      </p>

      <details className="group border-t border-signal/15 pt-3">
        {/*
          `list-none` + the WebKit pseudo-element rule kill the native
          triangle marker so the chevron below is the only affordance; the
          summary keeps its own focus ring and stays a real disclosure
          control for keyboard and screen readers.
        */}
        <summary className="flex cursor-pointer list-none items-center gap-1.5 rounded font-mono text-xs tracking-[0.15em] text-signal-strong uppercase focus-visible:ring-2 focus-visible:ring-signal-strong focus-visible:outline-none [&::-webkit-details-marker]:hidden">
          <ChevronRight
            className="size-3.5 transition-transform group-open:rotate-90 motion-reduce:transition-none"
            aria-hidden="true"
          />
          {t('home:help.examplesLabel')}
        </summary>

        <ul className="mt-3 flex flex-col gap-2">
          {examples.map((example) => (
            <li key={example} className="flex gap-2 text-sm leading-relaxed text-muted-foreground">
              <span aria-hidden="true" className="mt-2 size-1 shrink-0 rounded-full bg-signal/60" />
              <span>{example}</span>
            </li>
          ))}
        </ul>

        {/* The one place technical vocabulary is allowed. Small and dimmed on
            purpose: the founder's eye slides past it, the engineer's doesn't. */}
        <p className="mt-3 font-mono text-[11px] leading-relaxed text-muted-foreground/70">
          <span className="text-signal-strong/70">{t('home:help.techLabel')}</span>{' '}
          {t(`home:help.cards.${variant}.tech`)}
        </p>
      </details>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm -C web test src/components/home/help/help-card.test.tsx`
Expected: PASS — 5 tests.

- [ ] **Step 5: Commit**

```bash
git add web/src/components/home/help/help-card.tsx web/src/components/home/help/help-card.test.tsx
git commit -m "feat(web): the help card, founder-facing with a folded technical layer"
```

---

### Task 4: The section

Eyebrow, heading, lede, the 2x2 grid of four cards, and the CTA pair.

**Files:**
- Create: `web/src/components/home/help/how-i-help.tsx`
- Test: `web/src/components/home/help/how-i-help.test.tsx`

**Interfaces:**
- Consumes: `HelpCard` (Task 3), `HELP_CARD_KEYS` (Task 2), `useAskWidgetStore` from `@/stores/ask-widget-store`, `profile.contact.calendly` from `@/content/profile`, `SectionEyebrow`, `Button`/`buttonVariants`.
- Produces: `export function HowIHelp()`, consumed by `routes/index.tsx` in Task 5.

The primary CTA calls `open()` with **no argument** — that opens the Ask widget with an empty composer so the visitor types their own case, which is exactly what "Tell me your case" asks for. (`AskChips` passes a question because it is offering a specific pre-written one; this button is not.)

- [ ] **Step 1: Write the failing test**

Create `web/src/components/home/help/how-i-help.test.tsx`:

```tsx
import { fireEvent, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithI18n } from '@/test/render-with-i18n';
import { profile } from '@/content/profile';
import { useAskWidgetStore } from '@/stores/ask-widget-store';
import { HowIHelp } from './how-i-help';

vi.mock('./help-diagram', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./help-diagram')>();
  return { ...actual, HelpDiagram: ({ variant }: { variant: string }) => <div data-testid={`diagram-${variant}`} /> };
});

describe('HowIHelp', () => {
  beforeEach(() => {
    useAskWidgetStore.setState({ isOpen: false, pendingQuestion: null });
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })) as unknown as typeof window.matchMedia;
  });

  it('renders the heading, eyebrow and lede', async () => {
    await renderWithI18n(<HowIHelp />);

    expect(screen.getByRole('heading', { name: 'How can I help you?' })).toBeInTheDocument();
    expect(screen.getByText('what i solve')).toBeInTheDocument();
    expect(screen.getByText(/I don't sell technology/)).toBeInTheDocument();
  });

  it('renders all four cards, in order', async () => {
    const { container } = await renderWithI18n(<HowIHelp />);

    for (const variant of ['repetitive', 'spreadsheet', 'ai', 'idea']) {
      expect(screen.getByTestId(`diagram-${variant}`)).toBeInTheDocument();
    }

    const headings = Array.from(container.querySelectorAll('h3')).map((h) => h.textContent);
    expect(headings).toEqual([
      'Your team spends the day doing work a machine would do.',
      'Someone on your team spends the day filling in a spreadsheet.',
      'You want AI in what the company already does, not in a demo.',
      "The idea hasn't left the drawing board yet.",
    ]);
  });

  it('opens the Ask widget with an empty composer when the primary CTA is clicked', async () => {
    await renderWithI18n(<HowIHelp />);

    fireEvent.click(screen.getByRole('button', { name: /tell me your case/i }));

    expect(useAskWidgetStore.getState().isOpen).toBe(true);
    expect(
      useAskWidgetStore.getState().pendingQuestion,
      'the visitor types their own case — nothing is submitted for them',
    ).toBeNull();
  });

  it('links the secondary CTA to the booking link, in a new tab', async () => {
    await renderWithI18n(<HowIHelp />);

    const book = screen.getByRole('link', { name: /talk to me/i });
    expect(book).toHaveAttribute('href', profile.contact.calendly);
    expect(book).toHaveAttribute('target', '_blank');
    expect(book).toHaveAttribute('rel', 'noreferrer');
  });

  it('renders pt-BR copy', async () => {
    await renderWithI18n(<HowIHelp />, { locale: 'pt-BR' });

    expect(screen.getByRole('heading', { name: 'Como eu posso te ajudar?' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /me conta o seu caso/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /conversar comigo/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm -C web test src/components/home/help/how-i-help.test.tsx`
Expected: FAIL — `Failed to resolve import "./how-i-help"`.

- [ ] **Step 3: Write the implementation**

Create `web/src/components/home/help/how-i-help.tsx`:

```tsx
import { Calendar, MessageCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { HelpCard } from '@/components/home/help/help-card';
import { HELP_CARD_KEYS } from '@/components/home/help/help-diagram';
import { SectionEyebrow } from '@/components/signal/section-eyebrow';
import { Button, buttonVariants } from '@/components/ui/button';
import { profile } from '@/content/profile';
import { useAskWidgetStore } from '@/stores/ask-widget-store';
import { cn } from '@/lib/utils';

/**
 * The home page's offer, sitting where "send a pulse" used to. That button
 * proved the pipeline was live, which is the right pitch for a hiring
 * engineer and the wrong one for the founder this site now sells to — a
 * founder does not evaluate a round-trip time. Four problems they recognise
 * from their own week, in their own words, with the engineering folded into
 * each card's disclosure for whoever they forward the link to.
 */
export function HowIHelp() {
  const { t } = useTranslation('home');
  const openAskWidget = useAskWidgetStore((s) => s.open);

  return (
    <section className="bg-background px-6 py-14 text-foreground sm:px-10 md:py-20">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <div className="flex flex-col gap-3">
          <SectionEyebrow>{t('home:help.eyebrow')}</SectionEyebrow>
          <h2 className="text-2xl font-semibold tracking-tight text-balance text-foreground">
            {t('home:help.heading')}
          </h2>
          <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">{t('home:help.lede')}</p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {HELP_CARD_KEYS.map((variant) => (
            <HelpCard key={variant} variant={variant} />
          ))}
        </div>

        {/*
          `open()` with no argument, unlike AskChips: this button asks the
          visitor to describe their own situation, so the widget opens with
          an empty composer rather than submitting a question for them.
        */}
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            size="lg"
            onClick={() => openAskWidget()}
            className="border-transparent bg-signal text-signal-foreground hover:bg-signal/90"
          >
            <MessageCircle aria-hidden="true" />
            {t('home:help.cta.ask')}
          </Button>

          {profile.contact.calendly !== '' && (
            <a
              href={profile.contact.calendly}
              target="_blank"
              rel="noreferrer"
              className={cn(buttonVariants({ variant: 'outline', size: 'lg' }))}
            >
              <Calendar aria-hidden="true" />
              {t('home:help.cta.book')}
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm -C web test src/components/home/help/how-i-help.test.tsx`
Expected: PASS — 5 tests.

- [ ] **Step 5: Lint**

Run: `pnpm -C web lint`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add web/src/components/home/help/how-i-help.tsx web/src/components/home/help/how-i-help.test.tsx
git commit -m "feat(web): the \"How can I help you?\" section"
```

---

### Task 5: Wire it into the home page and remove "Send a pulse"

Splits the full-bleed wrapper so the new section can sit between `Hero` and `EngineeringShowcase`, deletes `SendPulse` and its copy, and updates the two existing tests that assert the button.

**Files:**
- Modify: `web/src/routes/index.tsx:39-42`
- Modify: `web/src/components/home/engineering-showcase.tsx`
- Modify: `web/src/components/home/engineering-showcase.test.tsx:14-26,49-65`
- Modify: `web/src/routes/index.test.tsx:74-82`
- Modify: `web/src/i18n/locales/en/home.json`, `web/src/i18n/locales/pt-BR/home.json` (drop `sendPulse`)
- Delete: `web/src/components/home/send-pulse.tsx`, `web/src/components/home/send-pulse.test.tsx`

**Interfaces:**
- Consumes: `HowIHelp` from Task 4.
- Produces: nothing new.

`ArchitectureDiagram` already declares `traversalKey?: number` and returns early when it is `undefined` (`architecture-diagram.tsx:50`), so dropping the prop leaves it rendering its ambient animation with no one-shot traversal. No change is needed in that file.

`usePulseHub` stays — `LiveIndicator` uses it for the live count and connection state. Only its `react()` method loses its last caller in the web app; the server's `PresenceHub.React` endpoint is left alone.

- [ ] **Step 1: Update the failing tests first**

In `web/src/routes/index.test.tsx`, replace the two tests at lines 74–82:

```tsx
  it('renders the "How can I help you?" section in en', async () => {
    await renderIndexRoute('en');

    expect(screen.getByRole('heading', { name: 'How can I help you?' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /send a pulse/i })).not.toBeInTheDocument();
  });

  it('renders the "Como eu posso te ajudar?" section in pt-BR', async () => {
    await renderIndexRoute('pt-BR');

    expect(screen.getByRole('heading', { name: 'Como eu posso te ajudar?' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /enviar um pulso/i })).not.toBeInTheDocument();
  });
```

Still in `web/src/routes/index.test.tsx`, `send-pulse.tsx` was the only consumer of `usePulseHub` anywhere in this route's tree (`EventFeed`, `LiveMap` and `MapStats` do not use it), so its mock becomes dead once the component is gone. Remove the `usePulseHubMock` declaration (line 14), the `vi.mock('@/realtime/use-pulse-hub', …)` block (lines 22–24), and the `usePulseHubMock.mockReturnValue(…)` line inside `beforeEach` (line 71).

In `web/src/components/home/engineering-showcase.test.tsx`, delete the two tests at lines 49–65 (`hosts the "send a pulse" button…` and `places "send a pulse" before the diagram…`) and the now-unused `usePulseHubMock` declaration and `vi.mock` at lines 14–18, plus its `mockReturnValue` line inside `beforeEach` (line 25). The dynamic `await import('./engineering-showcase')` at line 20 existed only to sequence that mock — turn it into a plain top-level import:

```tsx
import { EngineeringShowcase } from './engineering-showcase';
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm -C web test src/routes/index.test.tsx src/components/home/engineering-showcase.test.tsx`
Expected: FAIL — `index.test.tsx` cannot find the "How can I help you?" heading (the section is not mounted yet); `engineering-showcase.test.tsx` may pass already, which is fine.

- [ ] **Step 3: Mount the section and split the breakout wrapper**

In `web/src/routes/index.tsx`, add the import:

```tsx
import { HowIHelp } from '@/components/home/help/how-i-help';
```

and replace the wrapper block at lines 39–42:

```tsx
      {/*
        Hero is designed full-bleed, but AppShell's <main> is
        `mx-auto max-w-7xl py-6` — without this breakout wrapper it'd sit
        capped at 1280px with a 24px band above, which reads as a visible
        frame around the "immersive" dark band (most obvious in light theme,
        where the gutter turns white). The `w-screen` (100vw) here can
        overflow past a classic (non-overlay) scrollbar's width; the
        `overflow-x: hidden` on `body` in styles.css clips that.
      */}
      <div className="-mt-6 ml-[calc(50%-50vw)] mr-[calc(50%-50vw)] w-screen">
        <Hero />
      </div>

      {/*
        The offer, in the slot "send a pulse" used to hold — first thing
        after the hero, before any engineering. An ordinary `max-w-5xl`
        section like the live-proof block below, not full-bleed: the
        immersive dark band is the hero's alone.
      */}
      <HowIHelp />

      {/* Same breakout as the hero, minus the `-mt-6` — that cancels
          <main>'s top padding and only the first block needs it. */}
      <div className="ml-[calc(50%-50vw)] mr-[calc(50%-50vw)] w-screen">
        <EngineeringShowcase />
      </div>
```

- [ ] **Step 4: Strip `SendPulse` from the showcase**

Replace `web/src/components/home/engineering-showcase.tsx` with:

```tsx
import { useTranslation } from 'react-i18next';
import { ArchitectureDiagram } from '@/components/home/architecture-diagram';
import { Pill } from '@/components/signal/pill';

/**
 * The engineering showcase band under the hero: the request/event pipeline
 * diagram — "how it works" — proving the "live distributed system" claim by
 * explaining the mechanism, not by re-showing numbers. The actual live
 * numbers and event stream live in exactly one place on the home page: the
 * "live proof" block further down (routes/index.tsx).
 *
 * This band used to host "send a pulse", whose click played one traversal
 * across these nodes and reported the measured round-trip. That button was
 * the best possible pitch for a hiring engineer and the wrong one for the
 * founder this site now sells to; it was replaced by the "How can I help
 * you?" section above. The diagram keeps its ambient animation —
 * `ArchitectureDiagram` treats `traversalKey` as optional and simply skips
 * the one-shot traversal when nothing passes it.
 */
export function EngineeringShowcase() {
  const { t } = useTranslation('home');

  return (
    <section className="bg-background px-6 py-14 text-foreground sm:px-10 md:py-20">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <Pill>{t('home:showcase.eyebrow')}</Pill>
        <ArchitectureDiagram />
      </div>
    </section>
  );
}
```

- [ ] **Step 5: Delete the component and its copy**

```bash
git rm web/src/components/home/send-pulse.tsx web/src/components/home/send-pulse.test.tsx
```

Then remove the entire `"sendPulse": { … }` block from both `web/src/i18n/locales/en/home.json` and `web/src/i18n/locales/pt-BR/home.json`. It is the last key in each file — take care to leave the preceding key without a trailing comma.

- [ ] **Step 6: Run the full suite**

Run: `pnpm -C web test`
Expected: PASS, with no reference to `send-pulse` remaining. If any other test fails on the missing button, it was asserting the old home page — update it the same way as Step 1.

- [ ] **Step 7: Verify nothing still points at the deleted module**

Run: `grep -rn "SendPulse\|PULSE_PAYLOAD\|send-pulse\|sendPulse" web/src`
Expected: no output.

- [ ] **Step 8: Lint and build**

Run: `pnpm -C web lint && pnpm -C web exec tsc --noEmit && pnpm -C web build`
Expected: both succeed. The build includes the SSR prerender pass, which is what proves `HelpDiagram`'s `IntersectionObserver` use is safely confined to `useEffect`.

- [ ] **Step 9: Commit**

```bash
git add -A web/src docs
git commit -m "feat(web): lead the home with the offer, not the pulse button

\"Send a pulse\" proved the pipeline was live — the right pitch for a hiring
engineer, the wrong one for the founder this site now sells to. The slot it
held now carries four problems a founder recognises from their own week."
```

---

### Task 6: See it in the browser

The section is visual, and no unit test can tell whether the 2x2 grid breathes, the diagrams read at their real size, or the disclosure feels worth opening.

**Files:** none — `.claude/launch.json` already defines the dev server as `pulse-web` (pnpm, port 5173). Do not create or edit it.

- [ ] **Step 1: Start the preview and look at the section**

Use `preview_start` with `{name: "pulse-web"}`, then `read_console_messages` for errors and a screenshot of the new section.

- [ ] **Step 2: Check the states that only exist in a browser**

- Desktop (1280x800): the 2x2 grid, cards of equal height, diagrams legible.
- Mobile (375x812): single column, diagrams not clipped.
- Both themes — the section uses `bg-background`/`text-foreground` and signal tokens, so light theme must not wash out the `text-muted-foreground/70` technical line.
- Open a disclosure: the chevron rotates, examples and technical line appear, layout does not jump.
- Click "Tell me your case": the Ask widget opens with an **empty** composer.

- [ ] **Step 3: Fix anything found, then re-verify and commit**

Only commit if Step 2 turned up changes.

---

## Self-Review

**Spec coverage:**

| Spec requirement | Task |
|---|---|
| Founder-facing surface, no jargon | Task 1 (copy + the jargon-guard test) |
| Collapsed layer: examples + one technical line | Tasks 1, 3 |
| Four cards: repetitive, spreadsheet, ai, idea | Tasks 1, 4 |
| Section eyebrow / heading / lede | Tasks 1, 4 |
| CTA pair → Ask widget + Calendly | Task 4 |
| Both locales, pt-BR authoritative | Task 1 (constraint restated globally) |
| Mini diagram per card, ArchitectureDiagram grammar | Task 2 |
| In-view traversal, `data-motion`, reduced motion | Task 2 |
| Native `<details>` for a11y / no-JS / crawlers | Task 3 |
| Mobile single column | Tasks 4, 6 |
| Page order Hero → HowIHelp → EngineeringShowcase | Task 5 |
| Delete send-pulse + `sendPulse.*`, keep `usePulseHub` | Task 5 |
| Update index.test.tsx, engineering-showcase.test.tsx | Task 5 |

**Type consistency:** `HelpCardKey` and `HELP_CARD_KEYS` are declared once, in `help-diagram.tsx` (Task 2), and imported by Tasks 3 and 4. The four card keys are identical across the locale files, the copy test, the icon map and the section. `HelpDiagram`, `HelpCard` and `HowIHelp` keep the same signatures wherever they appear.

## Out of scope

`AskChips` at the foot of the home page still asks three recruiter questions ("Does Felipe have Kubernetes experience?", "What's Felipe's strongest tech stack?", "Is Felipe open to remote roles?"), and the Ask widget's composer placeholder still reads "Ask about Felipe's experience…". Both are aimed at a hiring engineer rather than a founder, which leaves two AI entry points on one page saying different things. Realigning them is a separate change.
