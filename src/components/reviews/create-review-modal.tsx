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
        className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        showCloseButton={false}
      >
        {/* Header */}
        <DialogHeader className="flex-shrink-0 border-b border-gray-200 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {selectedAlbum && (
                <button
                  onClick={handleBack}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <ArrowLeft className="h-5 w-5 text-gray-500" />
                </button>
              )}
              <DialogTitle className="text-xl font-bold text-gray-800">
                {selectedAlbum ? 'Write Your Review' : 'Create New Review'}
              </DialogTitle>
            </div>
            <button
              onClick={handleClose}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-4 px-1">
          {!selectedAlbum ? (
            /* Album Search Step */
            <div className="space-y-4">
              {/* Search Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search for an Album or Artist
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    type="text"
                    value={query}
                    onChange={handleSearchChange}
                    placeholder="Enter album or artist name..."
                    className="pl-10 py-3 border-gray-300 focus:ring-pink-500 focus:border-pink-500"
                    autoFocus
                  />
                  {query && (
                    <button
                      onClick={() => { setQuery(''); clearResults(); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full"
                    >
                      <X className="h-4 w-4 text-gray-400" />
                    </button>
                  )}
                </div>
              </div>

              {/* Search Results */}
              {searchLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
                  <span className="ml-3 text-gray-500">Searching...</span>
                </div>
              ) : results && results.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-sm text-gray-500">{results.length} results found</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-[400px] overflow-y-auto pr-2">
                    {results.map((album) => (
                      <button
                        key={album.spotify_id}
                        onClick={() => handleSelectAlbum(album)}
                        className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:border-pink-300 hover:shadow-md transition-all text-left group"
                      >
                        <div className="aspect-square relative bg-gray-100">
                          {album.cover_image ? (
                            <Image
                              src={album.cover_image}
                              alt={album.title}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Music className="h-12 w-12 text-gray-300" />
                            </div>
                          )}
                        </div>
                        <div className="p-3">
                          <h3 className="font-semibold text-gray-800 truncate text-sm" title={album.title}>
                            {album.title}
                          </h3>
                          <p className="text-xs text-gray-500 truncate">{album.artist}</p>
                          {album.release_date && (
                            <p className="text-xs text-gray-400">
                              {new Date(album.release_date).getFullYear()}
                            </p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : query && !searchLoading ? (
                <div className="text-center py-12">
                  <Music className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No albums found for &quot;{query}&quot;</p>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Music className="h-16 w-16 text-gray-200 mx-auto mb-4" />
                  <p className="text-gray-400">Start typing to search for an album</p>
                </div>
              )}
            </div>
          ) : (
            /* Review Form Step */
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Selected Album */}
              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
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
                      <Music className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="flex-grow min-w-0">
                  <h3 className="font-bold text-gray-800 truncate">{selectedAlbum.title}</h3>
                  <p className="text-gray-600 text-sm">{selectedAlbum.artist}</p>
                  {selectedAlbum.release_date && (
                    <p className="text-gray-400 text-sm">
                      {new Date(selectedAlbum.release_date).getFullYear()}
                    </p>
                  )}
                </div>
              </div>

              {/* Rating */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Your Rating
                </label>
                <div className="flex items-center gap-4">
                  <StarRating
                    rating={rating}
                    size="lg"
                    interactive
                    onChange={setRating}
                  />
                  <span className="text-gray-500 text-sm">
                    {rating > 0 ? `${rating}/5` : 'Click to rate'}
                  </span>
                </div>
              </div>

              {/* Review Text */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Review <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <Textarea
                  placeholder="Share your thoughts about this album..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={4}
                  className="border-gray-300 focus:ring-pink-500 focus:border-pink-500"
                />
              </div>

              {/* Favorite */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="favorite"
                  checked={isFavorite}
                  onChange={(e) => setIsFavorite(e.target.checked)}
                  className="h-4 w-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                />
                <label htmlFor="favorite" className="flex items-center gap-2 text-gray-700 cursor-pointer text-sm">
                  <Heart className={`h-4 w-4 ${isFavorite ? 'text-pink-500 fill-pink-500' : 'text-gray-400'}`} />
                  Mark as favorite album
                </label>
              </div>

              {/* Error */}
              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}

              {/* Submit */}
              <div className="flex gap-3 pt-2">
                <Button
                  type="submit"
                  disabled={isLoading || rating === 0}
                  className="flex-1 bg-pink-600 hover:bg-pink-700 text-white font-medium py-3"
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
                  className="px-6"
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
