import {
  useId,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
} from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/cn';

export const controlClass =
  'min-h-11 w-full rounded-lg border border-border bg-surface px-3 py-2 text-body leading-5 text-primary ' +
  'placeholder:text-disabled transition focus:border-accent focus:outline-none focus:shadow-focus ' +
  'disabled:cursor-not-allowed disabled:bg-background disabled:text-disabled';

/* -------------------------------------------------------------------------- */
/* Field wrapper                                                              */
/* -------------------------------------------------------------------------- */

interface FieldProps {
  id?: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  optional?: string;
  className?: string;
  children: ReactNode;
}

export function Field({
  id,
  label,
  hint,
  error,
  required,
  optional,
  className,
  children,
}: FieldProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-body-medium font-medium text-primary">
        {label}
        {required ? (
          <span aria-hidden="true" className="text-danger">
            {' '}
            *
          </span>
        ) : null}
        {optional ? (
          <span className="ms-1 text-small font-normal text-primary/50">
            ({optional})
          </span>
        ) : null}
      </label>
      {children}
      {error ? (
        <p className="text-small text-danger" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-small text-primary/55">{hint}</p>
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Text input                                                                 */
/* -------------------------------------------------------------------------- */

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
  suffix?: ReactNode;
  /** Layout classes for the input group when a suffix is present. */
  wrapperClassName?: string;
}

export function TextInput({
  className,
  wrapperClassName,
  invalid,
  suffix,
  ...rest
}: TextInputProps) {
  const inputClass = cn(
    controlClass,
    invalid && 'border-danger focus:border-danger',
    className,
    !suffix && wrapperClassName,
  );

  /*
   * Without a suffix this is a single native input. With a suffix the unit is
   * a real flex child of an input group: no absolute positioning, no overlap,
   * and the value never slides underneath the unit label.
   */
  if (!suffix) {
    return (
      <input
        {...rest}
        aria-invalid={invalid || undefined}
        className={inputClass}
      />
    );
  }

  return (
    <div
      className={cn(
        'flex min-h-11 w-full items-stretch overflow-hidden rounded-lg border border-border bg-surface text-body text-primary transition',
        'focus-within:border-accent focus-within:shadow-focus',
        invalid && 'border-danger focus-within:border-danger',
        rest.disabled && 'bg-background',
        wrapperClassName,
      )}
    >
      <input
        {...rest}
        aria-invalid={invalid || undefined}
        className={cn(
          'min-w-0 flex-1 border-0 bg-transparent px-3 py-2 text-body leading-5 text-primary',
          'placeholder:text-disabled focus:outline-none disabled:cursor-not-allowed disabled:text-disabled',
          className,
        )}
      />
      <span className="pointer-events-none flex shrink-0 select-none items-center border-s border-border/70 bg-background px-2.5 text-small text-primary/60">
        {suffix}
      </span>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Numeric input — rejects negatives at the event level (§8.1)                */
/* -------------------------------------------------------------------------- */

interface NumericInputProps
  extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    'value' | 'onChange' | 'type' | 'min'
  > {
  value: number;
  onChange: (value: number) => void;
  invalid?: boolean;
  suffix?: ReactNode;
}

export function NumericInput({
  value,
  onChange,
  className,
  invalid,
  suffix,
  ...rest
}: NumericInputProps) {
  const [draft, setDraft] = useState<string | null>(null);
  const display = draft ?? (Number.isFinite(value) ? String(value) : '0');

  return (
    <TextInput
      {...rest}
      type="text"
      inputMode="decimal"
      dir="ltr"
      value={display}
      invalid={invalid}
      suffix={suffix}
      onFocus={(event) => {
        setDraft(String(value));
        event.currentTarget.select();
      }}
      onBlur={() => setDraft(null)}
      onKeyDown={(event) => {
        if (['-', '+', 'e', 'E'].includes(event.key)) {
          event.preventDefault();
        }
        rest.onKeyDown?.(event);
      }}
      onChange={(event) => {
        const raw = event.target.value.replace(/,/g, '').trim();
        if (raw === '') {
          setDraft('');
          onChange(0);
          return;
        }
        if (!/^\d*\.?\d*$/.test(raw)) return;
        setDraft(raw);
        const parsed = Number(raw);
        if (Number.isFinite(parsed)) onChange(Math.max(0, parsed));
      }}
      className="text-end font-numeric"
      wrapperClassName={className}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Select                                                                     */
/* -------------------------------------------------------------------------- */

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  options: readonly SelectOption[];
  onChange: (value: string) => void;
  invalid?: boolean;
}

export function Select({
  options,
  onChange,
  className,
  invalid,
  ...rest
}: SelectProps) {
  return (
    <div className={cn('relative min-w-0', className)}>
      <select
        {...rest}
        aria-invalid={invalid || undefined}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          controlClass,
          'appearance-none pe-9',
          invalid && 'border-danger focus:border-danger',
        )}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 end-2.5 my-auto size-4 text-primary/50"
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Switch                                                                     */
/* -------------------------------------------------------------------------- */

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: ReactNode;
  description?: ReactNode;
  id?: string;
}

export function Switch({
  checked,
  onChange,
  label,
  description,
  id,
}: SwitchProps) {
  const generatedId = useId();
  const switchId = id ?? generatedId;

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <label
          htmlFor={switchId}
          className="block text-body-medium font-medium text-primary"
        >
          {label}
        </label>
        {description ? (
          <p className="mt-0.5 text-small text-primary/55">{description}</p>
        ) : null}
      </div>
      <button
        id={switchId}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition',
          'focus-visible:outline-none focus-visible:shadow-focus',
          checked ? 'justify-end bg-accent' : 'justify-start bg-border',
        )}
      >
        <span
          aria-hidden="true"
          className="size-5 rounded-full bg-white shadow-sm"
        />
      </button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Checkbox                                                                   */
/* -------------------------------------------------------------------------- */

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: ReactNode;
  id?: string;
}

export function Checkbox({ checked, onChange, label, id }: CheckboxProps) {
  const generatedId = useId();
  const checkboxId = id ?? generatedId;

  return (
    <label
      htmlFor={checkboxId}
      className={cn(
        'flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition',
        checked
          ? 'border-success/30 bg-success-surface'
          : 'border-border bg-surface hover:bg-background',
      )}
    >
      <input
        id={checkboxId}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 size-4 shrink-0 cursor-pointer rounded-sm accent-accent focus-visible:outline-none focus-visible:shadow-focus"
      />
      <span className="text-body leading-5 text-primary">{label}</span>
    </label>
  );
}
