import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

interface ResponsiveFieldProps {
  label: ReactNode;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}

/**
 * A field label that stays visible on small screens and becomes screen-reader
 * only on wider layouts, where a shared column header carries the label.
 */
export function ResponsiveField({
  label,
  htmlFor,
  children,
  className,
}: ResponsiveFieldProps) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-1.5', className)}>
      <label
        htmlFor={htmlFor}
        className="text-small font-medium text-primary/60 sm:sr-only"
      >
        {label}
      </label>
      {children}
    </div>
  );
}

export function RowGrid({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'grid gap-3 rounded-lg border border-border bg-surface p-3',
        'sm:items-end sm:gap-x-4 sm:gap-y-3 sm:rounded-none sm:border-0 sm:border-b sm:bg-transparent sm:p-3',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function TableHeaderRow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'hidden gap-4 border-b border-border px-3 pb-2 text-small font-medium text-primary/50 sm:grid [&>span]:whitespace-nowrap',
        className,
      )}
    >
      {children}
    </div>
  );
}
