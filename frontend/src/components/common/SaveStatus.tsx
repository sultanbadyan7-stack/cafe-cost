import { CircleAlert, CircleCheck, Loader2 } from 'lucide-react';
import { useCalculator } from '../../context/CalculatorContext';
import { useI18n } from '../../hooks/useI18n';
import { formatTime } from '../../lib/format';
import { cn } from '../../lib/cn';

interface SaveStatusProps {
  className?: string;
  showLabel?: boolean;
}

export function SaveStatus({ className, showLabel = true }: SaveStatusProps) {
  const { saveStatus, lastSavedAt } = useCalculator();
  const { t } = useI18n();

  const label =
    saveStatus === 'error'
      ? t('header.saveError')
      : saveStatus === 'saving'
        ? t('header.saving')
        : lastSavedAt === null
          ? t('footer.autosave')
          : t('footer.savedAt', { time: formatTime(lastSavedAt) });

  return (
    <span
      aria-live="polite"
      className={cn(
        'inline-flex items-center gap-1.5 text-small text-primary/55',
        className,
      )}
    >
      {saveStatus === 'error' ? (
        <CircleAlert aria-hidden="true" className="size-3.5 text-danger" />
      ) : saveStatus === 'saving' ? (
        <Loader2 aria-hidden="true" className="size-3.5 animate-spin-fast" />
      ) : (
        <CircleCheck aria-hidden="true" className="size-3.5 text-success" />
      )}
      {showLabel ? <span>{label}</span> : <span className="sr-only">{label}</span>}
    </span>
  );
}
