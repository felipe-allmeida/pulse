/**
 * The project half of the AI assistant's grounding, rendered from `projects.ts`.
 *
 * The assistant knows exactly one thing: the text of `profile.md`, embedded
 * into the API assembly and pasted into the system prompt (see
 * `src/Pulse.Api/Assistant/AskMessageBuilder.cs`). Hand-writing the case
 * studies there would make a second source of truth for facts that already
 * live in `src/content/projects.ts` — and the copy that drifts is the one
 * nobody is reading, so the assistant would quietly start contradicting the
 * page it sits on. This renders that file instead, and a test fails the build
 * when the committed output no longer matches the source.
 *
 * English only, deliberately: the system prompt already instructs the model to
 * answer in the visitor's language regardless of the profile's, so emitting
 * both locales would double the tokens on every question to say the same
 * things twice.
 *
 * The figures — `script`, `comparison`, `table` — are left out. They are
 * drawings: rows and bar weights that mean something laid out on a page and
 * nothing as prose. Everything that carries a claim is included.
 */
import type { LocalizedString } from '../../content/types';
import type { CaseStudyFlow, Project } from '../../content/projects';

const en = (value: LocalizedString): string => value.en;

/** Warns the next reader of the generated file, which has no other context. */
export const GENERATED_BANNER =
  '<!-- GENERATED from web/src/content/projects.ts by `pnpm gen:assistant`. Do not edit by hand:\n' +
  '     edit the source and regenerate, or the drift test in assistant-profile.test.ts fails. -->';

function flowLines(label: string, flow: CaseStudyFlow): string[] {
  const heading = flow.caption ? en(flow.caption) : label;
  const lines = [`- **${heading}:**${flow.summary ? ` ${en(flow.summary)}` : ''}`];
  for (const step of flow.steps) lines.push(`  - ${step.label} — ${en(step.detail)}`);
  return lines;
}

function projectLines(project: Project): string[] {
  const detail = project.detail;
  const lines = [`### ${project.name} — ${en(project.tagline)}`, ''];

  lines.push(`- **Role:** ${en(project.role)}${project.period ? ` (${en(project.period)})` : ''}`);

  /*
    Visibility is stated rather than implied by the presence of a link: "no
    link" and "closed source" are different facts, and a recruiter asking "can
    I see the code?" deserves the second one.
  */
  const links = project.links.map((l) => `${l.label}: ${l.href}`).join(' · ');
  lines.push(
    project.visibility === 'public'
      ? `- **Source:** public${links ? ` — ${links}` : ''}`
      : `- **Source:** closed — professional work described without the code${links ? ` (${links})` : ''}`,
  );

  lines.push(`- **Stack:** ${project.tech.join(', ')}`);
  lines.push(`- **What it is:** ${en(detail?.overview ?? project.description)}`);

  if (detail?.contribution) {
    lines.push(`- **What Felipe did:** ${en(detail.contribution.summary)}`);
    for (const area of detail.contribution.areas ?? []) lines.push(`  - ${en(area)}`);
    // The boundary is the most quotable line in the file: it is the one that
    // stops the assistant claiming a teammate's work as Felipe's.
    if (detail.contribution.boundary) lines.push(`  - NOT his work: ${en(detail.contribution.boundary)}`);
  }

  if (detail?.problem) lines.push(`- **Problem it solved:** ${en(detail.problem)}`);

  if (detail?.metrics?.length) {
    const metrics = detail.metrics
      .map((m) => `${en(m.value)} ${en(m.label)}${m.note ? ` (${en(m.note)})` : ''}`)
      .join('; ');
    lines.push(`- **Results:** ${metrics}${detail.metricsNote ? ` — ${en(detail.metricsNote)}` : ''}`);
  }

  if (detail?.architecture) lines.push(...flowLines('Architecture', detail.architecture));
  if (detail?.states) lines.push(...flowLines('Lifecycle', detail.states));

  if (detail?.highlights?.length) {
    lines.push('- **What it does:**');
    for (const highlight of detail.highlights) lines.push(`  - ${en(highlight)}`);
  }

  if (detail?.decisions?.length) {
    lines.push('- **Engineering decisions:**');
    for (const d of detail.decisions) lines.push(`  - **${en(d.heading)}** — ${en(d.body)}`);
  }

  if (detail?.leadership?.length) {
    lines.push('- **Leadership on this project:**');
    for (const s of detail.leadership) lines.push(`  - **${en(s.heading)}** — ${en(s.body)}`);
  }

  lines.push('');
  return lines;
}

/** The full `projects.generated.md` body, banner included. */
export function renderAssistantProjects(items: Project[]): string {
  const lines = [
    GENERATED_BANNER,
    '',
    '## Project case studies',
    '',
    'These are the projects written up on the site, in the order they appear there. Each one is a real',
    'system Felipe worked on; the "What Felipe did" line is the authoritative statement of his part in it.',
    '',
    ...items.flatMap(projectLines),
  ];
  return `${lines.join('\n').trimEnd()}\n`;
}
