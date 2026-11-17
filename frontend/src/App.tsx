import { useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { CalculatorProvider, useCalculator } from './context/CalculatorContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider, ToastViewport } from './context/ToastContext';
import { Header } from './components/layout/Header';
import { TabNav } from './components/layout/TabNav';
import { Layout } from './components/layout/Layout';
import {
  MobileSummaryBar,
  SummaryRail,
} from './components/layout/StickySummary';
import { GeneralTab } from './components/tabs/GeneralTab';
import { SuppliersTab } from './components/tabs/SuppliersTab';
import { MenuTab } from './components/tabs/MenuTab';
import { ExpensesTab } from './components/tabs/ExpensesTab';
import { StaffTab } from './components/tabs/StaffTab';
import { AssetsTab } from './components/tabs/AssetsTab';
import { SummaryTab } from './components/tabs/SummaryTab';
import { PrintSummary } from './components/report/PrintSummary';
import { SaveStatus } from './components/common/SaveStatus';
import { useI18n } from './hooks/useI18n';
import { useEnterKeyNavigation } from './hooks/useEnterKeyNavigation';
import { TELEGRAM_URL } from './lib/links';

function ActiveTab() {
  const { state } = useCalculator();

  switch (state.tab) {
    case 'menu':
      return <MenuTab />;
    case 'suppliers':
      return <SuppliersTab />;
    case 'expenses':
      return <ExpensesTab />;
    case 'staff':
      return <StaffTab />;
    case 'assets':
      return <AssetsTab />;
    case 'summary':
      return <SummaryTab />;
    default:
      return <GeneralTab />;
  }
}

function AppShell() {
  const { state } = useCalculator();
  const { t } = useI18n();
  useEnterKeyNavigation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [state.tab]);

  return (
    <div className="min-h-screen bg-background">
      <a
        href="#main"
        className="sr-only rounded-md bg-surface px-4 py-2 text-body-medium text-primary shadow-rail focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-50"
      >
        {t('app.skip')}
      </a>

      <div className="sticky top-0 z-40 shadow-sm">
        <Header />
        <TabNav />
      </div>

      <Layout aside={<SummaryRail />}>
        <div
          key={state.tab}
          role="tabpanel"
          className="animate-fade-up"
        >
          <ActiveTab />
        </div>

        <footer className="mt-8 border-t border-border pt-4 text-small text-primary/45">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="max-w-2xl text-legal">{t('app.disclaimer')}</p>
            <div className="flex items-center gap-3">
              <a
                href={TELEGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-8 items-center gap-1.5 rounded-sm px-1 text-small text-primary/60 transition hover:text-accent focus-visible:outline-none focus-visible:shadow-focus"
              >
                {t('footer.telegram')}
              </a>
              <SaveStatus />
            </div>
          </div>
          <p className="mt-1 text-legal text-primary/35">
            {t('app.name')} — {t('footer.madeWith')}
          </p>
        </footer>
      </Layout>

      <MobileSummaryBar />
      <PrintSummary />
      <ToastViewport closeLabel={t('toast.dismiss')} />
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <ToastProvider>
          <CalculatorProvider>
            <AppShell />
          </CalculatorProvider>
        </ToastProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
