import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useI18n } from '../../hooks/useI18n';
import { Button } from './Button';

/**
 * Sun / Moon theme switch for the global header.
 * The preference is persisted by `ThemeProvider` under `cafecost.theme.v1`.
 */
export function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();
  const { t } = useI18n();
  const currentLabel = isDark ? t('header.themeDark') : t('header.themeLight');
  const nextLabel = isDark ? t('header.themeLight') : t('header.themeDark');

  return (
    <Button
      size="md"
      variant="ghost"
      onClick={toggleTheme}
      aria-label={`${t('header.theme')}: ${currentLabel}`}
      aria-pressed={isDark}
      title={`${t('header.theme')}: ${nextLabel}`}
      className="px-2.5"
    >
      {isDark ? (
        <Sun aria-hidden="true" />
      ) : (
        <Moon aria-hidden="true" />
      )}
    </Button>
  );
}
