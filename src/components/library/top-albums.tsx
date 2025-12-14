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
      <div className="text-center py-8 text-muted-foreground">
        <Disc className="w-12 h-12 mx-auto mb-2 opacity-30" />
        <p>Nenhum álbum encontrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {albums.map((album, index) => (
        <div
          key={`${album.name}-${album.artist}`}
          className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded-lg transition-colors"
        >
          <div className="w-6 text-center text-muted-foreground font-medium">
            {index + 1}
          </div>

          <div className="relative w-10 h-10 rounded overflow-hidden bg-muted flex-shrink-0">
            {album.image ? (
              <Image
                src={album.image}
                alt={album.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Disc className="w-5 h-5 text-muted-foreground" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{album.name}</p>
            <p className="text-xs text-muted-foreground truncate">{album.artist}</p>
          </div>

          <div className="text-xs text-muted-foreground">
            {album.scrobble_count} plays
          </div>
        </div>
      ))}
    </div>
  );
}
