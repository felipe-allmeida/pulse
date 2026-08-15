import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CaseStudyFlow } from '@/components/projects/case-study-flow';
import type { CaseStudyFlow as CaseStudyFlowContent } from '@/content/projects';
import { renderWithI18n } from '@/test/render-with-i18n';

const flow: CaseStudyFlowContent = {
  caption: { en: 'The life of a thing', 'pt-BR': 'A vida de uma coisa' },
  summary: { en: 'How it moves.', 'pt-BR': 'Como ela anda.' },
  steps: [
    { label: 'Processing', detail: { en: 'Recorded and validated.', 'pt-BR': 'Registrado e validado.' } },
    { label: 'Enrolled', detail: { en: 'The policy exists.', 'pt-BR': 'A apólice existe.' } },
  ],
};

describe('CaseStudyFlow', () => {
  it('renders the summary and every step in order', async () => {
    await renderWithI18n(<CaseStudyFlow flow={flow} />);

    expect(screen.getByText('How it moves.')).toBeInTheDocument();
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent('Processing');
    expect(items[0]).toHaveTextContent('Recorded and validated.');
    expect(items[1]).toHaveTextContent('Enrolled');
  });

  it('renders in pt-BR', async () => {
    await renderWithI18n(<CaseStudyFlow flow={flow} />, { locale: 'pt-BR' });
    expect(screen.getByText('Como ela anda.')).toBeInTheDocument();
    expect(screen.getByText('A apólice existe.')).toBeInTheDocument();
  });

  it('renders without a summary', async () => {
    const { summary, ...rest } = flow;
    await renderWithI18n(<CaseStudyFlow flow={rest} />);
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('renders nothing when there are no steps', async () => {
    const { container } = await renderWithI18n(<CaseStudyFlow flow={{ ...flow, steps: [] }} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the same elements at every width — nothing is hidden by breakpoint', async () => {
    const { container } = await renderWithI18n(<CaseStudyFlow flow={flow} />);
    const hidden = container.querySelectorAll('[class*="hidden"], [class*="sm:block"], [class*="sm:hidden"]');
    expect(hidden, 'a breakpoint-toggled element means two layouts to review').toHaveLength(0);
  });

  it('renders only li elements as direct children of the list', async () => {
    const { container } = await renderWithI18n(<CaseStudyFlow flow={flow} />);
    const list = container.querySelector('ol');
    expect(list).not.toBeNull();
    expect(Array.from(list!.children).filter((el) => el.tagName !== 'LI')).toHaveLength(0);
  });

  it('adds no heading of its own — the page section supplies it', async () => {
    await renderWithI18n(<CaseStudyFlow flow={flow} />);
    expect(screen.queryAllByRole('heading')).toHaveLength(0);
  });
});
