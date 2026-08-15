import type { LocalizedString } from './types';

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
  /** A real script or config sample. */
  script?: CaseStudyScript;
  /** A before/after figure drawn to scale. */
  comparison?: CaseStudyComparison;
  /** An illustrative table of the system's output. */
  table?: CaseStudyTable;
  /** 3-5 engineering decisions with their rationale. */
  decisions?: CaseStudySection[];
}

export interface Project {
  slug: string;
  name: string;
  tagline: LocalizedString;
  description: LocalizedString;
  tech: string[];
  role: LocalizedString;
  period?: LocalizedString;
  links: { label: string; href: string }[];
  visibility: 'public' | 'private';
  screenshot?: string;
  /** Extra content for the dedicated `/projects/$slug` page. */
  detail?: ProjectDetailContent;
}

export const projects: Project[] = [
  {
    slug: 'pulse',
    name: 'Pulse',
    tagline: {
      en: 'A live, real-time system embedded in a portfolio.',
      'pt-BR': 'Um sistema ao vivo, em tempo real, embutido em um portfólio.',
    },
    description: {
      en: 'Visitors see who else is online, a live world map, and public metrics — a thin client over an event-driven .NET backend (SignalR presence, RabbitMQ outbox, Postgres, OpenTelemetry), an ops dashboard, and an AI assistant. Deployed with Docker/Caddy + IaC.',
      'pt-BR':
        'Os visitantes veem quem mais está online, um mapa-múndi ao vivo e métricas públicas — um client fino sobre um backend .NET orientado a eventos (presença via SignalR, outbox com RabbitMQ, Postgres, OpenTelemetry), um dashboard de operações e um assistente de IA. Deploy com Docker/Caddy + IaC.',
    },
    tech: ['.NET 10', 'SignalR', 'RabbitMQ', 'Redis', 'Postgres', 'React 19', 'Docker', 'Terraform'],
    role: { en: 'Design & implementation', 'pt-BR': 'Design & implementação' },
    visibility: 'public',
    links: [{ label: 'GitHub', href: 'https://github.com/felipe-allmeida/pulse' }],
    detail: {
      overview: {
        en: 'A self-hosted portfolio that doubles as a live systems demo: presence, visits, and metrics travel through a real event-driven backend in real time, not canned data.',
        'pt-BR':
          'Um portfólio auto-hospedado que também funciona como demo de sistemas ao vivo: presença, visitas e métricas passam por um backend real orientado a eventos em tempo real, não dados simulados.',
      },
      highlights: [
        {
          en: 'Live presence via SignalR — see who else is on the site right now, on a world map.',
          'pt-BR': 'Presença ao vivo via SignalR — veja quem mais está no site agora, num mapa-múndi.',
        },
        {
          en: 'Event-driven .NET backend with a RabbitMQ transactional outbox, Postgres, and OpenTelemetry tracing.',
          'pt-BR':
            'Backend .NET orientado a eventos com outbox transacional via RabbitMQ, Postgres e tracing com OpenTelemetry.',
        },
        {
          en: 'A public ops dashboard exposing real metrics — connections, event throughput, latency.',
          'pt-BR': 'Um dashboard de operações público expondo métricas reais — conexões, throughput de eventos, latência.',
        },
        {
          en: 'An AI assistant grounded in a maintained profile, streaming answers about the author.',
          'pt-BR': 'Um assistente de IA baseado em um perfil mantido, respondendo em streaming sobre o autor.',
        },
        {
          en: 'Deployed with Docker Compose + Caddy behind Terraform-managed infrastructure.',
          'pt-BR': 'Deploy com Docker Compose + Caddy sobre infraestrutura gerenciada com Terraform.',
        },
      ],
    },
  },
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
      en: 'Senior Product Engineer, platform team — the multi-tenant core, its intent workflows, the public API contract, and integration testing. Front end by others.',
      'pt-BR':
        'Senior Product Engineer, time de plataforma — o núcleo multi-tenant, seus fluxos de intent, o contrato da API pública e os testes de integração. Front-end por outros.',
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
          note: { en: 'enrollment, quote, amendment, renewal…', 'pt-BR': 'adesão, cotação, alteração, renovação…' },
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
          en: 'Group setup, enrollment, quoting, amendment, renewal, policy import, and dependant management, each as its own workflow.',
          'pt-BR':
            'Configuração de grupo, adesão, cotação, alteração, renovação, importação de apólice e gestão de dependentes, cada uma como seu próprio fluxo.',
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
            en: 'What a given case must collect depends on the insurer and the regulatory region at once. Rather than encoding nine forms, the platform asks a requirements service what this case needs and renders that. Adding an insurer stops being a front-end change. The lookup happens behind the same adapter boundary, so the core still never handles a provider identity itself.',
            'pt-BR':
              'O que um caso precisa coletar depende da seguradora e da região regulatória ao mesmo tempo. Em vez de codificar nove formulários, a plataforma pergunta a um serviço de requisitos o que aquele caso exige e renderiza isso. Adicionar uma seguradora deixa de ser mudança de front-end. A consulta acontece atrás da mesma fronteira de adapter, então o núcleo continua sem manipular a identidade de nenhum provedor.',
          },
        },
        {
          heading: {
            en: 'An adapter factory as the only door to a provider',
            'pt-BR': 'Uma adapter factory como única porta para o provedor',
          },
          body: {
            en: 'The platform core resolves an adapter and talks to that. It never learns which insurer it is serving, which is what keeps a tenth integration from touching enrollment logic — and what let provider contracts be introduced behind feature flags and migrated without stopping the product.',
            'pt-BR':
              'O núcleo da plataforma resolve um adapter e fala com ele. Nunca fica sabendo qual seguradora está atendendo, e é isso que impede uma décima integração de tocar na lógica de adesão — e o que permitiu introduzir contratos de provedor atrás de feature flags e migrar sem parar o produto.',
          },
        },
        {
          heading: {
            en: 'Idempotency and duplicate suppression as a requirement, not a repair',
            'pt-BR': 'Idempotência e supressão de duplicata como requisito, não conserto',
          },
          body: {
            en: 'Retries happen, webhooks arrive twice, and consumers run concurrently against the same rows. Intent creation takes an idempotency key, auto-enrollment suppresses the duplicate intent-and-webhook pair, and the eligibility-screening consumer handles serialization conflicts rather than assuming they cannot happen.',
            'pt-BR':
              'Retry acontece, webhook chega duas vezes e consumidores rodam concorrentes sobre as mesmas linhas. A criação de intent aceita chave de idempotência, a adesão automática suprime o par intent-e-webhook duplicado, e o consumer de triagem de elegibilidade trata conflito de serialização em vez de assumir que ele não ocorre.',
          },
        },
      ],
    },
  },
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
    screenshot: '/screenshots/ulbra-atende.png',
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
            en: 'Every entity has its own ID struct, rendered as ti_…, tm_…, us_…. Passing a team ID where a ticket ID belongs stops compiling. A whole class of bug moves from runtime to build time, and IDs say what they are in logs and URLs.',
            'pt-BR':
              'Cada entidade tem seu próprio struct de ID, escrito como ti_…, tm_…, us_…. Passar um ID de time onde se espera um de chamado para de compilar. Uma classe inteira de bug sai do runtime e vai para o build, e o ID diz o que é em log e em URL.',
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
  {
    slug: 'ulbra-one',
    name: 'Ulbra One',
    tagline: {
      en: 'Internal ERP replacing legacy systems.',
      'pt-BR': 'ERP interno substituindo sistemas legados.',
    },
    description: {
      en: 'An internal ERP built to replace legacy systems — a modular .NET platform on PostgreSQL with a React front end, covering core internal business operations.',
      'pt-BR':
        'Um ERP interno construído para substituir sistemas legados — uma plataforma .NET modular sobre PostgreSQL com front-end em React, cobrindo as operações internas centrais do negócio.',
    },
    tech: ['.NET 10', 'PostgreSQL', 'EF Core', 'React', 'Tailwind'],
    role: { en: 'Software engineer', 'pt-BR': 'Engenheiro de software' },
    period: { en: 'Professional work', 'pt-BR': 'Trabalho profissional' },
    visibility: 'private',
    links: [],
    detail: {
      overview: {
        en: 'An internal ERP replacing legacy systems — a modular .NET platform on PostgreSQL with a React front end, covering core internal business operations.',
        'pt-BR':
          'Um ERP interno substituindo sistemas legados — uma plataforma .NET modular sobre PostgreSQL com front-end em React, cobrindo as operações internas centrais do negócio.',
      },
      highlights: [
        {
          en: 'A modular architecture organized by business domain.',
          'pt-BR': 'Arquitetura modular organizada por domínio de negócio.',
        },
        {
          en: 'Migrates core operations off legacy systems onto a unified platform.',
          'pt-BR': 'Migra operações centrais de sistemas legados para uma plataforma unificada.',
        },
        {
          en: 'PostgreSQL persistence via EF Core.',
          'pt-BR': 'Persistência em PostgreSQL via EF Core.',
        },
        {
          en: 'A modern React + Tailwind front end replacing older internal tools.',
          'pt-BR': 'Front-end moderno em React + Tailwind substituindo ferramentas internas antigas.',
        },
      ],
    },
  },
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
        en: 'Testing a phone menu meant someone dialling it, pressing the keys, listening to what the system said, and writing down whether it was right — once per scenario, per language, per route. A full cycle was over twenty thousand calls placed by hand across the team, which in practice meant the full cycle almost never ran. Automating it brought the cycle down to about three hours.',
        'pt-BR':
          'Testar um menu telefônico significava alguém discar, apertar as teclas, ouvir o que o sistema dizia e anotar se estava certo — uma vez por cenário, por idioma, por rota. Um ciclo completo eram mais de vinte mil ligações feitas à mão pelo time, o que na prática significava que o ciclo completo quase nunca rodava. Automatizar reduziu o ciclo para cerca de três horas.',
      },
      metricsNote: {
        en: 'Call volume and cycle time as recalled from the project; the command count is verifiable in source.',
        'pt-BR':
          'Volume de ligações e tempo de ciclo conforme lembrados do projeto; a contagem de comandos é verificável no código.',
      },
      metrics: [
        {
          value: { en: '20k+', 'pt-BR': '20 mil+' },
          label: { en: 'calls per test cycle', 'pt-BR': 'ligações por ciclo de teste' },
          note: {
            en: 'previously placed one at a time, by hand across the team',
            'pt-BR': 'antes, uma a uma, à mão, pelo time',
          },
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
          'Setup Language="en-US"',
          'Dial +1 (000) 000 0000',
          'Wait 3',
          'Hear [Confidence=85%] thank you for calling, please say or enter your service tag',
          'Enter (serialnumber) 1234567#',
          'Hear [WaitBefore=2] one moment while I look that up',
          'Hang',
        ],
        note: {
          en: 'The grammar is checked before the call: a missing Dial or Hang, a repeated step where only one is allowed, or a step out of order fails the script rather than the phone bill. Validation steps run after the call ends. The number above is a documentation placeholder.',
          'pt-BR':
            'A gramática é conferida antes da ligação: um Dial ou Hang ausente, um passo repetido onde só cabe um, ou um passo fora de ordem reprovam o roteiro em vez da conta de telefone. Os passos de validação rodam depois que a chamada termina. O número acima é um placeholder de documentação.',
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
          en: 'Durations as recalled from the project; the repository does not record them.',
          'pt-BR': 'Durações conforme lembradas do projeto; o repositório não as registra.',
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
          ['transferring you to support', 'transferring you to sales', '78%'],
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
              'Transcrição de fala nunca é exata caractere a caractere, então comparar por igualdade reprova bons testes. Cada asserção carrega sua própria tolerância no roteiro, porque o quão perto a transcrição chega depende do que foi dito — um prompt padrão transcreve de forma confiável, um nome de produto não.',
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
];
