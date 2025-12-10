'use client';

import { useState, useCallback } from 'react';
import { Search, Loader2, X } from 'lucide-react';
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
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search for an album..."
          value={query}
          onChange={handleChange}
          className="pl-10 pr-10"
        />
        {query && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
            onClick={handleClear}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Selected Album */}
      {selectedAlbum && !query && (
        <div className="p-4 rounded-lg border bg-muted/50">
          <p className="text-sm font-medium mb-2">Selected Album</p>
          <div className="flex items-center gap-4">
            <AlbumCard
              spotifyId={selectedAlbum.spotify_id}
              title={selectedAlbum.title}
              artist={selectedAlbum.artist}
              coverImage={selectedAlbum.cover_image}
              releaseDate={selectedAlbum.release_date}
              size="sm"
              selected
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSelect(null as unknown as SpotifyAlbumResult)}
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
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <AlbumCardSkeleton key={i} size="sm" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8 text-destructive">
              {error}
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No albums found. Try a different search term.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
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
