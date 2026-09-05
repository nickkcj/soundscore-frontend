'use client';

import Image from 'next/image';
import { Music } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
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
      <div className="text-center py-6 text-muted-foreground">
        <Music className="w-10 h-10 mx-auto mb-2 opacity-30" />
        <p className="font-semibold text-foreground">Nenhuma reprodução ainda</p>
        <p className="text-sm">Sincronize o Spotify para ver seu histórico.</p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {scrobbles.map((scrobble) => (
        <ScrobbleItem key={`${scrobble.id}-${scrobble.played_at}`} scrobble={scrobble} />
      ))}
    </div>
  );
}

function ScrobbleItem({ scrobble }: { scrobble: Scrobble }) {
  return (
    <div className="group flex min-w-0 items-center gap-3 rounded-xl p-2.5 transition-colors hover:bg-[#f7f3ed] dark:hover:bg-muted/50">
      {/* Album Art */}
      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-[0.7rem] bg-muted shadow-sm">
        {scrobble.album_image_url ? (
          <Image
            src={scrobble.album_image_url}
            alt={scrobble.album_name || 'Album'}
            fill
            sizes="44px"
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
        <p className="truncate text-sm font-bold tracking-[-0.01em]">{scrobble.track_name}</p>
        <p className="text-xs text-muted-foreground truncate">{scrobble.artist_name}</p>
      </div>

      {/* Time */}
      <div className="max-w-20 flex-shrink-0 text-right text-[11px] leading-tight text-muted-foreground sm:max-w-none sm:text-xs">
        {formatDistanceToNow(new Date(scrobble.played_at), { addSuffix: true, locale: ptBR })}
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
