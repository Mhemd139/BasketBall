'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Home, Building2, Users, Settings, Dumbbell, BarChart3, Calendar, Wallet } from 'lucide-react';

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
  { href: '/halls', icon: Building2, label: 'Halls', labelAr: 'القاعات', labelHe: 'אולמות' },
  { href: '/trainers', icon: Dumbbell, label: 'Trainers', labelAr: 'المدربين', labelHe: 'מאמנים' },
  { href: '/payments', icon: Wallet, label: 'Payments', labelAr: 'المدفوعات', labelHe: 'תשלומים' },
  { href: '/reports', icon: BarChart3, label: 'Reports', labelAr: 'التقارير', labelHe: 'דוחות' },
  { href: '/more', icon: Settings, label: 'Settings', labelAr: 'الإعدادات', labelHe: 'הגדרות' },
];

interface SidebarProps {
  locale: string;
}

export function Sidebar({ locale }: SidebarProps) {
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
    <aside className="sidebar hidden md:flex" suppressHydrationWarning>
      <nav className="flex flex-col gap-1 w-full">
        {navItems.map((item) => {
          const active = isActive(item.href);
          const fullHref = `/${locale}${item.href}`;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={fullHref}
              className={cn('sidebar-item', active && 'active')}
            >
              <Icon className="w-5 h-5" strokeWidth={2.5} />
              <span>{getLabel(item)}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
