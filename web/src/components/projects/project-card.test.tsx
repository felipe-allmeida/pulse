import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Project } from '@/content/projects';
import { renderWithI18n } from '@/test/render-with-i18n';
import { ProjectCard } from './project-card';

const publicProject: Project = {
  slug: 'pulse',
  name: 'Pulse',
  tagline: { en: 'A live, real-time system embedded in a portfolio.', 'pt-BR': 'Um sistema ao vivo, em tempo real, embutido em um portfólio.' },
  description: { en: 'A thin client over an event-driven .NET backend.', 'pt-BR': 'Um client fino sobre um backend .NET orientado a eventos.' },
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

describe('ProjectCard', () => {
  it('renders name, a tech badge, and the repo link for a public project', async () => {
    await renderWithI18n(<ProjectCard project={publicProject} />);

    expect(screen.getByText('Pulse')).toBeInTheDocument();
    expect(screen.getByText('.NET 10')).toBeInTheDocument();

    const link = screen.getByRole('link', { name: /github/i });
    expect(link).toHaveAttribute('href', 'https://github.com/felipe-allmeida/pulse');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', expect.stringContaining('noreferrer'));
  });

  it('renders no repo link and a private label for a private project', async () => {
    await renderWithI18n(<ProjectCard project={privateProject} />);

    expect(screen.getByText('Ulbra Atende')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByText('Private')).toBeInTheDocument();
  });
});
