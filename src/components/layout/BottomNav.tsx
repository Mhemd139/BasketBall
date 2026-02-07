'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Home, Building2, Users, Settings, Calendar } from 'lucide-react';

interface NavItem {
  href: string;
  icon: typeof Home;
  label: string;
  labelAr: string;
  labelHe: string;
}

const navItems: NavItem[] = [
  { href: '', icon: Home, label: 'Home', labelAr: 'الرئيسية', labelHe: 'בית' },
  { href: '/schedule', icon: Calendar, label: 'Schedule', labelAr: 'الجدول', labelHe: 'לוח זמנים' },
  { href: '/teams', icon: Users, label: 'Teams', labelAr: 'الفرق', labelHe: 'קבוצות' },
  { href: '/more', icon: Settings, label: 'More', labelAr: 'المزيد', labelHe: 'עוד' },
];

interface BottomNavProps {
  locale: string;
}

export function BottomNav({ locale }: BottomNavProps) {
  const pathname = usePathname();
  
  const getLabel = (item: NavItem) => {
    if (locale === 'ar') return item.labelAr;
    if (locale === 'he') return item.labelHe;
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
      <div className="flex items-center justify-around w-full max-w-[400px]">
        {navItems.map((item) => {
          const active = isActive(item.href);
          const fullHref = `/${locale}${item.href}`;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={fullHref}
              className={cn('nav-item', active && 'active')}
            >
              <div className="nav-icon">
                <Icon className="w-5 h-5" strokeWidth={2.5} />
              </div>
              <span className="nav-label">{getLabel(item)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
