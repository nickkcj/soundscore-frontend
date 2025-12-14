'use client';

import Image from 'next/image';
import { Music, Pause, Play } from 'lucide-react';
import type { NowPlaying } from '@/types';

interface NowPlayingCardProps {
  nowPlaying: NowPlaying | null;
  isLoading?: boolean;
}

export function NowPlayingCard({ nowPlaying, isLoading }: NowPlayingCardProps) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-3 p-3 bg-card rounded-lg border animate-pulse">
        <div className="w-12 h-12 bg-muted rounded" />
        <div className="flex-1">
          <div className="h-4 w-32 bg-muted rounded mb-1" />
          <div className="h-3 w-24 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!nowPlaying) {
    return null;
  }

  const progressPercent = (nowPlaying.progress_ms / nowPlaying.duration_ms) * 100;

  return (
    <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-green-500/10 to-green-500/5 rounded-lg border border-green-500/20">
      {/* Album Art */}
      <div className="relative w-12 h-12 rounded overflow-hidden bg-muted flex-shrink-0">
        {nowPlaying.album_image_url ? (
          <Image
            src={nowPlaying.album_image_url}
            alt={nowPlaying.album_name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Music className="w-6 h-6 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Track Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {nowPlaying.is_playing ? (
            <Play className="w-3 h-3 text-green-500 fill-green-500" />
          ) : (
            <Pause className="w-3 h-3 text-muted-foreground" />
          )}
          <span className="text-xs text-green-500 font-medium">
            {nowPlaying.is_playing ? 'Now Playing' : 'Paused'}
          </span>
        </div>
        <p className="font-medium text-sm truncate">{nowPlaying.track_name}</p>
        <p className="text-xs text-muted-foreground truncate">{nowPlaying.artist_name}</p>

        {/* Progress Bar */}
        <div className="mt-1 h-1 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 transition-all duration-1000"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
