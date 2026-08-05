import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Project } from '@/content/projects';
import { ProjectCard } from './project-card';

const publicProject: Project = {
  slug: 'pulse',
  name: 'Pulse',
  tagline: 'A live, real-time system embedded in a portfolio.',
  description: 'A thin client over an event-driven .NET backend.',
  tech: ['.NET 10', 'React 19'],
  role: 'Design & implementation',
  visibility: 'public',
  links: [{ label: 'GitHub', href: 'https://github.com/felipe-allmeida/pulse' }],
};

const privateProject: Project = {
  slug: 'ulbra-atende',
  name: 'Ulbra Atende',
  tagline: 'Support & ticketing platform.',
  description: 'An internal support and ticketing platform.',
  tech: ['.NET 10', 'PostgreSQL'],
  role: 'Software engineer',
  period: 'Professional work',
  visibility: 'private',
  links: [],
};

describe('ProjectCard', () => {
  it('renders name, a tech badge, and the repo link for a public project', () => {
    render(<ProjectCard project={publicProject} />);

    expect(screen.getByText('Pulse')).toBeInTheDocument();
    expect(screen.getByText('.NET 10')).toBeInTheDocument();

    const link = screen.getByRole('link', { name: /github/i });
    expect(link).toHaveAttribute('href', 'https://github.com/felipe-allmeida/pulse');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', expect.stringContaining('noreferrer'));
  });

  it('renders no repo link and a private label for a private project', () => {
    render(<ProjectCard project={privateProject} />);

    expect(screen.getByText('Ulbra Atende')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByText(/professional work.*private/i)).toBeInTheDocument();
  });
});
