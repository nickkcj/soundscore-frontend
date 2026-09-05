'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { setTokens } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import { toast } from 'sonner';
import { AlertCircle, Loader2 } from 'lucide-react';

export default function OAuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { fetchUser } = useAuthStore();
  const accessToken = searchParams.get('access_token');
  const refreshToken = searchParams.get('refresh_token');
  const errorMsg = searchParams.get('error');
  const [error, setError] = useState<string | null>(
    errorMsg || (!accessToken || !refreshToken ? 'Os dados de autenticação não foram recebidos' : null)
  );

  useEffect(() => {
    if (errorMsg) {
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
      toast.success('Login concluído!');
          router.push('/feed');
        })
        .catch(() => {
          setError('Não foi possível carregar os dados da sua conta');
          toast.error('Não foi possível carregar os dados da sua conta');
          setTimeout(() => router.push('/login'), 2000);
        });
    } else {
      setTimeout(() => router.push('/login'), 2000);
    }
  }, [accessToken, refreshToken, errorMsg, router, fetchUser]);

  return (
    <div className="flex min-h-[24rem] items-center justify-center">
      <div className="w-full max-w-sm break-words text-center">
        {error ? (
          <div>
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-700"><AlertCircle className="h-6 w-6" /></span>
            <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-[#963a4a]">Não deu certo</p>
            <h1 className="mt-3 text-3xl font-black tracking-[-0.05em] text-[#1b1919]">Não conseguimos entrar.</h1>
            <p className="mt-3 text-sm leading-6 text-[#6c6562]">{error}</p>
            <p className="mt-2 text-xs text-[#8a817d]">Voltando para o login...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#963a4a]/10 text-[#963a4a]"><Loader2 className="h-7 w-7 animate-spin" /></span>
            <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-[#963a4a]">Conectando sua conta</p>
            <h1 className="mt-3 text-3xl font-black tracking-[-0.05em] text-[#1b1919]">Preparando o SoundScore.</h1>
            <p className="mt-3 text-sm leading-6 text-[#6c6562]">Estamos confirmando seu acesso e carregando sua coleção.</p>
          </div>
        )}
      </div>
    </div>
  );
}
