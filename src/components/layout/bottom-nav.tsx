'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Rss, Library, PlusCircle, Users, User } from 'lucide-react';
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
  { label: 'Biblioteca', href: '/library', icon: Library },
  { label: 'Resenha', href: '/reviews/create', icon: PlusCircle, isCta: true },
  { label: 'Grupos', href: '/groups', icon: Users },
];

export function BottomNav() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (!isAuthenticated || !user || pathname === '/reviews/create') return null;

  const profileItem: NavItem = {
    label: 'Perfil',
    href: `/profile/${user.username}`,
    icon: User,
  };

  const items = [...BASE_ITEMS, profileItem];

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/');

  return (
    <nav
      aria-label="Primary navigation"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border/80 bg-background/95 pb-[var(--safe-area-bottom)] shadow-[0_-8px_24px_-18px_rgba(0,0,0,0.45)] backdrop-blur-md supports-[backdrop-filter]:bg-background/85 md:hidden"
    >
      <div className="flex h-[var(--app-bottom-nav-height)] items-end justify-around px-[var(--safe-area-left)]">
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          if (item.isCta) {
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                aria-current={active ? 'page' : undefined}
                className="flex min-h-11 min-w-11 flex-col items-center justify-center px-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
              >
                <span className="-mt-4 flex h-13 w-13 items-center justify-center rounded-full border-4 border-background bg-wine-700 shadow-lg transition-transform active:scale-95 active:bg-wine-800">
                  <Icon className="h-6 w-6 text-white" />
                </span>
                <span className="mt-0.5 text-[10px] font-semibold text-wine-700 dark:text-wine-300">{item.label}</span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'relative flex h-full min-h-11 flex-1 flex-col items-center justify-center gap-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring active:bg-muted/70',
                active ? 'text-wine-700 dark:text-wine-300' : 'text-muted-foreground'
              )}
            >
              {active && <span className="absolute top-1 h-0.5 w-5 rounded-full bg-current" />}
              <Icon className={cn('h-5 w-5', active && 'fill-wine-700/15 dark:fill-wine-300/15')} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
