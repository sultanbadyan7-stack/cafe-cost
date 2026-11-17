import type { ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/cn';

interface AccordionProps {
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export function Accordion({
  title,
  description,
  children,
  defaultOpen = false,
  className,
}: AccordionProps) {
  return (
    <details
      open={defaultOpen}
      className={cn(
        'group rounded-xl border border-border bg-surface shadow-sm',
        className,
      )}
    >
      <summary
        className={cn(
          'flex cursor-pointer list-none items-center justify-between gap-3 p-4 sm:p-5',
          'focus-visible:outline-none focus-visible:shadow-focus [&::-webkit-details-marker]:hidden',
        )}
      >
        <div className="min-w-0">
          <p className="text-h3 text-primary">{title}</p>
          {description ? (
            <p className="mt-0.5 text-small text-primary/55">{description}</p>
          ) : null}
        </div>
        <ChevronDown
          aria-hidden="true"
          className="size-4 shrink-0 text-primary/45 transition group-open:rotate-180"
        />
      </summary>
      <div className="border-t border-border p-4 sm:p-5">{children}</div>
    </details>
  );
}
