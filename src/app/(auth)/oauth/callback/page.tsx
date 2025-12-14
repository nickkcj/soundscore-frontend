'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { setTokens } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function OAuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { fetchUser } = useAuthStore();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');
    const errorMsg = searchParams.get('error');

    if (errorMsg) {
      setError(errorMsg);
      toast.error(errorMsg);
      setTimeout(() => router.push('/login'), 2000);
      return;
    }

    if (accessToken && refreshToken) {
      // Set tokens and fetch user
      setTokens({
        access_token: accessToken,
        refresh_token: refreshToken,
        token_type: 'bearer',
      });

      fetchUser()
        .then(() => {
          toast.success('Successfully logged in!');
          router.push('/feed');
        })
        .catch(() => {
          setError('Failed to load user data');
          toast.error('Failed to load user data');
          setTimeout(() => router.push('/login'), 2000);
        });
    } else {
      setError('Missing authentication tokens');
      setTimeout(() => router.push('/login'), 2000);
    }
  }, [searchParams, router, fetchUser]);

  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <div className="text-center">
        {error ? (
          <div className="text-destructive">
            <p className="text-lg font-medium">{error}</p>
            <p className="text-sm text-muted-foreground mt-2">
              Redirecting to login...
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Completing sign in...</p>
          </div>
        )}
      </div>
    </div>
  );
}
