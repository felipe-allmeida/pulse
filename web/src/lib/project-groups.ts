import type { Project } from '../content/projects';

/**
 * A run of consecutive projects that render together: either loose cards, or
 * the projects of one venture under a shared header.
 */
export type ProjectGroup =
  | { kind: 'standalone'; projects: Project[] }
  | { kind: 'venture'; ventureSlug: string; projects: Project[] };

/**
 * Folds the flat, ordered project list into renderable runs.
 *
 * Order is preserved exactly, which is the point: the ULBRA group renders
 * where its projects already sit — after Dietbox, before the Dell tool — so
 * the chronological ordering the content tests assert survives the grouping.
 * A venture whose projects are not contiguous would produce two headers for
 * one venture; `content.test.ts` forbids that rather than this function
 * silently repairing it.
 */
export function groupProjects(projects: Project[]): ProjectGroup[] {
  const groups: ProjectGroup[] = [];

  for (const project of projects) {
    const last = groups.at(-1);
    const continues =
      last !== undefined &&
      (project.venture === undefined
        ? last.kind === 'standalone'
        : last.kind === 'venture' && last.ventureSlug === project.venture);

    if (continues) {
      last.projects.push(project);
      continue;
    }

    groups.push(
      project.venture === undefined
        ? { kind: 'standalone', projects: [project] }
        : { kind: 'venture', ventureSlug: project.venture, projects: [project] },
    );
  }

  return groups;
}
