import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

interface StatCardProps {
  label: ReactNode;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  tone?: string;
  className?: string;
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        'min-w-0 rounded-xl border border-border bg-surface p-4 shadow-sm',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-small font-medium text-primary/55">{label}</p>
        {icon ? (
          <span className="shrink-0 text-primary/35">{icon}</span>
        ) : null}
      </div>
      <p
        className={cn(
          'mt-2 break-words font-numeric text-h2 leading-7 text-primary',
          tone,
        )}
      >
        {value}
      </p>
      {hint ? (
        <p className="mt-1 text-legal leading-4 text-primary/50">{hint}</p>
      ) : null}
    </div>
  );
}
