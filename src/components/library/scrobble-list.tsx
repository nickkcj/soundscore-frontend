'use client';

import Image from 'next/image';
import { Music } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { Scrobble } from '@/types';

interface ScrobbleListProps {
  scrobbles: Scrobble[];
  isLoading?: boolean;
}

export function ScrobbleList({ scrobbles, isLoading }: ScrobbleListProps) {
  if (isLoading && scrobbles.length === 0) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <ScrobbleSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (scrobbles.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Music className="w-12 h-12 mx-auto mb-2 opacity-30" />
        <p>No scrobbles yet</p>
        <p className="text-sm">Connect Spotify and sync to see your listening history</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {scrobbles.map((scrobble) => (
        <ScrobbleItem key={`${scrobble.id}-${scrobble.played_at}`} scrobble={scrobble} />
      ))}
    </div>
  );
}

function ScrobbleItem({ scrobble }: { scrobble: Scrobble }) {
  return (
    <div className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded-lg transition-colors">
      {/* Album Art */}
      <div className="relative w-10 h-10 rounded overflow-hidden bg-muted flex-shrink-0">
        {scrobble.album_image_url ? (
          <Image
            src={scrobble.album_image_url}
            alt={scrobble.album_name || 'Album'}
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
        <p className="font-medium text-sm truncate">{scrobble.track_name}</p>
        <p className="text-xs text-muted-foreground truncate">{scrobble.artist_name}</p>
      </div>

      {/* Time */}
      <div className="text-xs text-muted-foreground flex-shrink-0">
        {formatDistanceToNow(new Date(scrobble.played_at), { addSuffix: true })}
      </div>
    </div>
  );
}

function ScrobbleSkeleton() {
  return (
    <div className="flex items-center gap-3 p-2 animate-pulse">
      <div className="w-10 h-10 bg-muted rounded" />
      <div className="flex-1">
        <div className="h-4 w-32 bg-muted rounded mb-1" />
        <div className="h-3 w-24 bg-muted rounded" />
      </div>
      <div className="h-3 w-16 bg-muted rounded" />
    </div>
  );
}
