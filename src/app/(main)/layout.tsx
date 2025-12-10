'use client';

import { useEffect } from 'react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
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
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
