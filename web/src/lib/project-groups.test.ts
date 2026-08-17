import { expect, it } from 'vitest';
import { groupProjects } from './project-groups';
import { projects } from '@/content/projects';
import type { Project } from '@/content/projects';

function stub(slug: string, venture?: string): Project {
  return {
    slug,
    name: slug,
    tagline: { en: slug, 'pt-BR': slug },
    description: { en: slug, 'pt-BR': slug },
    tech: [],
    role: { en: 'role', 'pt-BR': 'role' },
    links: [],
    visibility: 'private',
    venture,
  };
}

it('a run of ungrouped projects becomes one standalone group', () => {
  const groups = groupProjects([stub('a'), stub('b')]);
  expect(groups).toHaveLength(1);
  expect(groups[0].kind).toBe('standalone');
  expect(groups[0].projects.map((p) => p.slug)).toEqual(['a', 'b']);
});

it('a run sharing a venture becomes one venture group carrying its slug', () => {
  const groups = groupProjects([stub('a', 'ulbra'), stub('b', 'ulbra')]);
  expect(groups).toHaveLength(1);
  expect(groups[0]).toMatchObject({ kind: 'venture', ventureSlug: 'ulbra' });
  expect(groups[0].projects.map((p) => p.slug)).toEqual(['a', 'b']);
});

it('groups keep array order and split at every boundary', () => {
  const groups = groupProjects([stub('a'), stub('b', 'ulbra'), stub('c', 'ulbra'), stub('d')]);
  expect(groups.map((g) => [g.kind, g.projects.map((p) => p.slug)])).toEqual([
    ['standalone', ['a']],
    ['venture', ['b', 'c']],
    ['standalone', ['d']],
  ]);
});

it('two different ventures never merge', () => {
  const groups = groupProjects([stub('a', 'ulbra'), stub('b', 'dietbox')]);
  expect(groups).toHaveLength(2);
});

it('an empty list produces no groups', () => {
  expect(groupProjects([])).toEqual([]);
});

it('every project survives the grouping exactly once', () => {
  const flattened = groupProjects(projects).flatMap((g) => g.projects.map((p) => p.slug));
  expect(flattened).toEqual(projects.map((p) => p.slug));
});
