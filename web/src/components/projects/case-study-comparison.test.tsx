import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CaseStudyComparison } from '@/components/projects/case-study-comparison';
import type { CaseStudyComparison as CaseStudyComparisonContent } from '@/content/projects';
import { renderWithI18n } from '@/test/render-with-i18n';

const comparison: CaseStudyComparisonContent = {
  caption: { en: 'One test cycle', 'pt-BR': 'Um ciclo de teste' },
  before: {
    label: { en: 'By hand', 'pt-BR': 'À mão' },
    value: { en: '~1 month', 'pt-BR': '~1 mês' },
    weight: 160,
  },
  after: {
    label: { en: 'Automated', 'pt-BR': 'Automatizado' },
    value: { en: '~3 hours', 'pt-BR': '~3 horas' },
    weight: 3,
  },
  source: { en: 'As recalled.', 'pt-BR': 'Conforme lembrado.' },
};

function barWidths(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll('[data-bar]')).map(
    (el) => (el as HTMLElement).style.width,
  );
}

describe('CaseStudyComparison', () => {
  it('renders both sides with their labels and values', async () => {
    await renderWithI18n(<CaseStudyComparison comparison={comparison} />);

    expect(screen.getByText('By hand')).toBeInTheDocument();
    expect(screen.getByText('~1 month')).toBeInTheDocument();
    expect(screen.getByText('Automated')).toBeInTheDocument();
    expect(screen.getByText('~3 hours')).toBeInTheDocument();
    expect(screen.getByText('As recalled.')).toBeInTheDocument();
  });

  it('draws bars proportional to weight, the largest filling the track', async () => {
    const { container } = await renderWithI18n(<CaseStudyComparison comparison={comparison} />);

    const widths = barWidths(container);
    expect(widths).toHaveLength(2);
    expect(widths[0]).toBe('100%');
    expect(widths[1], '3/160 = 1.875%').toBe('1.875%');
  });

  it('scales correctly when the larger side is second', async () => {
    const flipped: CaseStudyComparisonContent = {
      ...comparison,
      before: { ...comparison.before, weight: 3 },
      after: { ...comparison.after, weight: 160 },
    };
    const { container } = await renderWithI18n(<CaseStudyComparison comparison={flipped} />);

    const widths = barWidths(container);
    expect(widths[1]).toBe('100%');
    expect(widths[0], '3/160 = 1.875%').toBe('1.875%');
  });

  it('renders in pt-BR', async () => {
    await renderWithI18n(<CaseStudyComparison comparison={comparison} />, { locale: 'pt-BR' });
    expect(screen.getByText('À mão')).toBeInTheDocument();
    expect(screen.getByText('~3 horas')).toBeInTheDocument();
  });

  it('adds no heading of its own', async () => {
    await renderWithI18n(<CaseStudyComparison comparison={comparison} />);
    expect(screen.queryAllByRole('heading')).toHaveLength(0);
  });

  it('draws no bar for a side whose weight is zero', async () => {
    const withZero: CaseStudyComparisonContent = {
      ...comparison,
      before: { ...comparison.before, weight: 0 },
    };
    const { container } = await renderWithI18n(<CaseStudyComparison comparison={withZero} />);

    const widths = barWidths(container);
    expect(widths[0], 'a zero must not be floored into a visible bar').toBe('0%');
    expect(widths[1]).toBe('100%');
  });

  it('draws no bar for a negative weight', async () => {
    const negative: CaseStudyComparisonContent = {
      ...comparison,
      before: { ...comparison.before, weight: -5 },
    };
    const { container } = await renderWithI18n(<CaseStudyComparison comparison={negative} />);
    expect(barWidths(container)[0]).toBe('0%');
  });

  it('renders nothing when neither side has a weight', async () => {
    const bothZero: CaseStudyComparisonContent = {
      ...comparison,
      before: { ...comparison.before, weight: 0 },
      after: { ...comparison.after, weight: 0 },
    };
    const { container } = await renderWithI18n(<CaseStudyComparison comparison={bothZero} />);
    expect(container).toBeEmptyDOMElement();
  });
});
