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

  it('renders one h1 and high-level detail for a private project, with a Private indicator and NO external link', async () => {
    await renderDetail('ulbra-atende');

    const headings = await screen.findAllByRole('heading', { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent('Ulbra Atende');

    expect(screen.getByText(/role-based routing across support teams/i)).toBeInTheDocument();
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

    expect(screen.getByText(/roteamento baseado em papéis entre times de suporte/i)).toBeInTheDocument();
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
});
