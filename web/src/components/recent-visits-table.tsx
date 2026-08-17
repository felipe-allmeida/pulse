import { useMemo } from 'react';
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { SubsectionHeading } from '@/components/signal/subsection-heading';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useVisits } from '@/lib/api';
import { formatRelativeTime } from '@/lib/format';
import { byNewest, EMPTY_POINTS } from '@/lib/points';
import type { VisitPoint } from '@/types/pulse';

const MAX_ROWS = 15;
const SKELETON_ROWS = 5;

type RecentVisitsTableProps = {
  /** Reference instant for relative-time formatting. Defaults to the real current time. */
  now?: Date;
};

const columnHelper = createColumnHelper<VisitPoint>();

function buildColumns(now: Date, locale: string, t: TFunction) {
  return [
    columnHelper.accessor('city', { id: 'city', header: t('dashboard:recentVisits.city') }),
    columnHelper.accessor('country', { id: 'country', header: t('dashboard:recentVisits.country') }),
    columnHelper.accessor('at', {
      id: 'when',
      header: t('dashboard:recentVisits.when'),
      cell: ({ getValue }) => formatRelativeTime(getValue(), now, locale),
    }),
  ];
}

export function RecentVisitsTable({ now = new Date() }: RecentVisitsTableProps = {}) {
  const { t, i18n } = useTranslation('dashboard');
  const { data, isLoading } = useVisits();
  const points = useMemo(() => byNewest(data ?? EMPTY_POINTS, MAX_ROWS), [data]);
  const columns = useMemo(() => buildColumns(now, i18n.language, t), [now, i18n.language, t]);

  const table = useReactTable({
    data: points,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    /*
      Same arrangement as EventFeed: fifteen rows outgrew the map beside it, so
      the grid stretched the *map's* card to match and left a tall empty band
      under the world. The card now takes its height from the row and scrolls
      the table inside it.
    */
    <Card className="flex h-full flex-col border-signal/20 bg-signal-muted/10">
      <CardHeader>
        <SubsectionHeading>{t('dashboard:recentVisits.title')}</SubsectionHeading>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 overflow-y-auto">
        <Table className="font-mono text-xs tabular-nums">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: SKELETON_ROWS }).map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  {columns.map((column) => (
                    <TableCell key={column.id}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center text-muted-foreground">
                  {t('dashboard:recentVisits.empty')}
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
