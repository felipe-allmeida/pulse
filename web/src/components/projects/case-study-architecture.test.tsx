import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CaseStudyArchitecture } from '@/components/projects/case-study-architecture';
import type { CaseStudyArchitectureNode } from '@/content/projects';
import { renderWithI18n } from '@/test/render-with-i18n';

const summary = {
  en: 'A .NET 10 modular monolith.',
  'pt-BR': 'Um monólito modular em .NET 10.',
};

const nodes: CaseStudyArchitectureNode[] = [
  {
    label: 'React 19 SPA',
    detail: { en: 'TanStack Router and Query.', 'pt-BR': 'TanStack Router e Query.' },
  },
  {
    label: 'PostgreSQL 17',
    detail: { en: 'One schema per module.', 'pt-BR': 'Um schema por módulo.' },
  },
];

describe('CaseStudyArchitecture', () => {
  it('renders the summary and every node in English', async () => {
    await renderWithI18n(<CaseStudyArchitecture summary={summary} nodes={nodes} />);

    expect(screen.getByText('A .NET 10 modular monolith.')).toBeInTheDocument();
    expect(screen.getByText('React 19 SPA')).toBeInTheDocument();
    expect(screen.getByText('TanStack Router and Query.')).toBeInTheDocument();
    expect(screen.getByText('PostgreSQL 17')).toBeInTheDocument();
    expect(screen.getByText('One schema per module.')).toBeInTheDocument();
  });

  it('renders in pt-BR', async () => {
    await renderWithI18n(<CaseStudyArchitecture summary={summary} nodes={nodes} />, {
      locale: 'pt-BR',
    });

    expect(screen.getByText('Um monólito modular em .NET 10.')).toBeInTheDocument();
    expect(screen.getByText('Um schema por módulo.')).toBeInTheDocument();
  });

  it('renders nothing when there are no nodes', async () => {
    const { container } = await renderWithI18n(
      <CaseStudyArchitecture summary={summary} nodes={[]} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('adds no heading of its own, so the page keeps one h1', async () => {
    await renderWithI18n(<CaseStudyArchitecture summary={summary} nodes={nodes} />);
    expect(screen.queryAllByRole('heading')).toHaveLength(0);
  });

  it('renders only li elements as direct children of the list', async () => {
    const { container } = await renderWithI18n(
      <CaseStudyArchitecture summary={summary} nodes={nodes} />,
    );

    const list = container.querySelector('ol');
    expect(list).not.toBeNull();
    const invalidChildren = Array.from(list!.children).filter((el) => el.tagName !== 'LI');
    expect(invalidChildren).toHaveLength(0);
  });
});
