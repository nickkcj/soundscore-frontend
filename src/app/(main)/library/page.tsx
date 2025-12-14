'use client';

import { Loader2 } from 'lucide-react';
import { LibraryContent } from '@/components/library/library-content';
import { useRequireAuth } from '@/hooks/use-auth';

export default function LibraryPage() {
  const { user, isLoading: authLoading } = useRequireAuth();

  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return null; // useRequireAuth will redirect
  }

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      <LibraryContent username={user.username} />
    </div>
  );
}
