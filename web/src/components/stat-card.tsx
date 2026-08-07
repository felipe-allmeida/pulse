import type { LucideIcon } from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type StatCardProps = {
  label: string;
  value: number;
  icon: LucideIcon;
  series?: number[];
};

export function StatCard({ label, value, icon: Icon, series }: StatCardProps) {
  const { i18n } = useTranslation();
  const formattedValue = new Intl.NumberFormat(i18n.language).format(value);

  return (
    <Card className="border-signal/20 bg-signal-muted/10">
      <CardHeader className="flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="font-mono text-xs tracking-wide text-muted-foreground uppercase">
          {label}
        </CardTitle>
        <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
      </CardHeader>
      <CardContent>
        <div className="font-mono text-2xl font-bold tabular-nums text-foreground">{formattedValue}</div>
        {series && series.length > 0 && (
          <div className="mt-2 h-12 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series.map((v) => ({ v }))}>
                <Area
                  type="monotone"
                  dataKey="v"
                  stroke="var(--color-chart-1)"
                  fill="var(--color-chart-1)"
                  fillOpacity={0.2}
                  strokeWidth={2}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
