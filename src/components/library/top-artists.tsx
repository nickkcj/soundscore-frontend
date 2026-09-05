'use client';

import Image from 'next/image';
import { User } from 'lucide-react';
import type { TopArtist } from '@/types';

interface TopArtistsProps {
  artists: TopArtist[];
  isLoading?: boolean;
}

export function TopArtists({ artists, isLoading }: TopArtistsProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-2 animate-pulse">
            <div className="w-6 text-center text-muted-foreground">{i + 1}</div>
            <div className="w-10 h-10 bg-muted rounded-full" />
            <div className="h-4 flex-1 bg-muted rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (artists.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <User className="w-10 h-10 mx-auto mb-2 opacity-30" />
        <p>Nenhum artista encontrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {artists.map((artist, index) => (
        <div
          key={artist.name}
          className="flex items-center gap-3 rounded-xl p-2.5 transition-colors hover:bg-[#f7f3ed] dark:hover:bg-muted/50"
        >
          <div className={`w-7 text-center text-lg font-black ${index === 0 ? 'text-[#d98524]' : 'text-muted-foreground/60'}`}>
            {index + 1}
          </div>

          {/* Artist Image */}
          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-muted shadow-sm">
            {artist.image ? (
              <Image
                src={artist.image}
                alt={artist.name}
                fill
                sizes="44px"
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User className="w-5 h-5 text-muted-foreground" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-bold">{artist.name}</p>
          </div>

          {artist.scrobble_count && (
            <div className="shrink-0 text-xs text-muted-foreground">
              {artist.scrobble_count} reproduções
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
