import type { LocalizedString } from './types';

export interface ContactConfig {
  /** Booking link. An empty string hides the "Book a call" CTA entirely. */
  calendly: string;
  email: string;
  linkedin: string;
  whatsapp: string;
}

export interface PhotoConfig {
  /**
   * The author photo in the About hero, displayed at 80px. Deliberately small:
   * it sits above the fold, and the `full` variant below would be roughly four
   * times the weight for pixels nobody sees at that size.
   */
  avatar: string;
  /**
   * The same photo at a size worth citing. Referenced only from the Schema.org
   * `Person.image`, never fetched by a browser rendering the page, so its
   * weight costs a visitor nothing and buys a usable image in a search or
   * answer engine's entity card.
   */
  full: string;
}

export interface Profile {
  name: string;
  title: LocalizedString;
  /** Author photo, as root-relative paths under `public/`. */
  photo: PhotoConfig;
  tagline: LocalizedString;
  bio: LocalizedString;
  skills: { group: LocalizedString; items: string[] }[];
  experience: {
    role: LocalizedString;
    org: string;
    /**
     * The employer's own site, when there is a public one to point at. Optional
     * on purpose: an entry with no verified URL renders as plain text rather
     * than as a guessed link that 404s or lands on someone else's domain.
     */
    url?: string;
    period: LocalizedString;
    summary: LocalizedString;
  }[];
  education: { credential: LocalizedString; org: string; period: LocalizedString }[];
  /** Spoken languages, as one line — `Portuguese (native) · English (advanced)`. */
  languages: LocalizedString;
  contact: ContactConfig;
}

export const profile: Profile = {
  name: 'Felipe de Almeida',
  photo: {
    avatar: '/felipe.webp',
    full: '/felipe-1200.webp',
  },
  title: {
    en: 'Software Engineer & Architect · Engineering Leader',
    'pt-BR': 'Engenheiro & Arquiteto de Software · Líder de Engenharia',
  },
  tagline: {
    en: 'I build distributed systems, developer platforms, and cloud infrastructure.',
    'pt-BR': 'Construo sistemas distribuídos, plataformas para desenvolvedores e infraestrutura em cloud.',
  },
  bio: {
    en: 'Software engineer and architect with 12+ years building and running .NET platforms — distributed systems, event-driven design, and CI/CD. As Head of Technology at Dietbox he led a 13-person engineering, QA, UX and support organization while staying hands-on in architecture and delivery. Most recently Senior Product Engineer at Kota.io, building health-insurance infrastructure for the European market. Currently freelancing through Pampa Devs — his software studio — where he is Head of Technology for ULBRA, leading three engineers across the university\'s internal platform, and open to new roles.',
    'pt-BR':
      'Engenheiro e arquiteto de software com mais de 12 anos construindo e operando plataformas .NET — sistemas distribuídos, arquitetura orientada a eventos e CI/CD. Como Head of Technology na Dietbox, liderou uma organização de 13 pessoas entre engenharia, QA, UX e suporte sem sair da arquitetura e da entrega. Mais recentemente, Senior Product Engineer na Kota.io, construindo infraestrutura de seguro-saúde para o mercado europeu. Atualmente atuando como freelancer pela Pampa Devs — seu estúdio de software —, onde é Head de Tecnologia da ULBRA, liderando três engenheiros na plataforma interna da universidade, e aberto a novas oportunidades.',
  },
  contact: {
    calendly: 'https://calendly.com/pampa-devs/bate-papo-sobre-seu-projeto',
    email: 'contato@pampadevs.com',
    linkedin: 'https://www.linkedin.com/in/felipe-allmeida',
    whatsapp: 'https://wa.me/5551983468863',
  },
  skills: [
    { group: { en: 'Languages', 'pt-BR': 'Linguagens' }, items: ['C#', 'TypeScript', 'JavaScript', 'SQL', 'Python'] },
    {
      group: { en: 'Backend', 'pt-BR': 'Backend' },
      items: ['.NET / ASP.NET Core', 'Node.js', 'EF Core', 'SignalR', 'MassTransit', 'gRPC', 'DDD', 'TDD'],
    },
    { group: { en: 'Frontend', 'pt-BR': 'Frontend' }, items: ['React', 'Vue', 'Next.js', 'Vite', 'Tailwind'] },
    {
      group: { en: 'Architecture', 'pt-BR': 'Arquitetura' },
      items: ['Event-driven', 'CQRS', 'Modular monoliths', 'REST / HATEOAS', 'Transactional outbox'],
    },
    {
      group: { en: 'Infra', 'pt-BR': 'Infra' },
      items: [
        'Docker',
        'Kubernetes',
        'Terraform',
        'Azure',
        'AWS',
        'GitHub Actions',
        'Azure DevOps',
        'GitLab CI',
        'Caddy',
      ],
    },
    {
      group: { en: 'Data & messaging', 'pt-BR': 'Dados & mensageria' },
      items: ['PostgreSQL', 'SQL Server', 'Cosmos DB', 'Redis', 'RabbitMQ / AMQP'],
    },
    /*
      Item labels stay in English in both locales, like the role titles below:
      these are the terms Brazilian engineering organisations actually use, and
      a half-translated chip row reads worse than a consistently English one.
    */
    {
      group: { en: 'Leadership', 'pt-BR': 'Liderança' },
      items: [
        'Team building',
        'Mentoring',
        'Scrum / Kanban',
        'Trunk-Based Development',
        'DORA metrics',
        'AI-assisted delivery',
        'Roadmap & budget',
      ],
    },
  ],
  experience: [
    /*
      ULBRA is a client of Pampa Devs, not a ninth employer — the role says so,
      the same way the ROLÊ row says "side venture". Both rows are open-ended
      because both are true at once: the studio holds the contract and this is
      the mandate inside it.

      The period starts in April rather than at the May contract date because
      the first commits — `infra` on 9 Apr, the service desk on 18 Apr — are
      the author's own, and a timeline that postdates its own evidence is the
      one thing a checkable page must not do.
    */
    {
      role: {
        en: 'Head of Technology (engagement via Pampa Devs)',
        'pt-BR': 'Head de Tecnologia (contrato via Pampa Devs)',
      },
      org: 'ULBRA',
      url: 'https://www.ulbra.br',
      period: { en: 'Apr 2026 – Current', 'pt-BR': 'Abr 2026 – Atual' },
      summary: {
        en: "Leads a three-engineer team building the university's internal platform from scratch — an IT service desk in production, an ERP replacing the legacy systems, a CRM taken over and rebuilt to full test coverage, administrative dashboards for the board, a student dashboard, and the datacenter automation all of it deploys onto. Introduced a spec-first, AI-assisted delivery model in which the team's time goes to specification and code review.",
        'pt-BR':
          'Lidera um time de três engenheiros construindo do zero a plataforma interna da universidade — um service desk de TI em produção, um ERP substituindo os sistemas legados, um CRM assumido e reconstruído até cobertura total de testes, dashboards administrativos para a diretoria, um painel para os alunos e a automação de datacenter em que tudo isso é publicado. Introduziu um modelo de entrega assistido por IA e guiado por especificação, em que o tempo do time vai para especificar e revisar código.',
      },
    },
    {
      role: { en: 'Founder & Software Engineer/Architect', 'pt-BR': 'Fundador & Engenheiro/Arquiteto de Software' },
      org: 'Pampa Devs',
      url: 'https://pampadevs.com',
      period: { en: 'Mar 2026 – Current', 'pt-BR': 'Mar 2026 – Atual' },
      summary: {
        en: 'His software studio — internal enterprise platforms (support/ticketing + ERP) in .NET & React, and web and e-commerce delivery for small and mid-sized businesses on Azure.',
        'pt-BR':
          'Seu estúdio de software — plataformas internas corporativas (suporte/chamados + ERP) em .NET & React, e entrega de web e e-commerce para pequenas e médias empresas na Azure.',
      },
    },
    {
      role: { en: 'Senior Product Engineer', 'pt-BR': 'Senior Product Engineer' },
      org: 'Kota.io',
      url: 'https://kota.io',
      period: { en: 'Oct 2025 – Jul 2026', 'pt-BR': 'Out 2025 – Jul 2026' },
      summary: {
        en: 'Health-insurance infrastructure for the European market: shipped the platform’s intent layer (enrollment, policy amendment, dependents, renewal), delivered integrations across nine insurers, moved its webhooks to an event-driven V2, and led the company-wide .NET 10 upgrade.',
        'pt-BR':
          'Infraestrutura de seguro-saúde para o mercado europeu: entregou a camada de intents da plataforma (adesão, alteração de apólice, dependentes, renovação), entregou integrações com nove seguradoras, migrou os webhooks para uma V2 orientada a eventos e liderou a atualização para .NET 10 em toda a empresa.',
      },
    },
    {
      role: { en: 'R&D Engineer (contract)', 'pt-BR': 'Engenheiro de P&D (contrato)' },
      org: 'Airia',
      url: 'https://airia.com',
      period: { en: 'Jun 2025 – Oct 2025', 'pt-BR': 'Jun 2025 – Out 2025' },
      summary: {
        en: 'Built web, console and on-premise applications in .NET 9, integrated multiple AI providers into production workflows, and owned the architecture and CI/CD design for new projects.',
        'pt-BR':
          'Construiu aplicações web, console e on-premise em .NET 9, integrou múltiplos provedores de IA a fluxos em produção e foi responsável pela arquitetura e pelo desenho de CI/CD dos novos projetos.',
      },
    },
    {
      role: { en: 'Lead Software Engineer', 'pt-BR': 'Lead Software Engineer' },
      org: 'ADP Brazil Labs',
      url: 'https://www.adp.com',
      period: { en: 'Aug 2024 – Jun 2025', 'pt-BR': 'Ago 2024 – Jun 2025' },
      summary: {
        en: 'Led architecture and planning for legacy modernization across .NET Framework and .NET Core, taking automated test coverage on legacy projects from 0% to 80%.',
        'pt-BR':
          'Liderou a arquitetura e o planejamento da modernização de sistemas legados em .NET Framework e .NET Core, levando a cobertura de testes automatizados dos projetos legados de 0% a 80%.',
      },
    },
    /*
      A side venture, run alongside the day job — so it is labelled as one
      rather than passed off as a ninth employer, and it sits by start date
      like every other row.
    */
    {
      role: { en: 'Partner (side venture)', 'pt-BR': 'Sócio (projeto paralelo)' },
      org: 'ROLÊ Entretenimento',
      url: 'https://roleentretenimento.com',
      period: { en: 'Oct 2023 – May 2025', 'pt-BR': 'Out 2023 – Mai 2025' },
      summary: {
        en: 'Events and nightlife promotion platform — owned the web and mobile architecture and delivery.',
        'pt-BR':
          'Plataforma de divulgação de eventos e vida noturna — responsável pela arquitetura e pela entrega de web e mobile.',
      },
    },
    {
      role: { en: 'Head of Technology', 'pt-BR': 'Head of Technology' },
      org: 'Dietbox',
      url: 'https://dietbox.me',
      period: { en: 'Aug 2022 – Aug 2024', 'pt-BR': 'Ago 2022 – Ago 2024' },
      summary: {
        en: 'Led a 13-person technology and UX organization — engineering, QA, UX and support. Introduced Scrum and trunk-based development, cutting lead time from a month to a week and a half, and cut monthly cloud spend by 21%.',
        'pt-BR':
          'Liderou uma organização de tecnologia e UX de 13 pessoas — engenharia, QA, UX e suporte. Introduziu Scrum e trunk-based development, reduzindo o lead time de um mês para uma semana e meia, e cortou 21% do gasto mensal em cloud.',
      },
    },
    {
      role: { en: 'Senior Software Engineer', 'pt-BR': 'Senior Software Engineer' },
      org: 'Dietbox',
      url: 'https://dietbox.me',
      period: { en: 'Sep 2020 – Aug 2022', 'pt-BR': 'Set 2020 – Ago 2022' },
      summary: {
        en: 'Migrated the legacy platform from .NET Framework 4.7 on Windows App Service to .NET 6 on Linux, and established CI/CD pipelines in Azure DevOps.',
        'pt-BR':
          'Migrou a plataforma legada de .NET Framework 4.7 no App Service Windows para .NET 6 no Linux e estabeleceu os pipelines de CI/CD no Azure DevOps.',
      },
    },
    {
      role: { en: 'Senior Software Engineer & Consultant', 'pt-BR': 'Senior Software Engineer & Consultor' },
      org: 'Poatek',
      url: 'https://poatek.com',
      period: { en: 'Jun 2020 – Sep 2020', 'pt-BR': 'Jun 2020 – Set 2020' },
      summary: {
        en: 'Backend and DevOps work for multiple clients using Azure, AKS, Terraform, Vault, .NET Core and React.',
        'pt-BR':
          'Trabalho de backend e DevOps para múltiplos clientes usando Azure, AKS, Terraform, Vault, .NET Core e React.',
      },
    },
    {
      role: { en: 'Software Engineer', 'pt-BR': 'Software Engineer' },
      org: 'Dell',
      url: 'https://www.dell.com',
      period: { en: 'Nov 2018 – Jun 2020', 'pt-BR': 'Nov 2018 – Jun 2020' },
      summary: {
        en: 'Built an automated regression-testing application for Dell’s interactive voice response system, replacing a month of manual testing, and a sales-rep tool that automated customer eligibility checks.',
        'pt-BR':
          'Construiu uma aplicação de testes de regressão automatizados para o sistema de resposta de voz interativa da Dell, substituindo um mês de testes manuais, e uma ferramenta para o time de vendas que automatizou a checagem de elegibilidade de clientes.',
      },
    },
    {
      role: { en: 'Development Lead', 'pt-BR': 'Development Lead' },
      org: 'Vox Game Studio',
      period: { en: 'Dec 2015 – Nov 2018', 'pt-BR': 'Dez 2015 – Nov 2018' },
      summary: {
        en: 'Promoted from intern to development lead; ran development, code review, testing and releases for a financial-education platform, and designed its core architecture in Unity3D / .NET.',
        'pt-BR':
          'Promovido de estagiário a development lead; conduziu desenvolvimento, code review, testes e releases de uma plataforma de educação financeira e desenhou sua arquitetura central em Unity3D / .NET.',
      },
    },
  ],
  education: [
    {
      credential: { en: 'MBA, Business Management', 'pt-BR': 'MBA, Gestão Empresarial' },
      org: 'Fundação Getúlio Vargas',
      period: { en: 'Aug 2023 – Oct 2026 · in progress', 'pt-BR': 'Ago 2023 – Out 2026 · em andamento' },
    },
    {
      credential: {
        en: 'Postgraduate Program, Software Engineering',
        'pt-BR': 'Pós-graduação, Engenharia de Software',
      },
      org: 'Universidade do Vale do Rio dos Sinos',
      period: { en: 'Feb 2021 – Oct 2022', 'pt-BR': 'Fev 2021 – Out 2022' },
    },
    {
      credential: { en: 'B.S., Digital Games', 'pt-BR': 'Bacharelado, Jogos Digitais' },
      org: 'Universidade do Vale do Rio dos Sinos',
      period: { en: 'Mar 2013 – Jan 2018', 'pt-BR': 'Mar 2013 – Jan 2018' },
    },
  ],
  languages: {
    en: 'Portuguese (native) · English (advanced)',
    'pt-BR': 'Português (nativo) · Inglês (avançado)',
  },
};
