import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/cn';

export type ButtonVariant =
  | 'primary'
  | 'accent'
  | 'secondary'
  | 'ghost'
  | 'danger';
export type ButtonSize = 'lg' | 'md' | 'sm';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  iconStart?: ReactNode;
  iconEnd?: ReactNode;
  fullWidth?: boolean;
}

/**
 * §5.2 Button specifications.
 * Large 48px / 24px inline padding / 8px radius / 16px 600.
 * Medium 40px / 16px / 6px / 14px 500.
 * Small 32px / 12px / 4px / 12px 500.
 */
const sizeStyles: Record<ButtonSize, string> = {
  lg: 'h-12 px-6 rounded-lg text-base font-semibold gap-2 [&_svg]:size-5',
  md: 'h-11 px-4 rounded-lg text-body-medium font-medium gap-2 [&_svg]:size-4',
  sm: 'h-9 px-3 rounded-lg text-small-medium font-medium gap-1.5 [&_svg]:size-3.5',
};

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-strong text-white hover:bg-strong-hover',
  accent: 'bg-accent-solid text-white hover:brightness-110',
  secondary:
    'border border-border bg-surface text-primary hover:bg-background',
  ghost: 'bg-transparent text-primary hover:bg-background',
  danger: 'bg-danger text-white hover:brightness-110 dark:text-slate-950',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      iconStart,
      iconEnd,
      fullWidth = false,
      className,
      disabled,
      children,
      type = 'button',
      ...rest
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={cn(
          'relative inline-flex select-none items-center justify-center whitespace-nowrap transition',
          'focus-visible:outline-none focus-visible:shadow-focus',
          'disabled:cursor-not-allowed disabled:border-border disabled:bg-border disabled:text-disabled disabled:opacity-70',
          sizeStyles[size],
          variantStyles[variant],
          fullWidth && 'w-full',
          className,
        )}
        {...rest}
      >
        <span
          className={cn(
            'inline-flex items-center justify-center gap-[inherit]',
            loading && 'invisible',
          )}
        >
          {iconStart}
          {children}
          {iconEnd}
        </span>
        {loading ? (
          <Loader2
            aria-hidden="true"
            className="absolute size-[18px] animate-spin-fast"
          />
        ) : null}
      </button>
    );
  },
);
