import { useMemo } from 'react';
import { flexRender } from '@tanstack/react-table';
// @tanstack/react-table v9 replaced `useReactTable`/`getCoreRowModel` with a new
// feature-slot `useTable` API. `/legacy` is the first-party v8-compat entry point
// that keeps the familiar `useReactTable`-shaped API we don't need row-model
// features (sorting/filtering/pagination) beyond the always-on core row model.
import { getCoreRowModel, useLegacyTable, type LegacyColumnDef } from '@tanstack/react-table/legacy';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useVisits } from '@/lib/api';
import type { VisitPoint } from '@/types/pulse';

const MAX_ROWS = 15;
const SKELETON_ROWS = 5;

const MINUTE = 60;
const HOUR = MINUTE * 60;
const DAY = HOUR * 24;

const relativeTimeFormatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

/**
 * Pure helper: formats `at` relative to `now`. Kept pure (no Date.now() inside)
 * so tests can pass a fixed `now` and get a deterministic string.
 */
export function formatRelativeTime(at: string, now: Date = new Date()): string {
  const diffSeconds = Math.round((new Date(at).getTime() - now.getTime()) / 1000);
  const absSeconds = Math.abs(diffSeconds);

  if (absSeconds < MINUTE) {
    return relativeTimeFormatter.format(diffSeconds, 'second');
  }
  if (absSeconds < HOUR) {
    return relativeTimeFormatter.format(Math.round(diffSeconds / MINUTE), 'minute');
  }
  if (absSeconds < DAY) {
    return relativeTimeFormatter.format(Math.round(diffSeconds / HOUR), 'hour');
  }
  return relativeTimeFormatter.format(Math.round(diffSeconds / DAY), 'day');
}

function newestFirst(points: VisitPoint[], limit: number): VisitPoint[] {
  return [...points].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()).slice(0, limit);
}

const EMPTY_POINTS: VisitPoint[] = [];

type RecentVisitsTableProps = {
  /** Reference instant for relative-time formatting. Defaults to the real current time. */
  now?: Date;
};

function buildColumns(now: Date): LegacyColumnDef<VisitPoint>[] {
  return [
    { id: 'city', header: 'City', accessorKey: 'city' },
    { id: 'country', header: 'Country', accessorKey: 'country' },
    {
      id: 'when',
      header: 'When',
      accessorKey: 'at',
      cell: ({ getValue }) => formatRelativeTime(getValue<string>(), now),
    },
  ];
}

export function RecentVisitsTable({ now = new Date() }: RecentVisitsTableProps = {}) {
  const { data, isLoading } = useVisits();
  const points = useMemo(() => newestFirst(data ?? EMPTY_POINTS, MAX_ROWS), [data]);
  const columns = useMemo(() => buildColumns(now), [now]);

  const table = useLegacyTable({
    data: points,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent visits</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
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
                  No visits yet.
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
