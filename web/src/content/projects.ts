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
];
