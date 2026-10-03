'use client';

import { useEffect } from 'react';
import { CommunityTermsGate } from '@/components/auth/community-terms-gate';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { BottomNav } from '@/components/layout/bottom-nav';
import { useAuthStore } from '@/stores/auth-store';
import { useNotificationStream } from '@/hooks/use-notifications';
import { cn } from '@/lib/utils';

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
    <div
      className={cn(
        'app-shell flex flex-col',
        isAuthenticated && 'app-shell--authenticated'
      )}
    >
      <Header />
      {isAuthenticated && <NotificationStreamConnector />}
      <main className="app-main flex-1"><CommunityTermsGate>{children}</CommunityTermsGate></main>
      {!isAuthenticated && <Footer />}
      <BottomNav />
    </div>
  );
}
