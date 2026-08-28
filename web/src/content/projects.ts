import type { LocalizedString } from './types';

/** One headline number on a case-study page. Pre-rounded and pre-formatted. */
export interface CaseStudyMetric {
  /** Display value, already formatted per locale — "~2.4k" / "~2,4 mil". */
  value: LocalizedString;
  /** What the number counts. */
  label: LocalizedString;
  /** Optional qualifier specific to this tile. */
  note?: LocalizedString;
}

/** One step in a flow — a topology node or a lifecycle state. */
export interface CaseStudyFlowStep {
  /** Short label: a product name or a state name, so not localized. */
  label: string;
  detail: LocalizedString;
}

/** A named sequence of steps: what calls what, or what happens next. */
export interface CaseStudyFlow {
  /** Doubles as the section heading. Optional only for `architecture`, which
   *  falls back to the shared "Architecture" heading; a `states` flow without
   *  one does not render, because "Architecture" would be the wrong title. */
  caption?: LocalizedString;
  summary?: LocalizedString;
  steps: CaseStudyFlowStep[];
}

/**
 * A titled prose block: a claim and the reasoning behind it. Used for a
 * project's engineering decisions, and for what changed under the author's
 * direction.
 */
export interface CaseStudySection {
  heading: LocalizedString;
  body: LocalizedString;
}

/** A short, real script or config sample, rendered as a code block. */
export interface CaseStudyScript {
  /** Short label above the block — doubles as the section heading. */
  caption: LocalizedString;
  /** Lines of the sample, verbatim. Not localized: it is code. */
  lines: string[];
  /** Optional note under the block. */
  note?: LocalizedString;
}

/** One side of a before/after comparison. */
export interface CaseStudyComparisonSide {
  label: LocalizedString;
  value: LocalizedString;
  /** Relative magnitude, any unit — drives bar length so the figure cannot
   *  draw a proportion the numbers do not claim. */
  weight: number;
}

/** A two-sided before/after figure, drawn to scale. */
export interface CaseStudyComparison {
  /** Doubles as the section heading. */
  caption: LocalizedString;
  before: CaseStudyComparisonSide;
  after: CaseStudyComparisonSide;
  /** Where the numbers come from — rendered as a footnote. */
  source?: LocalizedString;
}

/** A small illustrative table of the system's output. */
export interface CaseStudyTable {
  /** Doubles as the section heading. */
  caption: LocalizedString;
  columns: LocalizedString[];
  /** Row cells, already formatted. Illustrative values, real structure. */
  rows: string[][];
  note?: LocalizedString;
}

/** What the author actually did on a project. */
export interface ProjectContribution {
  /** One or two sentences naming the contribution. */
  summary: LocalizedString;
  /** The specific areas owned — 2-5 items. */
  areas?: LocalizedString[];
  /** What was explicitly someone else's. Omit when the author built it all. */
  boundary?: LocalizedString;
}

export interface ProjectDetailContent {
  /** A longer, dedicated-page overview — 1-3 sentences. */
  overview?: LocalizedString;
  /** What the author actually did — rendered as its own section. */
  contribution?: ProjectContribution;
  /** What the system does, as 2-8 bullet points. */
  highlights?: LocalizedString[];
  /** The situation before the project existed. 2-4 sentences. */
  problem?: LocalizedString;
  /** 3-4 headline numbers. Rounded — never exact production counts. */
  metrics?: CaseStudyMetric[];
  /** One qualifier rendered under the metrics heading, covering the whole grid. */
  metricsNote?: LocalizedString;
  /** How the system is put together — what calls what. */
  architecture?: CaseStudyFlow;
  /** How one unit of work moves through the system, state by state. */
  states?: CaseStudyFlow;
  /** A real script or config sample. */
  script?: CaseStudyScript;
  /** A before/after figure drawn to scale. */
  comparison?: CaseStudyComparison;
  /** An illustrative table of the system's output. */
  table?: CaseStudyTable;
  /** 3-5 engineering decisions with their rationale. */
  decisions?: CaseStudySection[];
  /** What changed under the author's direction — reuses the decisions shape. */
  leadership?: CaseStudySection[];
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
  /**
   * The venture this project was built inside, by slug. Absent for independent
   * work. Projects sharing a venture must be contiguous in this array — the
   * index groups by walking it in order.
   */
  venture?: string;
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
    screenshot: '/screenshots/pulse.webp',
    links: [
      { label: 'Live site', href: 'https://felipealmeida.tech' },
      { label: 'GitHub', href: 'https://github.com/felipe-allmeida/pulse' },
    ],
    detail: {
      overview: {
        en: 'A self-hosted portfolio that doubles as a live systems demo: presence, visits, and metrics travel through a real event-driven backend in real time, not canned data.',
        'pt-BR':
          'Um portfólio auto-hospedado que também funciona como demo de sistemas ao vivo: presença, visitas e métricas passam por um backend real orientado a eventos em tempo real, não dados simulados.',
      },
      contribution: {
        summary: {
          en: 'Solo project — the design, the event-driven backend, the front end, and the infrastructure it runs on.',
          'pt-BR':
            'Projeto solo — o design, o backend orientado a eventos, o front-end e a infraestrutura em que roda.',
        },
        areas: [
          { en: 'The realtime presence pipeline and its world map.', 'pt-BR': 'O pipeline de presença em tempo real e seu mapa-múndi.' },
          { en: 'The transactional outbox and the event-driven backend behind it.', 'pt-BR': 'O outbox transacional e o backend orientado a eventos por trás dele.' },
          { en: 'The public ops dashboard and the metrics it exposes.', 'pt-BR': 'O dashboard de operações público e as métricas que ele expõe.' },
          { en: 'The AI assistant and the profile that grounds it.', 'pt-BR': 'O assistente de IA e o perfil que o fundamenta.' },
          { en: 'Deployment, from container build to the machine it lands on.', 'pt-BR': 'O deploy, do build do container à máquina onde ele roda.' },
        ],
      },
      problem: {
        en: 'A CV asserts seniority and a repository demands that someone read it; neither lets a stranger watch a system work. Pulse closes that gap by being both the portfolio and the thing being demonstrated. The constraint it was built against was not a user need but an evidentiary one — make the claim checkable in the thirty seconds someone actually spends.',
        'pt-BR':
          'Um currículo afirma senioridade e um repositório exige que alguém o leia; nenhum dos dois deixa um estranho ver um sistema funcionando. O Pulse fecha essa lacuna sendo ao mesmo tempo o portfólio e a coisa demonstrada. O que guiou sua construção não foi uma necessidade de usuário, e sim de evidência — tornar a afirmação conferível nos trinta segundos que alguém de fato gasta.',
      },
      architecture: {
        summary: {
          en: 'A .NET backend behind a React client. A new connection resolves the visitor’s rough location and publishes a visit event through a transactional outbox, flushed in the same save as the write. A worker drains that outbox over RabbitMQ and appends the audit trail in Postgres. SignalR carries live presence — the connection count, and reactions — while the world map reads the accumulated visits by polling, so the map draws on its own schedule instead of blocking on that round trip. Tracing runs through OpenTelemetry, and the whole thing ships as containers behind Caddy.',
          'pt-BR':
            'Um backend .NET por trás de um cliente React. Uma conexão nova resolve a localização aproximada do visitante e publica um evento de visita por um outbox transacional, descarregado no mesmo save da escrita. Um worker drena esse outbox via RabbitMQ e acrescenta a trilha de auditoria no Postgres. O SignalR carrega a presença ao vivo — a contagem de conexões e as reações — enquanto o mapa-múndi lê as visitas acumuladas por polling, então o mapa desenha no próprio ritmo em vez de travar esperando esse round trip. O tracing passa por OpenTelemetry, e tudo sobe como containers atrás do Caddy.',
        },
        steps: [
          {
            label: 'Browser',
            detail: {
              en: 'A React client holding a SignalR connection open.',
              'pt-BR': 'Um cliente React mantendo uma conexão SignalR aberta.',
            },
          },
          {
            label: 'API',
            detail: {
              en: 'Resolves the visitor’s rough location, publishes the visit, and broadcasts the new presence count to everyone.',
              'pt-BR':
                'Resolve a localização aproximada do visitante, publica a visita e transmite a nova contagem de presença para todos.',
            },
          },
          {
            label: 'Outbox',
            detail: {
              en: 'The event is buffered and flushed in the same save as the write, so it cannot be published for something that did not commit.',
              'pt-BR':
                'O evento é bufferizado e descarregado no mesmo save da escrita, então não pode ser publicado para algo que não commitou.',
            },
          },
          {
            label: 'Worker',
            detail: {
              en: 'Drains the outbox over RabbitMQ and appends the visit to the audit trail.',
              'pt-BR': 'Drena o outbox via RabbitMQ e acrescenta a visita à trilha de auditoria.',
            },
          },
          {
            label: 'World map',
            detail: {
              en: 'Polls the accumulated visits on its own schedule, so the map never blocks on the round trip that fills it.',
              'pt-BR':
                'Consulta as visitas acumuladas no próprio ritmo, então o mapa nunca trava esperando o round trip que o alimenta.',
            },
          },
        ],
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
          en: 'A public ops dashboard exposing real metrics — live connections, visits over time, and the event feed as it happens.',
          'pt-BR':
            'Um dashboard de operações público expondo métricas reais — conexões ao vivo, visitas ao longo do tempo e o feed de eventos conforme acontece.',
        },
        {
          en: 'An AI assistant grounded in a maintained profile, streaming answers about me.',
          'pt-BR': 'Um assistente de IA baseado em um perfil mantido, respondendo em streaming sobre mim.',
        },
        {
          en: 'Deployed with Docker Compose + Caddy behind Terraform-managed infrastructure.',
          'pt-BR': 'Deploy com Docker Compose + Caddy sobre infraestrutura gerenciada com Terraform.',
        },
      ],
      decisions: [
        {
          heading: {
            en: 'A transactional outbox behind a visit counter',
            'pt-BR': 'Um outbox transacional atrás de um contador de visitas',
          },
          body: {
            en: 'Nothing about counting visits requires one. The point is not the counter — it is that the pattern is here, wired end to end, in something a reader can watch rather than a diagram they have to trust. On a product this would be over-engineering; on a demonstration it is the deliverable.',
            'pt-BR':
              'Nada em contar visitas exige um. O ponto não é o contador — é que o padrão está aqui, ligado de ponta a ponta, em algo que o leitor pode ver funcionando em vez de um diagrama em que precisa acreditar. Num produto isso seria over-engineering; numa demonstração é a entrega.',
          },
        },
        {
          heading: {
            en: 'Real telemetry, published',
            'pt-BR': 'Telemetria real, publicada',
          },
          body: {
            en: 'The ops dashboard exposes the system’s actual numbers, which means a reader can catch the site lying about itself. Most portfolios make claims that cannot be checked; this one chose the version that can be.',
            'pt-BR':
              'O dashboard de operações expõe os números reais do sistema, o que significa que um leitor pode flagrar o site mentindo sobre si mesmo. A maioria dos portfólios faz afirmações que não dá para conferir; este escolheu a versão que dá.',
          },
        },
        {
          heading: {
            en: 'Prerendered pages over a client-only app',
            'pt-BR': 'Páginas pré-renderizadas em vez de app só no cliente',
          },
          body: {
            en: 'The site renders its content into HTML at build time, so a first visit does not wait on JavaScript and a crawler sees the same page a person does — and, usefully, a deploy can be verified with a single request rather than a browser.',
            'pt-BR':
              'O site renderiza seu conteúdo em HTML no build, então a primeira visita não espera JavaScript e um crawler vê a mesma página que uma pessoa — e, de quebra, um deploy pode ser verificado com uma única requisição em vez de um navegador.',
          },
        },
        {
          heading: {
            en: 'An assistant grounded in a maintained profile',
            'pt-BR': 'Um assistente fundamentado num perfil mantido',
          },
          body: {
            en: 'The assistant answers from a file I keep current, and says it does not know rather than inventing. Ungrounded, it would be a demonstration of exactly the wrong thing.',
            'pt-BR':
              'O assistente responde a partir de um arquivo que eu mantenho atualizado, e diz que não sabe em vez de inventar. Sem fundamento, ele seria a demonstração exatamente do oposto.',
          },
        },
      ],
    },
  },
  {
    slug: 'kota-embed',
    name: 'Kota Embed',
    tagline: {
      en: "Health insurance enrollment, embedded inside other companies' platforms.",
      'pt-BR': 'Adesão a plano de saúde, embutida dentro das plataformas de outras empresas.',
    },
    description: {
      en: 'A multi-tenant .NET service behind an embedded enrollment flow: employers offer health insurance to their employees without leaving the software they already use, while the backend integrates with nine insurers across three regulatory regions.',
      'pt-BR':
        'Um serviço .NET multi-tenant por trás de um fluxo de adesão embutido: empregadores oferecem plano de saúde aos funcionários sem sair do software que já usam, enquanto o backend integra com nove seguradoras em três regiões regulatórias.',
    },
    tech: ['.NET', 'PostgreSQL', 'EF Core', 'AWS', 'OpenTelemetry', 'Multi-tenant', 'Webhooks'],
    role: {
      en: 'Senior Product Engineer, platform team',
      'pt-BR': 'Senior Product Engineer, time de plataforma',
    },
    period: { en: 'Professional work', 'pt-BR': 'Trabalho profissional' },
    visibility: 'private',
    screenshot: '/screenshots/kota.webp',
    links: [{ label: 'Website', href: 'https://kota.io' }],
    detail: {
      overview: {
        en: 'Kota Embed lets employers offer health insurance to their employees without leaving the software they already use — the enrollment flow runs embedded in a third-party platform, backed by a multi-tenant .NET service that integrates directly with insurers.',
        'pt-BR':
          'O Kota Embed permite que empregadores ofereçam plano de saúde aos funcionários sem sair do software que já usam — o fluxo de adesão roda embutido numa plataforma de terceiro, apoiado por um serviço .NET multi-tenant que integra direto com as seguradoras.',
      },
      contribution: {
        summary: {
          en: 'I owned the multi-tenant core — the part that turns an enrollment request into a policy across nine insurers that each behave differently.',
          'pt-BR':
            'O núcleo multi-tenant foi meu — a parte que transforma um pedido de adesão numa apólice, através de nove seguradoras que se comportam de formas diferentes.',
        },
        areas: [
          { en: 'The intent state machines behind enrollment, quoting, amendment and renewal.', 'pt-BR': 'As máquinas de estado de intent por trás de adesão, cotação, alteração e renovação.' },
          { en: 'Adaptive requirements: asking a service what a case must collect instead of hardcoding a form per insurer.', 'pt-BR': 'Requisitos adaptativos: perguntar a um serviço o que um caso precisa coletar, em vez de codificar um formulário por seguradora.' },
          { en: 'The versioned public API contract and its webhooks.', 'pt-BR': 'O contrato versionado da API pública e seus webhooks.' },
          { en: 'Provider contracts introduced behind feature flags and migrated without stopping the product.', 'pt-BR': 'Contratos de provedor introduzidos atrás de feature flags e migrados sem parar o produto.' },
          { en: 'Idempotency and duplicate suppression, and the integration suite that covers them.', 'pt-BR': 'Idempotência e supressão de duplicatas, e a suíte de integração que cobre as duas.' },
        ],
        boundary: {
          en: 'The front end — the embedded flow and its SDK — was built by others; I have no commits in it.',
          'pt-BR':
            'O front-end — o fluxo embutido e seu SDK — foi feito por outros; não tenho commits nele.',
        },
      },
      problem: {
        en: 'Enrolling someone in health insurance looks like a form. It is not. Each insurer wants different data in a different shape on its own schedule; some answer over HTTP, others by exchanging files over SFTP. Regulatory disclosure obligations differ by region. And all of it happens inside an iframe hosted on another company’s platform, where the user expects it to feel immediate. A form hardcoded per insurer does not survive the second insurer.',
        'pt-BR':
          'Inscrever alguém num plano de saúde parece um formulário. Não é. Cada seguradora quer dados diferentes, em formato diferente, no tempo dela; umas respondem por HTTP, outras trocando arquivos por SFTP. As obrigações regulatórias de disclosure mudam conforme a região. E tudo isso acontece dentro de um iframe hospedado na plataforma de outra empresa, onde o usuário espera que seja imediato. Um formulário hardcoded por seguradora não sobrevive à segunda seguradora.',
      },
      metrics: [
        {
          value: { en: '9', 'pt-BR': '9' },
          label: { en: 'insurer integrations', 'pt-BR': 'integrações de seguradora' },
          note: { en: 'HTTP APIs and SFTP file exchange', 'pt-BR': 'APIs HTTP e troca de arquivos por SFTP' },
        },
        {
          value: { en: '3', 'pt-BR': '3' },
          label: { en: 'regulatory regions', 'pt-BR': 'regiões regulatórias' },
          note: { en: 'disclosure rules differ per region', 'pt-BR': 'as regras de disclosure mudam por região' },
        },
        {
          value: { en: '7', 'pt-BR': '7' },
          label: { en: 'intent workflow types', 'pt-BR': 'tipos de fluxo de intent' },
          note: { en: 'enrollment, quote, amendment, renewal…', 'pt-BR': 'adesão, cotação, alteração, renovação…' },
        },
      ],
      architecture: {
        summary: {
          en: 'A .NET modular monolith split by bounded context: the multi-tenant platform core, one module per insurer, plus compliance, webhooks, and financial reporting. The core never calls an insurer directly — every provider call goes through an adapter factory, so the code that runs an enrollment does not know which insurer it is talking to. Long-running work is modeled as an intent: a persisted state machine rather than a request held open.',
          'pt-BR':
            'Um monólito modular em .NET dividido por contexto delimitado: o núcleo multi-tenant da plataforma, um módulo por seguradora, mais compliance, webhooks e relatório financeiro. O núcleo nunca chama uma seguradora direto — toda chamada a provedor passa por uma adapter factory, então o código que roda uma adesão não sabe com qual seguradora está falando. Trabalho de longa duração é modelado como intent: uma máquina de estados persistida, e não uma requisição mantida aberta.',
        },
        steps: [
          {
            label: 'Third-party platform',
            detail: {
              en: 'The host application, embedding the enrollment flow in an iframe.',
              'pt-BR': 'A aplicação hospedeira, embutindo o fluxo de adesão num iframe.',
            },
          },
          {
            label: 'Public API',
            detail: {
              en: 'Versioned contract and signed webhooks for the platforms doing the embedding.',
              'pt-BR': 'Contrato versionado e webhooks assinados para as plataformas que embutem o fluxo.',
            },
          },
          {
            label: 'Platform core',
            detail: {
              en: 'Employers, employees, eligibility, and the intent state machines.',
              'pt-BR': 'Empregadores, funcionários, elegibilidade e as máquinas de estado dos intents.',
            },
          },
          {
            label: 'Adapter factory',
            detail: {
              en: 'The single door to every insurer, keeping the core provider-agnostic.',
              'pt-BR': 'A única porta para cada seguradora, mantendo o núcleo agnóstico de provedor.',
            },
          },
          {
            label: 'Insurer integrations',
            detail: {
              en: 'One module per insurer, over HTTP or scheduled SFTP file exchange.',
              'pt-BR': 'Um módulo por seguradora, por HTTP ou troca agendada de arquivos via SFTP.',
            },
          },
        ],
      },
      states: {
        caption: { en: 'The life of an enrollment', 'pt-BR': 'A vida de uma adesão' },
        summary: {
          en: 'These are the statuses an enrollment actually moves through. It can also end ineligible, or not undertaken at all — the happy path below is not the only way out.',
          'pt-BR':
            'Estes são os status pelos quais uma adesão realmente passa. Ela também pode terminar inelegível, ou nem ser realizada — o caminho feliz abaixo não é a única saída.',
        },
        steps: [
          {
            label: 'Processing',
            detail: {
              en: 'The request is recorded against its idempotency key and validated, before anything external is called.',
              'pt-BR': 'O pedido é registrado sob sua chave de idempotência e validado, antes de qualquer chamada externa.',
            },
          },
          {
            label: 'ActionRequired',
            detail: {
              en: 'Something is missing that only a person can supply. The intent says so and waits, instead of failing.',
              'pt-BR': 'Falta algo que só uma pessoa pode fornecer. O intent declara isso e espera, em vez de falhar.',
            },
          },
          {
            label: 'PendingConfirmation',
            detail: {
              en: 'Everything the insurer and the region require is gathered; the requester confirms before it is sent.',
              'pt-BR': 'Tudo o que a seguradora e a região exigem está reunido; quem pediu confirma antes do envio.',
            },
          },
          {
            label: 'Enrolling',
            detail: {
              en: 'Handed to the insurer through its adapter, which answers on its own schedule.',
              'pt-BR': 'Entregue à seguradora pelo adapter dela, que responde no tempo dela.',
            },
          },
          {
            label: 'Enrolled',
            detail: {
              en: 'The policy exists. The platform reports it back to whoever asked.',
              'pt-BR': 'A apólice existe. A plataforma reporta de volta a quem pediu.',
            },
          },
        ],
      },
      highlights: [
        {
          en: 'Multi-tenant by construction: platform → employer → employee → group, isolated per tenant.',
          'pt-BR': 'Multi-tenant por construção: plataforma → empregador → funcionário → grupo, isolados por tenant.',
        },
        {
          en: 'Group setup, enrollment, quoting, amendment, renewal, policy import, and dependant management, each as its own workflow.',
          'pt-BR':
            'Configuração de grupo, adesão, cotação, alteração, renovação, importação de apólice e gestão de dependentes, cada uma como seu próprio fluxo.',
        },
        {
          en: 'Eligibility computed from provider rules rather than stored as a flag.',
          'pt-BR': 'Elegibilidade calculada a partir das regras do provedor, em vez de guardada como flag.',
        },
        {
          en: 'Policy and plan data aggregated across insurers into a single response.',
          'pt-BR': 'Dados de apólice e plano agregados entre seguradoras numa resposta única.',
        },
        {
          en: 'A versioned public API and signed webhooks for the platforms doing the embedding.',
          'pt-BR': 'Uma API pública versionada e webhooks assinados para as plataformas que embutem o fluxo.',
        },
        {
          en: 'Insurer integrations over both HTTP APIs and scheduled SFTP file exchange.',
          'pt-BR': 'Integrações de seguradora tanto por API HTTP quanto por troca agendada de arquivos via SFTP.',
        },
      ],
      decisions: [
        {
          heading: {
            en: 'Intents instead of request/response',
            'pt-BR': 'Intent em vez de request/response',
          },
          body: {
            en: 'An enrollment cannot finish inside one call — an insurer may take minutes or days. Modeling it as a persisted state machine with its own status makes the in-between state something the system can query, resume, and report on, instead of a transaction held open and hoped for.',
            'pt-BR':
              'Uma adesão não termina dentro de uma chamada — uma seguradora pode levar minutos ou dias. Modelar isso como máquina de estados persistida, com status próprio, transforma o estado intermediário em algo que o sistema consulta, retoma e reporta, em vez de uma transação mantida aberta na esperança.',
          },
        },
        {
          heading: {
            en: 'Adaptive requirements instead of a form per insurer',
            'pt-BR': 'Requisitos adaptativos em vez de um formulário por seguradora',
          },
          body: {
            en: 'What a given case must collect depends on the insurer and the regulatory region at once. Rather than encoding nine forms, the platform asks a requirements service what this case needs and renders that. Adding an insurer stops being a front-end change. The lookup happens behind the same adapter boundary, so the core still never handles a provider identity itself.',
            'pt-BR':
              'O que um caso precisa coletar depende da seguradora e da região regulatória ao mesmo tempo. Em vez de codificar nove formulários, a plataforma pergunta a um serviço de requisitos o que aquele caso exige e renderiza isso. Adicionar uma seguradora deixa de ser mudança de front-end. A consulta acontece atrás da mesma fronteira de adapter, então o núcleo continua sem manipular a identidade de nenhum provedor.',
          },
        },
        {
          heading: {
            en: 'An adapter factory as the only door to a provider',
            'pt-BR': 'Uma adapter factory como única porta para o provedor',
          },
          body: {
            en: 'The platform core resolves an adapter and talks to that. It never learns which insurer it is serving, which is what keeps a tenth integration from touching enrollment logic — and what let provider contracts be introduced behind feature flags and migrated without stopping the product.',
            'pt-BR':
              'O núcleo da plataforma resolve um adapter e fala com ele. Nunca fica sabendo qual seguradora está atendendo, e é isso que impede uma décima integração de tocar na lógica de adesão — e o que permitiu introduzir contratos de provedor atrás de feature flags e migrar sem parar o produto.',
          },
        },
        {
          heading: {
            en: 'Idempotency and duplicate suppression as a requirement, not a repair',
            'pt-BR': 'Idempotência e supressão de duplicata como requisito, não conserto',
          },
          body: {
            en: 'Retries happen, webhooks arrive twice, and consumers run concurrently against the same rows. Intent creation takes an idempotency key, auto-enrollment suppresses the duplicate intent-and-webhook pair, and the eligibility-screening consumer handles serialization conflicts rather than assuming they cannot happen.',
            'pt-BR':
              'Retry acontece, webhook chega duas vezes e consumidores rodam concorrentes sobre as mesmas linhas. A criação de intent aceita chave de idempotência, a adesão automática suprime o par intent-e-webhook duplicado, e o consumer de triagem de elegibilidade trata conflito de serialização em vez de assumir que ele não ocorre.',
          },
        },
      ],
    },
  },
  {
    slug: 'dietbox',
    name: 'Dietbox Webapp',
    tagline: {
      en: 'The decade-old monolith the product grew on, and still its largest codebase.',
      'pt-BR': 'O monolito de dez anos em que o produto cresceu, e ainda sua maior base de código.',
    },
    description: {
      en: 'The monolith that carried both the nutritionist and the patient experience before any other service existed, deploying once a night because that was the only window that felt safe — and the codebase a newer generation of services has since grown up beside.',
      'pt-BR':
        'O monolito que atendeu nutricionistas e pacientes antes de existir qualquer outro serviço, com deploy uma vez por noite porque essa era a única janela que parecia segura — e a base de código ao lado da qual uma geração mais nova de serviços cresceu desde então.',
    },
    tech: ['C#', 'ASP.NET MVC', 'Entity Framework', 'SQL Server', 'Azure App Service', 'Kendo UI', 'Azure DevOps'],
    role: {
      en: 'Senior Software Engineer, then Head of Technology',
      'pt-BR': 'Engenheiro de Software Sênior, depois Head de Tecnologia',
    },
    period: { en: '2020–2024', 'pt-BR': '2020–2024' },
    venture: 'dietbox',
    visibility: 'private',
    screenshot: '/screenshots/dietbox.webp',
    links: [{ label: 'Website', href: 'https://dietbox.me' }],
    detail: {
      overview: {
        en: "The monolith is the product's centre of gravity: for years it was the only codebase, carrying both the nutritionist and the patient experience through the same release. Everything the product did shipped through this one pipeline, on the one schedule that pipeline allowed.",
        'pt-BR':
          'O monolito é o centro de gravidade do produto: por anos foi a única base de código, levando tanto a experiência da nutricionista quanto a do paciente na mesma entrega. Tudo que o produto fazia passava por esse único pipeline, na única janela que esse pipeline permitia.',
      },
      contribution: {
        summary: {
          en: 'Principal architect for four years — I set the platform’s patterns and configured the Azure estate, including for services other people wrote. Later the whole technology organization reported to me.',
          'pt-BR':
            'Arquiteto principal por quatro anos — defini os padrões da plataforma e configurei o ambiente Azure, inclusive para serviços escritos por outras pessoas. Depois, toda a área de tecnologia passou a se reportar a mim.',
        },
        areas: [
          {
            en: 'The build and release pipeline in Azure DevOps, shipping the core project together with its satellites and its gulp-built, Kendo UI front end.',
            'pt-BR':
              'O pipeline de build e release no Azure DevOps, entregando o projeto principal junto com seus satélites e seu front end construído em gulp com Kendo UI.',
          },
          {
            en: 'Production availability and incident response.',
            'pt-BR': 'Disponibilidade em produção e resposta a incidentes.',
          },
        ],
        boundary: {
          en: 'The product’s largest codebase was a team effort — about a sixth of that repository’s commits are mine.',
          'pt-BR':
            'A maior base de código do produto foi trabalho de time — cerca de um sexto dos commits daquele repositório são meus.',
        },
      },
      problem: {
        en: 'The nutritionist lives in the tool all day; the patient opens it to read a meal plan. Same product, same identity backbone, opposite expectations. And in 2020 a .NET Framework monolith carried both on Windows App Service, shipping once a day, at night, because that was the only window that felt safe.',
        'pt-BR':
          'A nutricionista vive na ferramenta o dia inteiro; o paciente abre para ler um plano alimentar. Mesmo produto, mesma base de identidade, expectativas opostas. E em 2020 um monolito .NET Framework carregava os dois no Windows App Service, com deploy uma vez por dia, de madrugada, porque era a única janela que parecia segura.',
      },
      metrics: [
        {
          value: { en: '~600', 'pt-BR': '~600' },
          label: { en: 'commits in the monolith', 'pt-BR': 'commits no monolito' },
          note: { en: 'mine, of ~3.9k total', 'pt-BR': 'meus, de ~3,9 mil no total' },
        },
        {
          value: { en: '4 years', 'pt-BR': '4 anos' },
          label: { en: 'in the same codebase', 'pt-BR': 'na mesma base de código' },
          note: { en: '2020 to 2024', 'pt-BR': 'de 2020 a 2024' },
        },
      ],
      metricsNote: {
        en: 'The commit counts come from the repository. The rest is my own record of the period.',
        'pt-BR': 'Os números de commit vêm do repositório. O resto é meu próprio registro do período.',
      },
      architecture: {
        summary: {
          en: 'The core project, its data, the scheduled job beside it, and the Azure app it deploys onto.',
          'pt-BR': 'O projeto principal, seus dados, o job agendado ao lado dele, e o app Azure onde é publicado.',
        },
        steps: [
          {
            label: 'Web application',
            detail: {
              en: 'The core project and its satellites — catalogs, enums, shared infrastructure, resources and reports — behind a gulp-built front end using Kendo UI.',
              'pt-BR':
                'O projeto principal e seus satélites — catálogos, enums, infraestrutura compartilhada, recursos e relatórios — atrás de um front end construído em gulp com Kendo UI.',
            },
          },
          {
            label: 'Data layer',
            detail: {
              en: 'Entity Framework over SQL Server, the store the monolith reads and writes through.',
              'pt-BR': 'Entity Framework sobre SQL Server, a base que o monolito lê e grava.',
            },
          },
          {
            label: 'Background jobs',
            detail: {
              en: 'A webjob project for scheduled work — a single daily job — sitting in the repository but outside the solution the release builds, and published on its own.',
              'pt-BR':
                'Um projeto de webjob para trabalho agendado — um único job diário — que fica no repositório mas fora da solution que a release compila, e é publicado por fora.',
            },
          },
          {
            label: 'Azure App Service',
            detail: {
              en: 'A Windows app with a staging slot: the release deploys the built artifact to the slot, then swaps the slot into production.',
              'pt-BR':
                'Um app Windows com um slot de staging: a release publica o artefato construído no slot e depois faz o swap do slot para produção.',
            },
          },
        ],
      },
      highlights: [
        {
          en: 'Diet planning for the practitioner, and the same plan in the patient’s own app.',
          'pt-BR': 'Montagem de plano alimentar para a profissional, e o mesmo plano no app do paciente.',
        },
        {
          en: 'Two sign-up journeys over one identity system — a practitioner subscribing, and a patient invited by the one treating them.',
          'pt-BR':
            'Dois caminhos de cadastro sobre um único sistema de identidade — a profissional que assina e o paciente convidado por ela.',
        },
        {
          en: 'Live updates pushed to open clients without a refresh.',
          'pt-BR': 'Atualizações em tempo real enviadas a clientes abertos, sem recarregar.',
        },
        {
          en: 'Subscriptions and recurring billing.',
          'pt-BR': 'Assinaturas e cobrança recorrente.',
        },
      ],
      decisions: [
        {
          heading: {
            en: 'One core, many satellites',
            'pt-BR': 'Um núcleo, vários satélites',
          },
          body: {
            en: "The core project doesn't carry catalogs, enums, shared infrastructure, resources and reports itself — each lives in its own satellite project. A change to reference data doesn't touch the same project as a change to the request path.",
            'pt-BR':
              'O projeto principal não carrega catálogos, enums, infraestrutura compartilhada, recursos e relatórios sozinho — cada um vive em seu próprio projeto satélite. Uma mudança em dado de referência não toca o mesmo projeto que uma mudança no caminho de requisição.',
          },
        },
        {
          heading: {
            en: 'The release builds a target, not the solution',
            'pt-BR': 'A release compila um alvo, não a solution',
          },
          body: {
            en: "The release pipeline restores the solution but builds a single target — the site project — and archives only what that target publishes. The webjob project sitting beside it in the repository is not in the solution at all: it still targets 4.7.2 where the site targets 4.8, carries its own daily-schedule publish settings, and has not been touched since 2021. Naming a target rather than a solution is what keeps a project in that state from riding into a release nobody meant to include it in.",
            'pt-BR':
              'O pipeline de release restaura a solution mas compila um único alvo — o projeto do site — e arquiva apenas o que aquele alvo publica. O projeto de webjob que fica ao lado, no mesmo repositório, não está na solution: ainda tem 4.7.2 como alvo enquanto o site tem 4.8, carrega as próprias configurações de publicação com agendamento diário, e não é tocado desde 2021. Nomear um alvo em vez de uma solution é o que impede um projeto nesse estado de entrar de carona numa release em que ninguém pretendia incluí-lo.',
          },
        },
        {
          heading: {
            en: 'Release by slot swap, not by overwrite',
            'pt-BR': 'Release por troca de slot, não por sobrescrita',
          },
          body: {
            en: 'The pipeline builds once and deploys that one artifact to the app’s staging slot; production changes by swapping the slot in, not by writing over the site while it is serving. What goes live is a build that was already running before it took traffic, and the way back is the same swap in the other direction. That is what a deploy has to be before it can happen in daylight rather than at night.',
            'pt-BR':
              'O pipeline compila uma vez e publica esse único artefato no slot de staging do app; produção muda pelo swap do slot, não por sobrescrever o site enquanto ele atende. O que vai ao ar é um build que já estava rodando antes de receber tráfego, e o caminho de volta é o mesmo swap na direção contrária. É isso que um deploy precisa ser antes de poder acontecer de dia em vez de de madrugada.',
          },
        },
        {
          heading: {
            en: 'A monolith you strangle, not rewrite',
            'pt-BR': 'Um monolito que se estrangula, não se reescreve',
          },
          body: {
            en: 'New capability went into the services beside the monolith, not into the monolith itself. It kept the surface it already served, without a rewrite competing for the same hours as the features shipping everywhere else.',
            'pt-BR':
              'Nova capacidade foi para os serviços ao lado do monolito, não para dentro dele. Ele manteve a superfície que já atendia, sem uma reescrita disputando as mesmas horas com as funcionalidades entregues no resto da plataforma.',
          },
        },
      ],
    },
  },
  {
    slug: 'dietbox-b2c',
    name: 'Dietbox B2C',
    tagline: {
      en: 'One identity backbone, two audiences, custom sign-in journeys.',
      'pt-BR': 'Uma base de identidade, dois públicos, jornadas de login customizadas.',
    },
    description: {
      en: 'Custom Azure AD B2C policies for a product whose two audiences share nothing but an account: a practitioner subscribing, and a patient invited by the one treating them. Federated sign-in, silent migration off the legacy store, and revocation that actually signs a session out everywhere.',
      'pt-BR':
        'Políticas customizadas de Azure AD B2C para um produto cujos dois públicos não dividem nada além da conta: a profissional que assina e o paciente convidado por ela. Login federado, migração silenciosa da base legada e revogação que de fato encerra a sessão em todo lugar.',
    },
    tech: ['Azure AD B2C', 'Identity Experience Framework', 'XML', 'OpenID Connect', 'OAuth 2.0', '.NET 6', 'HTML', 'CSS', 'Azure DevOps'],
    role: {
      en: 'Senior Software Engineer, then Head of Technology',
      'pt-BR': 'Engenheiro de Software Sênior, depois Head de Tecnologia',
    },
    period: { en: '2021–2024', 'pt-BR': '2021–2024' },
    visibility: 'private',
    screenshot: '/screenshots/dietbox-b2c.webp',
    links: [{ label: 'Website', href: 'https://dietbox.me' }],
    venture: 'dietbox',
    detail: {
      overview: {
        en: 'One Azure AD B2C identity system carrying two audiences that share nothing but the account: a nutritionist subscribing and paying, and a patient arriving by invitation from the one treating them. Three years of custom sign-in journeys, federated providers, silent migration off the legacy store, and session revocation that reaches every open browser.',
        'pt-BR':
          'Um único sistema de identidade em Azure AD B2C carregando dois públicos que não dividem nada além da conta: a nutricionista que assina e paga, e o paciente que chega por convite de quem o atende. Três anos de jornadas de login customizadas, provedores federados, migração silenciosa da base legada e revogação de sessão que alcança todo navegador aberto.',
      },
      contribution: {
        summary: {
          en: 'This is the author’s largest personal ownership in the Dietbox estate: half the commits over three years, across both audiences’ sign-in journeys.',
          'pt-BR':
            'Esta é a maior propriedade pessoal do autor no conjunto Dietbox: metade dos commits ao longo de três anos, cobrindo as jornadas de login dos dois públicos.',
        },
        areas: [
          {
            en: 'The two policy sets — one for the practitioner, one for the patient — each its own sign-up, sign-in and password-reset journey.',
            'pt-BR':
              'Os dois conjuntos de políticas — um para a profissional, um para o paciente — cada um com sua própria jornada de cadastro, login e redefinição de senha.',
          },
          {
            en: 'Federation with Google, Facebook and Apple, each mapped through its own exchange profile into a common subject claim.',
            'pt-BR':
              'Federação com Google, Facebook e Apple, cada uma mapeada por seu próprio exchange profile para uma claim de subject comum.',
          },
          {
            en: 'The first-sign-in migration that moves a legacy-store user into the directory during the same journey they log in with.',
            'pt-BR':
              'A migração no primeiro login, que move um usuário da base legada para o diretório na própria jornada em que ele entra.',
          },
          {
            en: 'Session revocation: a stamp on the user compared against the token’s issue time, so a password change or an admin revoke signs the account out everywhere.',
            'pt-BR':
              'Revogação de sessão: um carimbo no usuário comparado com o momento de emissão do token, para que uma troca de senha ou uma revogação administrativa encerre a conta em todo lugar.',
          },
          {
            en: 'The custom sign-in pages, one set per audience, served and filled in at runtime.',
            'pt-BR':
              'As páginas de login customizadas, um conjunto por público, servidas e preenchidas em tempo de execução.',
          },
        ],
      },
      problem: {
        en: 'A hosted login gives a product one journey. This one needed several: a subscriber signing up and paying, a patient arriving by invitation with no password to set, an academy student, and a receptionist acting on someone else’s behalf — all over one directory, without four separate user stores to keep in sync.',
        'pt-BR':
          'Um login hospedado dá a um produto uma única jornada. Este precisava de várias: uma assinante se cadastrando e pagando, um paciente chegando por convite sem senha para definir, uma aluna de academy, e uma recepcionista agindo em nome de outra pessoa — tudo sobre um único diretório, sem quatro bases de usuário separadas para manter sincronizadas.',
      },
      metrics: [
        {
          value: { en: '~7.2k', 'pt-BR': '~7,2 mil' },
          label: { en: 'lines of policy XML', 'pt-BR': 'linhas de XML de política' },
          note: { en: 'across two policy sets', 'pt-BR': 'em dois conjuntos de políticas' },
        },
        {
          value: { en: '~730', 'pt-BR': '~730' },
          label: { en: 'commits', 'pt-BR': 'commits' },
          note: { en: 'mine, of ~1.5k total', 'pt-BR': 'meus, de ~1,5 mil no total' },
        },
      ],
      metricsNote: {
        en: 'The line count is a plain line count over the committed policy files; the commit share comes from the repository.',
        'pt-BR':
          'A contagem de linhas é uma contagem simples sobre os arquivos de política versionados; a proporção de commits vem do repositório.',
      },
      states: {
        caption: { en: 'The sign-in journey', 'pt-BR': 'A jornada de login' },
        summary: {
          en: 'Every step below corresponds to a technical profile that exists in the policy — this is the orchestration as written, not a simplification of it.',
          'pt-BR':
            'Cada etapa abaixo corresponde a um technical profile que existe na política — é a orquestração como está escrita, não uma simplificação dela.',
        },
        steps: [
          {
            label: 'Sign-in',
            detail: {
              en: 'Local credentials, or a federated provider — Google, Facebook or Apple — exchanged into a common subject claim.',
              'pt-BR':
                'Credenciais locais, ou um provedor federado — Google, Facebook ou Apple — trocado por uma claim de subject comum.',
            },
          },
          {
            label: 'Legacy check',
            detail: {
              en: 'Is this a legacy-store user who has not yet been migrated?',
              'pt-BR': 'É um usuário da base legada que ainda não foi migrado?',
            },
          },
          {
            label: 'Migration',
            detail: {
              en: 'If so, the account is written into the directory with an alternative security identifier linking it back to the legacy credential — in the same journey as the sign-in, not a separate step.',
              'pt-BR':
                'Se sim, a conta é escrita no diretório com um identificador de segurança alternativo que a liga de volta à credencial legada — na mesma jornada do login, não numa etapa separada.',
            },
          },
          {
            label: 'Entitlement',
            detail: {
              en: 'Is the account enabled, and does it belong to a gated journey — subscriber, academy — that requires an active entitlement?',
              'pt-BR':
                'A conta está habilitada, e ela pertence a uma jornada com restrição — assinante, academy — que exige um direito de acesso ativo?',
            },
          },
          {
            label: 'Token',
            detail: {
              en: 'A token is issued, stamped with the time the user’s security record was last valid from.',
              'pt-BR':
                'Um token é emitido, carimbado com o momento a partir do qual o registro de segurança do usuário é válido.',
            },
          },
        ],
      },
      architecture: {
        summary: {
          en: 'Two independent policy sets sit above one directory, and everything downstream trusts the tokens they issue.',
          'pt-BR':
            'Dois conjuntos de políticas independentes ficam acima de um diretório único, e tudo a jusante confia nos tokens que eles emitem.',
        },
        steps: [
          {
            label: 'Practitioner policies',
            detail: {
              en: 'Sign-up, sign-in, subscriber and academy journeys for the nutritionist audience.',
              'pt-BR': 'Jornadas de cadastro, login, assinante e academy para o público de nutricionistas.',
            },
          },
          {
            label: 'Patient policies',
            detail: {
              en: 'Sign-up and sign-in for the patient audience, invited rather than self-registering.',
              'pt-BR': 'Cadastro e login para o público de pacientes, convidados em vez de autocadastrados.',
            },
          },
          {
            label: 'Directory',
            detail: {
              en: 'One user store beneath both policy sets, holding local and federated accounts alike.',
              'pt-BR': 'Uma única base de usuários abaixo dos dois conjuntos de políticas, com contas locais e federadas.',
            },
          },
          {
            label: 'Auth service',
            detail: {
              en: 'Validates the tokens this system issues. Reads and writes against the directory itself go through a shared gateway package that several services in the platform take a dependency on.',
              'pt-BR':
                'Valida os tokens que este sistema emite. Leituras e escritas no próprio diretório passam por um pacote de gateway compartilhado do qual vários serviços da plataforma dependem.',
            },
          },
          {
            label: 'Custom UI pages',
            detail: {
              en: 'Static markup, one set per audience, served by the identity platform and filled in at runtime.',
              'pt-BR': 'Marcação estática, um conjunto por público, servida pela plataforma de identidade e preenchida em tempo de execução.',
            },
          },
        ],
      },
      decisions: [
        {
          heading: {
            en: 'Custom policies instead of a hosted login',
            'pt-BR': 'Políticas customizadas em vez de um login hospedado',
          },
          body: {
            en: 'A hosted login gives one journey. This product needed a subscriber signing up and paying, a patient arriving by invitation, an academy student, and a receptionist — over one directory, without four user stores to keep in sync. Writing the policy directly was the only way to get gated journeys and a first-sign-in migration without forking the user base.',
            'pt-BR':
              'Um login hospedado dá uma única jornada. Este produto precisava de uma assinante se cadastrando e pagando, um paciente chegando por convite, uma aluna de academy e uma recepcionista — sobre um único diretório, sem quatro bases de usuário para manter sincronizadas. Escrever a política diretamente foi a única forma de ter jornadas com restrição e migração no primeiro login sem bifurcar a base de usuários.',
          },
        },
        {
          heading: {
            en: 'Migration as a side effect of signing in',
            'pt-BR': 'Migração como efeito colateral do login',
          },
          body: {
            en: 'Nobody was asked to reset a password or re-register. The user experiences a login; the system experiences a migration, writing the account into the directory and linking it back to the legacy credential in the same journey.',
            'pt-BR':
              'Ninguém foi solicitado a redefinir senha ou se recadastrar. O usuário vive um login; o sistema vive uma migração, escrevendo a conta no diretório e ligando-a de volta à credencial legada na mesma jornada.',
          },
        },
        {
          heading: {
            en: 'Revocation that reaches open sessions',
            'pt-BR': 'Revogação que alcança sessões abertas',
          },
          body: {
            en: 'A token that is merely unrenewable is not revoked. Comparing the token’s issue time against a stamp on the user record is what makes "sign this account out everywhere" actually mean it, rather than "stop this account from getting a new token next time."',
            'pt-BR':
              'Um token apenas não renovável não está revogado. Comparar o momento de emissão do token com um carimbo no registro do usuário é o que faz "encerrar a conta em todo lugar" significar isso de fato, e não "impedir que a conta consiga um novo token da próxima vez".',
          },
        },
        {
          heading: {
            en: 'One directory, several journeys',
            'pt-BR': 'Um diretório, várias jornadas',
          },
          body: {
            en: 'Separate policies per audience over one shared user store, rather than one policy branching on audience or several stores that would have to be reconciled. The audiences share an identity, not a form.',
            'pt-BR':
              'Políticas separadas por público sobre uma única base de usuários compartilhada, em vez de uma política com ramificação por público ou várias bases para reconciliar. Os públicos compartilham uma identidade, não um formulário.',
          },
        },
      ],
      highlights: [
        {
          en: 'Federated sign-in with three providers, each exchanged into a common subject claim.',
          'pt-BR': 'Login federado com três provedores, cada um trocado por uma claim de subject comum.',
        },
        {
          en: 'Silent migration off the legacy store during the user’s own sign-in journey.',
          'pt-BR': 'Migração silenciosa da base legada durante a própria jornada de login do usuário.',
        },
        {
          en: 'Per-audience branded pages, one set for the practitioner and one for the patient.',
          'pt-BR': 'Páginas com marca por público, um conjunto para a profissional e um para o paciente.',
        },
        {
          en: 'Entitlement gates for subscriber and academy journeys, enforced inside the sign-in flow rather than after it.',
          'pt-BR':
            'Bloqueios de direito de acesso para jornadas de assinante e academy, aplicados dentro do fluxo de login em vez de depois dele.',
        },
      ],
    },
  },
  {
    slug: 'dietbox-payment',
    name: 'Dietbox Payment',
    tagline: {
      en: 'Subscriptions and recurring billing, behind a checkout of its own.',
      'pt-BR': 'Assinaturas e cobrança recorrente, atrás de um checkout próprio.',
    },
    description: {
      en: 'The service that carries the revenue: subscription commands on one side, a webhook endpoint per gateway on the other, and two payment gateways in packages of their own — with a Vue checkout in front of it.',
      'pt-BR':
        'O serviço que carrega a receita: comandos de assinatura de um lado, um endpoint de webhook por gateway do outro, e dois gateways de pagamento em pacotes próprios — com um checkout em Vue na frente.',
    },
    tech: ['.NET 6', 'C#', 'CQRS', 'Vue 3', 'Vite', 'PrimeVue', 'Pinia', 'Cypress', 'Azure DevOps'],
    role: {
      en: 'Head of Technology',
      'pt-BR': 'Head de Tecnologia',
    },
    period: { en: '2023–2024', 'pt-BR': '2023–2024' },
    visibility: 'private',
    screenshot: '/screenshots/dietbox-payment.webp',
    links: [{ label: 'Website', href: 'https://dietbox.me' }],
    venture: 'dietbox',
    detail: {
      overview: {
        en: 'The service responsible for the money: subscription commands on one side, a webhook handler for every event a payment gateway raises on the other, and two gateway integrations in between — Iugu and TSPay, each in a crosscutting package of its own. It is kept separate because money has a different failure mode from everything else in the product — its own release train, in a repository it shares with the platform’s other services.',
        'pt-BR':
          'O serviço responsável pelo dinheiro: comandos de assinatura de um lado, um handler de webhook para cada evento que um gateway de pagamento emite do outro, e duas integrações de gateway no meio — Iugu e TSPay, cada uma no próprio pacote transversal. Ele é mantido separado porque dinheiro tem um modo de falha diferente do resto do produto — trem de release próprio, num repositório que compartilha com os outros serviços da plataforma.',
      },
      contribution: {
        summary: {
          en: 'As principal architect across the estate, I set the patterns this service is built on: the path-filtered release pipeline that lets it ship on its own train, and the crosscutting-package convention every third-party integration is wrapped in before a service takes a dependency on it. The commands, the webhook handlers and the checkout itself were the team’s to write.',
          'pt-BR':
            'Como arquiteto principal do conjunto, defini os padrões sobre os quais este serviço é construído: o pipeline de release com filtro de caminho que permite que ele suba no próprio trem, e a convenção de pacote transversal em que toda integração de terceiro é embrulhada antes de um serviço depender dela. Os comandos, os handlers de webhook e o próprio checkout foram escritos pelo time.',
        },
        areas: [
          {
            en: 'The release pipeline’s path filter, so a payment hotfix ships on its own branch without redeploying the other four services.',
            'pt-BR':
              'O filtro de caminho do pipeline de release, para que um hotfix de pagamento suba pelo próprio branch sem redeployar os outros quatro serviços.',
          },
          {
            en: 'The crosscutting package each gateway integration lives in, and the one shared project that pulls them in for whichever service needs them.',
            'pt-BR':
              'O pacote transversal em que cada integração de gateway vive, e o único projeto compartilhado que os traz para qualquer serviço que precise deles.',
          },
          {
            en: 'The Azure estate this service deploys onto, configured the same way as its neighbours.',
            'pt-BR': 'O ambiente Azure onde este serviço é publicado, configurado da mesma forma que seus vizinhos.',
          },
        ],
        boundary: {
          en: 'The subscription commands, the webhook handlers and the checkout client are a team’s work: the author holds roughly a tenth of the checkout client’s commits, across February 2023 to July 2024, and about a fifth of the service’s, whose repository does not begin until October 2023 — the bulk of both belongs to other engineers.',
          'pt-BR':
            'Os comandos de assinatura, os handlers de webhook e o cliente de checkout foram trabalho de um time: o autor tem aproximadamente um décimo dos commits do cliente de checkout, entre fevereiro de 2023 e julho de 2024, e cerca de um quinto dos do serviço, cujo repositório só começa em outubro de 2023 — a maior parte dos dois pertence a outros engenheiros.',
        },
      },
      problem: {
        en: 'A subscription doesn’t live only in the product’s own database — it also lives in whichever gateway is processing it, and that gateway’s opinion of the subscription’s state arrives asynchronously, by webhook, on its own schedule. Two gateways were live at once while subscribers were being moved between them, each with its own event names, its own payload shape and its own idea of what a subscription is. And every one of those webhook deliveries has to be reconciled with what the product already believes happened, not simply trusted.',
        'pt-BR':
          'Uma assinatura não mora só no banco de dados do próprio produto — ela também mora em qualquer gateway que esteja processando, e a opinião desse gateway sobre o estado da assinatura chega de forma assíncrona, por webhook, no tempo dele. Dois gateways ficaram ativos ao mesmo tempo enquanto os assinantes eram migrados de um para o outro, cada um com seus próprios nomes de evento, seu próprio formato de payload e sua própria ideia do que é uma assinatura. E cada entrega de webhook precisa ser reconciliada com o que o produto já acredita ter acontecido, não simplesmente aceita como verdade.',
      },
      states: {
        caption: { en: 'The subscription lifecycle', 'pt-BR': 'O ciclo de vida da assinatura' },
        summary: {
          en: 'Every step below is a directory in the webhook handler tree, named for the gateway event it answers.',
          'pt-BR':
            'Cada etapa abaixo é um diretório na árvore de handlers de webhook, nomeado pelo evento do gateway que ela responde.',
        },
        steps: [
          {
            label: 'Created',
            detail: {
              en: 'The gateway has created the subscription on its side; the service records it before the first invoice exists.',
              'pt-BR': 'O gateway criou a assinatura do lado dele; o serviço a registra antes de existir a primeira fatura.',
            },
          },
          {
            label: 'Activated',
            detail: {
              en: 'The subscription’s first payment cleared; the service marks it active and the customer’s access follows.',
              'pt-BR':
                'O primeiro pagamento da assinatura foi confirmado; o serviço marca como ativa e o acesso do cliente segue essa marcação.',
            },
          },
          {
            label: 'Changed',
            detail: {
              en: 'A plan, a price or a payment method changed on the gateway’s side; the service updates its own record to match.',
              'pt-BR':
                'Um plano, um preço ou uma forma de pagamento mudou do lado do gateway; o serviço atualiza seu próprio registro para acompanhar.',
            },
          },
          {
            label: 'Payment failed',
            detail: {
              en: 'An invoice on the subscription failed to charge on the gateway’s side; the service records the failure.',
              'pt-BR': 'Uma fatura da assinatura falhou ao cobrar do lado do gateway; o serviço registra a falha.',
            },
          },
          {
            label: 'Suspended',
            detail: {
              en: 'The gateway has suspended the subscription; the service mirrors the state, and access follows it.',
              'pt-BR': 'O gateway suspendeu a assinatura; o serviço espelha o estado, e o acesso segue essa marcação.',
            },
          },
          {
            label: 'Expired',
            detail: {
              en: 'The subscription has run its course and the gateway has closed it; the service marks the record accordingly.',
              'pt-BR': 'A assinatura completou seu ciclo e o gateway a encerrou; o serviço marca o registro de acordo.',
            },
          },
          {
            label: 'Invoice paid',
            detail: {
              en: 'A marketplace invoice has been paid; the service records the payment against the subaccount it belongs to.',
              'pt-BR': 'Uma fatura do marketplace foi paga; o serviço registra o pagamento na subconta a que ela pertence.',
            },
          },
          {
            label: 'Invoice released',
            detail: {
              en: 'The marketplace has released the funds from a paid invoice to the subaccount holder.',
              'pt-BR': 'O marketplace liberou os valores de uma fatura paga para quem detém a subconta.',
            },
          },
          {
            label: 'Invoice refunded',
            detail: {
              en: 'A marketplace invoice has been refunded; the service reverses what it recorded against the subaccount.',
              'pt-BR': 'Uma fatura do marketplace foi reembolsada; o serviço reverte o que havia registrado na subconta.',
            },
          },
        ],
      },
      architecture: {
        summary: {
          en: 'A Vue checkout out front, CQRS commands and controllers in the middle, and two gateway integrations each in a package of its own — with each gateway closing the loop asynchronously through a webhook endpoint of its own.',
          'pt-BR':
            'Um checkout em Vue na frente, comandos e controllers CQRS no meio, e duas integrações de gateway, cada uma no próprio pacote — com cada gateway fechando o ciclo de forma assíncrona por um endpoint de webhook próprio.',
        },
        steps: [
          {
            label: 'Checkout client',
            detail: {
              en: 'The Vue checkout — subscription, renewal and thank-you views — calls the service’s commands: subscribe, create an invoice, generate a payment link.',
              'pt-BR':
                'O checkout em Vue — telas de assinatura, renovação e páginas de agradecimento — chama os comandos do serviço: assinar, criar fatura, gerar link de pagamento.',
            },
          },
          {
            label: 'Payment service',
            detail: {
              en: 'Subscription, transaction, voucher, extension and webhook controllers sit in front of the CQRS commands that do the work.',
              'pt-BR': 'Controllers de assinatura, transação, voucher, extensão e webhook ficam na frente dos comandos CQRS que fazem o trabalho.',
            },
          },
          {
            label: 'Gateway packages',
            detail: {
              en: 'Iugu and TSPay each live in a crosscutting package with an interface of their own, reached through the one shared project every service in this repository references.',
              'pt-BR':
                'Iugu e TSPay vivem cada um em um pacote transversal com interface própria, alcançados pelo único projeto compartilhado que todo serviço deste repositório referencia.',
            },
          },
          {
            label: 'Gateway webhooks',
            detail: {
              en: 'Each gateway posts its own opinion of the subscription back to an endpoint of its own, where a factory maps that gateway’s event names onto commands — one handler directory per event.',
              'pt-BR':
                'Cada gateway publica de volta a própria opinião sobre a assinatura num endpoint próprio, onde uma fábrica mapeia os nomes de evento daquele gateway em comandos — um diretório de handler por evento.',
            },
          },
        ],
      },
      decisions: [
        {
          heading: { en: 'One repository, five release trains', 'pt-BR': 'Um repositório, cinco trens de release' },
          body: {
            en: 'The payment service shares its repository with the core, auth, foods and jobs services, and each of the five ships on its own release train: its own pipeline file, its own branch trigger, and a path filter naming the other four services’ directories as reasons not to build. A payment hotfix does not redeploy auth. A monorepo without a shared deploy.',
            'pt-BR':
              'O serviço de pagamento compartilha o repositório com os serviços core, de autenticação, de alimentos e de jobs, e cada um dos cinco sobe no próprio trem de release: arquivo de pipeline próprio, gatilho de branch próprio, e um filtro de caminho que nomeia os diretórios dos outros quatro serviços como motivo para não construir. Um hotfix de pagamento não redeploya a autenticação. Um monorepo sem deploy compartilhado.',
          },
        },
        {
          heading: { en: 'A package per gateway, not one interface for all', 'pt-BR': 'Um pacote por gateway, não uma interface para todos' },
          body: {
            en: 'Iugu and TSPay do not share an interface — they have nothing in common to share. Each sits in its own crosscutting package with its own vocabulary, its own webhook endpoint and its own command factory, and a handler asks for the gateway it actually needs by name. Which gateway a subscription belongs to is a value in the domain, not a detail hidden from it, and that is what made moving subscribers between the two possible one at a time: a TSPay webhook can still reach into Iugu to suspend the old subscription of a nutritionist who has just been moved across.',
            'pt-BR':
              'Iugu e TSPay não compartilham interface — não têm nada em comum para compartilhar. Cada um fica no próprio pacote transversal, com vocabulário próprio, endpoint de webhook próprio e fábrica de comandos própria, e um handler pede pelo nome o gateway de que realmente precisa. A qual gateway uma assinatura pertence é um valor do domínio, não um detalhe escondido dele, e foi isso que permitiu mover os assinantes de um para o outro um a um: um webhook do TSPay ainda consegue chegar ao Iugu para suspender a assinatura antiga de uma nutricionista que acabou de ser migrada.',
          },
        },
        {
          heading: { en: 'The webhook tree is the state machine', 'pt-BR': 'A árvore de webhooks é a máquina de estados' },
          body: {
            en: 'There is one handler per gateway event, named for the event itself — subscription created, invoice paid, invoice refunded — rather than one endpoint switching on a payload field. The directory structure is the lifecycle, readable without opening a single file.',
            'pt-BR':
              'Existe um handler por evento do gateway, nomeado pelo próprio evento — assinatura criada, fatura paga, fatura reembolsada — em vez de um único endpoint que decide com base num campo do payload. A estrutura de diretórios é o ciclo de vida, legível sem abrir um único arquivo.',
          },
        },
        {
          heading: { en: 'A checkout that is not the app', 'pt-BR': 'Um checkout que não é o aplicativo' },
          body: {
            en: 'The purchase funnel ships as its own client — its own Vue app, its own Cypress suite reporting through Allure — separately from the rest of the product, on its own cadence.',
            'pt-BR':
              'O funil de compra sobe como um cliente próprio — seu próprio app em Vue, sua própria suíte de Cypress reportando via Allure — separado do resto do produto, no próprio ritmo.',
          },
        },
      ],
      highlights: [
        {
          en: 'Subscribing and renewing, with a suspend path when a payment lapses.',
          'pt-BR': 'Assinatura e renovação, com um caminho de suspensão quando um pagamento falha.',
        },
        {
          en: 'Vouchers and plan extensions, adjusting a subscription without cancelling and re-creating it.',
          'pt-BR': 'Vouchers e extensões de plano, ajustando uma assinatura sem cancelar e recriar.',
        },
        {
          en: 'Payment links generated on demand, for a charge outside the regular checkout flow.',
          'pt-BR': 'Links de pagamento gerados sob demanda, para uma cobrança fora do fluxo normal de checkout.',
        },
        {
          en: 'Marketplace subaccounts, with their own invoice-paid, released and refunded events.',
          'pt-BR': 'Subcontas de marketplace, com seus próprios eventos de fatura paga, liberada e reembolsada.',
        },
      ],
    },
  },
  {
    slug: 'dietbox-portal',
    name: 'Dietbox Portal',
    tagline: {
      en: 'The back office, and the newest generation of the platform’s architecture.',
      'pt-BR': 'O back office, e a geração mais nova da arquitetura da plataforma.',
    },
    description: {
      en: 'The internal tool the company runs the product from — subscriptions, vouchers, the food catalogue, marketing — built as a layered service with commands, queries and domain events dispatched at save time, and an admin client that can act as the user it is helping.',
      'pt-BR':
        'A ferramenta interna com que a empresa opera o produto — assinaturas, vouchers, catálogo de alimentos, marketing — construída como um serviço em camadas com comandos, queries e eventos de domínio despachados no momento da gravação, e um cliente admin capaz de agir como o usuário que está atendendo.',
    },
    tech: ['.NET 6', 'C#', 'CQRS', 'MediatR', 'EF Core', 'SQL Server', 'ASP.NET Identity', 'JWT', 'Vue 3', 'Vuex', 'Azure DevOps'],
    role: {
      en: 'Head of Technology',
      'pt-BR': 'Head de Tecnologia',
    },
    period: { en: '2023–2024', 'pt-BR': '2023–2024' },
    visibility: 'private',
    links: [{ label: 'Website', href: 'https://dietbox.me' }],
    venture: 'dietbox',
    detail: {
      overview: {
        en: 'A back office is where a SaaS company’s real operating procedure lives — the subscriptions, the vouchers, the food catalogue, marketing — and this was the first place the platform’s newer patterns were carried through end to end: layers numbered on disk, commands and queries behind a pipeline behaviour that logs every one of them, and a domain that raises its own events and has them dispatched the moment its changes are saved.',
        'pt-BR':
          'Um back office é onde vive o procedimento real de operação de uma empresa SaaS — as assinaturas, os vouchers, o catálogo de alimentos, o marketing — e este foi o primeiro lugar em que os padrões mais novos da plataforma foram aplicados de ponta a ponta: camadas numeradas em disco, comandos e queries atrás de um pipeline behaviour que registra cada um deles, e um domínio que emite os próprios eventos e os tem despachados no instante em que suas mudanças são gravadas.',
      },
      contribution: {
        summary: {
          en: 'The layered design this service is built on — the numbered directories, the command/query pipeline, and where the domain-event dispatch sits inside it — the identity building block, and the shared building blocks the platform’s newer services now start from, are the author’s. The eighteen business-domain controllers and the admin client’s views were the team’s to build out.',
          'pt-BR':
            'O design em camadas sobre o qual este serviço é construído — os diretórios numerados, o pipeline de comandos e queries, e o lugar onde o despacho de eventos de domínio se encaixa nele — o bloco de identidade e os blocos de construção compartilhados dos quais os serviços mais novos da plataforma partem, são do autor. Os dezoito controllers de domínio de negócio e as telas do cliente admin foram construídos pelo time.',
        },
        areas: [
          {
            en: 'The numbered directory layout — building blocks, services, application, domain, infrastructure — and the dependency direction it makes legible before a file is opened.',
            'pt-BR':
              'A estrutura de diretórios numerados — building blocks, services, application, domain, infrastructure — e a direção de dependência que ela deixa legível antes de abrir um arquivo.',
          },
          {
            en: 'The identity building block: its own user store, a JWT builder and validator, access and refresh tokens, and claim-based authorization.',
            'pt-BR':
              'O bloco de identidade: base de usuários própria, um builder e validador de JWT, tokens de acesso e refresh, e autorização baseada em claims.',
          },
          {
            en: 'The message and event base types among the shared building blocks, and the dispatch that publishes what an aggregate raised once the unit of work has saved it.',
            'pt-BR':
              'Os tipos base de mensagem e evento entre os blocos de construção compartilhados, e o despacho que publica o que um agregado emitiu assim que a unidade de trabalho o grava.',
          },
          {
            en: 'The shared building blocks — domain, infrastructure and identity — the platform’s newer services start from instead of each inventing its own.',
            'pt-BR':
              'Os blocos de construção compartilhados — domínio, infraestrutura e identidade — dos quais os serviços mais novos da plataforma partem, em vez de cada um inventar o próprio.',
          },
          {
            en: 'The client’s persisted token pair and its refresh flow against the accounts endpoint.',
            'pt-BR': 'O par de tokens persistido no cliente e o fluxo de refresh contra o endpoint de contas.',
          },
        ],
        boundary: {
          en: 'Across the service and the admin client together, roughly a third of the commits are the author’s — the rest, including most of the eighteen business-domain controllers and the client’s views, is the team’s.',
          'pt-BR':
            'Entre o serviço e o cliente admin juntos, cerca de um terço dos commits são do autor — o restante, incluindo a maior parte dos dezoito controllers de domínio de negócio e das telas do cliente, é do time.',
        },
      },
      problem: {
        en: 'Support and operations were reaching straight into the product database, or into the monolith’s own admin surface, to do what the business runs on day to day — adjusting a subscription, issuing a voucher, updating the food catalogue. A back office with its own domain, its own staff identity and its own command surface was the alternative: the same operations, but as named commands logged on the way through, behind sign-in that isn’t the customer’s.',
        'pt-BR':
          'Suporte e operações estavam entrando direto no banco de dados do produto, ou na própria superfície de admin do monolito, para fazer o que o negócio roda no dia a dia — ajustar uma assinatura, emitir um voucher, atualizar o catálogo de alimentos. Um back office com domínio próprio, identidade de equipe própria e superfície de comandos própria foi a alternativa: as mesmas operações, mas como comandos nomeados e registrados em log na passagem, atrás de um login que não é o do cliente.',
      },
      metrics: [
        {
          value: { en: '~276', 'pt-BR': '~276' },
          label: { en: 'commits across both repositories', 'pt-BR': 'commits nos dois repositórios' },
          note: { en: 'mine, of ~780 total', 'pt-BR': 'meus, de ~780 no total' },
        },
        {
          value: { en: '3', 'pt-BR': '3' },
          label: { en: 'test projects', 'pt-BR': 'projetos de teste' },
          note: { en: 'domain, application, and integration', 'pt-BR': 'domínio, aplicação e integração' },
        },
      ],
      metricsNote: {
        en: 'Both figures come from the two repositories’ own commit history.',
        'pt-BR': 'Os dois números vêm do próprio histórico de commits dos dois repositórios.',
      },
      architecture: {
        summary: {
          en: 'An admin client in front, a service exposing the eighteen controllers, an application layer of commands and queries behind a logging pipeline behaviour, a domain layer underneath, and infrastructure at the bottom — where saving a change is also what releases the events that change raised.',
          'pt-BR':
            'Um cliente admin na frente, um serviço expondo os dezoito controllers, uma camada de aplicação com comandos e queries atrás de um pipeline behaviour de log, uma camada de domínio embaixo dela, e infraestrutura na base — onde gravar uma mudança é também o que libera os eventos que aquela mudança emitiu.',
        },
        steps: [
          {
            label: 'Admin client',
            detail: {
              en: 'The Vue 3 client — dashboard, charts, and the eighteen controllers’ views — including the impersonate controls in the navbar and the patient view.',
              'pt-BR':
                'O cliente em Vue 3 — dashboard, gráficos e as telas dos dezoito controllers — incluindo os controles de impersonate na navbar e na tela do paciente.',
            },
          },
          {
            label: 'Service',
            detail: {
              en: 'Controllers behind the claim-requirement authorization filter, validating the access token before a request reaches a command or query.',
              'pt-BR':
                'Controllers atrás do filtro de autorização por claim, validando o token de acesso antes de a requisição chegar a um comando ou query.',
            },
          },
          {
            label: 'Application',
            detail: {
              en: 'Commands and queries behind a pipeline behaviour that logs each one by name, and the handlers that turn a domain event into the integration event other services consume.',
              'pt-BR':
                'Comandos e queries atrás de um pipeline behaviour que registra cada um pelo nome, e os handlers que transformam um evento de domínio no evento de integração que outros serviços consomem.',
            },
          },
          {
            label: 'Domain',
            detail: {
              en: 'The business rules for the eighteen areas administered — nutritionists, patients, subscriptions, vouchers, the food catalogue, and the rest — raising the events the layers above and below both care about.',
              'pt-BR':
                'As regras de negócio das dezoito áreas administradas — nutricionistas, pacientes, assinaturas, vouchers, catálogo de alimentos, e o resto — emitindo os eventos que as camadas acima e abaixo se importam.',
            },
          },
          {
            label: 'Infrastructure',
            detail: {
              en: 'An EF Core context over SQL Server: it writes the aggregate’s current state, then hands the events that aggregate collected while changing to MediatR, once the write has already landed.',
              'pt-BR':
                'Um contexto EF Core sobre SQL Server: grava o estado atual do agregado e então entrega ao MediatR os eventos que aquele agregado acumulou ao mudar, depois que a escrita já foi feita.',
            },
          },
        ],
      },
      decisions: [
        {
          heading: { en: 'Layers numbered on disk', 'pt-BR': 'Camadas numeradas em disco' },
          body: {
            en: 'The service’s directories are numbered by layer — building blocks, services, application, domain, infrastructure — so the dependency direction is legible from a directory listing alone, before a single file is open. A layer importing from the wrong direction is a violation visible in the file tree, not just in a code review.',
            'pt-BR':
              'Os diretórios do serviço são numerados por camada — building blocks, services, application, domain, infrastructure — então a direção de dependência é legível só de olhar a listagem de diretórios, antes de abrir um único arquivo. Uma camada importando na direção errada é uma violação visível na árvore de arquivos, não só numa revisão de código.',
          },
        },
        {
          heading: { en: 'Staff identity is not customer identity', 'pt-BR': 'Identidade de equipe não é identidade de cliente' },
          body: {
            en: 'The back office authenticates against its own store — an identity building block with its own user database, a JWT builder and validator, access and refresh tokens, and claim-based authorization — not the customer directory. Giving support staff accounts in the customer identity system would have meant handing customer-grade identities administrative scopes; keeping the two separate keeps a back-office session a different thing from a customer session, by construction.',
            'pt-BR':
              'O back office se autentica contra a própria base — um bloco de identidade com base de usuários própria, um builder e validador de JWT, tokens de acesso e refresh, e autorização baseada em claims — não o diretório do cliente. Dar contas de equipe de suporte no sistema de identidade do cliente teria significado conceder escopos administrativos a identidades de grau cliente; manter os dois separados faz de uma sessão do back office algo diferente de uma sessão de cliente, por construção.',
          },
        },
        {
          heading: { en: 'Events dispatched at save time, not stored', 'pt-BR': 'Eventos despachados na gravação, não armazenados' },
          body: {
            en: 'An aggregate collects the events it raises while a command changes it; the unit of work writes the row, then publishes those events through MediatR after that write has committed. Nothing is replayed and no state is rebuilt from a log — the table still holds the current row. What this buys is that a consequence of an operation is a subscriber to something the domain said, rather than one more paragraph inside the command that said it.',
            'pt-BR':
              'Um agregado acumula os eventos que emite enquanto um comando o altera; a unidade de trabalho grava a linha e então publica esses eventos via MediatR depois que essa escrita foi confirmada. Nada é reproduzido e nenhum estado é reconstruído a partir de um log — a tabela continua guardando a linha atual. O que isso compra é que a consequência de uma operação vira assinante de algo que o domínio disse, em vez de mais um parágrafo dentro do comando que o disse.',
          },
        },
        {
          heading: { en: 'Shared building blocks before shared services', 'pt-BR': 'Blocos de construção compartilhados antes de serviços compartilhados' },
          body: {
            en: 'The newer services, this one included, start from a common domain, infrastructure and identity layer instead of each inventing its own — the same message and event base types, the same identity building block, the same base entities. That shared foundation is what let a small team add a service without each one arriving in a different style.',
            'pt-BR':
              'Os serviços mais novos, este incluído, partem de uma camada comum de domínio, infraestrutura e identidade em vez de cada um inventar a própria — os mesmos tipos base de mensagem e evento, o mesmo bloco de identidade, as mesmas entidades base. Essa fundação compartilhada é o que permitiu que um time pequeno acrescentasse um serviço sem cada um chegar num estilo diferente.',
          },
        },
      ],
      highlights: [
        {
          en: 'Impersonation as a first-class feature: support can act as the nutritionist or patient they’re helping, from the client’s navbar or the patient view, and step back out.',
          'pt-BR':
            'Impersonation como funcionalidade de primeira classe: o suporte pode agir como a nutricionista ou o paciente que está atendendo, pela navbar do cliente ou pela tela do paciente, e voltar a ser quem é.',
        },
        {
          en: 'Eighteen controllers spanning the business administered: nutritionists and patients, subscriptions and their configuration, transactions, vouchers, the food catalogue, tags, marketing, materials, events, universities, metrics, accounts.',
          'pt-BR':
            'Dezoito controllers cobrindo o negócio administrado: nutricionistas e pacientes, assinaturas e suas configurações, transações, vouchers, catálogo de alimentos, tags, marketing, materiais, eventos, universidades, métricas, contas.',
        },
        {
          en: 'A dashboard with charts mirroring those same domains, so the numbers support looks at come from the same commands that changed them.',
          'pt-BR':
            'Um dashboard com gráficos espelhando esses mesmos domínios, então os números que o suporte olha vêm dos mesmos comandos que os alteraram.',
        },
        {
          en: 'Domain events kept separate from integration events, so a change another service needs to hear about is an explicit publication, not a side effect of one that only matters inside this one.',
          'pt-BR':
            'Eventos de domínio mantidos separados dos eventos de integração, então uma mudança que outro serviço precisa saber é uma publicação explícita, não efeito colateral de uma que só importa aqui dentro.',
        },
      ],
    },
  },
  {
    slug: 'dietbox-notifications',
    name: 'Dietbox Notifications',
    tagline: {
      en: 'A messaging bill turned into a product constraint.',
      'pt-BR': 'Uma conta de mensageria transformada em restrição de produto.',
    },
    description: {
      en: 'An isolated service that meters outbound messaging: a pre-paid send quota per practitioner, a log of every quota change, and a record of every notification sent. Built beside the product rather than inside it, so a cost problem did not become a platform problem.',
      'pt-BR':
        'Um serviço isolado que mede a mensageria de saída: uma cota pré-paga de envios por profissional, um log de cada mudança de cota e um registro de cada notificação enviada. Construído ao lado do produto, e não dentro dele, para que um problema de custo não virasse um problema de plataforma.',
    },
    tech: ['.NET 6', 'C#', 'CQRS', 'SQL Server', 'WhatsApp Business API', 'Azure DevOps'],
    role: {
      en: 'Head of Technology',
      'pt-BR': 'Head de Tecnologia',
    },
    period: { en: '2023–2024', 'pt-BR': '2023–2024' },
    visibility: 'private',
    links: [{ label: 'Website', href: 'https://dietbox.me' }],
    venture: 'dietbox',
    detail: {
      overview: {
        en: 'This service exists because of a number on an invoice: the official WhatsApp messaging bill in May 2023. The answer was not a rate limit bolted onto the existing product, but a small domain of its own — a quota, a log of who changed it, and a record of every send.',
        'pt-BR':
          'Este serviço existe por causa de um número numa fatura: a conta de mensageria oficial do WhatsApp em maio de 2023. A resposta não foi um limite de taxa colado no produto existente, mas um pequeno domínio próprio — uma cota, um log de quem a alterou, e um registro de cada envio.',
      },
      contribution: {
        summary: {
          en: 'The design document, the domain and the service are the author’s: nineteen of the twenty commits, from the first estimate to the running service.',
          'pt-BR':
            'O documento de design, o domínio e o serviço são do autor: dezenove dos vinte commits, da primeira estimativa ao serviço em produção.',
        },
        areas: [
          {
            en: 'The capacity-planning document itself — the volume, query-rate and storage estimates the service was built to meet.',
            'pt-BR':
              'O próprio documento de planejamento de capacidade — as estimativas de volume, taxa de consultas e armazenamento que o serviço foi construído para atender.',
          },
          {
            en: 'The domain model: a notification limit per practitioner, a log of every change to it, and a record of every notification sent.',
            'pt-BR':
              'O modelo de domínio: um limite de notificações por profissional, um log de cada mudança nele, e um registro de cada notificação enviada.',
          },
          {
            en: 'The two controllers and their commands and queries — adding a limit, sending a notification, and querying both limits and sent records.',
            'pt-BR':
              'Os dois controllers e seus comandos e queries — adicionar um limite, enviar uma notificação, e consultar tanto limites quanto registros enviados.',
          },
          {
            en: 'The crosscutting packages behind the layers: the WhatsApp provider integration and dependency injection.',
            'pt-BR':
              'Os pacotes transversais atrás das camadas: a integração com o provedor do WhatsApp e a injeção de dependência.',
          },
        ],
      },
      problem: {
        en: 'The official WhatsApp Business API bill arrived in May 2023, and the product had no way to meter what it was spending on it. The obvious place to add a limit was the main product itself — but the main product was already too complex to extend safely, and a cost control that risks the product it is protecting is not a cost control. The alternative was a service with zero impact on the product, able to serve other notification channels later.',
        'pt-BR':
          'A conta oficial da API do WhatsApp Business chegou em maio de 2023, e o produto não tinha como medir o que estava gastando com ela. O lugar óbvio para adicionar um limite era o próprio produto principal — mas o produto principal já era complexo demais para ser estendido com segurança, e um controle de custo que arrisca o produto que está protegendo não é um controle de custo. A alternativa foi um serviço com zero impacto no produto, capaz de atender outros canais de notificação depois.',
      },
      metrics: [
        {
          value: { en: '~51k', 'pt-BR': '~51 mil' },
          label: { en: 'messages a month', 'pt-BR': 'mensagens por mês' },
          note: { en: 'the volume being paid for', 'pt-BR': 'o volume que estava sendo pago' },
        },
        {
          value: { en: '~30k', 'pt-BR': '~30 mil' },
          label: { en: 'queries a day', 'pt-BR': 'consultas por dia' },
          note: { en: '0.3 QPS average', 'pt-BR': '0,3 QPS em média' },
        },
        {
          value: { en: '5', 'pt-BR': '5' },
          label: { en: 'peak QPS planned for', 'pt-BR': 'QPS de pico previsto' },
        },
        {
          value: { en: '~1.4 GB', 'pt-BR': '~1,4 GB' },
          label: { en: 'storage over ten years', 'pt-BR': 'armazenamento em dez anos' },
          note: { en: '214 bytes per notification', 'pt-BR': '214 bytes por notificação' },
        },
      ],
      metricsNote: {
        en: 'These four figures come from the service’s own design document, written before a line of it existed — a capacity plan, not a production measurement taken afterward.',
        'pt-BR':
          'Esses quatro números vêm do próprio documento de design do serviço, escrito antes de existir uma linha dele — um plano de capacidade, não uma medição de produção feita depois.',
      },
      architecture: {
        summary: {
          en: 'A calling service reaches the notify endpoint, which checks the practitioner’s quota before anything is sent, hands the message to the provider, and records the result either way.',
          'pt-BR':
            'Um serviço chamador chega ao endpoint de notificação, que verifica a cota do profissional antes de qualquer envio, entrega a mensagem ao provedor, e registra o resultado de qualquer forma.',
        },
        steps: [
          {
            label: 'Calling service',
            detail: {
              en: 'Another service in the platform requests a notification on a practitioner’s behalf.',
              'pt-BR': 'Outro serviço da plataforma solicita uma notificação em nome de um profissional.',
            },
          },
          {
            label: 'Notify endpoint',
            detail: {
              en: 'The notify controller receives the request and dispatches the send command.',
              'pt-BR': 'O controller de notificação recebe a requisição e dispara o comando de envio.',
            },
          },
          {
            label: 'Quota check',
            detail: {
              en: 'The practitioner’s limit is read before the send proceeds — no quota, no message.',
              'pt-BR': 'O limite do profissional é lido antes de o envio prosseguir — sem cota, sem mensagem.',
            },
          },
          {
            label: 'Provider',
            detail: {
              en: 'The WhatsApp integration sends the message through the official API, behind the crosscutting provider package.',
              'pt-BR': 'A integração com o WhatsApp envia a mensagem pela API oficial, atrás do pacote transversal do provedor.',
            },
          },
          {
            label: 'Sent record',
            detail: {
              en: 'The outcome — sent or refused — is written to the record every notification leaves behind.',
              'pt-BR': 'O resultado — enviado ou recusado — é gravado no registro que toda notificação deixa.',
            },
          },
        ],
      },
      states: {
        caption: {
          en: 'A notification, from request to record',
          'pt-BR': 'Uma notificação, do pedido ao registro',
        },
        steps: [
          {
            label: 'Requested',
            detail: {
              en: 'A calling service asks for a notification to be sent to a practitioner.',
              'pt-BR': 'Um serviço chamador pede o envio de uma notificação a um profissional.',
            },
          },
          {
            label: 'Quota checked',
            detail: {
              en: 'The practitioner’s remaining limit is read against the request.',
              'pt-BR': 'O limite restante do profissional é verificado contra o pedido.',
            },
          },
          {
            label: 'Dispatched or refused',
            detail: {
              en: 'Within quota, the message goes to the WhatsApp provider; over quota, the send is refused before it costs anything.',
              'pt-BR': 'Dentro da cota, a mensagem segue para o provedor do WhatsApp; fora da cota, o envio é recusado antes de custar algo.',
            },
          },
          {
            label: 'Recorded',
            detail: {
              en: 'Either outcome is written to the log of notifications sent, so the answer to "why was this blocked" already exists.',
              'pt-BR': 'Qualquer resultado é gravado no log de notificações enviadas, então a resposta para "por que isso foi bloqueado" já existe.',
            },
          },
        ],
      },
      decisions: [
        {
          heading: { en: 'A separate service specifically to be ignorable', 'pt-BR': 'Um serviço separado especificamente para ser ignorável' },
          body: {
            en: 'The stated goal was zero impact on the main product. Isolating the notification service meant it could be switched off, redeployed or rewritten without taking the product down with it — the opposite of bolting a limiter onto code that was already too complex to touch safely.',
            'pt-BR':
              'O objetivo declarado era zero impacto no produto principal. Isolar o serviço de notificações significou que ele podia ser desligado, reimplantado ou reescrito sem derrubar o produto junto — o oposto de colar um limitador num código que já era complexo demais para tocar com segurança.',
          },
        },
        {
          heading: { en: 'A quota is a domain model, not a rate limit', 'pt-BR': 'Uma cota é um modelo de domínio, não um rate limit' },
          body: {
            en: 'A bare counter would have answered "can this send happen." Instead, the limit, a log of every change to it, and a record of every send together answer a harder question: why was this one blocked, and who changed the limit that blocked it.',
            'pt-BR':
              'Um contador simples responderia apenas "esse envio pode acontecer". Em vez disso, o limite, um log de cada mudança nele, e um registro de cada envio respondem juntos uma pergunta mais difícil: por que este foi bloqueado, e quem alterou o limite que o bloqueou.',
          },
        },
        {
          heading: { en: 'Capacity planned before the first line', 'pt-BR': 'Capacidade planejada antes da primeira linha' },
          body: {
            en: 'The monthly volume, the query rate and the ten-year storage footprint were estimated in the design document before the service was built, which is why the storage decision — how much space this would ever need — was a boring, already-answered question rather than a surprise.',
            'pt-BR':
              'O volume mensal, a taxa de consultas e o espaço ocupado em dez anos foram estimados no documento de design antes de o serviço ser construído, e é por isso que a decisão de armazenamento — quanto espaço isso jamais precisaria — foi uma pergunta entediante e já respondida, não uma surpresa.',
          },
        },
        {
          heading: { en: 'One provider first, the interface for more', 'pt-BR': 'Um provedor primeiro, a interface para mais' },
          body: {
            en: 'WhatsApp was the bill that started this, so it is the only provider that sends today — but email, SMS and push were the shape the domain and the API were designed to accept later, without the quota model or the sent record needing to change.',
            'pt-BR':
              'O WhatsApp foi a conta que originou tudo isso, então é o único provedor que envia hoje — mas email, SMS e push foram o formato que o domínio e a API foram desenhados para aceitar depois, sem que o modelo de cota ou o registro de envio precisassem mudar.',
          },
        },
      ],
      highlights: [
        {
          en: 'A notify controller and commands to send a notification and to add a practitioner’s limit.',
          'pt-BR': 'Um controller de notificação e comandos para enviar uma notificação e para adicionar o limite de um profissional.',
        },
        {
          en: 'A nutritionist controller and queries over that practitioner’s current limit and history of sent notifications.',
          'pt-BR': 'Um controller de nutricionista e queries sobre o limite atual e o histórico de notificações enviadas desse profissional.',
        },
        {
          en: 'Three domain models: the notification limit itself, a log of every change to it, and a record of every notification sent.',
          'pt-BR': 'Três modelos de domínio: o próprio limite de notificações, um log de cada mudança nele, e um registro de cada notificação enviada.',
        },
        {
          en: 'A layered service with crosscutting packages for the WhatsApp provider and dependency injection, kept separate from the domain they support.',
          'pt-BR': 'Um serviço em camadas com pacotes transversais para o provedor do WhatsApp e injeção de dependência, mantidos separados do domínio que sustentam.',
        },
      ],
    },
  },
  {
    slug: 'dietbox-socket',
    name: 'Dietbox Socket',
    tagline: {
      en: 'Live updates as a service of its own, so they ship on their own clock.',
      'pt-BR': 'Atualizações ao vivo como serviço próprio, para subirem no próprio relógio.',
    },
    description: {
      en: 'A small realtime server that holds the open connections: a room per user, a shared-secret handshake, and one endpoint the platform posts to when something needs pushing. Separate from the product because long-lived connections and request traffic do not scale on the same axis — and because the monolith deployed once a night.',
      'pt-BR':
        'Um servidor de tempo real pequeno que mantém as conexões abertas: uma sala por usuário, um handshake com segredo compartilhado e um endpoint para onde a plataforma posta quando algo precisa ser empurrado. Separado do produto porque conexões de longa duração e tráfego de requisição não escalam no mesmo eixo — e porque o monolito subia uma vez por madrugada.',
    },
    tech: ['Node', 'Express', 'Socket.IO', 'Application Insights', 'Azure App Service', 'Azure DevOps'],
    role: { en: 'Senior Software Engineer', 'pt-BR': 'Engenheiro de Software Sênior' },
    period: { en: '2022', 'pt-BR': '2022' },
    visibility: 'private',
    links: [{ label: 'Website', href: 'https://dietbox.me' }],
    venture: 'dietbox',
    detail: {
      overview: {
        en: 'Thirty-four commits over two months in 2022, for a service that has outlived both: a socket server that holds every open connection, joins each client to a room named for its user id, and exposes one endpoint the rest of the platform posts to when something needs pushing out. It sits outside the product because a long-lived connection and a request are not the same kind of traffic.',
        'pt-BR':
          'Trinta e quatro commits em dois meses de 2022, para um serviço que sobreviveu a ambos: um servidor de tempo real que mantém cada conexão aberta, junta cada cliente a uma sala com o nome do seu id de usuário, e expõe um único endpoint para onde o resto da plataforma posta quando algo precisa ser empurrado. Ele fica fora do produto porque uma conexão de longa duração e uma requisição não são o mesmo tipo de tráfego.',
      },
      contribution: {
        summary: {
          en: 'Effectively a solo build: thirty-three of the thirty-four commits, from the handshake to the load-test harness that proved it held up.',
          'pt-BR':
            'Praticamente uma construção solo: trinta e três dos trinta e quatro commits, do handshake ao harness de carga que comprovou que ele aguentava.',
        },
        areas: [
          {
            en: 'The socket server itself: the shared-secret handshake, room assignment by user id, and an immediate disconnect for a client that ends up joined to no room.',
            'pt-BR':
              'O próprio servidor de tempo real: o handshake com segredo compartilhado, a atribuição de sala por id de usuário, e a desconexão imediata de um cliente que acaba sem entrar em nenhuma sala.',
          },
          {
            en: 'The notify endpoint the rest of the platform posts to, and the info and health endpoints used to watch the service itself.',
            'pt-BR':
              'O endpoint de notificação para onde o resto da plataforma posta, e os endpoints de info e de saúde usados para observar o próprio serviço.',
          },
          {
            en: 'The handler-loading convention: an event handler is a file, picked up automatically from a directory.',
            'pt-BR':
              'A convenção de carregamento de handlers: um handler de evento é um arquivo, carregado automaticamente a partir de um diretório.',
          },
          {
            en: 'The load-test harness, built to deliberately hold a share of clients on long-polling instead of letting all of them upgrade.',
            'pt-BR':
              'O harness de teste de carga, construído para manter deliberadamente uma parte dos clientes em long-polling em vez de deixar todos fazerem upgrade.',
          },
        ],
      },
      problem: {
        en: 'The monolith deployed once a night, and anything sharing its pipeline shared its cadence — a realtime channel that can only change at three in the morning is a realtime channel nobody changes. Separately, open connections and request traffic do not want the same instance count: one scales with how many people are online, the other with how many requests arrive.',
        'pt-BR':
          'O monolito subia uma vez por madrugada, e qualquer coisa que compartilhasse seu pipeline compartilhava seu ritmo — um canal de tempo real que só pode mudar às três da manhã é um canal de tempo real que ninguém muda. Separadamente, conexões abertas e tráfego de requisição não querem a mesma quantidade de instâncias: uma escala com quantas pessoas estão online, a outra com quantas requisições chegam.',
      },
      architecture: {
        summary: {
          en: 'The platform posts a room, an event name and a payload to the notify endpoint; the server resolves who is in that room right now and pushes the event straight to them.',
          'pt-BR':
            'A plataforma posta uma sala, um nome de evento e um payload para o endpoint de notificação; o servidor resolve quem está naquela sala agora e empurra o evento diretamente para eles.',
        },
        steps: [
          {
            label: 'Platform',
            detail: {
              en: 'Another service in the platform posts a room, an event name and a payload to the notify endpoint.',
              'pt-BR': 'Outro serviço da plataforma posta uma sala, um nome de evento e um payload para o endpoint de notificação.',
            },
          },
          {
            label: 'Room resolved',
            detail: {
              en: 'The server looks up which connections are actually joined to that room right now.',
              'pt-BR': 'O servidor verifica quais conexões estão de fato naquela sala agora.',
            },
          },
          {
            label: 'Fan-out',
            detail: {
              en: 'The event is pushed to every client currently joined to the room.',
              'pt-BR': 'O evento é empurrado para cada cliente atualmente na sala.',
            },
          },
          {
            label: 'Browser',
            detail: {
              en: 'The client receives the event and updates without a refresh.',
              'pt-BR': 'O cliente recebe o evento e atualiza sem um refresh.',
            },
          },
        ],
      },
      decisions: [
        {
          heading: { en: 'Realtime as its own deployable', 'pt-BR': 'Tempo real como implantação própria' },
          body: {
            en: 'Two reasons, both real: open connections and request traffic scale on different axes, and the product deployed once a night — a channel that can only change at three in the morning is one nobody changes. Splitting it into its own service let each axis scale on its own terms and let this one ship on its own clock.',
            'pt-BR':
              'Dois motivos, ambos reais: conexões abertas e tráfego de requisição escalam em eixos diferentes, e o produto subia uma vez por madrugada — um canal que só pode mudar às três da manhã é um canal que ninguém muda. Separá-lo em um serviço próprio deixou cada eixo escalar nos seus próprios termos, e deixou este subir no próprio relógio.',
          },
        },
        {
          heading: { en: 'A room per user id', 'pt-BR': 'Uma sala por id de usuário' },
          body: {
            en: 'Addressing is by identity, not by connection, so the platform can push to a person without knowing how many tabs, devices or reconnects that person currently has open.',
            'pt-BR':
              'O endereçamento é por identidade, não por conexão, então a plataforma consegue empurrar para uma pessoa sem saber quantas abas, dispositivos ou reconexões essa pessoa tem abertos no momento.',
          },
        },
        {
          heading: { en: 'Handlers auto-loaded from a directory', 'pt-BR': 'Handlers carregados automaticamente de um diretório' },
          body: {
            en: 'Adding an event is adding a file — there is no registry to remember to update, and no handler that exists in the code but was never wired in.',
            'pt-BR':
              'Adicionar um evento é adicionar um arquivo — não existe registro para lembrar de atualizar, nem handler que existe no código mas nunca foi ligado.',
          },
        },
        {
          heading: { en: 'A load test that keeps clients on long-polling', 'pt-BR': 'Um teste de carga que mantém clientes em long-polling' },
          body: {
            en: 'Not every client upgrades to a websocket. A load test where all of them do measures a population that does not exist, so the harness deliberately holds a share of clients on HTTP long-polling instead.',
            'pt-BR':
              'Nem todo cliente faz upgrade para um websocket. Um teste de carga em que todos fazem mede uma população que não existe, então o harness mantém deliberadamente uma parte dos clientes em long-polling via HTTP.',
          },
        },
      ],
      highlights: [
        {
          en: 'The notify endpoint the rest of the platform posts to when something needs pushing out.',
          'pt-BR': 'O endpoint de notificação para onde o resto da plataforma posta quando algo precisa ser empurrado.',
        },
        {
          en: 'An info endpoint reporting the live connection count, for monitoring.',
          'pt-BR': 'Um endpoint de info que reporta a contagem de conexões ao vivo, para monitoramento.',
        },
        {
          en: 'A health endpoint reporting its own latency.',
          'pt-BR': 'Um endpoint de saúde que reporta a própria latência.',
        },
        {
          en: 'A shared-secret handshake that disconnects a client immediately if it ends up joined to no room.',
          'pt-BR': 'Um handshake com segredo compartilhado que desconecta um cliente imediatamente se ele acabar sem entrar em nenhuma sala.',
        },
      ],
    },
  },
  {
    slug: 'ulbra-atende',
    name: 'Ulbra Atende',
    tagline: {
      en: 'IT service desk for a university, replacing GLPI.',
      'pt-BR': 'Service desk de TI de uma universidade, no lugar do GLPI.',
    },
    description: {
      en: "The IT service desk for a university, replacing GLPI as the single intake channel: SLA per team, approval flows, multi-stage templates, and an MCP server that lets staff work tickets from Claude or ChatGPT under their own permissions.",
      'pt-BR':
        'O service desk de TI de uma universidade, substituindo o GLPI como canal único de entrada: SLA por time, fluxos de aprovação, templates multi-etapa e um servidor MCP que deixa a equipe trabalhar chamados pelo Claude ou ChatGPT com as próprias permissões.',
    },
    tech: [
      '.NET 10',
      'PostgreSQL 17',
      'RabbitMQ',
      'React 19',
      'OpenIddict',
      'MCP',
      'OpenTelemetry',
      'Docker Swarm',
    ],
    role: { en: 'Head of Technology — design & implementation', 'pt-BR': 'Head de Tecnologia — design & implementação' },
    period: { en: 'Apr 2026 – Current', 'pt-BR': 'Abr 2026 – Atual' },
    venture: 'ulbra',
    visibility: 'private',
    links: [],
    screenshot: '/screenshots/ulbra-atende.webp',
    detail: {
      overview: {
        en: "The IT service desk for ULBRA — a .NET 10 modular monolith that replaced GLPI as the single intake channel for the university’s IT department, carrying a request from ticket to SLA to satisfaction survey.",
        'pt-BR':
          'O service desk de TI da ULBRA — um monólito modular em .NET 10 que substituiu o GLPI como canal único de entrada da TI da universidade, levando um pedido do chamado ao SLA à pesquisa de satisfação.',
      },
      contribution: {
        summary: {
          en: 'Principal author, from scratch — the architecture, the backend, the front end, and the deployment.',
          'pt-BR':
            'Autor principal, do zero — a arquitetura, o backend, o front-end e o deploy.',
        },
        areas: [
          { en: 'The modular monolith and the boundaries between its contexts.', 'pt-BR': 'O monólito modular e as fronteiras entre seus contextos.' },
          { en: 'The SLA engine, including pauses that record who stopped the clock and why.', 'pt-BR': 'O motor de SLA, incluindo pausas que registram quem interrompeu a contagem e por quê.' },
          { en: 'The transactional outbox and the notification fan-out it feeds.', 'pt-BR': 'O outbox transacional e o fan-out de notificação que ele alimenta.' },
          { en: 'The OAuth authorization server and the MCP server behind its consent screen.', 'pt-BR': 'O servidor de autorização OAuth e o servidor MCP atrás da sua tela de consentimento.' },
          { en: 'The React front end and the Docker Swarm deployment.', 'pt-BR': 'O front-end em React e o deploy em Docker Swarm.' },
        ],
        boundary: {
          en: 'One engineer now works on this codebase alongside me.',
          'pt-BR': 'Um engenheiro agora trabalha neste código ao meu lado.',
        },
      },
      problem: {
        en: "ULBRA’s IT department took requests through GLPI, e-mail, and direct messages at the same time. There was no SLA per team, no audit trail on approvals, and no way to tell whether anyone was satisfied with the outcome. Ulbra Atende replaces GLPI as the single intake channel and makes each of those measurable — three months in, the median ticket closes in about an hour and a half.",
        'pt-BR':
          'A TI da ULBRA recebia demanda por GLPI, e-mail e mensagem direta ao mesmo tempo. Não havia SLA por time, nem rastro de aprovação, nem como saber se alguém ficou satisfeito com o resultado. O Ulbra Atende substitui o GLPI como canal único de entrada e torna cada uma dessas coisas mensurável — três meses depois, a mediana de fechamento é de cerca de uma hora e meia.',
      },
      metricsNote: {
        en: 'in ~3 months of production',
        'pt-BR': 'em ~3 meses de produção',
      },
      metrics: [
        {
          value: { en: '~2.4k', 'pt-BR': '~2,4 mil' },
          label: { en: 'tickets handled', 'pt-BR': 'chamados atendidos' },
          note: { en: '85% closed', 'pt-BR': '85% concluídos' },
        },
        {
          value: { en: '200+', 'pt-BR': '200+' },
          label: { en: 'users', 'pt-BR': 'usuários' },
          note: { en: 'across ~30 teams', 'pt-BR': 'em ~30 times' },
        },
        {
          value: { en: '~6 min', 'pt-BR': '~6 min' },
          label: { en: 'median first response', 'pt-BR': 'mediana da 1ª resposta' },
          note: { en: 'SLA tracked per team', 'pt-BR': 'SLA medido por time' },
        },
        {
          value: { en: '~5.0', 'pt-BR': '~5,0' },
          label: { en: 'satisfaction score', 'pt-BR': 'nota de satisfação' },
          note: { en: '400+ responses, 1-5 scale', 'pt-BR': '400+ respostas, escala 1-5' },
        },
      ],
      architecture: {
        summary: {
          en: 'A .NET 10 modular monolith: one deployable, separate bounded contexts — Core, Identity, Notifications and MCP — each layered Domain → Application → Infrastructure with its own Postgres schema. Integration events travel over RabbitMQ through an EF transactional outbox. Attachments live in S3/MinIO, caching in Redis, tracing via OpenTelemetry; integration tests run against real Postgres, RabbitMQ and MinIO through Testcontainers.',
          'pt-BR':
            'Um monólito modular em .NET 10: um único deploy, contextos delimitados separados — Core, Identity, Notifications e MCP — cada um em camadas Domain → Application → Infrastructure com seu próprio schema no Postgres. Eventos de integração passam pelo RabbitMQ através de um outbox transacional do EF. Anexos ficam em S3/MinIO, cache em Redis, tracing por OpenTelemetry; os testes de integração rodam contra Postgres, RabbitMQ e MinIO reais via Testcontainers.',
        },
        steps: [
          {
            label: 'React 19 SPA',
            detail: {
              en: 'TanStack Router and Query over a Tailwind design system.',
              'pt-BR': 'TanStack Router e Query sobre um design system em Tailwind.',
            },
          },
          {
            label: '.NET 10 API',
            detail: {
              en: 'Modular monolith — four bounded contexts in one deployable.',
              'pt-BR': 'Monólito modular — quatro contextos delimitados num único deploy.',
            },
          },
          {
            label: 'PostgreSQL 17',
            detail: {
              en: 'One schema per module; EF Core migrations applied on startup.',
              'pt-BR': 'Um schema por módulo; migrations do EF Core aplicadas no startup.',
            },
          },
          {
            label: 'RabbitMQ',
            detail: {
              en: 'Integration events published through an EF transactional outbox.',
              'pt-BR': 'Eventos de integração publicados por um outbox transacional do EF.',
            },
          },
          {
            label: 'Slack · Google Chat · e-mail',
            detail: {
              en: 'Notification fan-out consuming those events.',
              'pt-BR': 'Fan-out de notificação consumindo esses eventos.',
            },
          },
        ],
      },
      states: {
        caption: { en: 'The life of a ticket', 'pt-BR': 'A vida de um chamado' },
        summary: {
          en: 'The SLA clock is the thread running through it. It starts on the receiving team’s policy, stops when the ticket is waiting on someone outside the team, and is what the response and resolution targets are measured against. A ticket can also end cancelled, and work needing sign-off waits on an approval before it starts.',
          'pt-BR':
            'O relógio do SLA é o fio que atravessa tudo. Ele começa pela política do time que recebe, para quando o chamado depende de alguém fora do time, e é contra ele que as metas de resposta e resolução são medidas. Um chamado também pode terminar cancelado, e trabalho que exige aval espera uma aprovação antes de começar.',
        },
        steps: [
          {
            label: 'Open',
            detail: {
              en: 'The clock starts against the receiving team’s SLA policy, and triage routes it to a team and a category.',
              'pt-BR': 'O relógio começa contra a política de SLA do time que recebe, e a triagem faz o roteamento para um time e uma categoria.',
            },
          },
          {
            label: 'InProgress',
            detail: {
              en: 'An assignee owns it. First response is already measured by this point.',
              'pt-BR': 'Alguém assume. A primeira resposta já foi medida a esta altura.',
            },
          },
          {
            label: 'Paused',
            detail: {
              en: 'Waiting on the requester or a third party. The clock stops, and who paused it and why is recorded as its own entry.',
              'pt-BR': 'Esperando quem abriu ou um terceiro. O relógio para, e quem pausou e por quê fica registrado como uma entrada própria.',
            },
          },
          {
            label: 'Completed',
            detail: {
              en: 'The work is done and the requester is asked to rate it — which is where the satisfaction score comes from.',
              'pt-BR': 'O trabalho acabou e quem abriu é convidado a avaliar — que é de onde vem a nota de satisfação.',
            },
          },
        ],
      },
      highlights: [
        {
          en: 'SLA per team, with pauses that record who paused the clock and why.',
          'pt-BR': 'SLA por time, com pausas que registram quem parou o relógio e por quê.',
        },
        {
          en: 'Multi-stage ticket templates, so a recurring request arrives already broken into steps.',
          'pt-BR':
            'Templates de chamado multi-etapa, então um pedido recorrente já chega dividido em passos.',
        },
        {
          en: 'Approval flow — work that needs a sign-off cannot start without one.',
          'pt-BR': 'Fluxo de aprovação — trabalho que exige aval não começa sem ele.',
        },
        {
          en: 'Parent/child tickets and explicit dependencies between them.',
          'pt-BR': 'Chamados pai/filho e dependências explícitas entre eles.',
        },
        {
          en: 'Notifications fan out to Slack, Google Chat and e-mail, per user preference.',
          'pt-BR':
            'Notificações se espalham por Slack, Google Chat e e-mail, conforme a preferência de cada usuário.',
        },
        {
          en: 'A dashboard whose cards drill down into the exact listing they summarize.',
          'pt-BR': 'Um dashboard cujos cards abrem exatamente a listagem que resumem.',
        },
        {
          en: 'A satisfaction survey on every closed ticket.',
          'pt-BR': 'Pesquisa de satisfação em todo chamado concluído.',
        },
      ],
      decisions: [
        {
          heading: {
            en: 'A modular monolith, not microservices',
            'pt-BR': 'Monólito modular, não microsserviços',
          },
          body: {
            en: 'One team, one deploy. The boundary that matters is the module — enforced by project references and a schema per context — not the network. Distributing it would have bought deployment independence nobody needed and paid for it in latency, partial failures, and debugging.',
            'pt-BR':
              'Um time, um deploy. A fronteira que importa é o módulo — garantida por referências de projeto e um schema por contexto — não a rede. Distribuir teria comprado uma independência de deploy que ninguém precisava, pagando em latência, falha parcial e dificuldade de depurar.',
          },
        },
        {
          heading: {
            en: 'A transactional outbox for every integration event',
            'pt-BR': 'Outbox transacional para todo evento de integração',
          },
          body: {
            en: 'The event row is written in the same transaction as the business change. A notification can never fire for a ticket that failed to commit, and never disappears because the broker happened to be down at that moment — the relay delivers it once the transaction lands.',
            'pt-BR':
              'A linha do evento é escrita na mesma transação da mudança de negócio. Uma notificação nunca dispara para um chamado que não commitou, e nunca some porque o broker estava fora naquele instante — o relay entrega assim que a transação fecha.',
          },
        },
        {
          heading: {
            en: 'Strongly-typed IDs from a source generator',
            'pt-BR': 'IDs fortemente tipados por source generator',
          },
          body: {
            en: 'Every entity has its own ID struct, rendered as ti_…, tm_…, us_…. Passing a team ID where a ticket ID belongs stops compiling. A whole class of bug moves from runtime to build time, and IDs say what they are in logs and URLs.',
            'pt-BR':
              'Cada entidade tem seu próprio struct de ID, escrito como ti_…, tm_…, us_…. Passar um ID de time onde se espera um de chamado para de compilar. Uma classe inteira de bug sai do runtime e vai para o build, e o ID diz o que é em log e em URL.',
          },
        },
        {
          heading: {
            en: 'Its own OAuth server, and an MCP server behind it',
            'pt-BR': 'Servidor OAuth próprio, e um servidor MCP atrás dele',
          },
          body: {
            en: 'OpenIddict issues the tokens; the MCP server exposes ticket read/write and lookup tools. Someone connects Claude or ChatGPT to their own account through a consent screen and works tickets in natural language — under exactly the permissions they already have in the UI, with the same scope check on every tool call.',
            'pt-BR':
              'O OpenIddict emite os tokens; o servidor MCP expõe ferramentas de leitura, escrita e consulta de chamados. A pessoa conecta o Claude ou o ChatGPT à própria conta por uma tela de consentimento e trabalha os chamados em linguagem natural — com exatamente as permissões que já tem na interface, e a mesma checagem de escopo em cada chamada de ferramenta.',
          },
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
      en: "An internal ERP replacing the university’s legacy systems — a modular .NET monolith on PostgreSQL with a React front end. In testing, ahead of launch.",
      'pt-BR':
        'Um ERP interno substituindo os sistemas legados da universidade — um monólito modular em .NET sobre PostgreSQL com front-end em React. Em teste, antes do lançamento.',
    },
    tech: ['.NET 10', 'PostgreSQL 17', 'EF Core', 'React', 'Tailwind', 'shadcn/ui'],
    role: { en: 'Head of Technology', 'pt-BR': 'Head de Tecnologia' },
    period: { en: 'Jun 2026 – Current', 'pt-BR': 'Jun 2026 – Atual' },
    venture: 'ulbra',
    visibility: 'private',
    screenshot: '/screenshots/ulbra-one.webp',
    links: [],
    detail: {
      overview: {
        en: 'An internal ERP built to take the university off its legacy systems — a modular .NET 10 monolith on PostgreSQL 17 with a React front end, covering core internal business operations. It is in testing, ahead of launch, so this describes what has been built rather than what is running.',
        'pt-BR':
          'Um ERP interno construído para tirar a universidade dos sistemas legados — um monólito modular em .NET 10 sobre PostgreSQL 17 com front-end em React, cobrindo as operações internas centrais. Está em teste, antes do lançamento, então o que segue descreve o que foi construído, não o que está em produção.',
      },
      contribution: {
        summary: {
          en: 'I set the architecture and the conventions, and built alongside one engineer who carries the day-to-day of this codebase.',
          'pt-BR':
            'Defini a arquitetura e as convenções e construí junto com um engenheiro que toca o dia a dia deste código.',
        },
        areas: [
          {
            en: 'The module boundaries, and the conventions carried over from the service desk.',
            'pt-BR': 'As fronteiras entre módulos e as convenções trazidas do service desk.',
          },
          {
            en: 'The PostgreSQL schema and the code-first migration path.',
            'pt-BR': 'O schema PostgreSQL e o caminho de migrations code-first.',
          },
          {
            en: 'Review of every change into the codebase.',
            'pt-BR': 'Revisão de toda mudança que entra no código.',
          },
        ],
        boundary: {
          en: 'One engineer owns this codebase day to day; much of the implementation is theirs.',
          'pt-BR':
            'Um engenheiro cuida deste código no dia a dia; boa parte da implementação é dele.',
        },
      },
      problem: {
        en: 'The university runs its internal operations on licensed legacy systems that neither its data nor its processes fit well. Ulbra One is the platform meant to replace them, built in-house so that the business rules live somewhere the team can change.',
        'pt-BR':
          'A universidade opera seus processos internos sobre sistemas legados licenciados em que nem os dados nem os processos se encaixam bem. O Ulbra One é a plataforma que deve substituí-los, construída em casa para que as regras de negócio fiquem onde o time pode mudá-las.',
      },
      highlights: [
        {
          en: 'A modular monolith organized by business domain rather than by technical layer.',
          'pt-BR': 'Um monólito modular organizado por domínio de negócio, não por camada técnica.',
        },
        {
          en: 'PostgreSQL via EF Core, code-first, with snake_case naming applied by convention rather than by attribute.',
          'pt-BR':
            'PostgreSQL via EF Core, code-first, com nomenclatura snake_case aplicada por convenção e não por atributo.',
        },
        {
          en: 'A React and Tailwind front end sharing the design tokens of the service desk.',
          'pt-BR': 'Front-end React e Tailwind compartilhando os design tokens do service desk.',
        },
        {
          en: 'Migrations run on startup, so an environment is never a manual step behind the code.',
          'pt-BR':
            'As migrations rodam na inicialização, então nenhum ambiente fica um passo manual atrás do código.',
        },
      ],
      decisions: [
        {
          heading: {
            en: 'The same conventions as the service desk, deliberately',
            'pt-BR': 'As mesmas convenções do service desk, de propósito',
          },
          body: {
            en: 'Endpoint shape, result type and migration strategy are copied from Ulbra Atende rather than reconsidered. With three engineers across six systems, an engineer moving between two codebases should not be learning a second set of rules — the consistency is worth more than any local improvement either codebase might have made alone.',
            'pt-BR':
              'Formato de endpoint, tipo de retorno e estratégia de migration são copiados do Ulbra Atende em vez de repensados. Com três engenheiros para seis sistemas, quem troca de código não deveria estar aprendendo um segundo conjunto de regras — a consistência vale mais do que qualquer melhoria local que um dos dois pudesse ter feito sozinho.',
          },
        },
        {
          heading: {
            en: 'A modular monolith, not services',
            'pt-BR': 'Um monólito modular, não serviços',
          },
          body: {
            en: 'An ERP is a set of tightly related domains that transact together. Splitting it into services would buy independent deployment at the cost of distributed transactions across modules that genuinely need consistency — and there is no team here to operate that. Modules give the boundaries; the single process keeps the transactions.',
            'pt-BR':
              'Um ERP é um conjunto de domínios fortemente relacionados que transacionam juntos. Quebrá-lo em serviços compraria deploy independente ao custo de transações distribuídas entre módulos que realmente precisam de consistência — e não há time aqui para operar isso. Os módulos dão as fronteiras; o processo único mantém as transações.',
          },
        },
      ],
    },
  },
  {
    slug: 'ulbra-crm',
    name: 'Ulbra CRM',
    tagline: {
      en: 'An inherited CRM taken from no tests to full coverage.',
      'pt-BR': 'Um CRM herdado levado de zero testes a cobertura total.',
    },
    description: {
      en: "The university’s CRM platform, inherited with no automated tests and little structure. Rebuilt under my direction to full test coverage, with a front-end migration that stopped every screen change from throwing away the user’s filters.",
      'pt-BR':
        'A plataforma de CRM da universidade, herdada sem testes automatizados e com pouca estrutura. Reconstruída sob a minha direção até cobertura total de testes, com uma migração de front-end que acabou com a perda dos filtros do usuário a cada troca de tela.',
    },
    tech: ['React', 'TanStack Router', 'MongoDB', 'Docker Swarm'],
    role: { en: 'Head of Technology — direction & review', 'pt-BR': 'Head de Tecnologia — direção & revisão' },
    period: { en: 'Apr 2026 – Current', 'pt-BR': 'Abr 2026 – Atual' },
    venture: 'ulbra',
    visibility: 'private',
    links: [],
    detail: {
      overview: {
        en: "The CRM the university runs on, inherited rather than built: no automated tests, and a codebase whose structure had not kept up with it. It is now fully covered by tests and materially better to use, and the work was done by the team under my direction — I set the direction and reviewed it, and did not write it.",
        'pt-BR':
          'O CRM em que a universidade opera, herdado e não construído: sem testes automatizados e com uma estrutura que não acompanhou o próprio crescimento. Hoje está totalmente coberto por testes e sensivelmente melhor de usar, e o trabalho foi feito pelo time sob a minha direção — eu defini a direção e revisei, não escrevi.',
      },
      contribution: {
        summary: {
          en: 'I set the direction and reviewed the work; the engineering was the team’s.',
          'pt-BR': 'Defini a direção e revisei o trabalho; a engenharia foi do time.',
        },
        areas: [
          {
            en: 'The decision to cover the codebase with tests before changing its behaviour.',
            'pt-BR': 'A decisão de cobrir o código com testes antes de mudar seu comportamento.',
          },
          {
            en: 'The routing migration that made filter state survive navigation.',
            'pt-BR': 'A migração de rotas que fez o estado dos filtros sobreviver à navegação.',
          },
          { en: 'Review of the work as it landed.', 'pt-BR': 'Revisão do trabalho conforme entrava.' },
        ],
        boundary: {
          en: 'None of this implementation is mine. It was built by the engineers on the team; my part was deciding what to do and reviewing what came back.',
          'pt-BR':
            'Nada desta implementação é minha. Foi construída pelos engenheiros do time; a minha parte foi decidir o que fazer e revisar o que voltava.',
        },
      },
      problem: {
        en: 'The CRM arrived with no automated tests at all, which made every change a gamble, and with usability debt that the people using it every day absorbed silently. The worst of it: changing screens reloaded the application, so the filters someone had just set were gone. Work that goes through the same three or four filters all day pays that cost on every navigation.',
        'pt-BR':
          'O CRM chegou sem nenhum teste automatizado, o que tornava toda mudança uma aposta, e com uma dívida de usabilidade que quem usava todo dia absorvia em silêncio. O pior sintoma: trocar de tela recarregava a aplicação, então os filtros recém-configurados sumiam. Um trabalho que passa pelos mesmos três ou quatro filtros o dia inteiro paga esse custo a cada navegação.',
      },
      metrics: [
        {
          value: { en: '0% → 100%', 'pt-BR': '0% → 100%' },
          label: { en: 'test coverage', 'pt-BR': 'cobertura de testes' },
        },
      ],
      decisions: [
        {
          heading: { en: 'Tests first, behaviour second', 'pt-BR': 'Primeiro os testes, depois o comportamento' },
          body: {
            en: 'The codebase was unstructured and untested, and the temptation with both is to restructure first. The order was inverted: cover the existing behaviour, then change it. Coverage on code nobody has changed yet is what makes the later restructuring safe rather than hopeful — and it is the reason the number is worth quoting.',
            'pt-BR':
              'O código estava desestruturado e sem testes, e a tentação diante dos dois é reestruturar primeiro. A ordem foi invertida: cobrir o comportamento existente e só então mudá-lo. Cobertura sobre código que ninguém mexeu ainda é o que torna a reestruturação posterior segura em vez de esperançosa — e é a razão de o número valer a pena ser citado.',
          },
        },
        {
          heading: { en: 'Routing as state, not as navigation', 'pt-BR': 'Rotas como estado, não como navegação' },
          body: {
            en: 'Moving to a router that holds application state in the route turned filters from something the page owned into something the URL owned. The visible win is that a screen change no longer discards them; the quieter one is that a filtered view became a link somebody can send to a colleague.',
            'pt-BR':
              'Migrar para um roteador que guarda o estado da aplicação na própria rota transformou os filtros de algo que a página possuía em algo que a URL possui. O ganho visível é que trocar de tela não os descarta mais; o silencioso é que uma visão filtrada virou um link que alguém pode mandar para um colega.',
          },
        },
        {
          heading: { en: 'Directed, not written', 'pt-BR': 'Dirigido, não escrito' },
          body: {
            en: 'This is the one system in the group I did not build. With three engineers and six systems, my leverage as lead is in deciding what gets done and reviewing what comes back, not in adding a fourth pair of hands to a codebase that already has an owner.',
            'pt-BR':
              'Este é o único sistema do grupo que eu não construí. Com três engenheiros e seis sistemas, a minha alavanca como líder está em decidir o que é feito e revisar o que volta, não em somar um quarto par de mãos a um código que já tem dono.',
          },
        },
      ],
    },
  },
  {
    slug: 'ulbra-admin',
    name: 'Ulbra Admin',
    tagline: {
      en: 'The numbers the board runs the university on.',
      'pt-BR': 'Os números com que a diretoria conduz a universidade.',
    },
    description: {
      en: 'Administrative dashboards for the presidency and the board, reading enrollment from the legacy Oracle system through a typed API and prospect data from the CRM — deliberately the simplest architecture in the group.',
      'pt-BR':
        'Dashboards administrativos para a presidência e a diretoria, lendo matrícula do sistema Oracle legado através de uma API tipada e dados de captação do CRM — deliberadamente a arquitetura mais simples do grupo.',
    },
    tech: ['.NET 10', 'React 19', 'PostgreSQL', 'MongoDB', 'TanStack Router', 'Docker Swarm'],
    role: { en: 'Head of Technology — design & implementation', 'pt-BR': 'Head de Tecnologia — design & implementação' },
    period: { en: 'Aug 2026 – Current', 'pt-BR': 'Ago 2026 – Atual' },
    venture: 'ulbra',
    visibility: 'private',
    links: [],
    detail: {
      overview: {
        en: 'The dashboards the presidency and the board use to check the university’s numbers. A .NET 10 API and a React 19 front end that read two systems neither of them owns: prospect data from the CRM, and confirmed enrollment from the legacy Oracle platform through a typed HTTP client rather than a database connection.',
        'pt-BR':
          'Os dashboards que a presidência e a diretoria usam para conferir os números da universidade. Uma API em .NET 10 e um front-end React 19 que leem dois sistemas que não lhes pertencem: dados de captação vindos do CRM e matrícula confirmada da plataforma Oracle legada, por um cliente HTTP tipado e não por conexão de banco.',
      },
      contribution: {
        summary: {
          en: 'I built it end to end — the API, the integrations, the front end and the deployment.',
          'pt-BR': 'Construí de ponta a ponta — a API, as integrações, o front-end e o deploy.',
        },
        areas: [
          { en: 'The read-only integration with the CRM’s datastore.', 'pt-BR': 'A integração somente-leitura com a base do CRM.' },
          { en: 'The typed client that fronts the legacy enrollment system.', 'pt-BR': 'O cliente tipado que fica à frente do sistema legado de matrícula.' },
          { en: 'The dashboards themselves and the React front end.', 'pt-BR': 'Os próprios dashboards e o front-end React.' },
          { en: 'Authentication and the Swarm deployment.', 'pt-BR': 'Autenticação e o deploy em Swarm.' },
        ],
      },
      problem: {
        en: 'The people accountable for the university’s numbers could not see them without asking. Enrollment lived in a legacy platform, prospects lived in the CRM, and reconciling the two meant a request to IT and a spreadsheet that was stale by the time it arrived. The question being asked was not complicated; the answer was just never at hand.',
        'pt-BR':
          'Quem responde pelos números da universidade não conseguia vê-los sem pedir. A matrícula ficava numa plataforma legada, a captação no CRM, e cruzar as duas significava um chamado para a TI e uma planilha que já chegava desatualizada. A pergunta não era complicada; a resposta é que nunca estava à mão.',
      },
      highlights: [
        {
          en: 'Prospect and enrollment figures side by side, from the two systems that own them.',
          'pt-BR': 'Números de captação e de matrícula lado a lado, vindos dos dois sistemas que os detêm.',
        },
        {
          en: 'Reads the CRM’s datastore strictly read-only — the dashboards can never corrupt the system of record.',
          'pt-BR':
            'Lê a base do CRM estritamente em modo leitura — os dashboards não têm como corromper o sistema de origem.',
        },
        {
          en: 'Single sign-on, so access follows the accounts the university already manages.',
          'pt-BR': 'Login único, então o acesso segue as contas que a universidade já administra.',
        },
        {
          en: 'The same design tokens as the service desk, so six systems read as one platform.',
          'pt-BR': 'Os mesmos design tokens do service desk, para que seis sistemas leiam como uma plataforma só.',
        },
      ],
      architecture: {
        summary: {
          en: 'Two sources, neither of them owned by this system, behind one API.',
          'pt-BR': 'Duas fontes, nenhuma delas própria deste sistema, atrás de uma API.',
        },
        steps: [
          { label: 'CRM store', detail: { en: 'Prospect and pipeline data, read-only.', 'pt-BR': 'Dados de captação e funil, somente leitura.' } },
          { label: 'Enrollment API', detail: { en: 'A typed HTTP client over the legacy platform — never the database directly.', 'pt-BR': 'Um cliente HTTP tipado sobre a plataforma legada — nunca o banco diretamente.' } },
          { label: 'Admin API', detail: { en: 'Joins the two and serves the dashboards.', 'pt-BR': 'Junta as duas e serve os dashboards.' } },
          { label: 'Dashboards', detail: { en: 'What the board actually looks at.', 'pt-BR': 'O que a diretoria de fato olha.' } },
        ],
      },
      decisions: [
        {
          heading: {
            en: 'Deliberately the simplest architecture in the group',
            'pt-BR': 'Deliberadamente a arquitetura mais simples do grupo',
          },
          body: {
            en: 'Single project, no modules, no DDD — written into the codebase as a rule, in a house whose service desk is a modular monolith. This system owns almost no domain: it reads two other systems and draws charts. Giving it aggregates and bounded contexts would be ceremony around a query. The architecture is chosen per problem, and the honest answer here was "less".',
            'pt-BR':
              'Projeto único, sem módulos, sem DDD — escrito no código como regra, numa casa cujo service desk é um monólito modular. Este sistema quase não tem domínio próprio: ele lê dois outros sistemas e desenha gráficos. Dar-lhe agregados e contextos delimitados seria cerimônia em volta de uma consulta. A arquitetura é escolhida por problema, e a resposta honesta aqui era "menos".',
          },
        },
        {
          heading: {
            en: 'Never query the legacy database directly',
            'pt-BR': 'Nunca consultar o banco legado diretamente',
          },
          body: {
            en: 'Enrollment could have been read straight from the legacy platform’s database, and it would have been faster to write. It goes through a typed API instead, so the definition of "an enrolled student" lives in one place rather than being reimplemented in a SQL query — and so the day the legacy platform is replaced, one client changes rather than every consumer of it.',
            'pt-BR':
              'A matrícula poderia ser lida direto do banco da plataforma legada, e teria sido mais rápido de escrever. Ela passa por uma API tipada, para que a definição de "aluno matriculado" viva em um lugar só em vez de ser reimplementada numa consulta SQL — e para que, no dia em que a plataforma legada for substituída, mude um cliente e não todos os consumidores.',
          },
        },
        {
          heading: { en: 'Read-only by construction', 'pt-BR': 'Somente leitura por construção' },
          body: {
            en: 'The connection to the CRM’s datastore is read-only, not by convention but by the credentials it holds. A reporting system that can write to the system of record is one bug away from corrupting the numbers it exists to report.',
            'pt-BR':
              'A conexão com a base do CRM é somente leitura, não por convenção mas pelas credenciais que ela carrega. Um sistema de relatórios capaz de escrever no sistema de origem está a um bug de corromper os números que existe para reportar.',
          },
        },
      ],
    },
  },
  {
    slug: 'ulbra-student-dashboard',
    name: 'Student Dashboard',
    tagline: {
      en: 'A screen on a wall that tells students where to be.',
      'pt-BR': 'Uma tela na parede que diz aos alunos onde estar.',
    },
    description: {
      en: 'A class-schedule display installed in the medical school building, plus the admin behind it: an unattended kiosk that rotates schedules and campus content, switching themes between day and night.',
      'pt-BR':
        'Um painel de horários de aula instalado no prédio da medicina, e a administração por trás dele: um totem desassistido que alterna horários e conteúdo do campus, trocando de tema entre dia e noite.',
    },
    tech: ['.NET 10', 'React 19', 'PostgreSQL', 'Microsoft Fabric', 'ODBC', 'Docker Swarm'],
    role: { en: 'Head of Technology — design & implementation', 'pt-BR': 'Head de Tecnologia — design & implementação' },
    period: { en: 'Apr 2026 – Current', 'pt-BR': 'Abr 2026 – Atual' },
    venture: 'ulbra',
    visibility: 'private',
    links: [],
    detail: {
      overview: {
        en: "A schedule display installed in the university’s first building, the medical school, where it shows students the day’s classes. One system with two faces: an unattended fullscreen kiosk, and a sign-in-protected admin where staff manage the content it rotates. Academic data comes from the university’s analytics lakehouse.",
        'pt-BR':
          'Um painel de horários instalado no prédio 1 da universidade, o da medicina, onde mostra aos alunos as aulas do dia. Um sistema com duas faces: um totem em tela cheia, desassistido, e uma administração protegida por login em que a equipe gerencia o conteúdo que ele alterna. Os dados acadêmicos vêm do lakehouse analítico da universidade.',
      },
      contribution: {
        summary: {
          en: 'I built it end to end — the API, the lakehouse integration, both front ends and the deployment.',
          'pt-BR': 'Construí de ponta a ponta — a API, a integração com o lakehouse, os dois front-ends e o deploy.',
        },
        areas: [
          { en: 'The lakehouse connection that supplies the schedule.', 'pt-BR': 'A conexão com o lakehouse que alimenta o horário.' },
          { en: 'The kiosk display, its rotation and its day/night themes.', 'pt-BR': 'O painel do totem, sua rotação e seus temas de dia e noite.' },
          { en: 'The content admin and its scheduled playlist.', 'pt-BR': 'A administração de conteúdo e sua playlist agendada.' },
          { en: 'Deployment onto the internal cluster.', 'pt-BR': 'O deploy no cluster interno.' },
        ],
      },
      problem: {
        en: "Students arriving at the building had no way to see the day’s schedule without looking it up on a phone, and the university had no way to put anything in front of them at the moment they walked in. A printed sheet answers the first problem badly and the second not at all.",
        'pt-BR':
          'Alunos chegando ao prédio não tinham como ver o horário do dia sem consultar o celular, e a universidade não tinha como colocar nada à frente deles no momento em que entravam. Uma folha impressa responde mal à primeira necessidade e não responde à segunda.',
      },
      highlights: [
        {
          en: 'A fullscreen kiosk sized for the physical panel it runs on, not for a browser window.',
          'pt-BR': 'Um modo tela cheia dimensionado para o painel físico em que roda, não para uma janela de navegador.',
        },
        {
          en: 'Rotates between schedule pages and campus content on a fixed cadence.',
          'pt-BR': 'Alterna entre páginas de horário e conteúdo do campus numa cadência fixa.',
        },
        {
          en: 'Switches between a day and a night theme by the clock, so it is readable in both.',
          'pt-BR': 'Troca entre tema diurno e noturno pelo relógio, para ser legível nos dois.',
        },
        {
          en: 'Staff schedule content with start and end dates; it appears and expires on its own.',
          'pt-BR': 'A equipe agenda conteúdo com data de início e fim; ele aparece e expira sozinho.',
        },
      ],
      decisions: [
        {
          heading: { en: 'Polling, not a live connection', 'pt-BR': 'Polling, não conexão persistente' },
          body: {
            en: 'The display asks the server for fresh data on a short interval rather than holding a socket open. A socket is the better answer when a human is watching and latency matters; this is a screen on a wall with nobody in front of it. Polling recovers from a dropped network by itself, and nobody has to walk to the building to restart it.',
            'pt-BR':
              'O painel pede dados novos ao servidor em intervalos curtos em vez de manter um socket aberto. Socket é a melhor resposta quando há alguém olhando e a latência importa; aqui é uma tela na parede sem ninguém à frente. O polling se recupera sozinho de uma queda de rede, e ninguém precisa ir até o prédio reiniciar nada.',
          },
        },
        {
          heading: { en: 'The analytics lakehouse as the source', 'pt-BR': 'O lakehouse analítico como fonte' },
          body: {
            en: 'The schedule is read from the university’s analytics platform rather than from the academic system directly. It is the copy that is already shaped for reading, already has access controls the display can be granted narrowly, and — crucially — cannot be affected by a screen in a lobby querying it all day.',
            'pt-BR':
              'O horário é lido da plataforma analítica da universidade e não do sistema acadêmico diretamente. É a cópia já modelada para leitura, que já tem controle de acesso concedível de forma restrita ao painel e que — o ponto decisivo — não é afetada por uma tela no saguão consultando o dia inteiro.',
          },
        },
        {
          heading: { en: 'One system, two audiences', 'pt-BR': 'Um sistema, dois públicos' },
          body: {
            en: 'The kiosk has no login and no interaction; the admin has both. Splitting them into two deployments was the obvious move and was rejected: they share the content model entirely, and two services would mean two places to change when the shape of a slide changes. The boundary is a route and an auth check, not a process.',
            'pt-BR':
              'O totem não tem login nem interação; a administração tem os dois. Separá-los em dois deploys era o movimento óbvio e foi descartado: eles compartilham inteiramente o modelo de conteúdo, e dois serviços significariam dois lugares para mudar quando o formato de um slide mudasse. A fronteira é uma rota e uma verificação de acesso, não um processo.',
          },
        },
      ],
    },
  },
  {
    slug: 'ulbra-infra',
    name: 'Ulbra Infra',
    tagline: {
      en: 'From a person on the box to a repository and a pipeline.',
      'pt-BR': 'De uma pessoa no servidor a um repositório e um pipeline.',
    },
    description: {
      en: 'The internal datacenter platform every other system here deploys onto: one script takes a bare server to ready, applications ship from a repository through CI, and an alert can open its own pull request.',
      'pt-BR':
        'A plataforma de datacenter interno em que todos os outros sistemas daqui são publicados: um script leva um servidor cru até pronto, as aplicações sobem de um repositório via CI, e um alerta pode abrir seu próprio pull request.',
    },
    tech: ['Docker Swarm', 'Traefik', 'GitHub Actions', 'OpenTelemetry', 'SigNoz', 'Prometheus', 'Grafana', 'Metabase'],
    role: { en: 'Head of Technology — design & implementation', 'pt-BR': 'Head de Tecnologia — design & implementação' },
    period: { en: 'Apr 2026 – Current', 'pt-BR': 'Abr 2026 – Atual' },
    venture: 'ulbra',
    visibility: 'private',
    links: [],
    detail: {
      overview: {
        en: 'The platform underneath every other system in this group. It began as on-premise servers with no automation at all — deployment meant a person on the machine, installing a runtime and starting the application by hand. It is now a provisioning script, a container orchestrator, a reverse proxy, two observability tools with a declared split, and a delivery loop in which an alert can investigate itself and open a pull request.',
        'pt-BR':
          'A plataforma sob todos os outros sistemas deste grupo. Começou como servidores on-premise sem nenhuma automação — publicar significava uma pessoa na máquina, instalando um runtime e subindo a aplicação na mão. Hoje é um script de provisionamento, um orquestrador de contêineres, um proxy reverso, duas ferramentas de observabilidade com uma divisão declarada e um ciclo de entrega em que um alerta pode investigar a si mesmo e abrir um pull request.',
      },
      contribution: {
        summary: {
          en: 'I designed and built the platform, and the delivery model that runs on it.',
          'pt-BR': 'Desenhei e construí a plataforma e o modelo de entrega que roda sobre ela.',
        },
        areas: [
          { en: 'The one-run provisioning script and the cluster it produces.', 'pt-BR': 'O script de provisionamento em uma execução e o cluster que ele produz.' },
          { en: 'The reverse proxy and the routing convention every application follows.', 'pt-BR': 'O proxy reverso e a convenção de roteamento que toda aplicação segue.' },
          { en: 'The split between application and host observability.', 'pt-BR': 'A divisão entre observabilidade de aplicação e de host.' },
          { en: 'The CI pipeline, and the alert-to-pull-request loop built on top of it.', 'pt-BR': 'O pipeline de CI e o ciclo alerta-para-pull-request construído sobre ele.' },
          { en: 'The delivery dashboard that reads the team’s own task tracker.', 'pt-BR': 'O painel de entrega que lê o próprio rastreador de tarefas do time.' },
        ],
      },
      problem: {
        en: 'Everything ran on-premise with nothing automated around it. Getting an application into production meant connecting to a server, installing a runtime and starting the process by hand — which makes every deployment a memory exercise, every server subtly different from the last, and every outage an archaeology problem. Nothing was measured, so nothing could be improved on purpose.',
        'pt-BR':
          'Tudo rodava on-premise sem nenhuma automação em volta. Colocar uma aplicação em produção significava conectar num servidor, instalar um runtime e subir o processo na mão — o que torna todo deploy um exercício de memória, todo servidor sutilmente diferente do anterior e toda queda um problema de arqueologia. Nada era medido, então nada podia ser melhorado de propósito.',
      },
      highlights: [
        {
          en: 'One script takes a bare server to ready: container runtime, firewall, cluster, overlay networks, proxy and monitoring.',
          'pt-BR':
            'Um script leva um servidor cru até pronto: runtime de contêiner, firewall, cluster, redes overlay, proxy e monitoramento.',
        },
        {
          en: 'A new application needs a compose file and a workflow — the routing and the certificate follow from labels.',
          'pt-BR':
            'Uma aplicação nova precisa de um compose e um workflow — o roteamento e o certificado saem dos labels.',
        },
        {
          en: 'Telemetry is opt-in through environment variables; nothing else has to be wired.',
          'pt-BR': 'A telemetria é opcional por variáveis de ambiente; nada mais precisa ser ligado.',
        },
        {
          en: 'An alert can be investigated automatically and arrive as a pull request for a human to judge.',
          'pt-BR':
            'Um alerta pode ser investigado automaticamente e chegar como um pull request para um humano julgar.',
        },
      ],
      architecture: {
        caption: { en: 'Provision once, then per application', 'pt-BR': 'Provisiona uma vez, depois por aplicação' },
        summary: {
          en: 'The server is set up in one run; after that, shipping an application is a repository and a pipeline.',
          'pt-BR':
            'O servidor é configurado numa execução; depois disso, publicar uma aplicação é um repositório e um pipeline.',
        },
        steps: [
          { label: 'Provision', detail: { en: 'One script: runtime, firewall, cluster, overlay networks.', 'pt-BR': 'Um script: runtime, firewall, cluster, redes overlay.' } },
          { label: 'Platform', detail: { en: 'Reverse proxy and the observability stacks come up with it.', 'pt-BR': 'O proxy reverso e as stacks de observabilidade sobem junto.' } },
          { label: 'Push', detail: { en: 'CI builds the image and pushes it to the registry.', 'pt-BR': 'A CI constrói a imagem e envia para o registry.' } },
          { label: 'Deploy', detail: { en: 'The pipeline deploys the stack; the proxy picks up the route from labels.', 'pt-BR': 'O pipeline publica a stack; o proxy pega a rota pelos labels.' } },
          { label: 'Observe', detail: { en: 'Traces, logs and metrics flow in from environment variables alone.', 'pt-BR': 'Traces, logs e métricas chegam só pelas variáveis de ambiente.' } },
        ],
      },
      states: {
        caption: { en: 'From an alert to a merged fix', 'pt-BR': 'De um alerta a uma correção mesclada' },
        summary: {
          en: 'What the team automated is the investigation, not the judgement.',
          'pt-BR': 'O que o time automatizou é a investigação, não o julgamento.',
        },
        steps: [
          { label: 'Alert', detail: { en: 'Application telemetry crosses a threshold.', 'pt-BR': 'A telemetria da aplicação cruza um limiar.' } },
          { label: 'Investigate', detail: { en: 'A coding agent reads the trace and the code around it.', 'pt-BR': 'Um agente de código lê o trace e o código em volta.' } },
          { label: 'Pull request', detail: { en: 'A proposed fix arrives as a normal change to review.', 'pt-BR': 'Uma correção proposta chega como uma mudança normal para revisar.' } },
          { label: 'Review', detail: { en: 'An engineer accepts, amends or rejects it.', 'pt-BR': 'Um engenheiro aceita, ajusta ou rejeita.' } },
          { label: 'Merge', detail: { en: 'The same pipeline every other change goes through.', 'pt-BR': 'O mesmo pipeline por onde passa qualquer outra mudança.' } },
        ],
      },
      script: {
        caption: { en: 'What an application declares', 'pt-BR': 'O que uma aplicação declara' },
        lines: [
          'services:',
          '  my-app:',
          '    image: registry.example.internal/my-app:latest',
          '    networks: [proxy, monitoring]',
          '    environment:',
          '      - OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4317',
          '      - OTEL_SERVICE_NAME=my-app',
          '    deploy:',
          '      labels:',
          '        - "traefik.enable=true"',
          '        - "traefik.http.routers.myapp.rule=Host(`my-app.example.internal`)"',
        ],
        note: {
          en: 'Hostnames are placeholders. Routing, certificates and telemetry all follow from this block — there is no second place to register an application.',
          'pt-BR':
            'Os hostnames são fictícios. Roteamento, certificados e telemetria saem todos deste bloco — não há um segundo lugar onde registrar uma aplicação.',
        },
      },
      decisions: [
        {
          heading: {
            en: 'Two observability tools, on a stated boundary',
            'pt-BR': 'Duas ferramentas de observabilidade, numa fronteira declarada',
          },
          body: {
            en: 'Application telemetry — logs, traces, metrics — goes to one tool over OpenTelemetry; host metrics like CPU, memory and disk stay in another. Running two looks like drift until you read the rule written into the configuration: applications do not report to the host stack. Each tool is good at one of the two jobs, and the alternative considered and rejected was one tool doing both badly.',
            'pt-BR':
              'A telemetria de aplicação — logs, traces, métricas — vai para uma ferramenta via OpenTelemetry; métricas de host como CPU, memória e disco ficam em outra. Manter as duas parece deriva até se ler a regra escrita na configuração: aplicações não reportam para a stack de host. Cada ferramenta é boa em um dos dois trabalhos, e a alternativa considerada e descartada era uma só fazendo os dois mal.',
          },
        },
        {
          heading: { en: 'Alerts investigate themselves; humans still merge', 'pt-BR': 'Alertas se investigam; humanos ainda mesclam' },
          body: {
            en: 'When application telemetry raises an alert, a coding agent reads the trace and the surrounding code and opens a pull request with a proposed fix. What was automated is the investigation — the part that is mechanical and slow at three in the morning. The merge is not automated, and deliberately so: a change nobody approved reaching production is a worse failure than a slow fix.',
            'pt-BR':
              'Quando a telemetria de aplicação dispara um alerta, um agente de código lê o trace e o código em volta e abre um pull request com uma correção proposta. O que foi automatizado é a investigação — a parte mecânica e lenta às três da manhã. O merge não é automatizado, e de propósito: uma mudança que ninguém aprovou chegando em produção é uma falha pior do que uma correção lenta.',
          },
        },
        {
          heading: { en: 'An orchestrator sized for the team', 'pt-BR': 'Um orquestrador do tamanho do time' },
          body: {
            en: 'Kubernetes was the default answer and was not taken. The cluster is small, on-premise, and operated by three engineers who are also writing six applications. Swarm gives multi-node scheduling, rolling updates and overlay networking with a fraction of the operational surface — and the cost of the ceiling it imposes is far below the cost of a control plane nobody has time to run.',
            'pt-BR':
              'Kubernetes era a resposta padrão e não foi adotado. O cluster é pequeno, on-premise, e operado por três engenheiros que também escrevem seis aplicações. O Swarm dá agendamento multi-nó, rolling update e rede overlay com uma fração da superfície operacional — e o custo do teto que ele impõe é muito menor que o de um control plane que ninguém tem tempo de operar.',
          },
        },
        {
          heading: { en: 'The team measures itself with its own pipeline', 'pt-BR': 'O time se mede com o próprio pipeline' },
          body: {
            en: 'A dashboard reads the team’s task tracker through an ETL sidecar, so delivery is visible in the same place the systems’ numbers are. It is a small piece of plumbing carrying a large claim: a working model that is measured can be argued about with evidence, and one that is only asserted cannot.',
            'pt-BR':
              'Um painel lê o rastreador de tarefas do time por um sidecar de ETL, então a entrega fica visível no mesmo lugar em que estão os números dos sistemas. É um encanamento pequeno carregando uma afirmação grande: um modelo de trabalho que é medido pode ser discutido com evidência, e um que é apenas afirmado, não.',
          },
        },
      ],
    },
  },
  {
    slug: 'airia-cloud-connector',
    name: 'Airia Cloud Connector',
    tagline: {
      en: 'A reverse tunnel that reaches into a private network without opening it.',
      'pt-BR': 'Um túnel reverso que alcança uma rede privada sem precisar abri-la.',
    },
    description: {
      en: 'A self-contained agent a customer installs inside its own network. It dials out to the cloud platform and holds the connection open, so the platform can call internal APIs, query internal databases and reach internal MCP servers — without a single inbound firewall rule.',
      'pt-BR':
        'Um agente autocontido que o cliente instala dentro da própria rede. Ele disca para fora, até a plataforma na nuvem, e mantém a conexão aberta — assim a plataforma consegue chamar APIs internas, consultar bancos internos e alcançar servidores MCP internos sem uma única regra de firewall de entrada.',
    },
    tech: ['.NET 9', 'SignalR', 'Redis', 'JWT', 'MCP', 'xUnit', 'Testcontainers', 'Helm'],
    role: {
      en: 'R&D Engineer — security, routing and command surface',
      'pt-BR': 'Engenheiro de P&D — segurança, roteamento e superfície de comandos',
    },
    period: { en: 'Jun 2025 – Oct 2025', 'pt-BR': 'Jun 2025 – Out 2025' },
    venture: 'airia',
    visibility: 'private',
    links: [],
    screenshot: '/screenshots/airia-cloud-connector.webp',
    detail: {
      overview: {
        en: 'A trimmed, single-file executable that runs inside a customer network and holds an outbound channel open to the cloud platform. Everything the platform needs on the other side of the firewall — an HTTP call, a database query, an MCP tool invocation — travels back down that one channel as a typed command.',
        'pt-BR':
          'Um executável único e trimado que roda dentro da rede do cliente e mantém um canal de saída aberto até a plataforma na nuvem. Tudo que a plataforma precisa do outro lado do firewall — uma chamada HTTP, uma consulta a banco, a execução de uma ferramenta MCP — volta por esse mesmo canal como um comando tipado.',
      },
      contribution: {
        summary: {
          en: 'I owned how the connector authenticates, how a request finds the right one, and what it is able to do once it gets there.',
          'pt-BR':
            'Fui responsável por como o conector se autentica, como uma requisição encontra o conector certo e o que ele consegue fazer depois que chega lá.',
        },
        areas: [
          {
            en: 'Mutual TLS between connector and hub — built, and switched off a week later.',
            'pt-BR': 'TLS mútuo entre conector e hub — construído, e desligado uma semana depois.',
          },
          {
            en: 'Routing — resolving which connector in which customer group answers a given request.',
            'pt-BR': 'Roteamento — resolver qual conector, em qual grupo de cliente, responde a uma dada requisição.',
          },
          {
            en: 'The database command type, for both relational engines and document stores.',
            'pt-BR': 'O tipo de comando de banco de dados, tanto para engines relacionais quanto para bancos de documentos.',
          },
          {
            en: 'MCP support: listing an internal server’s tools and executing them through the tunnel.',
            'pt-BR': 'Suporte a MCP: listar as ferramentas de um servidor interno e executá-las pelo túnel.',
          },
          {
            en: 'Per-environment release packaging, and installation as a native Windows service.',
            'pt-BR': 'Empacotamento de release por ambiente e instalação como serviço nativo do Windows.',
          },
        ],
        boundary: {
          en: 'The repository predates me by three months and several engineers shared it; the hub’s browser-agent surface is someone else’s work.',
          'pt-BR':
            'O repositório é três meses mais velho que minha entrada e vários engenheiros dividiam ele; a superfície de browser agent do hub é trabalho de outra pessoa.',
        },
      },
      problem: {
        en: 'An enterprise buys a cloud AI platform, and then the agents it builds there need the systems that actually hold its data — a database, an internal API, an MCP server — all of which sit behind its firewall. The standard answers are a VPN, a site-to-site tunnel, or an inbound rule for the vendor’s address range, and each one asks a security team to open the perimeter for software it does not run. The connector inverts the direction instead: nothing dials in, so there is nothing to open.',
        'pt-BR':
          'Uma empresa contrata uma plataforma de IA na nuvem, e aí os agentes que ela constrói lá precisam dos sistemas que de fato guardam seus dados — um banco, uma API interna, um servidor MCP — todos atrás do firewall dela. As respostas padrão são VPN, túnel site-to-site ou uma regra de entrada para a faixa de endereços do fornecedor, e cada uma pede que o time de segurança abra o perímetro para um software que não é dele. O conector inverte o sentido: nada disca para dentro, então não há o que abrir.',
      },
      architecture: {
        summary: {
          en: 'The connector opens a SignalR connection outward and registers itself under a customer group. The hub keeps that registry in Redis rather than in memory, so any hub instance can find any connector and correlate the reply — which is what lets the hub scale horizontally behind a load balancer. A platform request becomes a typed command envelope, is pushed down the connector’s channel, executed against whatever is on the private side, and the response is tracked back to the instance still holding the caller.',
          'pt-BR':
            'O conector abre uma conexão SignalR para fora e se registra sob um grupo de cliente. O hub guarda esse registro no Redis em vez de em memória, então qualquer instância do hub encontra qualquer conector e correlaciona a resposta — que é o que permite escalar o hub horizontalmente atrás de um balanceador. Uma requisição da plataforma vira um envelope de comando tipado, é empurrada pelo canal do conector, executada contra o que existe do lado privado, e a resposta é rastreada de volta até a instância que ainda segura quem chamou.',
        },
        steps: [
          {
            label: 'Airia platform',
            detail: {
              en: 'Issues an ordinary HTTP request, addressed to a customer group rather than to a host.',
              'pt-BR': 'Emite uma requisição HTTP comum, endereçada a um grupo de cliente e não a um host.',
            },
          },
          {
            label: 'Cloud Hub',
            detail: {
              en: 'Wraps it as a typed command and looks up which connector should answer.',
              'pt-BR': 'Empacota como comando tipado e descobre qual conector deve responder.',
            },
          },
          {
            label: 'Redis registry',
            detail: {
              en: 'Holds the connector-to-instance map and the pending responses, so the hub can run as more than one replica.',
              'pt-BR':
                'Guarda o mapa conector-instância e as respostas pendentes, então o hub pode rodar com mais de uma réplica.',
            },
          },
          {
            label: 'Connector',
            detail: {
              en: 'Receives the command on the channel it already opened, from inside the customer network.',
              'pt-BR': 'Recebe o comando no canal que ele mesmo já abriu, de dentro da rede do cliente.',
            },
          },
          {
            label: 'Internal service',
            detail: {
              en: 'The API, database or MCP server that never became reachable from outside.',
              'pt-BR': 'A API, o banco ou o servidor MCP que nunca se tornou alcançável de fora.',
            },
          },
        ],
      },
      table: {
        caption: { en: 'What travels down the channel', 'pt-BR': 'O que trafega pelo canal' },
        columns: [
          { en: 'Command', 'pt-BR': 'Comando' },
          { en: 'What the platform asks for', 'pt-BR': 'O que a plataforma pede' },
        ],
        rows: [
          ['Http', 'Call an internal API and return the response'],
          ['Database', 'Run a query, or read the schema first'],
          ['McpServerInfo', 'List the tools an internal MCP server exposes'],
          ['McpToolExecution', 'Invoke one of those tools by name'],
          ['SystemInfo', 'Report the connector’s own health and version'],
        ],
        note: {
          en: 'Adding a capability means adding a command type, not another proxy.',
          'pt-BR': 'Somar uma capacidade é somar um tipo de comando, não outro proxy.',
        },
      },
      highlights: [
        {
          en: 'Outbound-only: the connector dials the cloud, never the other way round.',
          'pt-BR': 'Só saída: o conector disca para a nuvem, nunca o contrário.',
        },
        {
          en: 'Integration tests run against a real Redis through Testcontainers, not a fake.',
          'pt-BR': 'Os testes de integração rodam contra um Redis real via Testcontainers, não contra um fake.',
        },
        {
          en: 'Queries relational engines and document stores on the private side, schema included.',
          'pt-BR': 'Consulta engines relacionais e bancos de documentos do lado privado, schema incluído.',
        },
        {
          en: 'Exposes an internal MCP server’s tools to the platform through the same tunnel.',
          'pt-BR': 'Expõe as ferramentas de um servidor MCP interno para a plataforma pelo mesmo túnel.',
        },
        {
          en: 'Ships as one trimmed, self-contained executable, installable as a Windows service.',
          'pt-BR': 'Distribuído como um executável único, trimado e autocontido, instalável como serviço do Windows.',
        },
      ],
      decisions: [
        {
          heading: {
            en: 'Invert the direction rather than open the perimeter',
            'pt-BR': 'Inverter o sentido em vez de abrir o perímetro',
          },
          body: {
            en: 'A persistent outbound connection does everything an inbound rule would, and asks the customer for nothing their egress policy does not already allow. The security review this avoids is not a small one: it is the difference between a deployment a network team approves in an afternoon and one that spends a quarter in committee.',
            'pt-BR':
              'Uma conexão de saída persistente faz tudo o que uma regra de entrada faria, e não pede ao cliente nada que a política de egresso dele já não permita. A revisão de segurança que isso evita não é pequena: é a diferença entre um deploy que o time de rede aprova numa tarde e um que passa um trimestre em comitê.',
          },
        },
        {
          heading: {
            en: 'Mutual TLS, built and then switched off',
            'pt-BR': 'TLS mútuo, construído e depois desligado',
          },
          body: {
            en: 'A bearer token proves the connector to the hub and does nothing to prove the hub to the connector, so client certificates went on both ends, with an explicit clock-skew allowance and a readable error in place of a raw handshake failure. It lasted a week. I merged the change that disabled it myself, the certificate requirement was dropped the next day, and the wiring is still commented out on both sides — the reason is not recorded anywhere I can point to, and I am not going to reconstruct one. What ships is bearer tokens over TLS. The honest lesson is not about the cryptography: a security control that a customer’s ops team has to hold up their end of is only as real as the certificate distribution nobody had built yet.',
            'pt-BR':
              'Um bearer token prova o conector para o hub e não prova nada do hub para o conector, então certificados de cliente entraram nas duas pontas, com uma tolerância explícita de desvio de relógio e um erro legível no lugar de uma falha crua de handshake. Durou uma semana. Fui eu mesmo que mergeei a mudança que desligou isso, a exigência de certificado caiu no dia seguinte, e o wiring segue comentado dos dois lados — o motivo não está registrado em lugar nenhum que eu possa apontar, e não vou reconstruir um. O que vai para produção é bearer token sobre TLS. A lição honesta não é sobre criptografia: um controle de segurança que depende do time de operações do cliente segurar a outra ponta só é tão real quanto a distribuição de certificados que ninguém tinha construído ainda.',
          },
        },
        {
          heading: {
            en: 'The connector registry lives in Redis, not in the hub’s memory',
            'pt-BR': 'O registro de conectores vive no Redis, não na memória do hub',
          },
          body: {
            en: 'A connector is attached to exactly one hub instance, but a platform request can land on any of them. Keeping the registry and the pending responses in Redis means the instance that receives a request can route it to the instance holding the connection, and the reply finds its way back. Without that, the hub is pinned to a single replica — a strange thing to accept in the one component every customer’s traffic passes through.',
            'pt-BR':
              'Um conector está preso a exatamente uma instância do hub, mas uma requisição da plataforma pode cair em qualquer uma. Manter o registro e as respostas pendentes no Redis faz com que a instância que recebe a requisição consiga roteá-la até a instância que segura a conexão, e a resposta encontra o caminho de volta. Sem isso, o hub fica preso a uma réplica só — coisa estranha de aceitar no único componente por onde passa o tráfego de todo cliente.',
          },
        },
        {
          heading: {
            en: 'One command envelope instead of a proxy per capability',
            'pt-BR': 'Um envelope de comando único em vez de um proxy por capacidade',
          },
          body: {
            en: 'HTTP came first, and databases and MCP could each have been a second tunnel with its own lifecycle. Making them command types on the existing channel meant authentication, routing, reconnection and response correlation were solved once. When MCP support was added, none of that had to be rebuilt — it was a new command type and a handler.',
            'pt-BR':
              'HTTP veio primeiro, e banco e MCP poderiam cada um ter virado um segundo túnel com ciclo de vida próprio. Torná-los tipos de comando no canal já existente fez com que autenticação, roteamento, reconexão e correlação de resposta fossem resolvidos uma vez só. Quando o suporte a MCP entrou, nada disso precisou ser refeito — foi um novo tipo de comando e um handler.',
          },
        },
        {
          heading: {
            en: 'A trimmed single file, and the serializer that requires',
            'pt-BR': 'Um arquivo único trimado, e o serializador que isso exige',
          },
          body: {
            en: 'The connector is installed by someone else’s ops team on a machine nobody on the vendor side can log into, so it ships self-contained: no runtime to install, one file to copy, and later a native Windows service so it survives a reboot without a human. Trimming that binary breaks reflection-based JSON, which is why the command envelope is serialized through a source-generated context — an unglamorous constraint that follows directly from choosing a deployment the customer can actually operate.',
            'pt-BR':
              'O conector é instalado pelo time de operações de outra empresa, numa máquina em que ninguém do lado do fornecedor consegue entrar, então ele é distribuído autocontido: sem runtime para instalar, um arquivo para copiar e, depois, um serviço nativo do Windows para sobreviver a um reboot sem humano. Trimar esse binário quebra JSON baseado em reflexão, e é por isso que o envelope de comando é serializado por um contexto gerado em tempo de compilação — uma restrição sem glamour que decorre direto de escolher um deploy que o cliente consiga de fato operar.',
          },
        },
      ],
    },
  },
  {
    slug: 'airia-datastores',
    name: 'Airia.DataStores.Common',
    tagline: {
      en: 'One query surface over six database engines, shipped as a package.',
      'pt-BR': 'Uma superfície de consulta única sobre seis engines de banco, entregue como pacote.',
    },
    description: {
      en: 'A .NET library that puts relational engines and a document store behind one interface: run a query, read the schema, pool the connections. Written so the cloud connector and the platform consume the same build instead of maintaining two drifting copies of the same provider matrix.',
      'pt-BR':
        'Uma biblioteca .NET que coloca engines relacionais e um banco de documentos atrás de uma interface só: executar consulta, ler schema, gerenciar pool de conexões. Escrita para que o conector de nuvem e a plataforma consumam o mesmo build, em vez de manter duas cópias divergentes da mesma matriz de provedores.',
    },
    tech: ['.NET 9', 'PostgreSQL', 'SQL Server', 'MySQL', 'Snowflake', 'Databricks', 'MongoDB', 'xUnit'],
    role: {
      en: 'R&D Engineer — author, from the first commit',
      'pt-BR': 'Engenheiro de P&D — autor, desde o primeiro commit',
    },
    period: { en: 'Jul 2025 – Oct 2025', 'pt-BR': 'Jul 2025 – Out 2025' },
    venture: 'airia',
    visibility: 'private',
    links: [],
    screenshot: '/screenshots/airia-datastores.webp',
    detail: {
      overview: {
        en: 'A shared library that answers one question for every database an enterprise might point at an AI agent: how do you run a query and read a schema without the caller knowing which engine it is talking to.',
        'pt-BR':
          'Uma biblioteca compartilhada que responde a uma única pergunta para cada banco que uma empresa possa apontar para um agente de IA: como executar uma consulta e ler um schema sem que quem chama saiba com qual engine está falando.',
      },
      contribution: {
        summary: {
          en: 'I started this repository and wrote its first version — the interfaces, the providers, the pooling and the package pipeline that publishes it.',
          'pt-BR':
            'Eu abri este repositório e escrevi sua primeira versão — as interfaces, os provedores, o pooling e o pipeline de pacote que publica tudo.',
        },
        areas: [
          {
            en: 'The provider interface, and the relational implementations behind it.',
            'pt-BR': 'A interface de provedor e as implementações relacionais atrás dela.',
          },
          {
            en: 'Schema metadata retrieval, as part of the contract rather than an extra.',
            'pt-BR': 'A leitura de metadados de schema, como parte do contrato e não como extra.',
          },
          {
            en: 'Connection pooling and the factory that hands out pooled stores.',
            'pt-BR': 'O pooling de conexões e a factory que entrega stores do pool.',
          },
          {
            en: 'The document-store provider and its client wrapper.',
            'pt-BR': 'O provedor de banco de documentos e o wrapper de cliente dele.',
          },
          {
            en: 'Unit tests and the publish workflow that versions the package.',
            'pt-BR': 'Testes unitários e o workflow de publicação que versiona o pacote.',
          },
        ],
        boundary: {
          en: 'Other engineers added providers and fixes on top of it after the first release.',
          'pt-BR': 'Outros engenheiros somaram provedores e correções em cima disso depois do primeiro release.',
        },
      },
      problem: {
        en: 'The connector needed to query whatever database a customer happened to run, and the platform needed exactly the same thing from its own side. Written twice, that is two provider matrices, two sets of connection-string quirks and two places for a TLS default to be wrong — and they drift, because nobody fixes a bug in the copy they are not looking at.',
        'pt-BR':
          'O conector precisava consultar qualquer banco que o cliente por acaso rodasse, e a plataforma precisava exatamente do mesmo do lado dela. Escrito duas vezes, isso são duas matrizes de provedores, dois conjuntos de manias de connection string e dois lugares para um default de TLS estar errado — e eles divergem, porque ninguém corrige um bug na cópia que não está olhando.',
      },
      architecture: {
        summary: {
          en: 'A caller asks a factory for a store of a given type and hands it connection parameters as a dictionary rather than a pre-built connection string, so nothing upstream has to know each engine’s spelling. The factory returns a pooled store; the store exposes the same two operations — execute a query, describe the tables — whatever driver is underneath. Document stores get a sibling interface, because pretending a collection is a table would be a lie the caller eventually pays for.',
          'pt-BR':
            'Quem chama pede à factory um store de um tipo, entregando os parâmetros de conexão como um dicionário em vez de uma connection string pronta, então nada acima precisa conhecer a grafia de cada engine. A factory devolve um store do pool; o store expõe as mesmas duas operações — executar consulta, descrever tabelas — seja qual for o driver embaixo. Bancos de documentos ganham uma interface irmã, porque fingir que uma coleção é uma tabela seria uma mentira que quem chama acaba pagando.',
        },
        steps: [
          {
            label: 'Caller',
            detail: {
              en: 'The connector or the platform, holding connection parameters and a query.',
              'pt-BR': 'O conector ou a plataforma, com os parâmetros de conexão e uma consulta.',
            },
          },
          {
            label: 'Factory',
            detail: {
              en: 'Resolves the engine type to an implementation.',
              'pt-BR': 'Resolve o tipo de engine para uma implementação.',
            },
          },
          {
            label: 'Connection pool',
            detail: {
              en: 'Hands back a live store and reclaims it after use, capped per configuration.',
              'pt-BR': 'Devolve um store vivo e o recolhe depois do uso, com teto por configuração.',
            },
          },
          {
            label: 'Store',
            detail: {
              en: 'Two operations only: execute a query, describe the tables.',
              'pt-BR': 'Só duas operações: executar consulta, descrever tabelas.',
            },
          },
          {
            label: 'Engine driver',
            detail: {
              en: 'The vendor client, and the only place an engine’s quirks are allowed to live.',
              'pt-BR': 'O cliente do fornecedor, e o único lugar onde as manias de cada engine podem morar.',
            },
          },
        ],
      },
      table: {
        caption: { en: 'Engines behind the one interface', 'pt-BR': 'Engines atrás da interface única' },
        columns: [
          { en: 'Engine', 'pt-BR': 'Engine' },
          { en: 'Family', 'pt-BR': 'Família' },
        ],
        rows: [
          ['PostgreSQL', 'Relational'],
          ['SQL Server', 'Relational'],
          ['MySQL', 'Relational'],
          ['Snowflake', 'Warehouse'],
          ['Databricks', 'Warehouse'],
          ['MongoDB', 'Document'],
        ],
        note: {
          en: 'Warehouses answer the same interface as the relational engines; the document store has its own.',
          'pt-BR':
            'Os warehouses respondem à mesma interface das engines relacionais; o banco de documentos tem a sua.',
        },
      },
      highlights: [
        {
          en: 'Six engines behind one interface, with the document store kept honestly separate.',
          'pt-BR': 'Seis engines atrás de uma interface, com o banco de documentos honestamente separado.',
        },
        {
          en: 'Schema description is part of the contract, not something bolted on later.',
          'pt-BR': 'Descrever o schema faz parte do contrato, não é algo pregado depois.',
        },
        {
          en: 'Connection pooling behind the factory, so no caller manages a lifetime it did not open.',
          'pt-BR':
            'Pooling de conexões atrás da factory, então quem chama não gerencia um ciclo de vida que não abriu.',
        },
        {
          en: 'Connection parameters as a dictionary — the library, not the caller, knows each engine’s spelling.',
          'pt-BR':
            'Parâmetros de conexão como dicionário — a biblioteca, não quem chama, conhece a grafia de cada engine.',
        },
        {
          en: 'Published as a versioned package, consumed by both the connector and the platform.',
          'pt-BR': 'Publicada como pacote versionado, consumida tanto pelo conector quanto pela plataforma.',
        },
      ],
      decisions: [
        {
          heading: {
            en: 'Reading the schema is part of the interface',
            'pt-BR': 'Ler o schema faz parte da interface',
          },
          body: {
            en: 'A human writing SQL already knows the tables. A model does not, and asking it to guess produces queries that fail in ways that look like the database is broken. Making schema description a first-class operation alongside query execution is what turns the library from a connection helper into something an agent can actually be pointed at.',
            'pt-BR':
              'Uma pessoa escrevendo SQL já conhece as tabelas. Um modelo não, e pedir que ele adivinhe produz consultas que falham de um jeito que parece banco quebrado. Tornar a descrição de schema uma operação de primeira classe ao lado da execução de consulta é o que transforma a biblioteca de um utilitário de conexão em algo para o qual um agente pode de fato ser apontado.',
          },
        },
        {
          heading: {
            en: 'Parameters as a dictionary, never a connection string',
            'pt-BR': 'Parâmetros como dicionário, nunca connection string',
          },
          body: {
            en: 'Every engine spells the same idea differently — host versus server, the port that is implied, how encryption is requested. Accepting a built string would push that trivia into every caller and, worse, make each caller responsible for the security defaults. Taking a dictionary keeps one place where a wrong default can be fixed for everybody.',
            'pt-BR':
              'Cada engine escreve a mesma ideia de um jeito — host ou server, a porta que fica implícita, como a criptografia é pedida. Aceitar uma string pronta empurraria essa trivialidade para dentro de cada chamador e, pior, tornaria cada chamador responsável pelos defaults de segurança. Receber um dicionário mantém um lugar só onde um default errado pode ser corrigido para todo mundo.',
          },
        },
        {
          heading: {
            en: 'A published package, not shared source',
            'pt-BR': 'Um pacote publicado, não código compartilhado',
          },
          body: {
            en: 'The connector and the platform are separate repositories on separate release cadences. Copying the source would have been faster on day one and would have guaranteed divergence by month two. A versioned package makes the shared thing an actual dependency: an upgrade is a deliberate act with a number attached, and a fix reaches both consumers or neither.',
            'pt-BR':
              'O conector e a plataforma são repositórios separados, com cadências de release separadas. Copiar o código teria sido mais rápido no primeiro dia e teria garantido divergência no segundo mês. Um pacote versionado torna a coisa compartilhada uma dependência de verdade: atualizar é um ato deliberado com um número junto, e uma correção chega aos dois consumidores ou a nenhum.',
          },
        },
        {
          heading: {
            en: 'Pooling belongs to the library, and its ceiling is configuration',
            'pt-BR': 'O pooling pertence à biblioteca, e seu teto é configuração',
          },
          body: {
            en: 'Callers that open connections directly leak them under load, and the leak surfaces as an unrelated timeout somewhere else. Putting the pool behind the factory makes the correct thing the default thing. The maximum is a setting rather than a constant because the right ceiling for a connector on one customer machine is not the right ceiling for the platform — and the first default shipped turned out to be too low, and was raised five-fold.',
            'pt-BR':
              'Quem abre conexão direto vaza conexão sob carga, e o vazamento aparece como um timeout sem relação em outro lugar. Colocar o pool atrás da factory faz da coisa certa a coisa padrão. O máximo é configuração e não constante porque o teto certo para um conector numa máquina de cliente não é o teto certo para a plataforma — e o primeiro default entregue se mostrou baixo demais, e foi multiplicado por cinco.',
          },
        },
      ],
    },
  },
  {
    slug: 'airia-spm',
    name: 'Secure Posture Management',
    tagline: {
      en: 'An inventory of every AI agent an enterprise is already running.',
      'pt-BR': 'Um inventário de cada agente de IA que a empresa já está rodando.',
    },
    description: {
      en: 'The part of the platform that connects to the places AI actually runs — workflow automation tools, cloud model services, assistant builders — and turns what it finds into an inventory of agents and components, each carrying its own risk and a feed of policy violations.',
      'pt-BR':
        'A parte da plataforma que se conecta aos lugares onde a IA de fato roda — ferramentas de automação de workflow, serviços de modelo em nuvem, construtores de assistente — e transforma o que encontra num inventário de agentes e componentes, cada um carregando seu risco e um feed de violações de política.',
    },
    tech: ['.NET 9', 'Entity Framework Core', 'PostgreSQL', 'Azure AI Foundry', 'AWS Bedrock', 'xUnit'],
    role: {
      en: 'R&D Engineer — domain model, persistence and a provider',
      'pt-BR': 'Engenheiro de P&D — modelo de domínio, persistência e um provedor',
    },
    period: { en: 'Jul 2025 – Oct 2025', 'pt-BR': 'Jul 2025 – Out 2025' },
    venture: 'airia',
    visibility: 'private',
    links: [],
    screenshot: '/screenshots/airia-spm.webp',
    detail: {
      overview: {
        en: 'Posture management inside the platform: a set of provider connections that are refreshed on a schedule, the agents and components they discover, and the violations feed that says which of them did something a policy forbids.',
        'pt-BR':
          'Gestão de postura dentro da plataforma: um conjunto de conexões com provedores que são atualizadas em um agendamento, os agentes e componentes que elas descobrem e o feed de violações que diz qual deles fez algo que uma política proíbe.',
      },
      contribution: {
        summary: {
          en: 'I built the domain model and the persistence under this feature, and added one of the cloud providers it discovers through.',
          'pt-BR':
            'Construí o modelo de domínio e a persistência sob esta funcionalidade, e adicionei um dos provedores de nuvem por onde ela descobre.',
        },
        areas: [
          {
            en: 'The entities — connection, agent, component, settings — and their database context.',
            'pt-BR': 'As entidades — conexão, agente, componente, configurações — e seu contexto de banco.',
          },
          {
            en: 'A repository layer over that context, so query logic stopped living in services.',
            'pt-BR':
              'Uma camada de repositório sobre esse contexto, para que a lógica de consulta parasse de morar nos serviços.',
          },
          {
            en: 'The Azure model-service provider, alongside the ones already supported.',
            'pt-BR': 'O provedor de serviço de modelos da Azure, ao lado dos que já eram suportados.',
          },
          {
            en: 'An execution identifier on the violations feed, tying a violation to the run behind it.',
            'pt-BR':
              'Um identificador de execução no feed de violações, ligando uma violação à execução por trás dela.',
          },
        ],
        boundary: {
          en: 'This was a large feature owned across several teams — the discovery scanners, the risk scoring and the interface were other people’s work. Mine is the layer they read and write through.',
          'pt-BR':
            'Esta era uma funcionalidade grande, dividida entre vários times — os scanners de descoberta, a pontuação de risco e a interface eram trabalho de outras pessoas. O meu é a camada por onde elas leem e escrevem.',
        },
      },
      problem: {
        en: 'An enterprise does not adopt AI in one place. It arrives through a workflow automation tool one team installed, a cloud model service another team already pays for, an assistant builder bundled into software it licenses, and personal subscriptions nobody approved. Governing that starts with a list, and before this feature there was no list — only the parts each team happened to know about.',
        'pt-BR':
          'Uma empresa não adota IA num lugar só. Ela chega por uma ferramenta de automação de workflow que um time instalou, por um serviço de modelos em nuvem que outro time já paga, por um construtor de assistentes embutido num software licenciado e por assinaturas pessoais que ninguém aprovou. Governar isso começa por uma lista, e antes desta funcionalidade não havia lista — só as partes que cada time por acaso conhecia.',
      },
      architecture: {
        summary: {
          en: 'A tenant configures a connection per provider, each with its own typed configuration rather than a shared bag of settings. A scheduled job refreshes those connections and writes back what it found as components and agents, so the inventory has an age rather than being whatever the last person clicked. The violations feed sits on top and, since this work, carries the execution identifier that links a violation to the run that produced it.',
          'pt-BR':
            'Um tenant configura uma conexão por provedor, cada uma com sua configuração tipada em vez de um saco compartilhado de opções. Um job agendado atualiza essas conexões e grava o que encontrou como componentes e agentes, então o inventário tem uma idade em vez de ser o que a última pessoa clicou. O feed de violações fica por cima e, desde este trabalho, carrega o identificador de execução que liga uma violação à execução que a produziu.',
        },
        steps: [
          {
            label: 'Provider connection',
            detail: {
              en: 'One per platform an enterprise runs AI on, each with a typed configuration of its own.',
              'pt-BR': 'Uma por plataforma em que a empresa roda IA, cada uma com uma configuração tipada própria.',
            },
          },
          {
            label: 'Scheduled refresh',
            detail: {
              en: 'Re-reads every connection on a timer, so the inventory ages instead of going stale silently.',
              'pt-BR':
                'Relê cada conexão num temporizador, então o inventário envelhece em vez de ficar obsoleto em silêncio.',
            },
          },
          {
            label: 'Components and agents',
            detail: {
              en: 'What was discovered, persisted through a repository layer rather than ad-hoc queries.',
              'pt-BR':
                'O que foi descoberto, persistido por uma camada de repositório em vez de consultas ad-hoc.',
            },
          },
          {
            label: 'Violations feed',
            detail: {
              en: 'What broke a policy, each row traceable to the execution that caused it.',
              'pt-BR': 'O que quebrou uma política, cada linha rastreável até a execução que a causou.',
            },
          },
        ],
      },
      highlights: [
        {
          en: 'Discovery across several agent platforms, each behind its own typed connection.',
          'pt-BR': 'Descoberta em várias plataformas de agentes, cada uma atrás de uma conexão tipada própria.',
        },
        {
          en: 'A scheduled refresh, so the inventory has a known age.',
          'pt-BR': 'Uma atualização agendada, para que o inventário tenha uma idade conhecida.',
        },
        {
          en: 'A repository layer over the database context, keeping query logic out of services.',
          'pt-BR':
            'Uma camada de repositório sobre o contexto de banco, mantendo a lógica de consulta fora dos serviços.',
        },
        {
          en: 'Violations traceable to the execution that produced them.',
          'pt-BR': 'Violações rastreáveis até a execução que as produziu.',
        },
      ],
      decisions: [
        {
          heading: {
            en: 'A typed configuration per provider, not one settings blob',
            'pt-BR': 'Uma configuração tipada por provedor, não um blob de configurações',
          },
          body: {
            en: 'Every provider authenticates differently and exposes a different shape of thing to discover. A single loosely-typed settings object would have made every consumer guess which keys apply to which provider, and made adding one a matter of hoping nothing downstream cared. A closed set of typed configurations means the compiler names the work required to support a new platform.',
            'pt-BR':
              'Cada provedor autentica de um jeito e expõe um formato diferente de coisa a descobrir. Um único objeto de configuração fracamente tipado faria cada consumidor adivinhar quais chaves valem para qual provedor, e somar um provedor viraria torcer para nada lá na frente se importar. Um conjunto fechado de configurações tipadas faz o compilador nomear o trabalho necessário para suportar uma plataforma nova.',
          },
        },
        {
          heading: {
            en: 'A repository layer, added after the fact and on purpose',
            'pt-BR': 'Uma camada de repositório, acrescentada depois e de propósito',
          },
          body: {
            en: 'The first version queried the database context straight from the services, which is fine until three teams are writing services against the same entities and each invents its own idea of what "the agents for this tenant" means. Moving those queries behind repositories gave the feature one definition of each read, and gave the unit tests something to stand on that is not a database.',
            'pt-BR':
              'A primeira versão consultava o contexto de banco direto dos serviços, o que funciona até três times estarem escrevendo serviços sobre as mesmas entidades e cada um inventar sua própria ideia do que significa "os agentes deste tenant". Mover essas consultas para trás de repositórios deu à funcionalidade uma definição única de cada leitura, e deu aos testes unitários algo em que se apoiar que não é um banco.',
          },
        },
        {
          heading: {
            en: 'A scheduled refresh instead of a webhook per provider',
            'pt-BR': 'Atualização agendada em vez de um webhook por provedor',
          },
          body: {
            en: 'Webhooks would be fresher, and would require every provider to support them, every customer to configure them, and the platform to be reachable from each one — which is the same perimeter problem the connector exists to avoid. Polling on a schedule is less elegant and works everywhere, and an inventory whose age is known is more useful than one that is silently missing whatever event was dropped.',
            'pt-BR':
              'Webhooks seriam mais frescos, e exigiriam que todo provedor os suportasse, que todo cliente os configurasse e que a plataforma fosse alcançável a partir de cada um — que é o mesmo problema de perímetro que o conector existe para evitar. Consultar num agendamento é menos elegante e funciona em todo lugar, e um inventário cuja idade se conhece é mais útil que um a que falta, em silêncio, o evento que se perdeu.',
          },
        },
        {
          heading: {
            en: 'A violation you can trace to a run',
            'pt-BR': 'Uma violação que dá para rastrear até uma execução',
          },
          body: {
            en: 'A feed saying a policy was broken is an alert; a feed saying which execution broke it is an investigation. Carrying the execution identifier through to the violation row is a one-column change that moves the feed from something a security team watches to something they can act on.',
            'pt-BR':
              'Um feed dizendo que uma política foi quebrada é um alerta; um feed dizendo qual execução quebrou é uma investigação. Levar o identificador de execução até a linha da violação é uma mudança de uma coluna que tira o feed do lugar de algo que o time de segurança observa e o coloca no de algo sobre o que consegue agir.',
          },
        },
      ],
    },
  },
  {
    slug: 'dell-automated-caller',
    name: 'Dell Automated Caller',
    tagline: {
      en: 'Automated end-to-end testing for a phone system.',
      'pt-BR': 'Teste end-to-end automatizado de um sistema de telefonia.',
    },
    description: {
      en: 'An internal tool that tests an interactive voice system by actually calling it: a script drives a real phone call, the spoken responses are transcribed and checked against what the script expected, and the outcome is reported back into the test-management tool.',
      'pt-BR':
        'Uma ferramenta interna que testa uma URA ligando de verdade para ela: um roteiro conduz uma chamada real, as respostas faladas são transcritas e conferidas contra o que o roteiro esperava, e o resultado volta para a ferramenta de gestão de testes.',
    },
    tech: ['.NET Core', 'RabbitMQ', 'Entity Framework', 'Twilio', 'xUnit'],
    role: {
      en: 'Conception, architecture and implementation',
      'pt-BR': 'Concepção, arquitetura e implementação',
    },
    period: { en: '2020', 'pt-BR': '2020' },
    visibility: 'private',
    screenshot: '/screenshots/dell-automated-caller.webp',
    links: [],
    detail: {
      overview: {
        en: "An internal tool that tests an interactive voice system by actually calling it — the test suite dials the phone menu, listens to what it says, and checks it against what was expected, then files the result alongside the rest of the suite.",
        'pt-BR':
          'Uma ferramenta interna que testa uma URA ligando de verdade para ela — a suíte disca o menu telefônico, ouve o que ele diz, confere contra o esperado e registra o resultado junto com o resto da suíte.',
      },
      contribution: {
        summary: {
          en: 'I conceived the tool and built it, and later mentored the junior engineer who joined the project.',
          'pt-BR':
            'Concebi a ferramenta e a construí, e depois fui mentor do engenheiro júnior que entrou no projeto.',
        },
        areas: [
          { en: 'The test scripting language and the validator that rejects a bad script before it costs a call.', 'pt-BR': 'A linguagem de roteiro de teste e o validador que rejeita roteiro ruim antes de custar uma ligação.' },
          { en: 'Similarity-based assertion, with the threshold declared per step.', 'pt-BR': 'Asserção por similaridade, com o limiar declarado em cada passo.' },
          { en: 'The queue between the request and the call.', 'pt-BR': 'A fila entre a requisição e a ligação.' },
          { en: 'The telephony integration and the webhook that carries each transcribed response back.', 'pt-BR': 'A integração de telefonia e o webhook que traz cada resposta transcrita de volta.' },
          { en: 'Reporting results back into the test-management tool.', 'pt-BR': 'O reporte dos resultados de volta para a ferramenta de gestão de testes.' },
        ],
      },
      problem: {
        en: 'Testing a phone menu meant someone dialling it, pressing the keys, listening to what the system said, and writing down whether it was right — once per scenario, per language, per route. A full cycle was over twenty thousand calls placed by hand across the team, which in practice meant the full cycle almost never ran. Automating it brought the cycle down to about three hours.',
        'pt-BR':
          'Testar um menu telefônico significava alguém discar, apertar as teclas, ouvir o que o sistema dizia e anotar se estava certo — uma vez por cenário, por idioma, por rota. Um ciclo completo eram mais de vinte mil ligações feitas à mão pelo time, o que na prática significava que o ciclo completo quase nunca rodava. Automatizar reduziu o ciclo para cerca de três horas.',
      },
      metricsNote: {
        en: 'Call volume and cycle time as recalled from the project; the command count is verifiable in source.',
        'pt-BR':
          'Volume de ligações e tempo de ciclo conforme lembrados do projeto; a contagem de comandos é verificável no código.',
      },
      metrics: [
        {
          value: { en: '20k+', 'pt-BR': '20 mil+' },
          label: { en: 'calls per test cycle', 'pt-BR': 'ligações por ciclo de teste' },
          note: {
            en: 'previously placed one at a time, by hand across the team',
            'pt-BR': 'antes, uma a uma, à mão, pelo time',
          },
        },
        {
          value: { en: '~3h', 'pt-BR': '~3h' },
          label: { en: 'to run the full cycle', 'pt-BR': 'para rodar o ciclo inteiro' },
          note: { en: 'it had taken about a month', 'pt-BR': 'antes levava cerca de um mês' },
        },
        {
          value: { en: '9', 'pt-BR': '9' },
          label: { en: 'commands in the test DSL', 'pt-BR': 'comandos na DSL de teste' },
          note: {
            en: 'the script is validated before anything is dialled',
            'pt-BR': 'o roteiro é validado antes de qualquer discagem',
          },
        },
      ],
      architecture: {
        summary: {
          en: 'A .NET Core service in DDD layers. The API accepts a script; a validator rejects a malformed one before a call is placed; the run is dispatched over a RabbitMQ publish/subscribe queue; a telephony provider places the call and posts each transcribed response back by webhook; the response is scored against what the script expected; and the outcome is written back to the test-management tool against its plan, suite and work-item identifiers.',
          'pt-BR':
            'Um serviço .NET Core em camadas DDD. A API recebe um roteiro; um validador rejeita roteiro malformado antes de gastar uma ligação; a execução é despachada por uma fila publish/subscribe no RabbitMQ; um provedor de telefonia faz a chamada e devolve cada resposta transcrita por webhook; a resposta é pontuada contra o que o roteiro esperava; e o resultado volta para a ferramenta de gestão de testes, amarrado aos identificadores de plano, suíte e item de trabalho.',
        },
        steps: [
          {
            label: 'Test script',
            detail: {
              en: 'An ordered list of commands describing one call.',
              'pt-BR': 'Uma lista ordenada de comandos descrevendo uma ligação.',
            },
          },
          {
            label: 'Validator',
            detail: {
              en: 'Rejects a malformed script before anything is dialled.',
              'pt-BR': 'Rejeita roteiro malformado antes de qualquer discagem.',
            },
          },
          {
            label: 'Queue',
            detail: {
              en: 'Publish/subscribe, so a slow call never blocks the request.',
              'pt-BR': 'Publish/subscribe, então uma ligação lenta não trava a requisição.',
            },
          },
          {
            label: 'Telephony provider',
            detail: {
              en: 'Places the call and posts each transcribed response back.',
              'pt-BR': 'Faz a chamada e devolve cada resposta transcrita.',
            },
          },
          {
            label: 'Test management',
            detail: {
              en: 'Receives the outcome against its plan, suite and work item.',
              'pt-BR': 'Recebe o resultado amarrado ao plano, à suíte e ao item de trabalho.',
            },
          },
        ],
      },
      script: {
        caption: { en: 'A test script', 'pt-BR': 'Um roteiro de teste' },
        lines: [
          'Setup Language="en-US"',
          'Dial +1 (000) 000 0000',
          'Wait 3',
          'Hear [Confidence=85%] thank you for calling, please say or enter your service tag',
          'Enter (serialnumber) 1234567#',
          'Hear [WaitBefore=2] one moment while I look that up',
          'Hang',
        ],
        note: {
          en: 'The grammar is checked before the call: a missing Dial or Hang, a repeated step where only one is allowed, or a step out of order fails the script rather than the phone bill. Validation steps run after the call ends. The number above is a documentation placeholder.',
          'pt-BR':
            'A gramática é conferida antes da ligação: um Dial ou Hang ausente, um passo repetido onde só cabe um, ou um passo fora de ordem reprovam o roteiro em vez da conta de telefone. Os passos de validação rodam depois que a chamada termina. O número acima é um placeholder de documentação.',
        },
      },
      comparison: {
        caption: { en: 'One test cycle', 'pt-BR': 'Um ciclo de teste' },
        before: {
          label: { en: 'By hand', 'pt-BR': 'À mão' },
          value: { en: '~1 month', 'pt-BR': '~1 mês' },
          weight: 160,
        },
        after: {
          label: { en: 'Automated', 'pt-BR': 'Automatizado' },
          value: { en: '~3 hours', 'pt-BR': '~3 horas' },
          weight: 3,
        },
        source: {
          en: 'Durations as recalled from the project; the repository does not record them.',
          'pt-BR': 'Durações conforme lembradas do projeto; o repositório não as registra.',
        },
      },
      table: {
        caption: { en: 'What a step records', 'pt-BR': 'O que um passo registra' },
        columns: [
          { en: 'Expected', 'pt-BR': 'Esperado' },
          { en: 'Heard', 'pt-BR': 'Ouvido' },
          { en: 'Similarity', 'pt-BR': 'Similaridade' },
        ],
        rows: [
          ['please enter your service tag', 'please enter your service tag', '100%'],
          ['one moment while I look that up', 'one moment while i look that up', '97%'],
          ['transferring you to support', 'transferring you to sales', '78%'],
        ],
        note: {
          en: 'Structure from the real model — every spoken response is stored with what was expected, what was transcribed, and how closely the two matched. Values here are illustrative.',
          'pt-BR':
            'Estrutura do modelo real — toda resposta falada é guardada com o que se esperava, o que foi transcrito e o quanto os dois bateram. Os valores aqui são ilustrativos.',
        },
      },
      highlights: [
        {
          en: 'A test script is a short list of ordered commands: dial, wait, enter digits, listen, validate, hang up.',
          'pt-BR':
            'Um roteiro de teste é uma lista curta de comandos ordenados: discar, esperar, digitar, ouvir, validar, desligar.',
        },
        {
          en: 'Placeholders in the script are substituted at run time, so one script covers many data sets.',
          'pt-BR':
            'Placeholders no roteiro são substituídos em tempo de execução, então um roteiro cobre muitos conjuntos de dados.',
        },
        {
          en: 'Every spoken response is stored with what was expected, what was heard, and how closely they matched.',
          'pt-BR':
            'Toda resposta falada é guardada com o que se esperava, o que foi ouvido e o quanto os dois bateram.',
        },
        {
          en: 'Results are written back to the test-management tool against the plan, suite and work item they belong to.',
          'pt-BR':
            'Os resultados voltam para a ferramenta de gestão de testes amarrados ao plano, à suíte e ao item de trabalho a que pertencem.',
        },
        {
          en: 'A malformed script is rejected with a readable list of errors before any call is placed.',
          'pt-BR':
            'Um roteiro malformado é rejeitado com uma lista legível de erros antes de qualquer ligação.',
        },
      ],
      decisions: [
        {
          heading: {
            en: 'Assert on similarity, with the threshold declared per step',
            'pt-BR': 'Asserção por similaridade, com o limiar declarado em cada passo',
          },
          body: {
            en: 'Speech transcription is never character-exact, so comparing for equality fails good tests. Each assertion carries its own tolerance in the script, because how close a transcription lands depends on what was said — a stock prompt transcribes reliably, a product name does not.',
            'pt-BR':
              'Transcrição de fala nunca é exata caractere a caractere, então comparar por igualdade reprova bons testes. Cada asserção carrega sua própria tolerância no roteiro, porque o quão perto a transcrição chega depende do que foi dito — um prompt padrão transcreve de forma confiável, um nome de produto não.',
          },
        },
        {
          heading: {
            en: 'The script is a small language, validated before anything is dialled',
            'pt-BR': 'O roteiro é uma linguagem pequena, validada antes de qualquer discagem',
          },
          body: {
            en: 'A real call costs time and money and cannot be undone. The validator checks that the required commands are present, that single-use commands appear once, that the order is legal, and that each line matches its grammar — reporting every error in plain language before the first digit is dialled.',
            'pt-BR':
              'Uma ligação real custa tempo e dinheiro e não dá para desfazer. O validador confere que os comandos obrigatórios estão presentes, que os de uso único aparecem uma vez, que a ordem é válida e que cada linha bate com sua gramática — reportando cada erro em linguagem clara antes do primeiro dígito discado.',
          },
        },
        {
          heading: {
            en: 'A queue between the request and the call',
            'pt-BR': 'Uma fila entre a requisição e a ligação',
          },
          body: {
            en: 'A phone call takes minutes and fails for reasons outside the caller’s control. Publish/subscribe decouples whoever asked for the run from whatever executes it, so a slow or failed call never blocks the request that started it.',
            'pt-BR':
              'Uma ligação telefônica leva minutos e falha por motivos fora do controle de quem chamou. Publish/subscribe desacopla quem pediu a execução de quem a executa, então uma ligação lenta ou falha nunca trava a requisição que a iniciou.',
          },
        },
        {
          heading: {
            en: 'Checking more than the audio',
            'pt-BR': 'Conferir mais que o áudio',
          },
          body: {
            en: 'Hearing the right words does not prove the call was routed correctly. Separate validation steps check the voice menu, the telephony routing, and the records both left behind — which is what makes it an end-to-end test rather than an audio assertion.',
            'pt-BR':
              'Ouvir as palavras certas não prova que a ligação foi roteada corretamente. Passos de validação separados conferem o menu de voz, o roteamento telefônico e os registros que os dois deixaram — e é isso que faz dele um teste end-to-end em vez de uma asserção sobre áudio.',
          },
        },
      ],
    },
  },
];
