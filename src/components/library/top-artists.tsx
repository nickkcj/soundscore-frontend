'use client';

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
            <div className="h-4 flex-1 bg-muted rounded" />
            <div className="h-4 w-12 bg-muted rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (artists.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <User className="w-12 h-12 mx-auto mb-2 opacity-30" />
        <p>No top artists yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {artists.map((artist, index) => (
        <div
          key={artist.name}
          className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded-lg transition-colors"
        >
          <div className="w-6 text-center text-muted-foreground font-medium">
            {index + 1}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{artist.name}</p>
          </div>
          <div className="text-xs text-muted-foreground">
            {artist.scrobble_count} plays
          </div>
        </div>
      ))}
    </div>
  );
}
