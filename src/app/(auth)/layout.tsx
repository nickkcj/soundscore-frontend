'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Disc3, MessageCircle, Star } from 'lucide-react';
import { useRedirectIfAuthenticated } from '@/hooks/use-auth';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated } = useRedirectIfAuthenticated('/feed');
  const pathname = usePathname();
  const isLogin = pathname === '/login';
  const isRecovery = pathname === '/forgot-password' || pathname === '/reset-password';
  const isCallback = pathname === '/oauth/callback';
  const eyebrow = isLogin ? 'Continue de onde parou' : isRecovery ? 'Seu acesso, com segurança' : isCallback ? 'Só mais um instante' : 'Comece sua coleção';
  const description = isLogin
    ? 'Entre para rever suas notas, acompanhar a comunidade e encontrar o próximo álbum favorito.'
    : isRecovery
      ? 'Recupere sua conta com um link seguro e volte para tudo o que você já guardou por aqui.'
      : isCallback
        ? 'Estamos conectando sua conta e preparando tudo para você continuar.'
        : 'Crie um espaço para guardar o que você ouviu, sentiu e ainda quer descobrir.';

  if (isLoading || isAuthenticated) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#f4f0e8]">
        <div className="flex flex-col items-center gap-4">
          <Image src="/images/logo_only_soundscore.png" alt="" width={48} height={48} className="animate-pulse" />
          {isAuthenticated && <p className="animate-pulse text-sm text-[#6c6562]">Entrando no SoundScore...</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[#f4f0e8] lg:grid lg:grid-cols-[0.9fr_1.1fr]">
      <aside className="relative hidden min-h-dvh overflow-hidden bg-[#1b1919] p-8 text-white lg:flex lg:flex-col lg:justify-between xl:p-10">
        <div className="absolute -left-28 -top-28 size-80 rounded-full border-[64px] border-[#963a4a]/70" />
        <div className="absolute -bottom-36 -right-24 size-80 rounded-full border-[64px] border-[#f0a36b]/80" />

        <Link href="/" className="relative z-10 flex w-fit items-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f0a36b]">
          <Image src="/images/logo_only_soundscore.png" alt="" width={34} height={34} className="brightness-0 invert" />
          <span className="text-xl font-black tracking-[-0.035em]">SoundScore</span>
        </Link>

        <div className="relative z-10 mx-auto w-full max-w-xl py-10">
          <div className="relative mb-10 flex size-52 items-center justify-center rounded-full border border-white/10 xl:size-60">
            <div className="absolute inset-6 rounded-full border border-[#f0a36b]/45" />
            <div className="absolute inset-12 rounded-full border border-white/10" />
            <Disc3 className="relative size-20 stroke-[1.1] text-[#f0a36b] xl:size-24" />
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#f0a36b]">{eyebrow}</p>
          <h2 className="mt-4 max-w-xl text-5xl font-black leading-[0.92] tracking-[-0.06em] xl:text-6xl">
            {isLogin ? <>Sua próxima descoberta está <span className="text-[#f0a36b]">esperando.</span></> : isRecovery ? <>Sua história musical continua <span className="text-[#f0a36b]">guardada.</span></> : isCallback ? <>Abrindo as portas da sua <span className="text-[#f0a36b]">comunidade.</span></> : <>Seu gosto não precisa caber em uma <span className="text-[#f0a36b]">playlist.</span></>}
          </h2>
          <p className="mt-6 max-w-md text-base leading-7 text-white/50">{description}</p>
          <div className="mt-8 flex flex-wrap gap-2 text-xs font-semibold text-white/65">
            <span className="flex items-center gap-2 rounded-full border border-white/10 px-3 py-2"><Disc3 className="size-3.5 text-[#f0a36b]" /> Descubra</span>
            <span className="flex items-center gap-2 rounded-full border border-white/10 px-3 py-2"><Star className="size-3.5 text-[#f0a36b]" /> Avalie</span>
            <span className="flex items-center gap-2 rounded-full border border-white/10 px-3 py-2"><MessageCircle className="size-3.5 text-[#f0a36b]" /> Compartilhe</span>
          </div>
        </div>

        <p className="relative z-10 text-xs text-white/35">© {new Date().getFullYear()} SoundScore</p>
      </aside>

      <main className="flex min-h-dvh items-center justify-center px-4 py-7 sm:px-8 sm:py-10 lg:px-12 xl:px-20">
        <div className="w-full max-w-md">
          <Link href="/" className="mb-8 flex w-fit min-h-11 items-center gap-2 lg:hidden">
            <Image src="/images/logo_only_soundscore.png" alt="" width={30} height={30} />
            <span className="text-xl font-black tracking-[-0.035em] text-wine-800">SoundScore</span>
          </Link>
          {children}
        </div>
      </main>
    </div>
  );
}
