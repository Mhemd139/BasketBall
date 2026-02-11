import { ReactNode } from 'react';
import { Header } from './Header';
import { BottomNav } from './BottomNav';

interface AppShellProps {
  children: ReactNode;
  locale: string;
  showBottomNav?: boolean;
  headerTitle?: string;
  showBack?: boolean;
  backHref?: string;
}

export function AppShell({ 
  children, 
  locale, 
  showBottomNav = true,
  headerTitle,
  showBack,
  backHref
}: AppShellProps) {
  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: '#0a1628' }} dir="rtl">
      <Header 
        locale={locale} 
        title={headerTitle}
        showBack={showBack}
        backHref={backHref}
      />
      
      <main className={`max-w-screen-sm mx-auto px-4 ${showBottomNav ? 'pb-20 pt-20' : 'py-20'}`}>
        {children}
      </main>
      
      {showBottomNav && <BottomNav locale={locale} />}
    </div>
  );
}
