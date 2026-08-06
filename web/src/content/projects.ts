import type { LocalizedString } from './types';

export interface ProjectDetailContent {
  /** A longer, dedicated-page overview — 1-3 sentences. */
  overview?: LocalizedString;
  /** 2-5 bullet points for the dedicated page. */
  highlights?: LocalizedString[];
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
      en: 'Support & ticketing platform.',
      'pt-BR': 'Plataforma de suporte e chamados.',
    },
    description: {
      en: 'An internal support and ticketing platform built with .NET and React — role-based access and configurable ticket workflows for internal teams.',
      'pt-BR':
        'Uma plataforma interna de suporte e chamados construída com .NET e React — acesso baseado em papéis e fluxos de chamados configuráveis para times internos.',
    },
    tech: ['.NET 10', 'PostgreSQL', 'RabbitMQ', 'React', 'SignalR'],
    role: { en: 'Software engineer', 'pt-BR': 'Engenheiro de software' },
    period: { en: 'Professional work', 'pt-BR': 'Trabalho profissional' },
    visibility: 'private',
    links: [],
    detail: {
      overview: {
        en: 'An internal support and ticketing platform — a .NET modular monolith with role-based access and configurable ticket workflows for internal support staff.',
        'pt-BR':
          'Uma plataforma interna de suporte e chamados — um monólito modular em .NET com acesso baseado em papéis e fluxos de chamados configuráveis para as equipes de suporte.',
      },
      highlights: [
        {
          en: 'Role-based access for internal teams.',
          'pt-BR': 'Acesso baseado em papéis para times internos.',
        },
        {
          en: 'Configurable ticket workflows and role-based routing across support teams.',
          'pt-BR': 'Fluxos de chamados configuráveis e roteamento baseado em papéis entre times de suporte.',
        },
        {
          en: 'Real-time ticket notifications over SignalR.',
          'pt-BR': 'Notificações de chamados em tempo real via SignalR.',
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
