'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Home, Building2, Users, Settings, Calendar, ShieldCheck } from 'lucide-react';

interface NavItem {
  href: string;
  icon: typeof Home;
  label: string;
}

const navItems: NavItem[] = [
  { href: '', icon: Home, label: 'الرئيسية' },
  { href: '/schedule', icon: Calendar, label: 'الجدول' },
  { href: '/halls', icon: Building2, label: 'القاعات' },
  { href: '/teams', icon: Users, label: 'الفرق' },
  { href: '/more', icon: Settings, label: 'المزيد' },
];

interface BottomNavProps {
  locale: string;
  role?: string;
}

export function BottomNav({ locale, role }: BottomNavProps) {
  const pathname = usePathname();
  
  const getLabel = (item: NavItem) => {
    return item.label;
  };

  const isActive = (href: string) => {
    const fullPath = `/${locale}${href}`;
    if (href === '') {
      return pathname === `/${locale}` || pathname === `/${locale}/`;
    }
    return pathname?.startsWith(fullPath);
  };
  
  return (
    <nav className="bottom-nav md:hidden" suppressHydrationWarning>
      <div className="flex items-center justify-evenly w-full max-w-[400px]">
        {navItems.map((item) => {
          const active = isActive(item.href);
          const fullHref = `/${locale}${item.href}`;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={fullHref}
              className={cn('nav-item min-h-[48px] active:scale-95 transition-transform duration-100', active && 'active')}
            >
              <div className="nav-icon">
                <Icon className="w-5 h-5" strokeWidth={2.5} />
              </div>
              <span className="nav-label">{getLabel(item)}</span>
            </Link>
          );
        })}
        {role === 'headcoach' && (
             <Link
              href={`/${locale}/head-coach`}
              className={cn('nav-item min-h-[48px] active:scale-95 transition-transform duration-100', isActive('/head-coach') && 'active')}
            >
              <div className="nav-icon text-amber-600">
                <ShieldCheck className="w-5 h-5" strokeWidth={2.5} />
              </div>
              <span className="nav-label text-amber-600">الإدارة</span>
            </Link>
        )}
      </div>
    </nav>
  );
}
