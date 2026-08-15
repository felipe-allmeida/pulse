import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CaseStudyMetrics } from '@/components/projects/case-study-metrics';
import type { CaseStudyMetric } from '@/content/projects';
import { renderWithI18n } from '@/test/render-with-i18n';

const metrics: CaseStudyMetric[] = [
  {
    value: { en: '~2.4k', 'pt-BR': '~2,4 mil' },
    label: { en: 'tickets handled', 'pt-BR': 'chamados atendidos' },
    note: { en: '85% closed', 'pt-BR': '85% concluídos' },
  },
  {
    value: { en: '200+', 'pt-BR': '200+' },
    label: { en: 'users', 'pt-BR': 'usuários' },
  },
];

const note = { en: 'in ~3 months of production', 'pt-BR': 'em ~3 meses de produção' };

describe('CaseStudyMetrics', () => {
  it('renders every metric in English, with the shared note once', async () => {
    await renderWithI18n(<CaseStudyMetrics metrics={metrics} note={note} />);

    expect(screen.getByText('~2.4k')).toBeInTheDocument();
    expect(screen.getByText('tickets handled')).toBeInTheDocument();
    expect(screen.getByText('85% closed')).toBeInTheDocument();
    expect(screen.getByText('200+')).toBeInTheDocument();
    expect(screen.getByText('users')).toBeInTheDocument();
    expect(screen.getAllByText('in ~3 months of production')).toHaveLength(1);
  });

  it('renders in pt-BR', async () => {
    await renderWithI18n(<CaseStudyMetrics metrics={metrics} note={note} />, { locale: 'pt-BR' });

    expect(screen.getByText('~2,4 mil')).toBeInTheDocument();
    expect(screen.getByText('chamados atendidos')).toBeInTheDocument();
    expect(screen.getByText('em ~3 meses de produção')).toBeInTheDocument();
  });

  it('renders nothing for an empty list', async () => {
    const { container } = await renderWithI18n(<CaseStudyMetrics metrics={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing for an empty list even when a note is given', async () => {
    const { container } = await renderWithI18n(<CaseStudyMetrics metrics={[]} note={note} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('omits the note element entirely when no note is given', async () => {
    await renderWithI18n(<CaseStudyMetrics metrics={metrics} />);
    expect(screen.queryByText(/months of production/i)).not.toBeInTheDocument();
  });

  it('lays out three metrics in three columns, not four', async () => {
    const three: CaseStudyMetric[] = [
      { value: { en: '9', 'pt-BR': '9' }, label: { en: 'insurers', 'pt-BR': 'seguradoras' } },
      { value: { en: '3', 'pt-BR': '3' }, label: { en: 'regions', 'pt-BR': 'regiões' } },
      { value: { en: '7', 'pt-BR': '7' }, label: { en: 'workflows', 'pt-BR': 'fluxos' } },
    ];
    const { container } = await renderWithI18n(<CaseStudyMetrics metrics={three} />);

    const grid = container.querySelector('[class*="grid-cols"]');
    expect(grid).not.toBeNull();
    expect(grid!.className).toContain('sm:grid-cols-3');
    expect(grid!.className).not.toContain('sm:grid-cols-4');
  });

  it('keeps four columns for four metrics', async () => {
    const four: CaseStudyMetric[] = [
      { value: { en: '1', 'pt-BR': '1' }, label: { en: 'a', 'pt-BR': 'a' } },
      { value: { en: '2', 'pt-BR': '2' }, label: { en: 'b', 'pt-BR': 'b' } },
      { value: { en: '3', 'pt-BR': '3' }, label: { en: 'c', 'pt-BR': 'c' } },
      { value: { en: '4', 'pt-BR': '4' }, label: { en: 'd', 'pt-BR': 'd' } },
    ];
    const { container } = await renderWithI18n(<CaseStudyMetrics metrics={four} />);

    const grid = container.querySelector('[class*="grid-cols"]');
    expect(grid!.className).toContain('sm:grid-cols-4');
  });
});
