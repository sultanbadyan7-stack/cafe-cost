import type { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
  aside: ReactNode;
}

export function Layout({ children, aside }: LayoutProps) {
  return (
    <div className="mx-auto w-full max-w-content px-4 sm:px-6">
      <div className="grid gap-6 py-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:gap-6">
        <main id="main" tabIndex={-1} className="min-w-0 pb-28 focus:outline-none lg:pb-10">
          {children}
        </main>
        <div className="hidden lg:block">{aside}</div>
      </div>
    </div>
  );
}
