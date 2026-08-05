export interface Profile {
  name: string;
  title: string;
  tagline: string;
  bio: string;
  social: { label: string; href: string }[];
  skills: { group: string; items: string[] }[];
  experience: { role: string; org: string; period: string; summary: string }[];
}

export const profile: Profile = {
  name: 'Felipe de Almeida',
  title: 'Senior Product Engineer & Software Architect',
  tagline: 'I build distributed systems, developer platforms, and cloud infrastructure.',
  bio: 'Software engineer and architect focused on distributed systems, event-driven design, and CI/CD. Currently Senior Product Engineer at Kota.io, building health-insurance infrastructure in Europe. Founder of Pampa Devs, a Brazilian developer community.',
  social: [
    { label: 'GitHub', href: 'https://github.com/felipe-allmeida' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/felipe-allmeida' },
  ],
  skills: [
    { group: 'Languages', items: ['C#', 'TypeScript', 'JavaScript', 'SQL'] },
    { group: 'Backend', items: ['.NET / ASP.NET Core', 'Node.js', 'SignalR', 'MassTransit', 'DDD', 'TDD'] },
    { group: 'Frontend', items: ['React', 'Vue', 'Next.js', 'Vite', 'Tailwind'] },
    { group: 'Infra', items: ['Docker', 'Kubernetes', 'Terraform', 'Azure', 'GitHub Actions', 'Caddy'] },
    { group: 'Data & messaging', items: ['PostgreSQL', 'SQL Server', 'Redis', 'RabbitMQ'] },
  ],
  experience: [
    { role: 'Senior Product Engineer', org: 'Kota.io', period: 'Current', summary: 'Health-insurance infrastructure for the European market.' },
    { role: 'Lead Software Engineer', org: 'ADP Brazil Labs', period: 'Past', summary: 'Led engineering on payroll/HR platform work.' },
    { role: 'Head of Technology', org: 'Dietbox', period: 'Past', summary: 'Owned technology and architecture.' },
    { role: 'Founder', org: 'Pampa Devs', period: 'Ongoing', summary: 'Open-source templates, tutorials, and tools for the developer community.' },
  ],
};
