'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Menu, X, LogOut, User, Settings, ClipboardList, Moon, Sun, Music, MessageCircle, Radio } from 'lucide-react';
import { useState, useEffect, useCallback, useSyncExternalStore } from 'react';
import { useTheme } from 'next-themes';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';
import { NotificationDropdown } from './notification-dropdown';
import { GlobalSearch } from './global-search';
import { api } from '@/lib/api';

const NAV_ITEMS = [
  { label: 'Sobre', href: '/about' },
  { label: 'Entrar', href: '/login' },
  { label: 'Criar conta', href: '/register' },
];

const subscribeToHydration = () => () => {};

function NavPill({ isActive }: { isActive: (path: string) => boolean }) {
  return (
    <div className="flex items-center gap-1">
      {NAV_ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            'rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200',
            item.href === '/register'
              ? 'ml-1 bg-wine-700 px-5 text-white shadow-[0_6px_20px_rgba(114,47,55,0.18)] hover:-translate-y-0.5 hover:bg-wine-800 hover:shadow-[0_8px_24px_rgba(114,47,55,0.24)]'
              : isActive(item.href)
                ? 'bg-wine-700/8 text-wine-700 dark:text-wine-300'
                : 'text-foreground/65 hover:bg-white/70 hover:text-wine-700 dark:hover:bg-muted'
          )}
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = useCallback(() => {
    logout();
    router.push('/');
  }, [logout, router]);
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false
  );
  const [unreadDMs, setUnreadDMs] = useState(0);

  // Poll unread DM count
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchUnread = async () => {
      try {
        const data = await api.get<{ unread_count: number }>('/dm/unread-count');
        setUnreadDMs(data.unread_count);
      } catch {
        // Silent
      }
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/');

  return (
    <header
      className={cn(
        'sticky top-0 z-50 border-b pt-[var(--safe-area-top)] backdrop-blur-md',
        !isAuthenticated && (pathname === '/' || pathname === '/about')
          ? 'border-[#1b1919]/8 bg-[#f4f0e8]/92 supports-[backdrop-filter]:bg-[#f4f0e8]/82'
          : 'border-border/80 bg-background/95 shadow-sm supports-[backdrop-filter]:bg-background/85'
      )}
    >
      <div className="container mx-auto px-4 md:px-8">
        <div className="flex h-[var(--app-header-height)] items-center justify-between gap-3">
          {/* Logo */}
          <Link
            href={isAuthenticated ? '/feed' : '/'}
            className="group flex min-h-11 min-w-0 items-center gap-1.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Image
              src="/images/logo_only_soundscore.png"
              alt=""
              width={40}
              height={40}
              priority
              className="h-7 w-7 shrink-0 object-contain transition-transform duration-200 group-hover:scale-105 dark:brightness-0 dark:invert md:h-8 md:w-8"
            />
            <span className="truncate text-xl font-black tracking-[-0.035em] text-wine-800 transition-opacity group-hover:opacity-90 dark:text-wine-300 md:text-[1.35rem]">
              SoundScore
            </span>
          </Link>

          {isAuthenticated && (
            <div className="mx-5 hidden min-w-0 flex-1 justify-center md:flex">
              <GlobalSearch />
            </div>
          )}

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 md:gap-2">
            {isAuthenticated ? (
              <>
                {/* Navigation Pills */}
                <div className="flex items-center bg-muted/50 backdrop-blur-sm rounded-full px-1.5 py-1 shadow-sm border border-border/50 mx-2">
                  <Link
                    href="/feed"
                    className={`group relative py-1.5 px-4 text-base font-medium transition-all duration-200 hover:bg-background/70 rounded-full ${
                      isActive('/feed') ? 'text-wine-600 dark:text-wine-300' : 'text-foreground/80 hover:text-wine-600 dark:hover:text-wine-300'
                    }`}
                  >
                    <span>Feed</span>
                    <span className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 h-0.5 bg-wine-600 transition-all duration-300 ${
                      isActive('/feed') ? 'w-[80%] opacity-100' : 'w-0 opacity-0 group-hover:w-[80%] group-hover:opacity-100'
                    }`} />
                  </Link>
                  <Link
                    href="/groups"
                    className={`group relative py-1.5 px-4 text-base font-medium transition-all duration-200 hover:bg-background/70 rounded-full ${
                      isActive('/groups') ? 'text-wine-600 dark:text-wine-300' : 'text-foreground/80 hover:text-wine-600 dark:hover:text-wine-300'
                    }`}
                  >
                    <span>Grupos</span>
                    <span className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 h-0.5 bg-wine-600 transition-all duration-300 ${
                      isActive('/groups') ? 'w-[80%] opacity-100' : 'w-0 opacity-0 group-hover:w-[80%] group-hover:opacity-100'
                    }`} />
                  </Link>
                </div>

                {/* Right Side Actions */}
                <div className="flex items-center gap-3">
                  {/* Messages — mesmo wrapper/estilo do sino de notificações */}
                  <Button variant="ghost" size="icon" className={cn('relative h-10 w-10 rounded-full p-0 text-foreground/70 transition-colors hover:bg-wine-700/8 hover:text-wine-700', isActive('/messages') && 'bg-wine-700/8 text-wine-700 dark:text-wine-300')} asChild>
                    <Link href="/messages" aria-label="Mensagens">
                      <MessageCircle className="size-5 stroke-[1.9]" />
                      {unreadDMs > 0 && (
                        <span className="absolute right-0 top-0 flex h-[17px] min-w-[17px] -translate-y-px translate-x-px items-center justify-center rounded-full border-2 border-background bg-wine-700 px-1 text-[9px] font-black leading-none text-white">
                          {unreadDMs > 9 ? '9+' : unreadDMs}
                        </span>
                      )}
                    </Link>
                  </Button>

                  {/* Notifications */}
                  <NotificationDropdown />

                  {/* User Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="relative focus:outline-none">
                        <Avatar className="h-10 w-10 ring-2 ring-wine-200 hover:ring-wine-400 dark:ring-wine-800 dark:hover:ring-wine-600 transition-all cursor-pointer">
                          <AvatarImage src={user?.profile_picture || undefined} alt={user?.username} />
                          <AvatarFallback className="bg-wine-600 text-white font-semibold">
                            {user?.username?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-lg border border-border">
                      {/* User Info Header */}
                      <div className="flex items-center gap-3 p-3 border-b border-border">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user?.profile_picture || undefined} />
                          <AvatarFallback className="bg-wine-600 text-white">
                            {user?.username?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-foreground">{user?.username}</span>
                          <span className="text-xs text-muted-foreground">{user?.email}</span>
                        </div>
                      </div>

                      {/* Menu Items */}
                      <div className="py-1">
                        <DropdownMenuItem asChild>
                          <Link href={`/profile/${user?.username}`} className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-wine-50 hover:text-wine-600 dark:hover:bg-wine-950/30 dark:hover:text-wine-300">
                            <User className="h-4 w-4" />
                            <span>My Profile</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/library" className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-wine-50 hover:text-wine-600 dark:hover:bg-wine-950/30 dark:hover:text-wine-300">
                            <Music className="h-4 w-4" />
                            <span>Library</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/sessions" className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-wine-50 hover:text-wine-600 dark:hover:bg-wine-950/30 dark:hover:text-wine-300">
                            <Radio className="h-4 w-4" />
                            <span>Listening Party</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/my-reviews" className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-wine-50 hover:text-wine-600 dark:hover:bg-wine-950/30 dark:hover:text-wine-300">
                            <ClipboardList className="h-4 w-4" />
                            <span>My Reviews</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/account" className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-wine-50 hover:text-wine-600 dark:hover:bg-wine-950/30 dark:hover:text-wine-300">
                            <Settings className="h-4 w-4" />
                            <span>Settings</span>
                          </Link>
                        </DropdownMenuItem>
                      </div>

                      <DropdownMenuSeparator />

                      {/* Theme Toggle */}
                      <div className="py-1">
                        <DropdownMenuItem
                          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                          className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-wine-50 hover:text-wine-600 dark:hover:bg-wine-950/30 dark:hover:text-wine-300"
                        >
                          {mounted && theme === 'dark' ? (
                            <Sun className="h-4 w-4" />
                          ) : (
                            <Moon className="h-4 w-4" />
                          )}
                          <span>{mounted && theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                        </DropdownMenuItem>
                      </div>

                      <DropdownMenuSeparator />

                      {/* Logout */}
                      <div className="py-1">
                        <DropdownMenuItem
                          onClick={handleLogout}
                          className="flex items-center gap-2 px-3 py-2 cursor-pointer text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                          <LogOut className="h-4 w-4" />
                          <span>Logout</span>
                        </DropdownMenuItem>
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </>
            ) : (
              /* Not Authenticated Navigation */
              <NavPill isActive={isActive} />
            )}
          </nav>

          {/* Mobile right-side actions (authenticated: notifications + account) */}
          {isAuthenticated ? (
            <div className="flex shrink-0 items-center gap-0.5 md:hidden [&_button]:min-h-11 [&_button]:min-w-11">
              <GlobalSearch mobile />
              <NotificationDropdown />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="relative flex min-h-11 min-w-11 items-center justify-center rounded-full p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <Avatar className="h-8 w-8 ring-2 ring-wine-200 hover:ring-wine-400 dark:ring-wine-800 dark:hover:ring-wine-600 transition-all cursor-pointer">
                      <AvatarImage src={user?.profile_picture || undefined} alt={user?.username} />
                      <AvatarFallback className="bg-wine-600 text-white font-semibold text-sm">
                        {user?.username?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 rounded-xl shadow-lg border border-border">
                  <div className="flex items-center gap-3 p-3 border-b border-border">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={user?.profile_picture || undefined} />
                      <AvatarFallback className="bg-wine-600 text-white text-sm">
                        {user?.username?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-semibold text-foreground truncate">{user?.username}</span>
                      <span className="text-xs text-muted-foreground truncate">{user?.email}</span>
                    </div>
                  </div>
                  <div className="py-1">
                    <DropdownMenuItem asChild>
                      <Link href="/messages" className="flex items-center justify-between gap-2 px-3 py-2 cursor-pointer hover:bg-wine-50 hover:text-wine-600 dark:hover:bg-wine-950/30 dark:hover:text-wine-300">
                        <div className="flex items-center gap-2">
                          <MessageCircle className="h-4 w-4 stroke-[1.9]" />
                          <span>Mensagens</span>
                        </div>
                        {unreadDMs > 0 && (
                          <span className="h-4 min-w-[16px] px-1 rounded-full bg-wine-600 text-white text-[10px] font-bold flex items-center justify-center">
                            {unreadDMs > 99 ? '99+' : unreadDMs}
                          </span>
                        )}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/library" className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-wine-50 hover:text-wine-600 dark:hover:bg-wine-950/30 dark:hover:text-wine-300">
                        <Music className="h-4 w-4" />
                        <span>Library</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/sessions" className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-wine-50 hover:text-wine-600 dark:hover:bg-wine-950/30 dark:hover:text-wine-300">
                        <Radio className="h-4 w-4" />
                        <span>Listening Party</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/my-reviews" className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-wine-50 hover:text-wine-600 dark:hover:bg-wine-950/30 dark:hover:text-wine-300">
                        <ClipboardList className="h-4 w-4" />
                        <span>My Reviews</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/account" className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-wine-50 hover:text-wine-600 dark:hover:bg-wine-950/30 dark:hover:text-wine-300">
                        <Settings className="h-4 w-4" />
                        <span>Settings</span>
                      </Link>
                    </DropdownMenuItem>
                  </div>
                  <DropdownMenuSeparator />
                  <div className="py-1">
                    <DropdownMenuItem
                      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                      className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-wine-50 hover:text-wine-600 dark:hover:bg-wine-950/30 dark:hover:text-wine-300"
                    >
                      {mounted && theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                      <span>{mounted && theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                    </DropdownMenuItem>
                  </div>
                  <DropdownMenuSeparator />
                  <div className="py-1">
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="flex items-center gap-2 px-3 py-2 cursor-pointer text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Logout</span>
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            /* Mobile menu button for unauthenticated users */
            <button
              className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-muted hover:text-wine-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-public-navigation"
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile Navigation for unauthenticated users only */}
      {mobileMenuOpen && !isAuthenticated && (
        <div id="mobile-public-navigation" className={cn('border-t md:hidden', pathname === '/' || pathname === '/about' ? 'border-[#1b1919]/8 bg-[#f4f0e8]' : 'border-border bg-background')}>
          <nav className="container mx-auto flex flex-col gap-2 px-4 py-3">
            <Link
              href="/about"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex min-h-11 items-center rounded-lg px-4 py-2 text-base font-medium transition-colors ${
                isActive('/about') ? 'bg-wine-50 text-wine-600 dark:bg-wine-950 dark:text-wine-300' : 'text-foreground hover:bg-muted'
              }`}
            >
              Sobre
            </Link>
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex min-h-11 items-center rounded-lg px-4 py-2 text-base font-medium transition-colors ${
                isActive('/login') ? 'bg-wine-50 text-wine-600 dark:bg-wine-950 dark:text-wine-300' : 'text-foreground hover:bg-muted'
              }`}
            >
              Entrar
            </Link>
            <Link
              href="/register"
              onClick={() => setMobileMenuOpen(false)}
              className="flex min-h-11 items-center justify-center rounded-lg bg-wine-600 px-4 py-2 text-center text-base font-medium text-white"
            >
              Criar conta
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
