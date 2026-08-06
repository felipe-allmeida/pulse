import { useMemo } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useTranslation } from 'react-i18next';
import { SubsectionHeading } from '@/components/signal/subsection-heading';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { useVisits } from '@/lib/api';
import { bucketByHour } from '@/lib/geo';
import { EMPTY_POINTS } from '@/lib/points';

/**
 * Formats a bucketed hour key (e.g. "2026-08-04T21:00") as a short local
 * time label (e.g. "9 PM") for axis ticks and the tooltip.
 */
function formatHourLabel(hour: string, locale: string): string {
  const date = new Date(`${hour}:00`);
  if (Number.isNaN(date.getTime())) return hour;
  return new Intl.DateTimeFormat(locale, { hour: 'numeric' }).format(date);
}

/**
 * "Visits over time" area chart: hourly visit counts over the visitor points
 * currently held by the API. This is NOT an all-time trend — `/api/map`
 * only ever returns the last 100 tracked points, so the chart reflects
 * recent activity, not full history.
 */
export function VisitsChart() {
  const { t, i18n } = useTranslation('dashboard');
  const { data } = useVisits();
  const points = data ?? EMPTY_POINTS;
  const buckets = useMemo(() => bucketByHour(points), [points]);
  const visitsLabel = t('dashboard:visitsChart.tooltipLabel');

  return (
    <Card className="border-signal/20 bg-signal-muted/10">
      <CardHeader>
        <SubsectionHeading>{t('dashboard:visitsChart.title')}</SubsectionHeading>
        <CardDescription>{t('dashboard:visitsChart.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        {buckets.length === 0 ? (
          <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
            {t('dashboard:visitsChart.empty')}
          </div>
        ) : (
          <div className="h-48 w-full font-mono tabular-nums">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={buckets} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis
                  dataKey="hour"
                  tickFormatter={(hour) => formatHourLabel(hour, i18n.language)}
                  tickLine={false}
                  axisLine={false}
                  stroke="var(--color-muted-foreground)"
                  fontSize={12}
                  minTickGap={24}
                />
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  stroke="var(--color-muted-foreground)"
                  fontSize={12}
                  width={28}
                />
                <Tooltip
                  labelFormatter={(hour) => formatHourLabel(String(hour), i18n.language)}
                  formatter={(value) => [String(value), visitsLabel]}
                  contentStyle={{
                    background: 'var(--color-card)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  name={visitsLabel}
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
