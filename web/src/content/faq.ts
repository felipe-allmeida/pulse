import type { LocalizedString } from './types';

/**
 * The questions people actually arrive with — recruiters skimming, and the
 * answer engines they increasingly ask first.
 *
 * Answer-shaped content is what an LLM can lift verbatim into a reply, which
 * is why this exists as a visible section on /about *and* as `FAQPage` JSON-LD
 * on the same page. The two must stay in step: structured data describing
 * answers a visitor cannot see on the page is the one form of markup search
 * engines actively penalise.
 *
 * Scope rule: every answer here is already established elsewhere in this repo
 * — `src/content/profile.ts`, the site copy, or the assistant's curated
 * `src/Pulse.Api/Assistant/profile.md`. Nothing here is inferred: if a fact is
 * not established in one of those places, it does not get an answer — a
 * plausible-sounding guess about work authorization or notice period is worse
 * than no answer at all, because this is the text an answer engine quotes
 * verbatim to a recruiter.
 */
export interface FaqEntry {
  /** Stable anchor id — also the deep-link target for the question. */
  id: string;
  question: LocalizedString;
  answer: LocalizedString;
}

export const faq: FaqEntry[] = [
  {
    id: 'open-to-work',
    question: {
      en: 'Are you open to new opportunities?',
      'pt-BR': 'Você está aberto a novas oportunidades?',
    },
    answer: {
      en: 'Yes. I am available now and actively looking for Staff or Principal Engineer roles, and for Head of Engineering / CTO positions. I work remotely and am open to roles in both European and US time zones. The fastest way to reach me is email (contato@pampadevs.com) or LinkedIn.',
      'pt-BR':
        'Sim. Estou disponível agora e procurando ativamente posições de Staff ou Principal Engineer, e também de Head of Engineering / CTO. Trabalho remotamente e estou aberto a vagas tanto em fusos europeus quanto americanos. O caminho mais rápido é e-mail (contato@pampadevs.com) ou LinkedIn.',
    },
  },
  {
    id: 'current-work',
    question: {
      en: 'What are you working on right now?',
      'pt-BR': 'No que você está trabalhando agora?',
    },
    answer: {
      en: 'I am Head of Technology for ULBRA, a Brazilian university, on an engagement through my own software studio Pampa Devs. I lead three engineers building the university’s internal platform in .NET and React — an IT service desk in production, an ERP replacing the legacy systems, a CRM rebuilt to full test coverage, administrative dashboards, a student dashboard, and the datacenter automation all of it deploys onto. I remain open to full-time roles.',
      'pt-BR':
        'Sou Head de Tecnologia da ULBRA, uma universidade brasileira, em um contrato através do meu próprio estúdio de software, a Pampa Devs. Lidero três engenheiros construindo a plataforma interna da universidade em .NET e React — um service desk de TI em produção, um ERP substituindo os sistemas legados, um CRM reconstruído até cobertura total de testes, dashboards administrativos, um painel para os alunos e a automação de datacenter em que tudo isso é publicado. Sigo aberto a posições full-time.',
    },
  },
  {
    id: 'what-he-is-looking-for',
    question: {
      en: 'What kind of company and work are you looking for?',
      'pt-BR': 'Que tipo de empresa e de trabalho você procura?',
    },
    answer: {
      en: 'Early-stage startups and scale-ups. I want to build products and take an active part in building the business, not only the code, and I am drawn to services at scale — where the work reaches a lot of people. The reach of the problem matters more to me than the industry it sits in.',
      'pt-BR':
        'Startups early-stage e scale-ups. Quero construir produtos e participar ativamente da construção do negócio, não só do código, e me sinto atraído por serviços de escala — onde o trabalho chega a muita gente. O alcance do problema pesa mais para mim do que o setor em que ele está.',
    },
  },
  {
    id: 'work-authorization',
    question: {
      en: 'Can you work in Europe or the US? Do you need visa sponsorship?',
      'pt-BR': 'Você pode trabalhar na Europa ou nos EUA? Precisa de sponsorship?',
    },
    answer: {
      en: 'Remotely, yes — that is how I already work with companies abroad, contracting from Brazil, most recently for Kota.io in the European market. I am Brazilian and based in Brazil, and do not hold an EU or US work permit, so an on-site role in either would require visa sponsorship. I would consider relocating for the right opportunity, but remote is what I am looking for.',
      'pt-BR':
        'Remotamente, sim — é assim que eu já trabalho com empresas de fora, contratado a partir do Brasil, mais recentemente para a Kota.io no mercado europeu. Sou brasileiro e moro no Brasil, e não tenho visto ou permissão de trabalho na UE nem nos EUA, então uma vaga presencial em qualquer um dos dois exigiria sponsorship. Consideraria mudar de país pela oportunidade certa, mas o que eu procuro é remoto.',
    },
  },
  {
    id: 'distributed-systems',
    question: {
      en: 'Do you have real distributed-systems experience?',
      'pt-BR': 'Você tem experiência real com sistemas distribuídos?',
    },
    answer: {
      en: 'Yes, and this site is the evidence rather than a claim about it. Pulse runs event-driven .NET services in production: SignalR presence over a Redis backplane, a RabbitMQ transactional outbox so a publish and its business write commit atomically, a separate worker process consuming those events into Postgres, and OpenTelemetry traces across the whole path. The source is public at github.com/felipe-allmeida/pulse.',
      'pt-BR':
        'Sim, e este site é a evidência, não uma afirmação sobre ela. O Pulse roda serviços .NET orientados a eventos em produção: presença via SignalR sobre um backplane Redis, um outbox transacional com RabbitMQ para que a publicação e a escrita de negócio sejam atômicas, um processo worker separado consumindo esses eventos para o Postgres, e traces com OpenTelemetry em todo o caminho. O código é público em github.com/felipe-allmeida/pulse.',
    },
  },
  {
    id: 'experience-years',
    question: {
      en: 'How many years of experience do you have?',
      'pt-BR': 'Quantos anos de experiência você tem?',
    },
    answer: {
      en: 'More than 12 years, starting in 2015 and spent almost entirely on .NET platforms. My path runs Vox Game Studio (development lead), Dell, Poatek, Dietbox (senior engineer, then Head of Technology), ADP Brazil Labs (lead engineer), Airia and Kota.io (senior product engineer). Roughly the last four of those years were in lead or head-of roles.',
      'pt-BR':
        'Mais de 12 anos, começando em 2015 e passados quase inteiramente em plataformas .NET. Minha trajetória vai de Vox Game Studio (development lead) a Dell, Poatek, Dietbox (engenheiro sênior e depois Head of Technology), ADP Brazil Labs (lead engineer), Airia e Kota.io (senior product engineer). Aproximadamente os últimos quatro desses anos foram em posições de liderança.',
    },
  },
  {
    id: 'leadership',
    question: {
      en: 'Do you have engineering leadership experience?',
      'pt-BR': 'Você tem experiência em liderança de engenharia?',
    },
    answer: {
      en: 'Yes. As Head of Technology at Dietbox I led a 13-person organization spanning engineering, QA, UX and support, introduced Scrum and trunk-based development — cutting lead time from a month to a week and a half — reduced monthly cloud spend by 21%, and reported KPIs and DORA metrics to the executive team. I was also Lead Software Engineer at ADP Brazil Labs, leading architecture and planning for legacy modernization, and I founded and run Pampa Devs. I set technical direction, mentor, and hire while staying hands-on in the code.',
      'pt-BR':
        'Sim. Como Head of Technology na Dietbox, liderei uma organização de 13 pessoas entre engenharia, QA, UX e suporte, introduzi Scrum e trunk-based development — reduzindo o lead time de um mês para uma semana e meia —, cortei 21% do gasto mensal em cloud e reportava KPIs e métricas DORA para a diretoria. Também fui Lead Software Engineer no ADP Brazil Labs, liderando arquitetura e planejamento da modernização de sistemas legados, e fundei e toco a Pampa Devs. Defino direção técnica, mentoro e contrato sem sair do código.',
    },
  },
  {
    id: 'education',
    question: {
      en: 'What is your education, and what languages do you speak?',
      'pt-BR': 'Qual é a sua formação e que idiomas você fala?',
    },
    answer: {
      en: 'I hold a B.S. in Digital Games and a postgraduate degree in Software Engineering, both from Universidade do Vale do Rio dos Sinos, and I am completing an MBA in Business Management at Fundação Getúlio Vargas. I speak Portuguese natively and English at an advanced level.',
      'pt-BR':
        'Sou bacharel em Jogos Digitais e pós-graduado em Engenharia de Software, ambos pela Universidade do Vale do Rio dos Sinos, e estou concluindo um MBA em Gestão Empresarial na Fundação Getúlio Vargas. Falo português nativo e inglês avançado.',
    },
  },
  {
    id: 'location',
    question: {
      en: 'Where are you based, and do you work remotely?',
      'pt-BR': 'Onde você mora e você trabalha remoto?',
    },
    answer: {
      en: 'I am based in Porto Alegre, Brazil (GMT-3) and work remotely. GMT-3 overlaps both the European and the US working day, and I am open to roles in either time zone.',
      'pt-BR':
        'Moro em Porto Alegre, Brasil (GMT-3), e trabalho remotamente. O GMT-3 se sobrepõe tanto ao dia útil europeu quanto ao americano, e estou aberto a vagas em qualquer um dos dois fusos.',
    },
  },
  {
    id: 'stack',
    question: {
      en: 'What is your main technology stack?',
      'pt-BR': 'Qual é a sua stack principal?',
    },
    answer: {
      en: 'C# and .NET / ASP.NET Core on the backend, TypeScript and React on the front end. Around them: PostgreSQL, Redis, RabbitMQ and SQL Server for data and messaging; Docker, Kubernetes, Terraform, Azure and GitHub Actions for infrastructure and CI/CD; OpenTelemetry for observability. Practices: event-driven architecture, transactional outbox, DDD and TDD.',
      'pt-BR':
        'C# e .NET / ASP.NET Core no backend, TypeScript e React no front-end. Ao redor disso: PostgreSQL, Redis, RabbitMQ e SQL Server para dados e mensageria; Docker, Kubernetes, Terraform, Azure e GitHub Actions para infraestrutura e CI/CD; OpenTelemetry para observabilidade. Práticas: arquitetura orientada a eventos, outbox transacional, DDD e TDD.',
    },
  },
  {
    id: 'live-system',
    question: {
      en: 'Is this portfolio really a live system?',
      'pt-BR': 'Este portfólio é mesmo um sistema ao vivo?',
    },
    answer: {
      en: 'Yes. Opening the page joins a real presence set over a WebSocket, puts a dot on a shared world map, and publishes a visit event through the backend described above. The metrics on the /live dashboard are that system reporting on itself — not fixtures, and not a recording.',
      'pt-BR':
        'Sim. Abrir a página entra em um conjunto de presença real por WebSocket, acende um ponto num mapa-múndi compartilhado e publica um evento de visita pelo backend descrito acima. As métricas no dashboard /live são esse sistema relatando a si mesmo — não são dados de exemplo nem uma gravação.',
    },
  },
];
