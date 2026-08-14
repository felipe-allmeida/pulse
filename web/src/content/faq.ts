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
 * `src/Pulse.Api/Assistant/profile.md`. The blanks still open in that file
 * (work authorization, English level, years of experience, relocation) are
 * deliberately absent rather than guessed at; add them here once they are
 * filled in there.
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
      en: 'Yes. He is available now and actively looking for Staff or Principal Engineer roles, and for Head of Engineering / CTO positions. He is open to remote work on Europe-friendly hours. The fastest way to reach him is email (contato@felipealmeida.tech) or LinkedIn.',
      'pt-BR':
        'Sim. Está disponível agora e procurando ativamente posições de Staff ou Principal Engineer, e também de Head of Engineering / CTO. Está aberto a trabalho remoto em horários compatíveis com a Europa. O caminho mais rápido é e-mail (contato@felipealmeida.tech) ou LinkedIn.',
    },
  },
  {
    id: 'current-work',
    question: {
      en: 'What is Felipe working on right now?',
      'pt-BR': 'No que o Felipe está trabalhando agora?',
    },
    answer: {
      en: 'He is freelancing through Pampa Devs, his own software studio, building internal enterprise platforms in .NET and React — a support and ticketing system, and an ERP replacing legacy internal tools. He remains open to full-time roles.',
      'pt-BR':
        'Está atuando como freelancer pela Pampa Devs, seu próprio estúdio de software, construindo plataformas internas corporativas em .NET e React — um sistema de suporte e chamados e um ERP substituindo ferramentas internas legadas. Segue aberto a posições full-time.',
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
    id: 'leadership',
    question: {
      en: 'Does Felipe have engineering leadership experience?',
      'pt-BR': 'O Felipe tem experiência em liderança de engenharia?',
    },
    answer: {
      en: 'Yes. He was Head of Technology at Dietbox, owning technology and architecture, and Lead Software Engineer at ADP Brazil Labs, leading engineering on payroll and HR platform work. He founded and runs Pampa Devs. He sets technical direction, mentors, and hires while staying hands-on in the code.',
      'pt-BR':
        'Sim. Foi Head of Technology na Dietbox, responsável por tecnologia e arquitetura, e Lead Software Engineer no ADP Brazil Labs, liderando a engenharia de uma plataforma de folha de pagamento e RH. Fundou e toca a Pampa Devs. Define direção técnica, mentora e contrata sem sair do código.',
    },
  },
  {
    id: 'location',
    question: {
      en: 'Where is Felipe based, and does he work remotely?',
      'pt-BR': 'Onde o Felipe mora e ele trabalha remoto?',
    },
    answer: {
      en: 'He is based in Porto Alegre, Brazil (GMT-3) and works remotely, with hours that overlap the European working day.',
      'pt-BR':
        'Ele mora em Porto Alegre, Brasil (GMT-3), e trabalha remotamente, com horários que se sobrepõem ao dia útil europeu.',
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
