// @vitest-environment node
//
// Node, not the suite's default jsdom: this file reads from disk, and under
// jsdom `import.meta.url` is not a `file:` URL, so the path module cannot
// resolve itself relative to its own location.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { projects } from '../../content/projects';
import { ASSISTANT_PROJECTS_PATH } from './assistant-profile-path';
import { GENERATED_BANNER, renderAssistantProjects } from './assistant-profile';

const rendered = renderAssistantProjects(projects);

describe('assistant project grounding', () => {
  it('the committed file matches the source — run `pnpm gen:assistant` if this fails', () => {
    // The whole point of generating this file is that it cannot drift from
    // `projects.ts`. Without this assertion it drifts silently, and the first
    // person to notice is a recruiter reading an answer that contradicts the
    // case study open in the next tab.
    expect(readFileSync(ASSISTANT_PROJECTS_PATH, 'utf8')).toBe(rendered);
  });

  it('warns that the file is generated', () => {
    expect(rendered.startsWith(GENERATED_BANNER)).toBe(true);
  });

  it('covers every project, with its role and what Felipe did', () => {
    for (const project of projects) {
      expect(rendered, `${project.slug} is missing`).toContain(`### ${project.name} —`);
    }

    // `contribution` is the field that answers "what was actually his?", and
    // every project except ulbra-one carries one (see content.test.ts).
    for (const project of projects.filter((p) => p.detail?.contribution)) {
      expect(rendered, `${project.slug} contribution`).toContain(project.detail!.contribution!.summary.en);
    }
  });

  it('carries the contribution boundaries verbatim — what was someone else’s work', () => {
    const boundaries = projects.map((p) => p.detail?.contribution?.boundary).filter((b) => b !== undefined);
    expect(boundaries.length, 'at least one project names a boundary').toBeGreaterThan(0);
    for (const boundary of boundaries) {
      expect(rendered).toContain(`NOT his work: ${boundary.en}`);
    }
  });

  it('states closed source as a fact rather than leaving it to be inferred from a missing link', () => {
    for (const project of projects.filter((p) => p.visibility === 'private')) {
      expect(rendered, `${project.slug}`).toContain('**Source:** closed');
    }
    expect(rendered).toContain('**Source:** public');
  });

  it('publishes no repository link for a private project', () => {
    // The same rule content.test.ts enforces on the page: this text is quoted
    // straight back to visitors, so it inherits the constraint. Scoped to each
    // project's own block — Pulse is public and its GitHub link belongs here,
    // so a document-wide search for "github.com" would be the wrong test.
    const blocks = rendered.split('\n### ');
    for (const project of projects.filter((p) => p.visibility === 'private')) {
      const block = blocks.find((b) => b.startsWith(`${project.name} —`));
      expect(block, `${project.slug} has no block`).toBeDefined();
      expect(block, `${project.slug} links to a repository`).not.toMatch(
        /github\.com|gitlab\.|bitbucket\.|dev\.azure\.com|\/_git\//i,
      );
    }
  });

  it('is English only — the system prompt handles translation', () => {
    const ptOnly = projects.flatMap((p) => [p.tagline['pt-BR'], p.description['pt-BR']]);
    for (const text of ptOnly) {
      if (text === projects[0].tagline.en) continue;
      expect(rendered).not.toContain(text);
    }
  });
});
