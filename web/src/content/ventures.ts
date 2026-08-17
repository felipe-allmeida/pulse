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
      en: "The university's internal technology platform, built from scratch by a small team: an IT service desk in production, an ERP replacing the legacy systems, a CRM taken over and rebuilt, administrative dashboards, a student dashboard, and the datacenter automation all of it deploys onto.",
      'pt-BR':
        'A plataforma de tecnologia interna da universidade, construída do zero por um time pequeno: um service desk de TI em produção, um ERP substituindo os sistemas legados, um CRM assumido e reconstruído, dashboards administrativos, um painel para os alunos e a automação de datacenter em que tudo isso é publicado.',
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
