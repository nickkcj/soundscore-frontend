'use client';

import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { GoogleIcon, SpotifyIcon } from '@/components/common/provider-icons';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

interface OAuthButtonsProps {
  disabled?: boolean;
}

export function OAuthButtons({ disabled }: OAuthButtonsProps) {
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);

  const handleOAuthLogin = (provider: 'google' | 'spotify') => {
    setLoadingProvider(provider);
    // Redirect to backend OAuth endpoint
    window.location.href = `${API_BASE_URL}/oauth/${provider}/login`;
  };

  return (
    <div className="space-y-5">
      <div className="grid min-w-0 grid-cols-2 gap-3">
        <Button
          variant="outline"
          type="button"
          disabled={disabled || loadingProvider !== null}
          onClick={() => handleOAuthLogin('google')}
          className="h-12 min-w-0 rounded-full border-[#1b1919]/10 bg-white px-3 font-semibold text-[#373130] shadow-none hover:bg-white/60"
        >
          {loadingProvider === 'google' ? <Loader2 className="mr-2 size-4 animate-spin" /> : <GoogleIcon className="mr-2 size-4" />}
          Google
        </Button>

        <Button
          variant="outline"
          type="button"
          disabled={disabled || loadingProvider !== null}
          onClick={() => handleOAuthLogin('spotify')}
          className="h-12 min-w-0 rounded-full border-[#1b1919]/10 bg-white px-3 font-semibold text-[#373130] shadow-none hover:bg-white/60"
        >
          {loadingProvider === 'spotify' ? <Loader2 className="mr-2 size-4 animate-spin" /> : <SpotifyIcon className="mr-2 size-4" />}
          Spotify
        </Button>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-[#1b1919]/10" />
        </div>
        <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-[0.16em]">
          <span className="bg-[#f4f0e8] px-3 text-[#8a817d]">
            ou use seu e-mail
          </span>
        </div>
      </div>
    </div>
  );
}
