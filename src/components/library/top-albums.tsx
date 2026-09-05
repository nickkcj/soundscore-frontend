'use client';

import Image from 'next/image';
import { Disc } from 'lucide-react';
import type { TopAlbum } from '@/types';

interface TopAlbumsProps {
  albums: TopAlbum[];
  isLoading?: boolean;
}

export function TopAlbums({ albums, isLoading }: TopAlbumsProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-2 animate-pulse">
            <div className="w-6 text-center text-muted-foreground">{i + 1}</div>
            <div className="w-10 h-10 bg-muted rounded" />
            <div className="flex-1">
              <div className="h-4 w-32 bg-muted rounded mb-1" />
              <div className="h-3 w-24 bg-muted rounded" />
            </div>
            <div className="h-4 w-12 bg-muted rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (albums.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <Disc className="w-10 h-10 mx-auto mb-2 opacity-30" />
        <p>Nenhum álbum encontrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {albums.map((album, index) => (
        <div
          key={`${album.name}-${album.artist}`}
          className="flex items-center gap-3 rounded-xl p-2.5 transition-colors hover:bg-[#f7f3ed] dark:hover:bg-muted/50"
        >
          <div className={`w-7 text-center text-lg font-black ${index === 0 ? 'text-[#d98524]' : 'text-muted-foreground/60'}`}>
            {index + 1}
          </div>

          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-[0.7rem] bg-muted shadow-sm">
            {album.image ? (
              <Image
                src={album.image}
                alt={album.name}
                fill
                sizes="44px"
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Disc className="w-5 h-5 text-muted-foreground" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-bold">{album.name}</p>
            <p className="text-xs text-muted-foreground truncate">{album.artist}</p>
          </div>

          <div className="shrink-0 text-xs text-muted-foreground">
            {album.scrobble_count} reproduções
          </div>
        </div>
      ))}
    </div>
  );
}
