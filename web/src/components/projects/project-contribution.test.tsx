import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ProjectContribution } from '@/components/projects/project-contribution';
import type { ProjectContribution as ProjectContributionContent } from '@/content/projects';
import { renderWithI18n } from '@/test/render-with-i18n';

const contribution: ProjectContributionContent = {
  summary: { en: 'I owned the core.', 'pt-BR': 'O núcleo foi meu.' },
  areas: [
    { en: 'The intent workflows.', 'pt-BR': 'Os fluxos de intent.' },
    { en: 'The public API contract.', 'pt-BR': 'O contrato da API pública.' },
  ],
  boundary: { en: 'The front end was built by others.', 'pt-BR': 'O front-end foi feito por outros.' },
};

describe('ProjectContribution', () => {
  it('renders summary, every area, and the boundary', async () => {
    await renderWithI18n(<ProjectContribution contribution={contribution} />);

    expect(screen.getByText('I owned the core.')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByText('The public API contract.')).toBeInTheDocument();
    expect(screen.getByText('The front end was built by others.')).toBeInTheDocument();
  });

  it('renders in pt-BR', async () => {
    await renderWithI18n(<ProjectContribution contribution={contribution} />, { locale: 'pt-BR' });
    expect(screen.getByText('O núcleo foi meu.')).toBeInTheDocument();
    expect(screen.getByText('O front-end foi feito por outros.')).toBeInTheDocument();
  });

  it('renders a summary-only contribution without an empty list', async () => {
    const { container } = await renderWithI18n(
      <ProjectContribution contribution={{ summary: contribution.summary }} />,
    );
    expect(screen.getByText('I owned the core.')).toBeInTheDocument();
    expect(container.querySelector('ul')).toBeNull();
  });

  it('omits the boundary when there is none', async () => {
    const { areas, summary } = contribution;
    await renderWithI18n(<ProjectContribution contribution={{ summary, areas }} />);
    expect(screen.queryByText(/built by others/i)).not.toBeInTheDocument();
  });

  it('adds no heading of its own', async () => {
    await renderWithI18n(<ProjectContribution contribution={contribution} />);
    expect(screen.queryAllByRole('heading')).toHaveLength(0);
  });
});
