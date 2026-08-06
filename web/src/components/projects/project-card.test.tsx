import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Locale } from '@/content/types';
import type { Project } from '@/content/projects';
import { renderWithI18n } from '@/test/render-with-i18n';
import { ProjectCard } from './project-card';

const publicProject: Project = {
  slug: 'pulse',
  name: 'Pulse',
  tagline: {
    en: 'A live, real-time system embedded in a portfolio.',
    'pt-BR': 'Um sistema ao vivo, em tempo real, embutido em um portfólio.',
  },
  description: {
    en: 'A thin client over an event-driven .NET backend.',
    'pt-BR': 'Um client fino sobre um backend .NET orientado a eventos.',
  },
  tech: ['.NET 10', 'React 19'],
  role: { en: 'Design & implementation', 'pt-BR': 'Design & implementação' },
  visibility: 'public',
  links: [{ label: 'GitHub', href: 'https://github.com/felipe-allmeida/pulse' }],
};

const privateProject: Project = {
  slug: 'ulbra-atende',
  name: 'Ulbra Atende',
  tagline: { en: 'Support & ticketing platform.', 'pt-BR': 'Plataforma de suporte e chamados.' },
  description: { en: 'An internal support and ticketing platform.', 'pt-BR': 'Uma plataforma interna de suporte e chamados.' },
  tech: ['.NET 10', 'PostgreSQL'],
  role: { en: 'Software engineer', 'pt-BR': 'Engenheiro de software' },
  period: { en: 'Professional work', 'pt-BR': 'Trabalho profissional' },
  visibility: 'private',
  links: [],
};

function renderCard(project: Project, locale?: Locale) {
  const rootRoute = createRootRoute({ component: () => <ProjectCard project={project} /> });
  const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', component: () => null });
  const detailRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/projects/$slug',
    component: () => null,
  });
  const routeTree = rootRoute.addChildren([indexRoute, detailRoute]);
  const router = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: ['/'] }) });

  return renderWithI18n(<RouterProvider router={router} />, { locale });
}

const projectWithScreenshot: Project = {
  ...publicProject,
  screenshot: 'https://example.com/pulse-screenshot.png',
};

describe('ProjectCard', () => {
  it('renders no empty placeholder box/img when the project has no screenshot', async () => {
    await renderCard(publicProject);

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.queryByText(/screenshot coming|captura de tela em breve/i)).not.toBeInTheDocument();
  });

  it('renders the screenshot image with a meaningful alt when project.screenshot is set', async () => {
    await renderCard(projectWithScreenshot);

    const image = await screen.findByRole('img', { name: /pulse screenshot/i });
    expect(image).toHaveAttribute('src', 'https://example.com/pulse-screenshot.png');
    expect(image).toHaveAttribute('loading', 'lazy');
  });

  it('links the whole card to its dedicated /projects/<slug> page', async () => {
    await renderCard(publicProject);

    const detailLink = await screen.findByRole('link', { name: /view pulse details/i });
    expect(detailLink).toHaveAttribute('href', '/projects/pulse');
  });

  it('renders name, a tech chip, external links, and the detail link for a public project', async () => {
    await renderCard(publicProject);

    const repoLink = await screen.findByRole('link', { name: /github/i });
    expect(repoLink).toHaveAttribute('href', 'https://github.com/felipe-allmeida/pulse');
    expect(repoLink).toHaveAttribute('target', '_blank');
    expect(repoLink).toHaveAttribute('rel', expect.stringContaining('noreferrer'));

    expect(screen.getByText('Pulse')).toBeInTheDocument();
    expect(screen.getByText('.NET 10')).toBeInTheDocument();

    expect(await screen.findByRole('link', { name: /view pulse details/i })).toHaveAttribute(
      'href',
      '/projects/pulse',
    );
  });

  it('marks pulse as the featured card', async () => {
    await renderCard(publicProject);

    const article = await screen.findByRole('article');
    expect(article).toHaveAttribute('data-featured', 'true');
  });

  it('does not mark a non-pulse project as featured', async () => {
    await renderCard(privateProject);

    const article = await screen.findByRole('article');
    expect(article).toHaveAttribute('data-featured', 'false');
  });

  it('renders the detail link and a private label but NO repo/external link for a private project', async () => {
    await renderCard(privateProject);

    const detailLink = await screen.findByRole('link', { name: /view ulbra atende details/i });
    expect(detailLink).toHaveAttribute('href', '/projects/ulbra-atende');

    expect(screen.getByText('Ulbra Atende')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /github|repo/i })).not.toBeInTheDocument();
    expect(screen.getByText('Private')).toBeInTheDocument();
  });

  it('renders the detail link and a pt-BR private label but NO repo/external link for a private project', async () => {
    await renderCard(privateProject, 'pt-BR');

    const detailLink = await screen.findByRole('link', { name: /ver detalhes de ulbra atende/i });
    expect(detailLink).toHaveAttribute('href', '/projects/ulbra-atende');

    expect(screen.getByText('Ulbra Atende')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /github|repo/i })).not.toBeInTheDocument();
    expect(screen.getByText('Privado')).toBeInTheDocument();
  });
});
