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
    screenshot: '/screenshots/pulse.png',
    links: [
      { label: 'Live site', href: 'https://pulse.felipealmeida.tech' },
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
          en: 'An AI assistant grounded in a maintained profile, streaming answers about the author.',
          'pt-BR': 'Um assistente de IA baseado em um perfil mantido, respondendo em streaming sobre o autor.',
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
            en: 'The assistant answers from a file the author keeps current, and says it does not know rather than inventing. Ungrounded, it would be a demonstration of exactly the wrong thing.',
            'pt-BR':
              'O assistente responde a partir de um arquivo que o autor mantém atualizado, e diz que não sabe em vez de inventar. Sem fundamento, ele seria a demonstração exatamente do oposto.',
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
    screenshot: '/screenshots/kota.png',
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
    name: 'Dietbox',
    tagline: {
      en: 'Nutrition software for practitioners and their patients.',
      'pt-BR': 'Software de nutrição para profissionais e seus pacientes.',
    },
    description: {
      en: 'A Brazilian SaaS where nutritionists build diet plans and their patients follow them — two audiences over one identity backbone and one platform.',
      'pt-BR':
        'Um SaaS brasileiro em que nutricionistas montam planos alimentares e seus pacientes os seguem — dois públicos sobre uma única base de identidade e uma única plataforma.',
    },
    tech: ['.NET', 'Azure', 'Azure AD B2C', 'PostgreSQL', 'Redis', 'Socket.IO', 'Azure DevOps'],
    role: {
      en: 'Senior Software Engineer, then Head of Technology',
      'pt-BR': 'Engenheiro de Software Sênior, depois Head de Tecnologia',
    },
    period: { en: '2020–2024', 'pt-BR': '2020–2024' },
    visibility: 'private',
    screenshot: '/screenshots/dietbox.png',
    links: [{ label: 'Website', href: 'https://dietbox.me' }],
    detail: {
      overview: {
        en: 'A Brazilian SaaS used by nutritionists to plan diets and by their patients to follow them. Two audiences with almost nothing in common share one product, one identity system and one platform — and that platform spans a decade-old monolith and a newer generation of services running beside it.',
        'pt-BR':
          'Um SaaS brasileiro usado por nutricionistas para montar dietas e por seus pacientes para segui-las. Dois públicos com quase nada em comum dividem um produto, um sistema de identidade e uma plataforma — e essa plataforma vai de um monolito de dez anos a uma geração mais nova de serviços rodando ao lado dele.',
      },
      contribution: {
        summary: {
          en: 'Principal architect for four years — I set the platform’s patterns and configured the Azure estate, including for services other people wrote. Later the whole technology organization reported to me.',
          'pt-BR':
            'Arquiteto principal por quatro anos — defini os padrões da plataforma e configurei o ambiente Azure, inclusive para serviços escritos por outras pessoas. Depois, toda a área de tecnologia passou a se reportar a mim.',
        },
        areas: [
          {
            en: 'The move off .NET Framework on Windows onto .NET 6 on Linux.',
            'pt-BR': 'A saída do .NET Framework no Windows para .NET 6 no Linux.',
          },
          {
            en: 'Identity end to end: the custom Azure AD B2C policies behind both audiences.',
            'pt-BR':
              'Identidade de ponta a ponta: as políticas customizadas de Azure AD B2C por trás dos dois públicos.',
          },
          {
            en: 'The portal service, and the shared building blocks the newer services start from.',
            'pt-BR': 'O serviço de portal e os blocos compartilhados dos quais os serviços mais novos partem.',
          },
          {
            en: 'The realtime service, and CI/CD in Azure DevOps.',
            'pt-BR': 'O serviço de tempo real e o CI/CD no Azure DevOps.',
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
          value: { en: '13', 'pt-BR': '13' },
          label: { en: 'people in the org', 'pt-BR': 'pessoas na área' },
          note: { en: 'engineering, QA, UX and support', 'pt-BR': 'engenharia, QA, UX e suporte' },
        },
        {
          value: { en: '~1.7k', 'pt-BR': '~1,7 mil' },
          label: { en: 'commits across six services', 'pt-BR': 'commits em seis serviços' },
          note: { en: 'mine, of ~5.8k total', 'pt-BR': 'meus, de ~5,8 mil no total' },
        },
        {
          value: { en: '1 month → 1.5 weeks', 'pt-BR': '1 mês → 1,5 semanas' },
          label: { en: 'lead time', 'pt-BR': 'lead time' },
          note: {
            en: 'after Scrum and trunk-based development',
            'pt-BR': 'depois de Scrum e trunk-based development',
          },
        },
        {
          value: { en: '−21%', 'pt-BR': '−21%' },
          label: { en: 'monthly cloud spend', 'pt-BR': 'custo mensal de nuvem' },
          note: { en: 'after an Azure cost pass', 'pt-BR': 'depois de uma revisão de custos no Azure' },
        },
      ],
      metricsNote: {
        en: 'The commit counts come from the repositories. The rest is my own record of the period.',
        'pt-BR':
          'Os números de commit vêm dos repositórios. O resto é meu próprio registro do período.',
      },
      architecture: {
        summary: {
          en: 'Two generations of the same product, sharing one identity backbone.',
          'pt-BR': 'Duas gerações do mesmo produto, dividindo uma única base de identidade.',
        },
        steps: [
          {
            label: 'Legacy platform',
            detail: {
              en: 'The .NET Framework monolith the product grew on, and still its largest codebase.',
              'pt-BR':
                'O monolito .NET Framework em que o produto cresceu, e ainda sua maior base de código.',
            },
          },
          {
            label: 'Identity',
            detail: {
              en: 'Azure AD B2C with custom policies, one set per audience, over a single directory.',
              'pt-BR':
                'Azure AD B2C com políticas customizadas, um conjunto por público, sobre um único diretório.',
            },
          },
          {
            label: 'Portal service',
            detail: {
              en: 'The newer generation: a layered domain over shared building blocks, with event sourcing where the questions are historical.',
              'pt-BR':
                'A geração mais nova: um domínio em camadas sobre blocos compartilhados, com event sourcing onde as perguntas são históricas.',
            },
          },
          {
            label: 'Realtime',
            detail: {
              en: 'A dedicated socket server, scaled horizontally behind a Redis adapter.',
              'pt-BR':
                'Um servidor de sockets dedicado, escalado horizontalmente atrás de um adaptador Redis.',
            },
          },
          {
            label: 'Azure',
            detail: {
              en: 'The estate I configured, with delivery through Azure DevOps.',
              'pt-BR': 'O ambiente que configurei, com entrega via Azure DevOps.',
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
            en: 'Custom identity policies instead of a hosted login',
            'pt-BR': 'Políticas de identidade customizadas em vez de um login pronto',
          },
          body: {
            en: 'Two audiences share a product but not a journey: a practitioner signing up for a subscription, a patient invited by the one treating them. Custom B2C policies gave each its own sign-up, sign-in and password flow, branded per audience, over one identity backbone instead of two user stores to keep in sync.',
            'pt-BR':
              'Dois públicos dividem um produto, mas não um caminho: a profissional que assina, o paciente convidado por ela. Políticas customizadas de B2C deram a cada um seu próprio fluxo de cadastro, login e senha, com marca própria, sobre uma única base de identidade em vez de duas bases de usuários para manter sincronizadas.',
          },
        },
        {
          heading: {
            en: 'Shared building blocks before shared services',
            'pt-BR': 'Blocos compartilhados antes de serviços compartilhados',
          },
          body: {
            en: 'The newer services start from a common domain, infrastructure and identity layer rather than each inventing its own. It is what let a small team add a service without each new one arriving in a new style.',
            'pt-BR':
              'Os serviços mais novos partem de uma camada comum de domínio, infraestrutura e identidade em vez de cada um inventar a sua. É o que permitiu a um time pequeno adicionar um serviço sem que cada novo chegasse num estilo novo.',
          },
        },
        {
          heading: {
            en: 'Event sourcing in the portal, not everywhere',
            'pt-BR': 'Event sourcing no portal, não em tudo',
          },
          body: {
            en: 'The portal’s questions are historical — what changed, when, and by whom — so its state is derived from events. The rest of the platform is not, because the rest of the platform is not asking that, and event sourcing charges rent on every service that adopts it.',
            'pt-BR':
              'As perguntas do portal são históricas — o que mudou, quando e por quem —, então seu estado é derivado de eventos. O resto da plataforma não é, porque o resto da plataforma não faz essa pergunta, e event sourcing tem um custo de manutenção em todo serviço que o adota.',
          },
        },
        {
          heading: { en: 'Realtime as its own service', 'pt-BR': 'Tempo real como serviço próprio' },
          body: {
            en: 'Long-lived connections scale on a different axis from request traffic, and behind a Redis adapter any instance can push to a client connected to any other. Keeping it inside the monolith would have tied both to the same deploy — and the monolith deployed once a night.',
            'pt-BR':
              'Conexões de longa duração escalam num eixo diferente do tráfego de requisições, e atrás de um adaptador Redis qualquer instância consegue enviar a um cliente conectado em outra. Mantê-lo dentro do monolito teria amarrado os dois ao mesmo deploy — e o monolito subia uma vez por madrugada.',
          },
        },
      ],
      leadership: [
        {
          heading: { en: 'From one nightly deploy to several a day', 'pt-BR': 'De um deploy noturno a vários por dia' },
          body: {
            en: 'I brought in Scrum and trunk-based development. A deploy in daylight stopped being an event.',
            'pt-BR':
              'Trouxe Scrum e trunk-based development. Deploy em horário comercial deixou de ser evento.',
          },
        },
        {
          heading: { en: 'A payment migration nobody noticed', 'pt-BR': 'Uma migração de pagamentos que ninguém notou' },
          body: {
            en: 'I planned and ran the move of thousands of active subscribers from Iugu to Pagar.me. Revenue never paused — the kind of change whose measure of success is that nothing happened.',
            'pt-BR':
              'Planejei e conduzi a migração de milhares de assinantes ativos de Iugu para Pagar.me. A receita não parou em momento nenhum — o tipo de mudança cuja medida de sucesso é não ter acontecido nada.',
          },
        },
        {
          heading: { en: 'Cloud spend as an engineering problem', 'pt-BR': 'Custo de nuvem como problema de engenharia' },
          body: {
            en: 'I took a cost pass over the Azure estate — without a feature freeze to pay for it.',
            'pt-BR': 'Fiz uma revisão de custos no ambiente Azure — sem congelar entregas para bancar a economia.',
          },
        },
        {
          heading: {
            en: 'Reporting engineering in the executive’s language',
            'pt-BR': 'Reportar engenharia na língua da diretoria',
          },
          body: {
            en: 'I started bringing DORA metrics and a roadmap to the executive team, so investment in technology was argued with evidence rather than conviction.',
            'pt-BR':
              'Passei a levar métricas DORA e um roadmap à diretoria, para que o investimento em tecnologia fosse defendido com evidências, não com convicção.',
          },
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
    screenshot: '/screenshots/ulbra-atende.png',
    detail: {
      overview: {
        en: "The IT service desk for ULBRA — a .NET 10 modular monolith that replaced GLPI as the single intake channel for the university's IT department, carrying a request from ticket to SLA to satisfaction survey.",
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
      },
      problem: {
        en: "ULBRA's IT department took requests through GLPI, e-mail, and direct messages at the same time. There was no SLA per team, no audit trail on approvals, and no way to tell whether anyone was satisfied with the outcome. Ulbra Atende replaces GLPI as the single intake channel and makes each of those measurable — three months in, the median ticket closes in about an hour and a half.",
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
      en: `An internal ERP replacing the university's legacy systems — a modular .NET monolith on PostgreSQL with a React front end. In testing, ahead of launch.`,
      'pt-BR':
        'Um ERP interno substituindo os sistemas legados da universidade — um monólito modular em .NET sobre PostgreSQL com front-end em React. Em teste, antes do lançamento.',
    },
    tech: ['.NET 10', 'PostgreSQL 17', 'EF Core', 'React', 'Tailwind', 'shadcn/ui'],
    role: { en: 'Head of Technology', 'pt-BR': 'Head de Tecnologia' },
    period: { en: 'Jun 2026 – Current', 'pt-BR': 'Jun 2026 – Atual' },
    venture: 'ulbra',
    visibility: 'private',
    screenshot: '/screenshots/ulbra-one.png',
    links: [],
    detail: {
      overview: {
        en: 'An internal ERP built to take the university off its legacy systems — a modular .NET 10 monolith on PostgreSQL 17 with a React front end, covering core internal business operations. It is in testing, ahead of launch, so this describes what has been built rather than what is running.',
        'pt-BR':
          'Um ERP interno construído para tirar a universidade dos sistemas legados — um monólito modular em .NET 10 sobre PostgreSQL 17 com front-end em React, cobrindo as operações internas centrais. Está em teste, antes do lançamento, então o que segue descreve o que foi construído, não o que está em produção.',
      },
      contribution: {
        summary: {
          en: 'Set the architecture and the conventions, and built alongside one engineer who carries the day-to-day of this codebase.',
          'pt-BR':
            'Definiu a arquitetura e as convenções e construiu junto com um engenheiro que toca o dia a dia deste código.',
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
      en: "The university's CRM platform, inherited with no automated tests and little structure. Rebuilt under the author's direction to full test coverage, with a front-end migration that stopped every screen change from throwing away the user's filters.",
      'pt-BR':
        'A plataforma de CRM da universidade, herdada sem testes automatizados e com pouca estrutura. Reconstruída sob a direção do autor até cobertura total de testes, com uma migração de front-end que acabou com a perda dos filtros do usuário a cada troca de tela.',
    },
    tech: ['React', 'TanStack Router', 'MongoDB', 'Docker Swarm'],
    role: { en: 'Head of Technology — direction & review', 'pt-BR': 'Head de Tecnologia — direção & revisão' },
    period: { en: 'Apr 2026 – Current', 'pt-BR': 'Abr 2026 – Atual' },
    venture: 'ulbra',
    visibility: 'private',
    links: [],
    detail: {
      overview: {
        en: "The CRM the university runs on, inherited rather than built: no automated tests, and a codebase whose structure had not kept up with it. It is now fully covered by tests and materially better to use, and the work was done by the team under the author's direction — he set the direction and reviewed it, and did not write it.",
        'pt-BR':
          'O CRM em que a universidade opera, herdado e não construído: sem testes automatizados e com uma estrutura que não acompanhou o próprio crescimento. Hoje está totalmente coberto por testes e sensivelmente melhor de usar, e o trabalho foi feito pelo time sob a direção do autor — ele definiu a direção e revisou, não escreveu.',
      },
      contribution: {
        summary: {
          en: 'Set the direction and reviewed the work; the engineering was the team\'s.',
          'pt-BR': 'Definiu a direção e revisou o trabalho; a engenharia foi do time.',
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
          en: 'None of this implementation is the author\'s. It was built by the engineers on the team; his part was deciding what to do and reviewing what came back.',
          'pt-BR':
            'Nada desta implementação é do autor. Foi construída pelos engenheiros do time; a parte dele foi decidir o que fazer e revisar o que voltava.',
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
        {
          value: { en: '0', 'pt-BR': '0' },
          label: { en: 'filter resets per navigation', 'pt-BR': 'perdas de filtro por navegação' },
          note: { en: 'was: every one', 'pt-BR': 'antes: todas' },
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
            en: 'This is the one system in the group the author did not build. With three engineers and six systems, the lead\'s leverage is in deciding what gets done and reviewing what comes back, not in adding a fourth pair of hands to a codebase that already has an owner.',
            'pt-BR':
              'Este é o único sistema do grupo que o autor não construiu. Com três engenheiros e seis sistemas, a alavanca da liderança está em decidir o que é feito e revisar o que volta, não em somar um quarto par de mãos a um código que já tem dono.',
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
    screenshot: '/screenshots/dell-automated-caller.png',
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
