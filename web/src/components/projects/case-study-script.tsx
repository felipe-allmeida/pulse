import type { CaseStudyScript as CaseStudyScriptContent } from '@/content/projects';
import { useLocalized } from '@/i18n/use-localized';

export interface CaseStudyScriptProps {
  script: CaseStudyScriptContent;
}

/**
 * A real script sample from a project, shown as code. The first token of each
 * line is emphasized as its command — done by splitting the string, not by a
 * syntax-highlighting dependency and not by injecting markup, so the block
 * stays selectable, copyable, and readable to a screen reader as plain text.
 * The caption is rendered by the page section as its heading, not here.
 */
export function CaseStudyScript({ script }: CaseStudyScriptProps) {
  const L = useLocalized();
  if (script.lines.length === 0) return null;

  return (
    <figure className="m-0 flex flex-col gap-3">
      <div className="overflow-x-auto rounded-lg border border-signal/20 bg-signal-muted/10 p-4">
        <pre className="m-0 font-mono text-xs leading-relaxed text-muted-foreground">
          <code>
            {script.lines.map((line, index) => {
              const separator = line.indexOf(' ');
              const command = separator === -1 ? line : line.slice(0, separator);
              const rest = separator === -1 ? '' : line.slice(separator);
              return (
                <span key={index}>
                  <span className="text-signal-strong">{command}</span>
                  {rest}
                  {index < script.lines.length - 1 ? '\n' : ''}
                </span>
              );
            })}
          </code>
        </pre>
      </div>
      {script.note ? (
        <figcaption className="max-w-2xl text-xs leading-relaxed text-muted-foreground">
          {L(script.note)}
        </figcaption>
      ) : null}
    </figure>
  );
}
