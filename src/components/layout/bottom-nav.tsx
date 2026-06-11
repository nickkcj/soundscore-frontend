'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Rss, Compass, PlusCircle, Users, User } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  isCta?: boolean;
}

const BASE_ITEMS: NavItem[] = [
  { label: 'Feed', href: '/feed', icon: Rss },
  { label: 'Discover', href: '/discover', icon: Compass },
  { label: 'Review', href: '/reviews/create', icon: PlusCircle, isCta: true },
  { label: 'Groups', href: '/groups', icon: Users },
];

export function BottomNav() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (!isAuthenticated || !user) return null;

  const profileItem: NavItem = {
    label: 'Profile',
    href: `/profile/${user.username}`,
    icon: User,
  };

  const items = [...BASE_ITEMS, profileItem];

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/');

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-end justify-around h-16">
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          if (item.isCta) {
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                className="flex flex-col items-center justify-center -mt-5 px-2"
              >
                <span className="flex items-center justify-center w-14 h-14 rounded-full bg-wine-700 shadow-lg active:bg-wine-800 transition-colors">
                  <Icon className="h-7 w-7 text-white" />
                </span>
                <span className="text-[10px] font-medium text-wine-700 mt-0.5">{item.label}</span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors',
                active ? 'text-wine-700 dark:text-wine-300' : 'text-muted-foreground'
              )}
            >
              <Icon className={cn('h-5 w-5', active && 'fill-wine-700/15 dark:fill-wine-300/15')} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
