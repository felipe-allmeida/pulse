import { useMemo } from 'react';
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

function buildColumns(now: Date) {
  return [
    columnHelper.accessor('city', { id: 'city', header: 'City' }),
    columnHelper.accessor('country', { id: 'country', header: 'Country' }),
    columnHelper.accessor('at', {
      id: 'when',
      header: 'When',
      cell: ({ getValue }) => formatRelativeTime(getValue(), now),
    }),
  ];
}

export function RecentVisitsTable({ now = new Date() }: RecentVisitsTableProps = {}) {
  const { data, isLoading } = useVisits();
  const points = useMemo(() => byNewest(data ?? EMPTY_POINTS, MAX_ROWS), [data]);
  const columns = useMemo(() => buildColumns(now), [now]);

  const table = useReactTable({
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
