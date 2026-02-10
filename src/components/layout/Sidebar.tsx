'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Home, Building2, Users, Settings, Dumbbell, BarChart3, Calendar, Wallet, ShieldCheck } from 'lucide-react';

interface NavItem {
  href: string;
  icon: typeof Home;
  label: string;
}

const navItems: NavItem[] = [
  { href: '', icon: Home, label: 'الرئيسية' },
  { href: '/schedule', icon: Calendar, label: 'الجدول' },
  { href: '/teams', icon: Users, label: 'الفرق' },
  { href: '/halls', icon: Building2, label: 'القاعات' },
  { href: '/trainers', icon: Dumbbell, label: 'المدربين' },
  { href: '/payments', icon: Wallet, label: 'المدفوعات' },
  { href: '/reports', icon: BarChart3, label: 'التقارير' },
  { href: '/more', icon: Settings, label: 'الإعدادات' },
];

interface SidebarProps {
  locale: string;
  role?: string;
}

export function Sidebar({ locale, role }: SidebarProps) {
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
        
        {/* Head Coach Link */}
        {role === 'headcoach' && (
            <Link
              href={`/${locale}/head-coach`}
              className={cn('sidebar-item', isActive('/head-coach') && 'active', 'text-amber-600 hover:text-amber-700 hover:bg-amber-50')}
            >
              <ShieldCheck className="w-5 h-5" strokeWidth={2.5} />
              <span>الإدارة</span>
            </Link>
        )}
      </nav>
    </aside>
  );
}
