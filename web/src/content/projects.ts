import type { LocalizedString } from './types';

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
  },
];
