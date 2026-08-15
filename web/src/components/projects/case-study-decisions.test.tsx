import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CaseStudyDecisions } from '@/components/projects/case-study-decisions';
import type { CaseStudySection } from '@/content/projects';
import { renderWithI18n } from '@/test/render-with-i18n';

const decisions: CaseStudySection[] = [
  {
    heading: { en: 'A modular monolith', 'pt-BR': 'Monólito modular' },
    body: { en: 'One team, one deploy.', 'pt-BR': 'Um time, um deploy.' },
  },
  {
    heading: { en: 'Transactional outbox', 'pt-BR': 'Outbox transacional' },
    body: { en: 'The event commits with the write.', 'pt-BR': 'O evento commita com a escrita.' },
  },
];

describe('CaseStudyDecisions', () => {
  it('renders every heading and body in English', async () => {
    await renderWithI18n(<CaseStudyDecisions sections={decisions} />);

    expect(screen.getByText('A modular monolith')).toBeInTheDocument();
    expect(screen.getByText('One team, one deploy.')).toBeInTheDocument();
    expect(screen.getByText('Transactional outbox')).toBeInTheDocument();
    expect(screen.getByText('The event commits with the write.')).toBeInTheDocument();
  });

  it('renders in pt-BR', async () => {
    await renderWithI18n(<CaseStudyDecisions sections={decisions} />, { locale: 'pt-BR' });

    expect(screen.getByText('Monólito modular')).toBeInTheDocument();
    expect(screen.getByText('O evento commita com a escrita.')).toBeInTheDocument();
  });

  it('renders nothing for an empty list', async () => {
    const { container } = await renderWithI18n(<CaseStudyDecisions sections={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders decision headings as h3, below the page h2 sections', async () => {
    await renderWithI18n(<CaseStudyDecisions sections={decisions} />);
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(2);
  });
});
