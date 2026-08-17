import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithI18n } from '@/test/render-with-i18n';
import { VentureSection } from './venture-section';
import type { Venture } from '@/content/ventures';
import type { Project } from '@/content/projects';

const venture: Venture = {
  slug: 'ulbra',
  name: 'ULBRA',
  url: 'https://www.ulbra.br',
  role: { en: 'Head of Technology', 'pt-BR': 'Head de Tecnologia' },
  period: { en: 'Apr 2026 – Current', 'pt-BR': 'Abr 2026 – Atual' },
  engagement: { en: 'Client of Pampa Devs', 'pt-BR': 'Cliente da Pampa Devs' },
  summary: { en: 'The internal platform.', 'pt-BR': 'A plataforma interna.' },
  team: { en: 'Three engineers.', 'pt-BR': 'Três engenheiros.' },
  practices: [
    {
      heading: { en: 'One queue', 'pt-BR': 'Uma fila' },
      body: { en: 'Work enters through Linear.', 'pt-BR': 'O trabalho entra pelo Linear.' },
    },
  ],
};

const project: Project = {
  slug: 'ulbra-atende',
  name: 'Ulbra Atende',
  tagline: { en: 'Service desk.', 'pt-BR': 'Service desk.' },
  description: { en: 'A service desk.', 'pt-BR': 'Um service desk.' },
  tech: ['.NET 10'],
  role: { en: 'Head of Technology', 'pt-BR': 'Head de Tecnologia' },
  links: [],
  visibility: 'private',
  venture: 'ulbra',
};

function renderSection(v: Venture = venture) {
  const rootRoute = createRootRoute({
    component: () => <VentureSection venture={v} projects={[project]} />,
  });
  const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', component: () => null });
  const detailRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/projects/$slug',
    component: () => null,
  });
  const routeTree = rootRoute.addChildren([indexRoute, detailRoute]);
  const router = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: ['/'] }) });

  return renderWithI18n(<RouterProvider router={router} />);
}

describe('VentureSection', () => {
  it('names the venture and links it', async () => {
    await renderSection();
    const link = await screen.findByRole('link', { name: 'ULBRA' });
    expect(link).toHaveAttribute('href', 'https://www.ulbra.br');
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('states the engagement, so the reader does not read it as employment', async () => {
    await renderSection();
    expect(await screen.findByText(/client of pampa devs/i)).toBeInTheDocument();
  });

  it('renders the venture practices', async () => {
    await renderSection();
    expect(await screen.findByText('One queue')).toBeInTheDocument();
    expect(screen.getByText('Work enters through Linear.')).toBeInTheDocument();
  });

  it('renders a card per project', async () => {
    await renderSection();
    expect(await screen.findByRole('heading', { name: 'Ulbra Atende' })).toBeInTheDocument();
  });

  it('renders the name as plain text when the venture has no url', async () => {
    await renderSection({ ...venture, url: undefined });
    expect(screen.queryByRole('link', { name: 'ULBRA' })).not.toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'ULBRA' })).toBeInTheDocument();
  });

  it('keeps one heading level between the venture and its practices', async () => {
    await renderSection();
    // h1 (page) → h2 (venture) → h3 (each practice). The practices label is
    // deliberately not a heading, so it cannot collide with the venture's h2.
    expect(await screen.findByRole('heading', { level: 2, name: 'ULBRA' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'One queue' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /how the team works/i })).not.toBeInTheDocument();
  });
});
