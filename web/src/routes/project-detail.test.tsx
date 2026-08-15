import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ProjectDetail } from '@/components/projects/project-detail';
import type { Locale } from '@/content/types';
import { renderWithI18n } from '@/test/render-with-i18n';

function renderDetail(slug: string, locale?: Locale) {
  const rootRoute = createRootRoute({ component: () => <ProjectDetail slug={slug} /> });
  const projectsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/projects', component: () => null });
  const routeTree = rootRoute.addChildren([projectsRoute]);
  const router = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: ['/'] }) });

  return renderWithI18n(<RouterProvider router={router} />, { locale });
}

describe('ProjectDetail', () => {
  it('renders exactly one h1, the tagline, tech chips, overview/highlights, and external links for pulse', async () => {
    await renderDetail('pulse');

    const headings = await screen.findAllByRole('heading', { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent('Pulse');

    expect(screen.getByText(/live, real-time system/i)).toBeInTheDocument();
    expect(screen.getByText('.NET 10')).toBeInTheDocument();
    expect(screen.getByText(/self-hosted portfolio/i)).toBeInTheDocument();
    expect(screen.getByText(/live presence via signalr/i)).toBeInTheDocument();

    const repoLink = screen.getByRole('link', { name: /github/i });
    expect(repoLink).toHaveAttribute('href', 'https://github.com/felipe-allmeida/pulse');
    expect(repoLink).toHaveAttribute('target', '_blank');
    expect(repoLink).toHaveAttribute('rel', expect.stringContaining('noreferrer'));
  });

  it('renders no empty placeholder box/img on the detail page when the project has no screenshot', async () => {
    await renderDetail('pulse');

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.queryByText(/screenshot coming|captura de tela em breve/i)).not.toBeInTheDocument();
  });

  it('renders one h1 and high-level detail for a private project, with a Private indicator and NO external link', async () => {
    await renderDetail('ulbra-atende');

    const headings = await screen.findAllByRole('heading', { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent('Ulbra Atende');

    expect(screen.getByText(/pauses that record who paused the clock/i)).toBeInTheDocument();
    expect(screen.getByText('Private')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /github|repo/i })).not.toBeInTheDocument();
    // No external/repo link should exist at all on a private project's detail page.
    const externalLikeLinks = screen.queryAllByRole('link').filter((link) => link.getAttribute('target') === '_blank');
    expect(externalLikeLinks).toHaveLength(0);
  });

  it('renders one h1 and pt-BR high-level detail for a private project, with a Privado indicator and NO external link', async () => {
    await renderDetail('ulbra-atende', 'pt-BR');

    const headings = await screen.findAllByRole('heading', { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent('Ulbra Atende');

    expect(screen.getByText(/pausas que registram quem parou o relógio/i)).toBeInTheDocument();
    expect(screen.getByText('Privado')).toBeInTheDocument();
    const externalLikeLinks = screen.queryAllByRole('link').filter((link) => link.getAttribute('target') === '_blank');
    expect(externalLikeLinks).toHaveLength(0);
  });

  it('renders a localized not-found state for an unknown slug, with exactly one h1 and a link back to /projects', async () => {
    await renderDetail('nonexistent-project');

    const headings = await screen.findAllByRole('heading', { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent(/not found/i);

    const backLink = screen.getByRole('link', { name: /all projects/i });
    expect(backLink).toHaveAttribute('href', '/projects');
  });

  it('renders the full case study for ulbra-atende, in section order', async () => {
    await renderDetail('ulbra-atende');

    await screen.findAllByRole('heading', { level: 1 });
    expect(screen.getByText(/took requests through GLPI/i)).toBeInTheDocument();
    expect(screen.getByText('~2.4k')).toBeInTheDocument();
    expect(screen.getByText('in ~3 months of production')).toBeInTheDocument();
    expect(screen.getByText(/Core, Identity, Notifications and MCP/i)).toBeInTheDocument();
    expect(screen.getByText('Slack · Google Chat · e-mail')).toBeInTheDocument();
    expect(screen.getByText(/its own OAuth server/i)).toBeInTheDocument();

    const headings = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
    expect(headings).toEqual([
      'Overview',
      'The problem',
      'By the numbers',
      'Architecture',
      'What it does',
      'Engineering decisions',
    ]);
  });

  it('renders the case study in pt-BR', async () => {
    await renderDetail('ulbra-atende', 'pt-BR');

    await screen.findAllByRole('heading', { level: 1 });
    expect(screen.getByText(/recebia demanda por GLPI/i)).toBeInTheDocument();
    expect(screen.getByText('~2,4 mil')).toBeInTheDocument();
    expect(screen.getByText('em ~3 meses de produção')).toBeInTheDocument();

    const headings = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
    expect(headings).toEqual([
      'Visão geral',
      'O problema',
      'Em números',
      'Arquitetura',
      'O que faz',
      'Decisões de engenharia',
    ]);
  });

  it('omits every case-study section for a project that has none', async () => {
    await renderDetail('ulbra-one');

    await screen.findAllByRole('heading', { level: 1 });
    const headings = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
    expect(headings).toEqual(['Overview', 'What it does']);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });
});
