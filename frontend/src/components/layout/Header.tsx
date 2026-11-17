import { useState } from 'react';
import {
  CircleAlert,
  Cloud,
  Languages,
  LogIn,
  LogOut,
  Send,
  Sparkles,
  Wallet,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCalculator } from '../../context/CalculatorContext';
import { useI18n } from '../../hooks/useI18n';
import { TELEGRAM_URL } from '../../lib/links';
import { Button } from '../common/Button';
import { SaveStatus } from '../common/SaveStatus';
import { ThemeToggle } from '../common/ThemeToggle';
import { CafeCostLogo } from '../brand/CafeCostLogo';
import { CurrencyModal } from './CurrencyModal';
import { AuthModal } from '../modals/AuthModal';

export function Header() {
  const { state, setLanguage, quickCalculate, saveToCloud, cloudSaveStatus } =
    useCalculator();
  const { user, signOut, loading } = useAuth();
  const { t } = useI18n();
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  const userEmail = user?.email ?? '';

  const cloudLabel =
    cloudSaveStatus === 'saving'
      ? t('header.savingCloud')
      : cloudSaveStatus === 'saved'
        ? t('header.savedCloud')
        : cloudSaveStatus === 'local'
          ? t('header.cloudLocal')
          : cloudSaveStatus === 'error'
            ? t('header.cloudError')
            : cloudSaveStatus === 'unconfigured'
              ? t('header.cloudUnconfiguredLabel')
              : t('header.saveToCloud');

  return (
    <>
      <header className="border-b border-border bg-surface/95 backdrop-blur">
        <div className="mx-auto flex min-h-16 w-full max-w-content flex-wrap items-center gap-x-2 gap-y-2 px-4 py-2 sm:gap-x-3 sm:px-6">
          <a
            href="#main"
            className="flex min-w-0 items-center gap-2 rounded-md focus-visible:outline-none focus-visible:shadow-focus"
          >
            <CafeCostLogo className="size-9 shrink-0" />
            <span className="hidden min-w-0 sm:block">
              <span className="block text-h3 leading-tight text-primary">
                {t('app.name')}
              </span>
              <span className="block truncate text-legal text-primary/50">
                {t('app.tagline')}
              </span>
            </span>
          </a>

          <div className="ms-auto flex items-center gap-1.5 sm:gap-2">
            <Button
              size="md"
              variant="accent"
              onClick={quickCalculate}
              iconStart={<Sparkles aria-hidden="true" />}
              title={t('header.quickCalculateHint')}
              className="px-3 sm:px-4"
            >
              {t('header.quickCalculate')}
            </Button>

            <Button
              size="md"
              variant="secondary"
              onClick={saveToCloud}
              loading={cloudSaveStatus === 'saving'}
              iconStart={<Cloud aria-hidden="true" />}
              aria-label={t('header.saveToCloudHint')}
              title={t('header.saveToCloudHint')}
              className="px-2.5 sm:px-3"
            >
              <span className="hidden text-small font-medium lg:inline">
                {cloudLabel}
              </span>
            </Button>

            {loading ? null : user ? (
              <div className="flex items-center gap-1">
                <span
                  title={userEmail}
                  className="hidden max-w-[14rem] truncate text-small text-primary/70 md:inline"
                >
                  {userEmail}
                </span>
                <Button
                  size="md"
                  variant="ghost"
                  onClick={signOut}
                  iconStart={<LogOut aria-hidden="true" />}
                  aria-label={t('header.signOut')}
                  title={t('header.signOut')}
                  className="px-2.5 sm:px-3"
                >
                  <span className="hidden text-small font-medium lg:inline">
                    {t('header.signOut')}
                  </span>
                </Button>
              </div>
            ) : (
              <Button
                size="md"
                variant="secondary"
                onClick={() => setAuthOpen(true)}
                iconStart={<LogIn aria-hidden="true" />}
                aria-label={t('header.login')}
                title={t('header.login')}
                className="px-2.5 sm:px-3"
              >
                <span className="hidden text-small font-medium sm:inline">
                  {t('header.login')}
                </span>
              </Button>
            )}

            <Button
              size="md"
              variant="secondary"
              onClick={() => setCurrencyOpen(true)}
              aria-label={t('header.currencyHint')}
              title={t('header.currencyHint')}
              className="hidden px-2.5 sm:inline-flex"
            >
              <Wallet aria-hidden="true" />
              <span className="hidden text-small font-medium lg:inline">
                {state.settings.currencyCode}
              </span>
            </Button>

            <ThemeToggle />

            <Button
              size="md"
              variant="ghost"
              onClick={() => setLanguage(state.language === 'en' ? 'ar' : 'en')}
              aria-label={t('header.language')}
              title={t('header.language')}
              className="px-2.5"
            >
              <Languages aria-hidden="true" />
              <span className="hidden text-small font-semibold sm:inline">
                {state.language === 'en' ? 'AR' : 'EN'}
              </span>
            </Button>

            <a
              href={TELEGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t('header.telegram')}
              title={t('header.telegram')}
              className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-md px-2 text-accent transition hover:bg-accent/10 focus-visible:outline-none focus-visible:shadow-focus"
            >
              <Send aria-hidden="true" className="size-4" />
              <span className="hidden text-small font-medium xl:inline">
                {t('header.telegram')}
              </span>
            </a>

            <SaveStatus className="hidden xl:inline-flex" />
          </div>
        </div>

        {cloudSaveStatus === 'unconfigured' ? (
          <div className="border-t border-warning/30 bg-warning-surface">
            <p
              role="alert"
              className="mx-auto flex w-full max-w-content items-start gap-2 px-4 py-2 text-small text-warning sm:px-6"
            >
              <CircleAlert
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0"
              />
              <span>{t('header.cloudUnconfigured')}</span>
            </p>
          </div>
        ) : null}
      </header>

      <CurrencyModal open={currencyOpen} onClose={() => setCurrencyOpen(false)} />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}
