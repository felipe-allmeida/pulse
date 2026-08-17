import type { CaseStudyTable as CaseStudyTableContent } from '@/content/projects';
import { useLocalized } from '@/i18n/use-localized';

export interface CaseStudyTableProps {
  table: CaseStudyTableContent;
}

/**
 * A small illustrative table of what a system records. A real `<table>` with
 * scoped column headers rather than a picture of one, so the values stay
 * selectable and a screen reader announces each cell with its column. Wide
 * content scrolls inside its own container so the page never does.
 * The caption is rendered by the page section as its heading, not here.
 */
export function CaseStudyTable({ table }: CaseStudyTableProps) {
  const L = useLocalized();
  if (table.rows.length === 0) return null;

  return (
    <figure className="m-0 flex flex-col gap-3">
      <div className="overflow-x-auto rounded-lg border border-signal/20 bg-signal-muted/10">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-signal/20">
              {table.columns.map((column, index) => (
                <th
                  key={index}
                  scope="col"
                  className="px-4 py-3 font-mono text-[0.6875rem] font-medium tracking-wide text-signal-strong uppercase"
                >
                  {L(column)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-b border-signal/10 last:border-b-0">
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="px-4 py-3 align-top text-muted-foreground">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {table.note ? (
        <figcaption className="text-xs leading-relaxed text-muted-foreground">
          {L(table.note)}
        </figcaption>
      ) : null}
    </figure>
  );
}
