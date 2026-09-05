'use client';

import { Loader2 } from 'lucide-react';
import { LibraryContent } from '@/components/library/library-content';
import { useRequireAuth } from '@/hooks/use-auth';

export default function LibraryPage() {
  const { user, isLoading: authLoading } = useRequireAuth();

  if (authLoading) {
    return (
      <div className="app-usable-viewport flex items-center justify-center bg-[#f4f0e8] py-24 dark:bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return null; // useRequireAuth will redirect
  }

  return (
    <div className="app-usable-viewport bg-[#f4f0e8] text-[#1b1919] dark:bg-background dark:text-foreground">
      <div className="container mx-auto max-w-6xl px-4 py-4 md:py-7">
      <LibraryContent username={user.username} />
      </div>
    </div>
  );
}
