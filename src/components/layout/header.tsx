'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { Menu, X, LogOut, User, Settings, ClipboardList, Moon, Sun, Music, MessageSquare } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { api } from '@/lib/api';

const NAV_ITEMS = [
  { label: 'About', href: '/about' },
  { label: 'Login', href: '/login' },
  { label: 'Register', href: '/register' },
];

function NavPill({ isActive }: { isActive: (path: string) => boolean }) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });
  const defaultIndex = 2; // Register

  const updateIndicator = useCallback((index: number) => {
    const el = itemRefs.current[index];
    const container = containerRef.current;
    if (el && container) {
      const containerRect = container.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      setIndicator({
        left: elRect.left - containerRect.left,
        width: elRect.width,
      });
    }
  }, []);

  useEffect(() => {
    updateIndicator(defaultIndex);
  }, [updateIndicator]);

  const activeIndex = hoveredIndex ?? defaultIndex;

  useEffect(() => {
    updateIndicator(activeIndex);
  }, [activeIndex, updateIndicator]);

  return (
    <div
      ref={containerRef}
      className="relative flex items-center bg-muted/50 backdrop-blur-sm rounded-full px-1.5 py-1 shadow-sm border border-border/50 mx-2"
      onMouseLeave={() => setHoveredIndex(null)}
    >
      <div
        className="absolute top-1 bottom-1 rounded-full bg-wine-600 transition-all duration-300 ease-out"
        style={{ left: indicator.left, width: indicator.width }}
      />
      {NAV_ITEMS.map((item, i) => (
        <Link
          key={item.href}
          ref={(el) => { itemRefs.current[i] = el; }}
          href={item.href}
          className={`relative z-10 py-1.5 px-4 text-base font-medium rounded-full transition-colors duration-300 ${
            activeIndex === i
              ? 'text-white'
              : isActive(item.href)
                ? 'text-wine-600 dark:text-wine-300'
                : 'text-foreground/80 hover:text-wine-600 dark:hover:text-wine-300'
          }`}
          onMouseEnter={() => setHoveredIndex(i)}
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}

export function Header() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [unreadDMs, setUnreadDMs] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

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
    <header className="sticky top-0 z-50 backdrop-blur-sm bg-background border-b border-border shadow-sm">
      <div className="container mx-auto px-4 md:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link href={isAuthenticated ? '/feed' : '/'} className="flex items-center group">
            <Image
              src="/images/logo_soundscore.png"
              alt="SoundScore"
              width={500}
              height={120}
              className="h-32 -my-12 w-auto object-contain group-hover:opacity-90 transition-opacity"
            />
          </Link>

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
                    href="/discover"
                    className={`group relative py-1.5 px-4 text-base font-medium transition-all duration-200 hover:bg-background/70 rounded-full ${
                      isActive('/discover') ? 'text-wine-600 dark:text-wine-300' : 'text-foreground/80 hover:text-wine-600 dark:hover:text-wine-300'
                    }`}
                  >
                    <span>Discover</span>
                    <span className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 h-0.5 bg-wine-600 transition-all duration-300 ${
                      isActive('/discover') ? 'w-[80%] opacity-100' : 'w-0 opacity-0 group-hover:w-[80%] group-hover:opacity-100'
                    }`} />
                  </Link>
                  <Link
                    href="/groups"
                    className={`group relative py-1.5 px-4 text-base font-medium transition-all duration-200 hover:bg-background/70 rounded-full ${
                      isActive('/groups') ? 'text-wine-600 dark:text-wine-300' : 'text-foreground/80 hover:text-wine-600 dark:hover:text-wine-300'
                    }`}
                  >
                    <span>Groups</span>
                    <span className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 h-0.5 bg-wine-600 transition-all duration-300 ${
                      isActive('/groups') ? 'w-[80%] opacity-100' : 'w-0 opacity-0 group-hover:w-[80%] group-hover:opacity-100'
                    }`} />
                  </Link>
                </div>

                {/* Right Side Actions */}
                <div className="flex items-center gap-3">
                  {/* Messages */}
                  <Link href="/messages" className="relative p-2 hover:bg-muted rounded-full transition-colors">
                    <MessageSquare className={cn('h-5 w-5', isActive('/messages') ? 'text-wine-600 dark:text-wine-300' : 'text-foreground/70')} />
                    {unreadDMs > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] px-1 rounded-full bg-wine-600 text-white text-[10px] font-bold flex items-center justify-center">
                        {unreadDMs > 99 ? '99+' : unreadDMs}
                      </span>
                    )}
                  </Link>

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
                          onClick={logout}
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

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-foreground hover:text-wine-600 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background">
          <nav className="container mx-auto px-4 py-4 flex flex-col gap-2">
            {isAuthenticated ? (
              <>
                {/* User Info */}
                <div className="flex items-center gap-3 p-3 mb-2 bg-muted rounded-lg">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user?.profile_picture || undefined} />
                    <AvatarFallback className="bg-wine-600 text-white">
                      {user?.username?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-foreground">{user?.username}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                </div>

                <Link
                  href="/feed"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`py-2 px-4 rounded-lg text-base font-medium transition-colors ${
                    isActive('/feed') ? 'bg-wine-50 text-wine-600 dark:bg-wine-950 dark:text-wine-300' : 'text-foreground hover:bg-muted'
                  }`}
                >
                  Feed
                </Link>
                <Link
                  href="/discover"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`py-2 px-4 rounded-lg text-base font-medium transition-colors ${
                    isActive('/discover') ? 'bg-wine-50 text-wine-600 dark:bg-wine-950 dark:text-wine-300' : 'text-foreground hover:bg-muted'
                  }`}
                >
                  Discover
                </Link>
                <Link
                  href="/groups"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`py-2 px-4 rounded-lg text-base font-medium transition-colors ${
                    isActive('/groups') ? 'bg-wine-50 text-wine-600 dark:bg-wine-950 dark:text-wine-300' : 'text-foreground hover:bg-muted'
                  }`}
                >
                  Groups
                </Link>
                <Link
                  href="/messages"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`py-2 px-4 rounded-lg text-base font-medium transition-colors flex items-center justify-between ${
                    isActive('/messages') ? 'bg-wine-50 text-wine-600 dark:bg-wine-950 dark:text-wine-300' : 'text-foreground hover:bg-muted'
                  }`}
                >
                  <span>Messages</span>
                  {unreadDMs > 0 && (
                    <span className="h-5 min-w-[20px] px-1.5 rounded-full bg-wine-600 text-white text-xs font-medium flex items-center justify-center">
                      {unreadDMs}
                    </span>
                  )}
                </Link>
                <Link
                  href={`/profile/${user?.username}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`py-2 px-4 rounded-lg text-base font-medium transition-colors ${
                    isActive(`/profile/${user?.username}`) ? 'bg-wine-50 text-wine-600 dark:bg-wine-950 dark:text-wine-300' : 'text-foreground hover:bg-muted'
                  }`}
                >
                  My Profile
                </Link>
                <Link
                  href="/library"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`py-2 px-4 rounded-lg text-base font-medium transition-colors ${
                    isActive('/library') ? 'bg-wine-50 text-wine-600 dark:bg-wine-950 dark:text-wine-300' : 'text-foreground hover:bg-muted'
                  }`}
                >
                  Library
                </Link>
                <Link
                  href="/my-reviews"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`py-2 px-4 rounded-lg text-base font-medium transition-colors ${
                    isActive('/my-reviews') ? 'bg-wine-50 text-wine-600 dark:bg-wine-950 dark:text-wine-300' : 'text-foreground hover:bg-muted'
                  }`}
                >
                  My Reviews
                </Link>
                <Link
                  href="/account"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`py-2 px-4 rounded-lg text-base font-medium transition-colors ${
                    isActive('/account') ? 'bg-wine-50 text-wine-600 dark:bg-wine-950 dark:text-wine-300' : 'text-foreground hover:bg-muted'
                  }`}
                >
                  Settings
                </Link>
                <hr className="my-2 border-border" />
                <button
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="py-2 px-4 rounded-lg text-base font-medium text-foreground hover:bg-muted text-left transition-colors flex items-center gap-2"
                >
                  {mounted && theme === 'dark' ? (
                    <Sun className="h-4 w-4" />
                  ) : (
                    <Moon className="h-4 w-4" />
                  )}
                  {mounted && theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                </button>
                <hr className="my-2 border-border" />
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="py-2 px-4 rounded-lg text-base font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950 text-left transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/about"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`py-2 px-4 rounded-lg text-base font-medium transition-colors ${
                    isActive('/about') ? 'bg-wine-50 text-wine-600 dark:bg-wine-950 dark:text-wine-300' : 'text-foreground hover:bg-muted'
                  }`}
                >
                  About
                </Link>
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`py-2 px-4 rounded-lg text-base font-medium transition-colors ${
                    isActive('/login') ? 'bg-wine-50 text-wine-600 dark:bg-wine-950 dark:text-wine-300' : 'text-foreground hover:bg-muted'
                  }`}
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2 px-4 rounded-lg text-base font-medium bg-wine-600 text-white text-center"
                >
                  Register
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
