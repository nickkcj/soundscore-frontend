'use client';

import { useEffect } from 'react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { BottomNav } from '@/components/layout/bottom-nav';
import { useAuthStore } from '@/stores/auth-store';
import { useNotificationStream } from '@/hooks/use-notifications';

function NotificationStreamConnector() {
  useNotificationStream();
  return null;
}

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { fetchUser, isAuthenticated } = useAuthStore();

  // Fetch user on mount
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      {isAuthenticated && <NotificationStreamConnector />}
      {/* pb-20 gives mobile content room above the bottom nav bar */}
      <main className="flex-1 pb-20 md:pb-0">{children}</main>
      <Footer />
      <BottomNav />
    </div>
  );
}
