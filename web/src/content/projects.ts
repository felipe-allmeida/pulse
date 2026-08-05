export interface Project {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  tech: string[];
  role: string;
  period?: string;
  links: { label: string; href: string }[];
  visibility: 'public' | 'private';
  screenshot?: string;
}

export const projects: Project[] = [
  {
    slug: 'pulse',
    name: 'Pulse',
    tagline: 'A live, real-time system embedded in a portfolio.',
    description:
      'Visitors see who else is online, a live world map, and public metrics — a thin client over an event-driven .NET backend (SignalR presence, RabbitMQ outbox, Postgres, OpenTelemetry), an ops dashboard, and an AI assistant. Deployed with Docker/Caddy + IaC.',
    tech: ['.NET 10', 'SignalR', 'RabbitMQ', 'Redis', 'Postgres', 'React 19', 'Docker', 'Terraform'],
    role: 'Design & implementation',
    visibility: 'public',
    links: [{ label: 'GitHub', href: 'https://github.com/felipe-allmeida/pulse' }],
  },
  {
    slug: 'ulbra-atende',
    name: 'Ulbra Atende',
    tagline: 'Support & ticketing platform.',
    description:
      'An internal support and ticketing platform built with .NET and React — role-based access and configurable ticket workflows for internal teams.',
    tech: ['.NET 10', 'PostgreSQL', 'RabbitMQ', 'React', 'SignalR'],
    role: 'Software engineer',
    period: 'Professional work',
    visibility: 'private',
    links: [],
  },
  {
    slug: 'ulbra-one',
    name: 'Ulbra One',
    tagline: 'Internal ERP replacing legacy systems.',
    description:
      'An internal ERP built to replace legacy systems — a modular .NET platform on PostgreSQL with a React front end, covering core internal business operations.',
    tech: ['.NET 10', 'PostgreSQL', 'EF Core', 'React', 'Tailwind'],
    role: 'Software engineer',
    period: 'Professional work',
    visibility: 'private',
    links: [],
  },
];
