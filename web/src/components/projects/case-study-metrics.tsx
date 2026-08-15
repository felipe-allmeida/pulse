import { Card, CardContent } from '@/components/ui/card';
import type { CaseStudyMetric } from '@/content/projects';
import type { LocalizedString } from '@/content/types';
import { useLocalized } from '@/i18n/use-localized';
import { cn } from '@/lib/utils';

export interface CaseStudyMetricsProps {
  metrics: CaseStudyMetric[];
  /** One qualifier covering the whole grid — rendered once, above it. */
  note?: LocalizedString;
}

/**
 * The headline-numbers grid on a project case study. Values are already
 * rounded and formatted per locale in content, so nothing here formats
 * numbers — a case study's figures are curated copy, not a live feed.
 * Renders nothing when there are no metrics. The grid runs four across by
 * default and three across for a three-metric case study, so a short set
 * fills its row instead of leaving a hole on the right.
 */
export function CaseStudyMetrics({ metrics, note }: CaseStudyMetricsProps) {
  const L = useLocalized();
  if (metrics.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      {note ? <p className="font-mono text-xs text-muted-foreground">{L(note)}</p> : null}
      <div className={cn('grid grid-cols-2 gap-3', metrics.length === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-4')}>
        {metrics.map((metric, index) => (
          <Card key={index} className="gap-0 border-signal/20 bg-signal-muted/10 py-4">
            <CardContent className="flex flex-col gap-1 px-4">
              <span className="font-mono text-2xl font-bold tabular-nums text-signal-strong">
                {L(metric.value)}
              </span>
              <span className="text-sm text-foreground/80">{L(metric.label)}</span>
              {metric.note ? (
                <span className="font-mono text-xs text-muted-foreground">{L(metric.note)}</span>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
