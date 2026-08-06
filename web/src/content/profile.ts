import type { LocalizedString } from './types';

export interface ContactConfig {
  /** Empty string until Felipe fills in a real Calendly link before merge. */
  calendly: string;
  email: string;
  linkedin: string;
  whatsapp: string;
}

export interface Profile {
  name: string;
  title: LocalizedString;
  tagline: LocalizedString;
  bio: LocalizedString;
  skills: { group: LocalizedString; items: string[] }[];
  experience: { role: LocalizedString; org: string; period: LocalizedString; summary: LocalizedString }[];
  contact: ContactConfig;
}

export const profile: Profile = {
  name: 'Felipe de Almeida',
  title: {
    en: 'Software Engineer & Architect · Engineering Leader',
    'pt-BR': 'Engenheiro & Arquiteto de Software · Líder de Engenharia',
  },
  tagline: {
    en: 'I build distributed systems, developer platforms, and cloud infrastructure.',
    'pt-BR': 'Construo sistemas distribuídos, plataformas para desenvolvedores e infraestrutura em cloud.',
  },
  bio: {
    en: 'Software engineer and architect focused on distributed systems, event-driven design, and CI/CD. Currently freelancing through Pampa Devs — his software studio — and open to new roles. Previously Senior Product Engineer at Kota.io, building health-insurance infrastructure in Europe.',
    'pt-BR':
      'Engenheiro e arquiteto de software focado em sistemas distribuídos, arquitetura orientada a eventos e CI/CD. Atualmente atuando como freelancer pela Pampa Devs — seu estúdio de software — e aberto a novas oportunidades. Antes, Senior Product Engineer na Kota.io, construindo infraestrutura de seguro-saúde na Europa.',
  },
  contact: {
    // Placeholder — Felipe fills in the real Calendly link before merge.
    calendly: '',
    email: 'contato@felipealmeida.tech',
    linkedin: 'https://www.linkedin.com/in/felipe-allmeida',
    whatsapp: 'https://wa.me/5551983468863',
  },
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
      role: { en: 'Founder & Software Engineer/Architect', 'pt-BR': 'Fundador & Engenheiro/Arquiteto de Software' },
      org: 'Pampa Devs',
      period: { en: 'Current', 'pt-BR': 'Atual' },
      summary: {
        en: 'His software studio — internal enterprise platforms (support/ticketing + ERP) in .NET & React.',
        'pt-BR': 'Seu estúdio de software — plataformas internas corporativas (suporte/chamados + ERP) em .NET & React.',
      },
    },
    {
      role: { en: 'Senior Product Engineer', 'pt-BR': 'Senior Product Engineer' },
      org: 'Kota.io',
      period: { en: 'Recent', 'pt-BR': 'Recente' },
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
  ],
};
