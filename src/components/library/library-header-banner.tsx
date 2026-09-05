'use client';

import Image from 'next/image';
import { Play, Music, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { TopArtist } from '@/types';

interface LibraryHeaderBannerProps {
  topArtist: TopArtist | null;
  topTrack: { name: string; artist: string; image: string | null; count: number; track_id?: string | null } | null;
  isLoading?: boolean;
}

export function LibraryHeaderBanner({ topArtist, topTrack, isLoading }: LibraryHeaderBannerProps) {
  if (isLoading) {
    return (
      <div className="relative h-52 overflow-hidden rounded-[1.75rem] bg-muted animate-pulse sm:h-60">
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 to-background/40" />
      </div>
    );
  }

  const bannerImage = topArtist?.image;
  const featured = topTrack
    ? { name: topTrack.name, artist: topTrack.artist, image: topTrack.image, trackId: topTrack.track_id }
    : null;

  return (
    <div className="relative min-h-52 overflow-hidden rounded-[1.75rem] bg-wine-900 text-white shadow-[0_22px_65px_rgba(69,30,37,0.18)] sm:h-60">
      {/* Background Image - blurred for ambient effect */}
      {bannerImage ? (
        <Image
          src={bannerImage}
          alt={topArtist?.name || 'Biblioteca musical'}
          fill
          sizes="(max-width: 1152px) 100vw, 1152px"
          className="scale-[1.02] object-cover object-center"
          priority
        />
      ) : (
        <div className="absolute inset-0 bg-[linear-gradient(115deg,#451c26_0%,#722f37_58%,#a34851_100%)]" />
      )}

      {/* Gradient Overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#32151c]/95 via-wine-900/65 to-black/15" />

      {/* Content */}
      <div className="relative flex min-h-52 flex-col justify-between gap-5 p-5 sm:h-full sm:flex-row sm:items-center sm:px-7 sm:py-6 lg:px-9">
        {/* Left: Title */}
        <div className="max-w-lg">
          <h1 className="text-3xl font-black tracking-[-0.045em] sm:text-4xl lg:text-5xl">Seu mês em música.</h1>
          {topArtist && (
            <p className="mt-2 text-sm text-white/70 sm:text-base">
              Artista em destaque: <span className="font-bold text-white">{topArtist.name}</span>
            </p>
          )}
        </div>

        {/* Right: Top Track Card */}
        {featured && (
          <div className="flex w-full items-center gap-3 rounded-[1.25rem] border border-white/15 bg-black/25 p-3 backdrop-blur-md sm:max-w-xs">
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-[0.8rem] bg-white/10 lg:h-16 lg:w-16">
              {featured.image ? (
                <Image
                  src={featured.image}
                  alt={featured.name}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <Music className="h-6 w-6 text-white/60" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.13em] text-[#f2ad52]"><Radio className="h-3 w-3" /> Faixa mais ouvida</p>
              <p className="truncate text-sm font-bold">{featured.name}</p>
              <p className="truncate text-xs text-white/65">{featured.artist}</p>
            </div>
            {featured.trackId && (
              <Button
                size="icon"
                variant="ghost"
                className="h-11 w-11 shrink-0 rounded-full bg-white/10 text-white hover:bg-white/20 hover:text-white"
                onClick={() => window.open(`https://open.spotify.com/track/${featured.trackId}`, '_blank')}
              >
                <Play className="w-4 h-4" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
