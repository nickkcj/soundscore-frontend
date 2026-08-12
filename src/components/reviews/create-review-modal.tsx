'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Heart, Music, Search, Loader2, X, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { StarRating } from '@/components/common/star-rating';
import { useReview, useAlbumSearch } from '@/hooks/use-reviews';
import { useDebouncedCallback } from '@/hooks/use-debounce';
import type { SpotifyAlbumResult, OptimisticReview, Review } from '@/types';

interface CreateReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  // Optimistic update callbacks
  onOptimisticCreate?: (review: OptimisticReview) => void;
  onReviewCreated?: (optimisticId: string, review: Review) => void;
  onOptimisticError?: (optimisticId: string) => void;
  // Current user info for optimistic review
  currentUser?: {
    id: number;
    username: string;
    profile_picture: string | null;
  };
}

export function CreateReviewModal({
  open,
  onOpenChange,
  onSuccess,
  onOptimisticCreate,
  onReviewCreated,
  onOptimisticError,
  currentUser,
}: CreateReviewModalProps) {
  const { createReview, isLoading, error } = useReview();
  const { results, isLoading: searchLoading, search, clearResults } = useAlbumSearch();

  const [query, setQuery] = useState('');
  const [selectedAlbum, setSelectedAlbum] = useState<SpotifyAlbumResult | null>(null);
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);

  const debouncedSearch = useDebouncedCallback((value: string) => {
    if (value.trim()) {
      search(value);
    } else {
      clearResults();
    }
  }, 300);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    debouncedSearch(value);
  };

  const handleSelectAlbum = (album: SpotifyAlbumResult) => {
    setSelectedAlbum(album);
    setQuery('');
    clearResults();
  };

  const handleBack = () => {
    setSelectedAlbum(null);
    setRating(0);
    setText('');
    setIsFavorite(false);
  };

  const handleClose = () => {
    // Reset state
    setQuery('');
    setSelectedAlbum(null);
    setRating(0);
    setText('');
    setIsFavorite(false);
    clearResults();
    onOpenChange(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedAlbum) {
      toast.error('Please select an album');
      return;
    }

    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    // Generate optimistic ID
    const optimisticId = `temp-${Date.now()}`;

    // If we have optimistic callbacks and current user, use optimistic update
    if (onOptimisticCreate && currentUser) {
      // Create optimistic review object
      const optimisticReview: OptimisticReview = {
        id: -1,
        uuid: optimisticId,
        _optimistic: true,
        _optimisticId: optimisticId,
        rating,
        text: text.trim() || null,
        is_favorite: isFavorite,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        album: {
          id: -1,
          spotify_id: selectedAlbum.spotify_id,
          title: selectedAlbum.title,
          artist: selectedAlbum.artist,
          cover_image: selectedAlbum.cover_image,
          release_date: selectedAlbum.release_date,
        },
        user_id: currentUser.id,
        username: currentUser.username,
        user_profile_picture: currentUser.profile_picture,
        like_count: 0,
        comment_count: 0,
        is_liked: false,
      };

      // Close modal immediately and add optimistic review to feed
      handleClose();
      onOptimisticCreate(optimisticReview);
      toast.success('Review created!');

      // Make API call in background
      try {
        const realReview = await createReview({
          spotify_id: selectedAlbum.spotify_id,
          title: selectedAlbum.title,
          artist: selectedAlbum.artist,
          cover_image: selectedAlbum.cover_image,
          release_date: selectedAlbum.release_date,
          rating,
          text: text.trim() || undefined,
          is_favorite: isFavorite,
        });

        if (realReview) {
          onReviewCreated?.(optimisticId, realReview);
          onSuccess?.();
        } else {
          // API returned null (error handled in hook)
          onOptimisticError?.(optimisticId);
          toast.error('Failed to create review');
        }
      } catch {
        // Remove optimistic review on error
        onOptimisticError?.(optimisticId);
        toast.error('Failed to create review');
      }
    } else {
      // Fallback to non-optimistic behavior
      const review = await createReview({
        spotify_id: selectedAlbum.spotify_id,
        title: selectedAlbum.title,
        artist: selectedAlbum.artist,
        cover_image: selectedAlbum.cover_image,
        release_date: selectedAlbum.release_date,
        rating,
        text: text.trim() || undefined,
        is_favorite: isFavorite,
      });

      if (review) {
        toast.success('Review created!');
        handleClose();
        onSuccess?.();
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="top-0 left-0 flex h-[100dvh] w-screen max-w-none translate-x-0 translate-y-0 grid-rows-none flex-col gap-0 overflow-hidden rounded-none border-0 p-0 sm:top-1/2 sm:left-1/2 sm:h-auto sm:max-h-[90dvh] sm:w-full sm:max-w-2xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl sm:border sm:p-6"
        showCloseButton={false}
      >
        {/* Header */}
        <DialogHeader className="flex-shrink-0 border-b border-border px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 text-left sm:px-0 sm:pt-0 sm:pb-4">
          <div className="flex items-center justify-between">
            <div className="flex min-w-0 items-center gap-1 sm:gap-3">
              {selectedAlbum && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors active:bg-muted sm:h-9 sm:w-9 sm:hover:bg-muted"
                  aria-label="Back to album search"
                >
                  <ArrowLeft className="h-5 w-5 text-muted-foreground" />
                </button>
              )}
              <DialogTitle className="truncate text-xl font-bold text-foreground sm:text-xl">
                {selectedAlbum ? 'Write Your Review' : 'Create New Review'}
              </DialogTitle>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors active:bg-muted sm:h-9 sm:w-9 sm:hover:bg-muted"
              aria-label="Close create review"
            >
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-1">
          {!selectedAlbum ? (
            /* Album Search Step */
            <div className="space-y-4">
              {/* Search Input */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Search for an Album or Artist
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="text"
                    value={query}
                    onChange={handleSearchChange}
                    placeholder="Enter album or artist name..."
                    className="h-11 border-input py-3 pr-11 pl-10 focus:border-wine-500 focus:ring-wine-500"
                    autoFocus
                  />
                  {query && (
                    <button
                      type="button"
                      onClick={() => { setQuery(''); clearResults(); }}
                      className="absolute right-0 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full active:bg-muted sm:hover:bg-muted"
                      aria-label="Clear search"
                    >
                      <X className="h-4 w-4 text-muted-foreground" />
                    </button>
                  )}
                </div>
              </div>

              {/* Search Results */}
              {searchLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-wine-500" />
                  <span className="ml-3 text-muted-foreground">Searching...</span>
                </div>
              ) : results && results.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">{results.length} results found</p>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
                    {results.map((album) => (
                      <button
                        key={album.spotify_id}
                        onClick={() => handleSelectAlbum(album)}
                        className="group min-w-0 overflow-hidden rounded-xl border border-border bg-card text-left transition active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wine-500 sm:hover:border-wine-300 sm:hover:shadow-md sm:dark:hover:border-wine-700"
                      >
                        <div className="aspect-square relative bg-muted">
                          {album.cover_image ? (
                            <Image
                              src={album.cover_image}
                              alt={album.title}
                              fill
                              className="object-cover transition-transform sm:group-hover:scale-105"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Music className="h-12 w-12 text-muted-foreground/30" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 p-2.5 sm:p-3">
                          <h3 className="font-semibold text-foreground truncate text-sm" title={album.title}>
                            {album.title}
                          </h3>
                          <p className="text-xs text-muted-foreground truncate">{album.artist}</p>
                          {album.release_date && (
                            <p className="text-xs text-muted-foreground/70">
                              {new Date(album.release_date).getFullYear()}
                            </p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : query && !searchLoading ? (
                <div className="py-10 text-center">
                  <Music className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">No albums found for &quot;{query}&quot;</p>
                </div>
              ) : (
                <div className="py-10 text-center sm:py-12">
                  <Music className="mx-auto mb-3 h-12 w-12 text-muted-foreground/20 sm:mb-4 sm:h-16 sm:w-16" />
                  <p className="text-muted-foreground/70">Start typing to search for an album</p>
                </div>
              )}
            </div>
          ) : (
            /* Review Form Step */
            <form onSubmit={handleSubmit} className="space-y-5 pb-[max(1rem,env(safe-area-inset-bottom))] sm:space-y-6 sm:pb-0">
              {/* Selected Album */}
              <div className="flex min-w-0 items-center gap-3 rounded-xl bg-muted/50 p-3 sm:items-start sm:gap-4 sm:p-4">
                <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-muted sm:h-20 sm:w-20">
                  {selectedAlbum.cover_image ? (
                    <Image
                      src={selectedAlbum.cover_image}
                      alt={selectedAlbum.title}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Music className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-grow min-w-0">
                  <h3 className="truncate font-bold text-foreground">{selectedAlbum.title}</h3>
                  <p className="truncate text-sm text-muted-foreground">{selectedAlbum.artist}</p>
                  {selectedAlbum.release_date && (
                    <p className="text-muted-foreground/70 text-sm">
                      {new Date(selectedAlbum.release_date).getFullYear()}
                    </p>
                  )}
                </div>
              </div>

              {/* Rating */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-3">
                  Your Rating
                </label>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  <div className="[&>div>button]:flex [&>div>button]:h-11 [&>div>button]:w-11 [&>div>button]:items-center [&>div>button]:justify-center">
                    <StarRating
                      rating={rating}
                      size="lg"
                      interactive
                      onChange={setRating}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {rating > 0 ? `${rating}/5` : 'Click to rate'}
                  </span>
                </div>
              </div>

              {/* Review Text */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Your Review <span className="text-muted-foreground font-normal">(optional)</span>
                </label>
                <Textarea
                  placeholder="Share your thoughts about this album..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={4}
                  className="min-h-28 resize-none border-input focus:border-wine-500 focus:ring-wine-500"
                />
              </div>

              {/* Favorite */}
              <label htmlFor="favorite" className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-1 text-sm text-foreground active:bg-muted/50">
                <input
                  type="checkbox"
                  id="favorite"
                  checked={isFavorite}
                  onChange={(e) => setIsFavorite(e.target.checked)}
                  className="h-5 w-5 rounded border-input text-wine-600 focus:ring-wine-500"
                />
                <span className="flex items-center gap-2">
                  <Heart className={`h-4 w-4 ${isFavorite ? 'text-wine-500 fill-wine-500' : 'text-muted-foreground'}`} />
                  Mark as favorite album
                </span>
              </label>

              {/* Error */}
              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}

              {/* Submit */}
              <div className="sticky bottom-0 -mx-4 flex gap-3 border-t border-border bg-background/95 px-4 pt-3 pb-[max(0.25rem,env(safe-area-inset-bottom))] backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:pt-2 sm:pb-0">
                <Button
                  type="submit"
                  disabled={isLoading || rating === 0}
                  className="min-h-11 flex-1 bg-wine-600 py-3 font-medium text-white active:bg-wine-700 sm:hover:bg-wine-700"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Review'
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  className="min-h-11 px-4 sm:px-6"
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
