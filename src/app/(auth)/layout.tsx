'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRedirectIfAuthenticated } from '@/hooks/use-auth';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoading, isAuthenticated } = useRedirectIfAuthenticated('/feed');

  // Mostra loading enquanto verifica auth OU quando já está autenticado (redirecionando)
  if (isLoading || isAuthenticated) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-gradient-to-br from-wine-50 to-white dark:from-wine-950/20 dark:to-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-pulse">
            <Image
              src="/images/logo_soundscore.png"
              alt="SoundScore Logo"
              width={56}
              height={56}
              className="rounded-full dark:brightness-0 dark:invert"
            />
          </div>
          {isAuthenticated && (
            <p className="text-sm text-muted-foreground animate-pulse">
              Redirecting...
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh min-w-0 overflow-x-hidden">
      {/* Left side */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-8 pb-24"
        style={{
          background: `linear-gradient(to bottom,
            #722F37 0%,
            #5e2530 60%,
            #2d1218 100%)`,
        }}
      >
        {/* Logo */}
        <Link href="/" className="mb-0">
          <Image
            src="/images/logo_soundscore.png"
            alt="SoundScore"
            width={500}
            height={130}
            className="h-40 w-auto object-contain brightness-0 invert"
          />
        </Link>

        {/* Floating illustration */}
        <img
          src="https://cdn.builder.io/api/v1/image/assets/TEMP/27032dba77e68e55a80db39bdfcbc3e2ccb4b98f"
          className="w-[380px] h-[380px] object-contain animate-[float_6s_ease-in-out_infinite] brightness-0 invert opacity-80"
          alt="Music illustration"
        />

        {/* Text below */}
        <div className="text-center mt-0">
          <h1 className="text-4xl font-bold text-white mb-3">
            Rank your taste in music
          </h1>
          <p className="text-white/80 text-lg max-w-md">
            Rate albums, discover new music, and connect with fellow music lovers.
          </p>
        </div>

        {/* Float animation */}
        <style jsx>{`
          @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-15px); }
            100% { transform: translateY(0px); }
          }
        `}</style>
      </div>

      {/* Right side - Form */}
      <div className="flex w-full min-w-0 items-center justify-center bg-muted px-4 py-6 sm:p-8 lg:w-1/2">
        <div className="w-full min-w-0 max-w-md">
          {/* Mobile Logo */}
          <Link href="/" className="mb-5 flex min-h-11 items-center gap-2 lg:hidden sm:mb-8">
            <Image
              src="/images/logo_soundscore.png"
              alt="SoundScore Logo"
              width={40}
              height={40}
              className="rounded-full dark:brightness-0 dark:invert"
            />
            <span className="font-bold text-xl text-wine-700 dark:text-wine-400">
              SoundScore
            </span>
          </Link>
          {children}
        </div>
      </div>
    </div>
  );
}
