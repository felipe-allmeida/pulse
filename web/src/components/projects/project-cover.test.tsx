import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ProjectCover } from '@/components/projects/project-cover';
import { projects } from '@/content/projects';
import type { Project } from '@/content/projects';
import { renderWithI18n } from '@/test/render-with-i18n';

function coverFor(overrides: Partial<Project> = {}): Project {
  return {
    slug: 'test',
    name: 'Test Project',
    tagline: { en: 'A tagline.', 'pt-BR': 'Uma tagline.' },
    description: { en: 'A description.', 'pt-BR': 'Uma descrição.' },
    tech: ['A', 'B', 'C', 'D'],
    role: { en: 'Role', 'pt-BR': 'Papel' },
    visibility: 'private',
    links: [],
    ...overrides,
  };
}

function nodeCount(container: HTMLElement) {
  return container.querySelectorAll('rect').length;
}

describe('ProjectCover', () => {
  it('is announced as an image with the project name', async () => {
    await renderWithI18n(<ProjectCover project={coverFor()} />);
    expect(screen.getByRole('img', { name: /Test Project/ })).toBeInTheDocument();
  });

  it('draws one node per architecture step when the project has one', async () => {
    const project = coverFor({
      detail: {
        architecture: {
          steps: [
            { label: 'A', detail: { en: 'a', 'pt-BR': 'a' } },
            { label: 'B', detail: { en: 'b', 'pt-BR': 'b' } },
            { label: 'C', detail: { en: 'c', 'pt-BR': 'c' } },
            { label: 'D', detail: { en: 'd', 'pt-BR': 'd' } },
            { label: 'E', detail: { en: 'e', 'pt-BR': 'e' } },
          ],
        },
      },
    });
    const { container } = await renderWithI18n(<ProjectCover project={project} />);
    expect(nodeCount(container)).toBe(5);
  });

  it('falls back to the tech count when there is no architecture', async () => {
    const { container } = await renderWithI18n(<ProjectCover project={coverFor()} />);
    expect(nodeCount(container)).toBe(4);
  });

  it('clamps a very short or very long input into a readable range', async () => {
    const short = await renderWithI18n(<ProjectCover project={coverFor({ tech: ['only'] })} />);
    expect(nodeCount(short.container)).toBe(3);

    const long = await renderWithI18n(
      <ProjectCover project={coverFor({ tech: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'] })} />,
    );
    expect(nodeCount(long.container)).toBe(6);
  });

  it('is deterministic — the same project draws the same cover twice', async () => {
    const project = coverFor();
    const first = await renderWithI18n(<ProjectCover project={project} />);
    const second = await renderWithI18n(<ProjectCover project={project} />);
    expect(first.container.innerHTML).toBe(second.container.innerHTML);
  });

  it('renders a usable cover for every project that has no screenshot', async () => {
    for (const project of projects.filter((p) => !p.screenshot)) {
      const { container, unmount } = await renderWithI18n(<ProjectCover project={project} />);
      const nodes = nodeCount(container);
      expect(nodes, `${project.slug} drew ${nodes} nodes`).toBeGreaterThanOrEqual(3);
      expect(nodes, `${project.slug} drew ${nodes} nodes`).toBeLessThanOrEqual(6);
      unmount();
    }
  });
});
