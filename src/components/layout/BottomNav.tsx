'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Home, Building2, Users, User, ShieldCheck } from 'lucide-react';

interface NavItem {
  href: string;
  icon: typeof Home;
  label: string;
}

const navItems: NavItem[] = [
  { href: '', icon: Home, label: 'الرئيسية' },
  { href: '/halls', icon: Building2, label: 'القاعات' },
  { href: '/teams', icon: Users, label: 'الفرق' },
  { href: '/more', icon: User, label: 'حسابي' },
];

interface BottomNavProps {
  locale: string;
  role?: string;
}

export function BottomNav({ locale, role }: BottomNavProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    const fullPath = `/${locale}${href}`;
    if (href === '') {
      return pathname === `/${locale}` || pathname === `/${locale}/`;
    }
    // "حسابي" tab is active for /more, /profile, /settings, /payments, /trainers, /reports
    if (href === '/more') {
      return ['/more', '/profile', '/settings', '/payments', '/trainers', '/reports'].some(
        p => pathname?.startsWith(`/${locale}${p}`)
      );
    }
    return pathname?.startsWith(fullPath);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#0B132B]/80 backdrop-blur-3xl border-t border-white/10 shadow-2xl z-[100] pt-2 pb-[max(env(safe-area-inset-bottom),8px)] flex items-center justify-center px-2 md:hidden" suppressHydrationWarning>
      <div className="flex items-center justify-evenly w-full max-w-[400px]">
        {navItems.map((item) => {
          const active = isActive(item.href);
          const fullHref = `/${locale}${item.href}`;
          const Icon = item.icon;

          return (
            <Link
              key={item.href || 'home'}
              href={fullHref}
              className={cn(
                'flex flex-col items-center justify-center gap-1 min-h-[48px] min-w-[64px] active:scale-95 transition-all duration-150 relative text-gray-400',
                active && 'text-white'
              )}
            >
              <div className={cn(
                'transition-all duration-300',
                active && 'scale-110 -translate-y-1'
              )}>
                <Icon className="w-6 h-6" strokeWidth={active ? 2.5 : 2} />
              </div>
              <span className={cn(
                'transition-all duration-300 text-[10px]',
                active ? 'font-black opacity-100' : 'font-medium opacity-70'
              )}>
                {item.label}
              </span>
              {active && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-gold-400 shadow-[0_0_8px_rgba(250,204,21,0.8)]" />
              )}
            </Link>
          );
        })}
        {role === 'headcoach' && (
          <Link
            href={`/${locale}/head-coach`}
            className={cn(
              'flex flex-col items-center justify-center gap-1 min-h-[48px] min-w-[64px] active:scale-95 transition-all duration-150 relative text-gray-400',
              isActive('/head-coach') && 'text-gold-400'
            )}
          >
            <div className={cn(
              'transition-all duration-300',
              isActive('/head-coach') && 'scale-110 -translate-y-1'
            )}>
              <ShieldCheck className="w-6 h-6" strokeWidth={isActive('/head-coach') ? 2.5 : 2} />
            </div>
            <span className={cn(
              'transition-all duration-300 text-[10px]',
              isActive('/head-coach') ? 'font-black opacity-100 text-gold-400' : 'font-medium opacity-70'
            )}>
              الإدارة
            </span>
            {isActive('/head-coach') && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-gold-400 shadow-[0_0_8px_rgba(250,204,21,0.8)]" />
            )}
          </Link>
        )}
      </div>
    </nav>
  );
}
