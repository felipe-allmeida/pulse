import { ChevronRight } from 'lucide-react';
import type { CaseStudyArchitectureNode } from '@/content/projects';
import type { LocalizedString } from '@/content/types';
import { useLocalized } from '@/i18n/use-localized';

export interface CaseStudyArchitectureProps {
  summary: LocalizedString;
  nodes: CaseStudyArchitectureNode[];
}

/**
 * A project's architecture: a summary paragraph over a static left-to-right
 * node flow (stacked on mobile). Deliberately static — the home page's
 * diagram animates because that page *is* a live system; here an animated
 * edge would be decoration pretending to be data.
 */
export function CaseStudyArchitecture({ summary, nodes }: CaseStudyArchitectureProps) {
  const L = useLocalized();
  if (nodes.length === 0) return null;

  return (
    <div className="flex flex-col gap-5">
      <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">{L(summary)}</p>
      <ol className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
        {nodes.map((node, index) => (
          <li key={index} className="flex flex-col items-stretch gap-2 sm:flex-1 sm:flex-row sm:items-center">
            {index > 0 ? (
              <ChevronRight
                aria-hidden
                className="size-4 shrink-0 rotate-90 self-center text-signal/40 sm:rotate-0"
              />
            ) : null}
            <span className="flex flex-1 flex-col gap-1 rounded-lg border border-signal/20 bg-signal-muted/10 p-3">
              <span className="font-mono text-xs font-medium text-signal-strong">{node.label}</span>
              <span className="text-xs leading-relaxed text-muted-foreground">{L(node.detail)}</span>
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
