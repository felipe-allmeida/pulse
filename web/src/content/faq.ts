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
      en: 'Is Felipe de Almeida open to new opportunities?',
      'pt-BR': 'Felipe de Almeida está aberto a novas oportunidades?',
    },
    answer: {
      en: 'Yes. He is available now and actively looking for Staff or Principal Engineer roles, and for Head of Engineering / CTO positions. He works remotely and is open to roles in both European and US time zones. The fastest way to reach him is email (contato@felipealmeida.tech) or LinkedIn.',
      'pt-BR':
        'Sim. Está disponível agora e procurando ativamente posições de Staff ou Principal Engineer, e também de Head of Engineering / CTO. Trabalha remotamente e está aberto a vagas tanto em fusos europeus quanto americanos. O caminho mais rápido é e-mail (contato@felipealmeida.tech) ou LinkedIn.',
    },
  },
  {
    id: 'current-work',
    question: {
      en: 'What is Felipe working on right now?',
      'pt-BR': 'No que o Felipe está trabalhando agora?',
    },
    answer: {
      en: 'He is Head of Technology for ULBRA, a Brazilian university, on an engagement through his own software studio Pampa Devs. He leads three engineers building the university’s internal platform in .NET and React — an IT service desk in production, an ERP replacing the legacy systems, a CRM rebuilt to full test coverage, administrative dashboards, a student dashboard, and the datacenter automation all of it deploys onto. He remains open to full-time roles.',
      'pt-BR':
        'É Head de Tecnologia da ULBRA, uma universidade brasileira, em um contrato através do seu próprio estúdio de software, a Pampa Devs. Lidera três engenheiros construindo a plataforma interna da universidade em .NET e React — um service desk de TI em produção, um ERP substituindo os sistemas legados, um CRM reconstruído até cobertura total de testes, dashboards administrativos, um painel para os alunos e a automação de datacenter em que tudo isso é publicado. Segue aberto a posições full-time.',
    },
  },
  {
    id: 'what-he-is-looking-for',
    question: {
      en: 'What kind of company and work is Felipe looking for?',
      'pt-BR': 'Que tipo de empresa e de trabalho o Felipe procura?',
    },
    answer: {
      en: 'Early-stage startups and scale-ups. He wants to build products and take an active part in building the business, not only the code, and he is drawn to services at scale — where the work reaches a lot of people. The reach of the problem matters more to him than the industry it sits in.',
      'pt-BR':
        'Startups early-stage e scale-ups. Ele quer construir produtos e participar ativamente da construção do negócio, não só do código, e se sente atraído por serviços de escala — onde o trabalho chega a muita gente. O alcance do problema pesa mais para ele do que o setor em que ele está.',
    },
  },
  {
    id: 'work-authorization',
    question: {
      en: 'Can Felipe work in Europe or the US? Does he need visa sponsorship?',
      'pt-BR': 'O Felipe pode trabalhar na Europa ou nos EUA? Ele precisa de sponsorship?',
    },
    answer: {
      en: 'Remotely, yes — that is how he already works with companies abroad, contracting from Brazil, most recently for Kota.io in the European market. He is Brazilian and based in Brazil, and does not hold an EU or US work permit, so an on-site role in either would require visa sponsorship. He would consider relocating for the right opportunity, but remote is what he is looking for.',
      'pt-BR':
        'Remotamente, sim — é assim que ele já trabalha com empresas de fora, contratado a partir do Brasil, mais recentemente para a Kota.io no mercado europeu. Ele é brasileiro e mora no Brasil, e não tem visto ou permissão de trabalho na UE nem nos EUA, então uma vaga presencial em qualquer um dos dois exigiria sponsorship. Consideraria mudar de país pela oportunidade certa, mas o que ele procura é remoto.',
    },
  },
  {
    id: 'distributed-systems',
    question: {
      en: 'Does Felipe have real distributed-systems experience?',
      'pt-BR': 'O Felipe tem experiência real com sistemas distribuídos?',
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
      en: 'How many years of experience does Felipe de Almeida have?',
      'pt-BR': 'Quantos anos de experiência o Felipe de Almeida tem?',
    },
    answer: {
      en: 'More than 12 years, starting in 2015 and spent almost entirely on .NET platforms. The path runs Vox Game Studio (development lead), Dell, Poatek, Dietbox (senior engineer, then Head of Technology), ADP Brazil Labs (lead engineer), Airia and Kota.io (senior product engineer). Roughly the last four of those years were in lead or head-of roles.',
      'pt-BR':
        'Mais de 12 anos, começando em 2015 e passados quase inteiramente em plataformas .NET. A trajetória vai de Vox Game Studio (development lead) a Dell, Poatek, Dietbox (engenheiro sênior e depois Head of Technology), ADP Brazil Labs (lead engineer), Airia e Kota.io (senior product engineer). Aproximadamente os últimos quatro desses anos foram em posições de liderança.',
    },
  },
  {
    id: 'leadership',
    question: {
      en: 'Does Felipe have engineering leadership experience?',
      'pt-BR': 'O Felipe tem experiência em liderança de engenharia?',
    },
    answer: {
      en: 'Yes. As Head of Technology at Dietbox he led a 13-person organization spanning engineering, QA, UX and support, introduced Scrum and trunk-based development — cutting lead time from a month to a week and a half — reduced monthly cloud spend by 21%, and reported KPIs and DORA metrics to the executive team. He was also Lead Software Engineer at ADP Brazil Labs, leading architecture and planning for legacy modernization, and he founded and runs Pampa Devs. He sets technical direction, mentors, and hires while staying hands-on in the code.',
      'pt-BR':
        'Sim. Como Head of Technology na Dietbox, liderou uma organização de 13 pessoas entre engenharia, QA, UX e suporte, introduziu Scrum e trunk-based development — reduzindo o lead time de um mês para uma semana e meia —, cortou 21% do gasto mensal em cloud e reportava KPIs e métricas DORA para a diretoria. Também foi Lead Software Engineer no ADP Brazil Labs, liderando arquitetura e planejamento da modernização de sistemas legados, e fundou e toca a Pampa Devs. Define direção técnica, mentora e contrata sem sair do código.',
    },
  },
  {
    id: 'education',
    question: {
      en: 'What is Felipe de Almeida’s education, and what languages does he speak?',
      'pt-BR': 'Qual é a formação do Felipe de Almeida e que idiomas ele fala?',
    },
    answer: {
      en: 'He holds a B.S. in Digital Games and a postgraduate degree in Software Engineering, both from Universidade do Vale do Rio dos Sinos, and is completing an MBA in Business Management at Fundação Getúlio Vargas. He speaks Portuguese natively and English at an advanced level.',
      'pt-BR':
        'É bacharel em Jogos Digitais e pós-graduado em Engenharia de Software, ambos pela Universidade do Vale do Rio dos Sinos, e está concluindo um MBA em Gestão Empresarial na Fundação Getúlio Vargas. Fala português nativo e inglês avançado.',
    },
  },
  {
    id: 'location',
    question: {
      en: 'Where is Felipe based, and does he work remotely?',
      'pt-BR': 'Onde o Felipe mora e ele trabalha remoto?',
    },
    answer: {
      en: 'He is based in Porto Alegre, Brazil (GMT-3) and works remotely. GMT-3 overlaps both the European and the US working day, and he is open to roles in either time zone.',
      'pt-BR':
        'Ele mora em Porto Alegre, Brasil (GMT-3), e trabalha remotamente. O GMT-3 se sobrepõe tanto ao dia útil europeu quanto ao americano, e ele está aberto a vagas em qualquer um dos dois fusos.',
    },
  },
  {
    id: 'stack',
    question: {
      en: 'What is Felipe de Almeida’s main technology stack?',
      'pt-BR': 'Qual é a stack principal do Felipe de Almeida?',
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
