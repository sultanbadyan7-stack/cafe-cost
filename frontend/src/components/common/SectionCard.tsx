import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

interface SectionCardProps {
  id?: string;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}

export function SectionCard({
  id,
  title,
  description,
  action,
  icon,
  children,
  className,
  bodyClassName,
}: SectionCardProps) {
  return (
    <section
      id={id}
      aria-labelledby={id ? `${id}-title` : undefined}
      className={cn(
        'rounded-xl border border-border bg-surface shadow-sm',
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border p-5 sm:p-6">
        <div className="flex min-w-0 items-start gap-3">
          {icon ? (
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-background text-accent">
              {icon}
            </span>
          ) : null}
          <div className="min-w-0">
            <h2 id={id ? `${id}-title` : undefined} className="text-h2 text-primary">
              {title}
            </h2>
            {description ? (
              <p className="mt-1 max-w-prose text-small text-primary/60">
                {description}
              </p>
            ) : null}
          </div>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className={cn('p-5 sm:p-6', bodyClassName)}>{children}</div>
    </section>
  );
}
