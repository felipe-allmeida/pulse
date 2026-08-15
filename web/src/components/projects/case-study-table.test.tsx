import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CaseStudyTable } from '@/components/projects/case-study-table';
import type { CaseStudyTable as CaseStudyTableContent } from '@/content/projects';
import { renderWithI18n } from '@/test/render-with-i18n';

const table: CaseStudyTableContent = {
  caption: { en: 'What a step records', 'pt-BR': 'O que um passo registra' },
  columns: [
    { en: 'Expected', 'pt-BR': 'Esperado' },
    { en: 'Heard', 'pt-BR': 'Ouvido' },
    { en: 'Similarity', 'pt-BR': 'Similaridade' },
  ],
  rows: [
    ['please enter your service tag', 'please enter your service tag', '100%'],
    ['transferring you to support', 'transferring you to sales', '81%'],
  ],
  note: { en: 'Values are illustrative.', 'pt-BR': 'Os valores são ilustrativos.' },
};

describe('CaseStudyTable', () => {
  it('renders a real table with a column header per column', async () => {
    await renderWithI18n(<CaseStudyTable table={table} />);

    const headers = screen.getAllByRole('columnheader');
    expect(headers.map((h) => h.textContent)).toEqual(['Expected', 'Heard', 'Similarity']);
    for (const header of headers) {
      expect(header).toHaveAttribute('scope', 'col');
    }
  });

  it('renders one row per data row, with every cell', async () => {
    await renderWithI18n(<CaseStudyTable table={table} />);

    // +1 for the header row.
    expect(screen.getAllByRole('row')).toHaveLength(3);
    expect(screen.getByText('transferring you to sales')).toBeInTheDocument();
    expect(screen.getByText('81%')).toBeInTheDocument();
  });

  it('renders the note, which carries the illustrative disclaimer', async () => {
    await renderWithI18n(<CaseStudyTable table={table} />);
    expect(screen.getByText('Values are illustrative.')).toBeInTheDocument();
  });

  it('renders headers and note in pt-BR', async () => {
    await renderWithI18n(<CaseStudyTable table={table} />, { locale: 'pt-BR' });

    expect(screen.getAllByRole('columnheader').map((h) => h.textContent)).toEqual([
      'Esperado',
      'Ouvido',
      'Similaridade',
    ]);
    expect(screen.getByText('Os valores são ilustrativos.')).toBeInTheDocument();
  });

  it('renders nothing when there are no rows', async () => {
    const { container } = await renderWithI18n(<CaseStudyTable table={{ ...table, rows: [] }} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('adds no heading of its own', async () => {
    await renderWithI18n(<CaseStudyTable table={table} />);
    expect(screen.queryAllByRole('heading')).toHaveLength(0);
  });
});
