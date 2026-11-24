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
import { Footer } from './components/layout/Footer';
import { useI18n } from './hooks/useI18n';
import { useEnterKeyNavigation } from './hooks/useEnterKeyNavigation';

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

        <Footer />
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
