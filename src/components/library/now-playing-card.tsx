'use client';

import Image from 'next/image';
import { Music } from 'lucide-react';
import { SoundBars } from './sound-bars';
import type { NowPlaying } from '@/types';

interface NowPlayingCardProps {
  nowPlaying: NowPlaying | null;
  isLoading?: boolean;
  compact?: boolean;
}

export function NowPlayingCard({ nowPlaying, isLoading, compact = false }: NowPlayingCardProps) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 animate-pulse">
        <div className="w-8 h-8 bg-muted rounded" />
        <div className="flex-1">
          <div className="h-3 w-24 bg-muted rounded mb-1" />
          <div className="h-2 w-16 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!nowPlaying) {
    return null;
  }

  // Compact version for profile header
  if (compact) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <SoundBars isPlaying={nowPlaying.is_playing} />
        <span className="truncate max-w-[200px]">
          {nowPlaying.track_name}
        </span>
        <span className="text-muted-foreground/60">-</span>
        <span className="truncate max-w-[150px] text-muted-foreground/80">
          {nowPlaying.artist_name}
        </span>
      </div>
    );
  }

  // Full version for library tab
  return (
    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
      {/* Album Art */}
      <div className="relative w-10 h-10 rounded overflow-hidden bg-muted flex-shrink-0">
        {nowPlaying.album_image_url ? (
          <Image
            src={nowPlaying.album_image_url}
            alt={nowPlaying.album_name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Music className="w-5 h-5 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Track Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <SoundBars isPlaying={nowPlaying.is_playing} />
          <span className="text-xs text-muted-foreground">
            {nowPlaying.is_playing ? 'Playing' : 'Paused'}
          </span>
        </div>
        <p className="font-medium text-sm truncate">{nowPlaying.track_name}</p>
        <p className="text-xs text-muted-foreground truncate">{nowPlaying.artist_name}</p>
      </div>
    </div>
  );
}
