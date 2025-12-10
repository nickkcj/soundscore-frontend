'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { Menu, X, LogOut, User, Settings, ClipboardList, Moon, Sun } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuthStore } from '@/stores/auth-store';
import { NotificationDropdown } from './notification-dropdown';

export function Header() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/');

  return (
    <header className="sticky top-0 z-50 backdrop-blur-sm bg-background border-b border-border shadow-sm">
      <div className="container mx-auto px-4 md:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link href={isAuthenticated ? '/feed' : '/'} className="flex items-center gap-3 group">
            <div className="relative overflow-hidden rounded-full p-0.5 bg-gradient-to-r from-pink-500 to-purple-500 shadow-inner transform group-hover:scale-105 transition-all duration-300">
              <div className="w-[40px] h-[40px] rounded-full bg-background p-0.5 flex items-center justify-center overflow-hidden">
                <Image
                  src="/images/music.png"
                  alt="SoundScore Logo"
                  width={32}
                  height={32}
                  className="object-contain"
                />
              </div>
            </div>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600 text-2xl font-bold tracking-tight group-hover:opacity-90 transition-opacity">
              SoundScore
            </span>
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
                      isActive('/feed') ? 'text-pink-600' : 'text-foreground/80 hover:text-pink-600'
                    }`}
                  >
                    <span>Feed</span>
                    <span className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 h-0.5 bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-300 ${
                      isActive('/feed') ? 'w-[80%] opacity-100' : 'w-0 opacity-0 group-hover:w-[80%] group-hover:opacity-100'
                    }`} />
                  </Link>
                  <Link
                    href="/discover"
                    className={`group relative py-1.5 px-4 text-base font-medium transition-all duration-200 hover:bg-background/70 rounded-full ${
                      isActive('/discover') ? 'text-pink-600' : 'text-foreground/80 hover:text-pink-600'
                    }`}
                  >
                    <span>Discover</span>
                    <span className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 h-0.5 bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-300 ${
                      isActive('/discover') ? 'w-[80%] opacity-100' : 'w-0 opacity-0 group-hover:w-[80%] group-hover:opacity-100'
                    }`} />
                  </Link>
                  <Link
                    href="/groups"
                    className={`group relative py-1.5 px-4 text-base font-medium transition-all duration-200 hover:bg-background/70 rounded-full ${
                      isActive('/groups') ? 'text-pink-600' : 'text-foreground/80 hover:text-pink-600'
                    }`}
                  >
                    <span>Groups</span>
                    <span className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 h-0.5 bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-300 ${
                      isActive('/groups') ? 'w-[80%] opacity-100' : 'w-0 opacity-0 group-hover:w-[80%] group-hover:opacity-100'
                    }`} />
                  </Link>
                </div>

                {/* Right Side Actions */}
                <div className="flex items-center gap-3">
                  {/* Notifications */}
                  <NotificationDropdown />

                  {/* User Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="relative focus:outline-none">
                        <Avatar className="h-10 w-10 ring-2 ring-pink-200 hover:ring-pink-400 transition-all cursor-pointer">
                          <AvatarImage src={user?.profile_picture || undefined} alt={user?.username} />
                          <AvatarFallback className="bg-gradient-to-br from-pink-400 to-purple-500 text-white font-semibold">
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
                          <AvatarFallback className="bg-gradient-to-br from-pink-400 to-purple-500 text-white">
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
                          <Link href={`/profile/${user?.username}`} className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-pink-50 hover:text-pink-600">
                            <User className="h-4 w-4" />
                            <span>My Profile</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/my-reviews" className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-pink-50 hover:text-pink-600">
                            <ClipboardList className="h-4 w-4" />
                            <span>My Reviews</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/account" className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-pink-50 hover:text-pink-600">
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
                          className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-pink-50 hover:text-pink-600"
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
              <div className="flex items-center bg-muted/50 backdrop-blur-sm rounded-full px-1.5 py-1 shadow-sm border border-border/50 mx-2">
                <Link
                  href="/about"
                  className={`group relative py-1.5 px-4 text-base font-medium transition-all duration-200 hover:bg-background/70 rounded-full ${
                    isActive('/about') ? 'text-pink-600' : 'text-foreground/80 hover:text-pink-600'
                  }`}
                >
                  <span>About</span>
                  <span className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 h-0.5 bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-300 ${
                    isActive('/about') ? 'w-[80%] opacity-100' : 'w-0 opacity-0 group-hover:w-[80%] group-hover:opacity-100'
                  }`} />
                </Link>
                <Link
                  href="/login"
                  className={`group relative py-1.5 px-4 text-base font-medium transition-all duration-200 hover:bg-background/70 rounded-full ${
                    isActive('/login') ? 'text-pink-600' : 'text-foreground/80 hover:text-pink-600'
                  }`}
                >
                  <span>Login</span>
                  <span className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 h-0.5 bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-300 ${
                    isActive('/login') ? 'w-[80%] opacity-100' : 'w-0 opacity-0 group-hover:w-[80%] group-hover:opacity-100'
                  }`} />
                </Link>
                <Link
                  href="/register"
                  className="py-1.5 px-4 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-full shadow-sm hover:shadow-md transition-all duration-300 hover:opacity-90 text-base font-medium"
                >
                  <span>Register</span>
                </Link>
              </div>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-foreground hover:text-pink-600 transition-colors"
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
                    <AvatarFallback className="bg-gradient-to-br from-pink-400 to-purple-500 text-white">
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
                    isActive('/feed') ? 'bg-pink-50 text-pink-600 dark:bg-pink-950' : 'text-foreground hover:bg-muted'
                  }`}
                >
                  Feed
                </Link>
                <Link
                  href="/discover"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`py-2 px-4 rounded-lg text-base font-medium transition-colors ${
                    isActive('/discover') ? 'bg-pink-50 text-pink-600 dark:bg-pink-950' : 'text-foreground hover:bg-muted'
                  }`}
                >
                  Discover
                </Link>
                <Link
                  href="/groups"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`py-2 px-4 rounded-lg text-base font-medium transition-colors ${
                    isActive('/groups') ? 'bg-pink-50 text-pink-600 dark:bg-pink-950' : 'text-foreground hover:bg-muted'
                  }`}
                >
                  Groups
                </Link>
                <Link
                  href={`/profile/${user?.username}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`py-2 px-4 rounded-lg text-base font-medium transition-colors ${
                    isActive(`/profile/${user?.username}`) ? 'bg-pink-50 text-pink-600 dark:bg-pink-950' : 'text-foreground hover:bg-muted'
                  }`}
                >
                  My Profile
                </Link>
                <Link
                  href="/my-reviews"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`py-2 px-4 rounded-lg text-base font-medium transition-colors ${
                    isActive('/my-reviews') ? 'bg-pink-50 text-pink-600 dark:bg-pink-950' : 'text-foreground hover:bg-muted'
                  }`}
                >
                  My Reviews
                </Link>
                <Link
                  href="/account"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`py-2 px-4 rounded-lg text-base font-medium transition-colors ${
                    isActive('/account') ? 'bg-pink-50 text-pink-600 dark:bg-pink-950' : 'text-foreground hover:bg-muted'
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
                    isActive('/about') ? 'bg-pink-50 text-pink-600 dark:bg-pink-950' : 'text-foreground hover:bg-muted'
                  }`}
                >
                  About
                </Link>
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`py-2 px-4 rounded-lg text-base font-medium transition-colors ${
                    isActive('/login') ? 'bg-pink-50 text-pink-600 dark:bg-pink-950' : 'text-foreground hover:bg-muted'
                  }`}
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2 px-4 rounded-lg text-base font-medium bg-gradient-to-r from-pink-500 to-purple-500 text-white text-center"
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
