import type { LocalizedString } from './types';

export interface Profile {
  name: string;
  title: LocalizedString;
  tagline: LocalizedString;
  bio: LocalizedString;
  social: { label: string; href: string }[];
  skills: { group: LocalizedString; items: string[] }[];
  experience: { role: LocalizedString; org: string; period: LocalizedString; summary: LocalizedString }[];
}

export const profile: Profile = {
  name: 'Felipe de Almeida',
  title: {
    en: 'Senior Product Engineer & Software Architect',
    'pt-BR': 'Senior Product Engineer & Arquiteto de Software',
  },
  tagline: {
    en: 'I build distributed systems, developer platforms, and cloud infrastructure.',
    'pt-BR': 'Construo sistemas distribuídos, plataformas para desenvolvedores e infraestrutura em cloud.',
  },
  bio: {
    en: 'Software engineer and architect focused on distributed systems, event-driven design, and CI/CD. Currently Senior Product Engineer at Kota.io, building health-insurance infrastructure in Europe. Founder of Pampa Devs, a Brazilian developer community.',
    'pt-BR':
      'Engenheiro e arquiteto de software focado em sistemas distribuídos, arquitetura orientada a eventos e CI/CD. Atualmente Senior Product Engineer na Kota.io, construindo infraestrutura de seguro-saúde na Europa. Fundador da Pampa Devs, uma comunidade brasileira de desenvolvedores.',
  },
  social: [
    { label: 'GitHub', href: 'https://github.com/felipe-allmeida' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/felipe-allmeida' },
  ],
  skills: [
    { group: { en: 'Languages', 'pt-BR': 'Linguagens' }, items: ['C#', 'TypeScript', 'JavaScript', 'SQL'] },
    {
      group: { en: 'Backend', 'pt-BR': 'Backend' },
      items: ['.NET / ASP.NET Core', 'Node.js', 'SignalR', 'MassTransit', 'DDD', 'TDD'],
    },
    { group: { en: 'Frontend', 'pt-BR': 'Frontend' }, items: ['React', 'Vue', 'Next.js', 'Vite', 'Tailwind'] },
    {
      group: { en: 'Infra', 'pt-BR': 'Infra' },
      items: ['Docker', 'Kubernetes', 'Terraform', 'Azure', 'GitHub Actions', 'Caddy'],
    },
    {
      group: { en: 'Data & messaging', 'pt-BR': 'Dados & mensageria' },
      items: ['PostgreSQL', 'SQL Server', 'Redis', 'RabbitMQ'],
    },
  ],
  experience: [
    {
      role: { en: 'Senior Product Engineer', 'pt-BR': 'Senior Product Engineer' },
      org: 'Kota.io',
      period: { en: 'Current', 'pt-BR': 'Atual' },
      summary: {
        en: 'Health-insurance infrastructure for the European market.',
        'pt-BR': 'Infraestrutura de seguro-saúde para o mercado europeu.',
      },
    },
    {
      role: { en: 'Lead Software Engineer', 'pt-BR': 'Lead Software Engineer' },
      org: 'ADP Brazil Labs',
      period: { en: 'Past', 'pt-BR': 'Anterior' },
      summary: {
        en: 'Led engineering on payroll/HR platform work.',
        'pt-BR': 'Liderou a engenharia de uma plataforma de folha de pagamento/RH.',
      },
    },
    {
      role: { en: 'Head of Technology', 'pt-BR': 'Head of Technology' },
      org: 'Dietbox',
      period: { en: 'Past', 'pt-BR': 'Anterior' },
      summary: {
        en: 'Owned technology and architecture.',
        'pt-BR': 'Responsável por tecnologia e arquitetura.',
      },
    },
    {
      role: { en: 'Founder', 'pt-BR': 'Fundador' },
      org: 'Pampa Devs',
      period: { en: 'Ongoing', 'pt-BR': 'Em andamento' },
      summary: {
        en: 'Open-source templates, tutorials, and tools for the developer community.',
        'pt-BR': 'Templates open-source, tutoriais e ferramentas para a comunidade de desenvolvedores.',
      },
    },
  ],
};
