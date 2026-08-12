'use client';

import { useState } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AlbumCard, AlbumCardSkeleton } from '@/components/common/album-card';
import { useAlbumSearch } from '@/hooks/use-reviews';
import { useDebouncedCallback } from '@/hooks/use-debounce';
import type { SpotifyAlbumResult } from '@/types';

interface AlbumSearchProps {
  onSelect: (album: SpotifyAlbumResult) => void;
  selectedAlbum?: SpotifyAlbumResult | null;
}

export function AlbumSearch({ onSelect, selectedAlbum }: AlbumSearchProps) {
  const [query, setQuery] = useState('');
  const { results, isLoading, error, search, clearResults } = useAlbumSearch();

  const debouncedSearch = useDebouncedCallback((value: string) => {
    if (value.trim()) {
      search(value);
    } else {
      clearResults();
    }
  }, 300);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    debouncedSearch(value);
  };

  const handleClear = () => {
    setQuery('');
    clearResults();
  };

  const handleSelect = (album: SpotifyAlbumResult) => {
    onSelect(album);
    setQuery('');
    clearResults();
  };

  return (
    <div className="min-w-0 space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search for an album..."
          value={query}
          onChange={handleChange}
          className="h-11 pr-12 pl-10"
        />
        {query && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-0 top-1/2 h-11 w-11 -translate-y-1/2"
            onClick={handleClear}
            aria-label="Clear album search"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Selected Album */}
      {selectedAlbum && !query && (
        <div className="min-w-0 rounded-xl border bg-muted/50 p-3 sm:p-4">
          <p className="text-sm font-medium mb-2">Selected Album</p>
          <div className="flex min-w-0 flex-col items-start gap-3 min-[360px]:flex-row min-[360px]:items-center sm:gap-4 [&_[data-slot=card]]:w-28 sm:[&_[data-slot=card]]:w-32">
            <div className="shrink-0">
              <AlbumCard
                spotifyId={selectedAlbum.spotify_id}
                title={selectedAlbum.title}
                artist={selectedAlbum.artist}
                coverImage={selectedAlbum.cover_image}
                releaseDate={selectedAlbum.release_date}
                size="sm"
                selected
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSelect(null as unknown as SpotifyAlbumResult)}
              className="min-h-11 min-w-0 max-w-full whitespace-normal"
            >
              Change album
            </Button>
          </div>
        </div>
      )}

      {/* Search Results */}
      {query && (
        <div className="space-y-3">
          {isLoading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 [&_[data-slot=card]]:w-full">
              {Array.from({ length: 8 }).map((_, i) => (
                <AlbumCardSkeleton key={i} size="sm" />
              ))}
            </div>
          ) : error ? (
            <div className="py-8 text-center text-destructive">
              {error}
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No albums found. Try a different search term.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 [&_[data-slot=card]]:w-full">
              {results.map((album) => (
                <AlbumCard
                  key={album.spotify_id}
                  spotifyId={album.spotify_id}
                  title={album.title}
                  artist={album.artist}
                  coverImage={album.cover_image}
                  releaseDate={album.release_date}
                  size="sm"
                  onClick={() => handleSelect(album)}
                  selected={selectedAlbum?.spotify_id === album.spotify_id}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
