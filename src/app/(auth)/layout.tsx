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
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-pink-50 to-white dark:from-pink-950/20 dark:to-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-pulse">
            <Image
              src="/images/music.png"
              alt="SoundScore Logo"
              width={56}
              height={56}
              className="rounded-full"
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
    <div className="min-h-screen flex">
      {/* Left side */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-8"
        style={{
          background: `linear-gradient(to bottom,
            rgba(201,24,74,0.85) 0%,
            rgba(201,24,74,0.75) 50%,
            rgba(0,0,0,0.9) 100%)`,
        }}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 mb-10">
          <Image
            src="/images/music.png"
            alt="SoundScore Logo"
            width={56}
            height={56}
            className="rounded-full bg-white p-1"
          />
          <span className="font-bold text-3xl text-white">SoundScore</span>
        </Link>

        {/* Floating illustration */}
        <img
          src="https://cdn.builder.io/api/v1/image/assets/TEMP/27032dba77e68e55a80db39bdfcbc3e2ccb4b98f"
          className="w-[380px] h-[380px] object-contain animate-[float_6s_ease-in-out_infinite]"
          alt="Music illustration"
        />

        {/* Text below */}
        <div className="text-center mt-10">
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
      <div className="flex w-full lg:w-1/2 items-center justify-center p-8 bg-muted">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <Link href="/" className="flex items-center gap-2 mb-8 lg:hidden">
            <Image
              src="/images/music.png"
              alt="SoundScore Logo"
              width={40}
              height={40}
              className="rounded-full"
            />
            <span className="font-bold text-xl text-[#C9184A]">
              SoundScore
            </span>
          </Link>
          {children}
        </div>
      </div>
    </div>
  );
}
