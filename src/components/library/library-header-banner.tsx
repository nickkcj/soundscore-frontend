'use client';

import Image from 'next/image';
import { Play, Music } from 'lucide-react';
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
      <div className="relative h-36 lg:h-48 rounded-xl overflow-hidden bg-muted animate-pulse">
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 to-background/40" />
      </div>
    );
  }

  const bannerImage = topArtist?.image;

  return (
    <div className="relative h-36 lg:h-48 rounded-xl overflow-hidden">
      {/* Background Image - blurred for ambient effect */}
      {bannerImage ? (
        <Image
          src={bannerImage}
          alt="Banner"
          fill
          className="object-cover scale-110 blur-md"
          priority
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/5" />
      )}

      {/* Gradient Overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/50 to-transparent" />

      {/* Content */}
      <div className="relative h-full flex items-center justify-between px-4 lg:px-6">
        {/* Left: Title */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Library</h1>
          {topArtist && (
            <p className="text-sm text-muted-foreground mt-1">
              Favorite artist: <span className="text-foreground font-medium">{topArtist.name}</span>
            </p>
          )}
        </div>

        {/* Right: Top Track Card */}
        {topTrack && (
          <div className="hidden sm:flex items-center gap-3 bg-card/80 backdrop-blur-sm rounded-lg p-3 border max-w-xs">
            <div className="relative w-12 h-12 lg:w-16 lg:h-16 rounded overflow-hidden flex-shrink-0">
              {topTrack.image ? (
                <Image
                  src={topTrack.image}
                  alt={topTrack.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <Music className="w-6 h-6 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Top Track
              </p>
              <p className="font-medium text-sm truncate">{topTrack.name}</p>
              <p className="text-xs text-muted-foreground truncate">{topTrack.artist}</p>
            </div>
            {topTrack.track_id && (
              <Button
                size="icon"
                variant="ghost"
                className="rounded-full flex-shrink-0"
                onClick={() => window.open(`https://open.spotify.com/track/${topTrack.track_id}`, '_blank')}
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
