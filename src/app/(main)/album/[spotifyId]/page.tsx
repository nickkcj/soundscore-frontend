'use client';

import { useState, useEffect, use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Play,
  ExternalLink,
  Music,
  Clock,
  Star,
  Disc3,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ReviewCard, ReviewCardSkeleton } from '@/components/reviews/review-card';
import { useReview } from '@/hooks/use-reviews';
import { api } from '@/lib/api';
import type { AlbumDetail, Review, ReviewListResponse } from '@/types';

// Helper function to format duration from ms to mm:ss
function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Helper function to format release date
function formatReleaseDate(date: string | null): string {
  if (!date) return 'Unknown';
  const parts = date.split('-');
  if (parts.length === 1) return parts[0]; // Just year
  if (parts.length === 2) return `${parts[1]}/${parts[0]}`; // Month/Year
  return new Date(date).toLocaleDateString('pt-BR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

interface PageProps {
  params: Promise<{ spotifyId: string }>;
}

export default function AlbumPage({ params }: PageProps) {
  const { spotifyId } = use(params);
  const router = useRouter();
  const { toggleLike, deleteReview } = useReview();

  const [album, setAlbum] = useState<AlbumDetail | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [hasMoreReviews, setHasMoreReviews] = useState(false);
  const [totalReviews, setTotalReviews] = useState(0);

  // Fetch album details
  useEffect(() => {
    const fetchAlbum = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await api.get<AlbumDetail>(`/reviews/album/${spotifyId}/details`);
        setAlbum(data);
        setTotalReviews(data.review_count);
      } catch (err) {
        setError('Failed to load album details');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAlbum();
  }, [spotifyId]);

  // Fetch reviews
  useEffect(() => {
    const fetchReviews = async () => {
      if (!album || album.review_count === 0) return;

      setIsLoadingReviews(true);
      try {
        const data = await api.get<ReviewListResponse>(
          `/reviews/album/${spotifyId}?page=${reviewsPage}&per_page=10`
        );
        if (reviewsPage === 1) {
          setReviews(data.reviews);
        } else {
          setReviews((prev) => [...prev, ...data.reviews]);
        }
        setHasMoreReviews(data.has_next);
        setTotalReviews(data.total);
      } catch (err) {
        console.error('Failed to load reviews:', err);
      } finally {
        setIsLoadingReviews(false);
      }
    };

    fetchReviews();
  }, [spotifyId, reviewsPage, album]);

  const handleLike = async (reviewUuid: string) => {
    const result = await toggleLike(reviewUuid);
    if (result) {
      setReviews((prev) =>
        prev.map((r) =>
          r.uuid === reviewUuid
            ? { ...r, is_liked: result.liked, like_count: result.like_count }
            : r
        )
      );
    }
  };

  const handleDelete = async (reviewUuid: string) => {
    if (confirm('Are you sure you want to delete this review?')) {
      const success = await deleteReview(reviewUuid);
      if (success) {
        setReviews((prev) => prev.filter((r) => r.uuid !== reviewUuid));
        setTotalReviews((prev) => prev - 1);
      }
    }
  };

  if (isLoading) {
    return <AlbumPageSkeleton />;
  }

  if (error || !album) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <Button variant="ghost" onClick={() => router.back()} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div className="text-center py-20">
          <AlertCircle className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Album not found</h2>
          <p className="text-muted-foreground">{error || 'Could not load album details'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background">
      <div className="container mx-auto max-w-5xl px-4 py-8">
        {/* Back Button */}
        <Button variant="ghost" onClick={() => router.back()} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        {/* Album Header */}
        <div className="flex flex-col md:flex-row gap-8 mb-10">
          {/* Album Cover */}
          <div className="flex-shrink-0">
            <div className="relative w-64 h-64 mx-auto md:mx-0 rounded-xl overflow-hidden shadow-2xl">
              {album.cover_image ? (
                <Image
                  src={album.cover_image}
                  alt={album.title}
                  fill
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-wine-500/20 to-wine-800/20">
                  <Music className="h-24 w-24 text-muted-foreground/50" />
                </div>
              )}
            </div>
          </div>

          {/* Album Info */}
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">{album.title}</h1>
            {album.artist_spotify_id ? (
              <Link
                href={`/artist/${album.artist_spotify_id}`}
                className="text-xl text-muted-foreground mb-4 block hover:text-foreground transition-colors hover:underline"
              >
                {album.artist}
              </Link>
            ) : (
              <p className="text-xl text-muted-foreground mb-4">{album.artist}</p>
            )}

            {/* Meta Info */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-muted-foreground mb-4">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatReleaseDate(album.release_date)}
              </span>
              <span className="flex items-center gap-1">
                <Disc3 className="h-4 w-4" />
                {album.total_tracks} tracks
              </span>
            </div>

            {/* Rating */}
            {album.avg_rating && (
              <div className="flex items-center justify-center md:justify-start gap-2 mb-4 text-muted-foreground">
                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                <span className="font-semibold text-foreground">{album.avg_rating.toFixed(1)}</span>
                <span className="text-sm">
                  ({totalReviews} {totalReviews === 1 ? 'review' : 'reviews'})
                </span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
              <Button asChild className="bg-wine-600 hover:bg-wine-700 text-white">
                <a href={album.spotify_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open in Spotify
                </a>
              </Button>
              <Button asChild variant="outline">
                <Link href={`/my-reviews?album=${spotifyId}`}>
                  <Star className="mr-2 h-4 w-4" />
                  Write Review
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Summary */}
        {album.summary && (
          <Card className="mb-10">
            <CardContent className="pt-6">
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Music className="h-5 w-5 text-wine-500" />
                About this Album
              </h2>
              <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {album.summary}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Tracklist */}
        <Card className="mb-10">
          <CardContent className="pt-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Disc3 className="h-5 w-5 text-wine-500" />
              Tracklist
            </h2>
            <div className="divide-y">
              {album.tracks.map((track) => (
                <div
                  key={track.track_number}
                  className="flex items-center gap-4 py-3 hover:bg-muted/50 rounded-lg px-2 -mx-2 transition-colors group"
                >
                  <span className="w-8 text-center text-muted-foreground text-sm">
                    {track.track_number}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate flex items-center gap-2">
                      {track.name}
                      {track.explicit && (
                        <Badge variant="secondary" className="text-xs px-1.5 py-0">
                          E
                        </Badge>
                      )}
                    </p>
                    {track.artists !== album.artist && (
                      <p className="text-sm text-muted-foreground truncate">{track.artists}</p>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDuration(track.duration_ms)}
                  </span>
                  <a
                    href={track.spotify_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-wine-500 hover:text-wine-600">
                      <Play className="h-4 w-4 fill-current" />
                    </Button>
                  </a>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Reviews Section */}
        <div className="mb-10">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Star className="h-5 w-5 text-wine-500" />
            Reviews ({totalReviews})
          </h2>

          {totalReviews === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Star className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground mb-4">No reviews yet. Be the first!</p>
                <Button asChild variant="outline">
                  <Link href={`/my-reviews?album=${spotifyId}`}>Write a Review</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  onLike={handleLike}
                  onDelete={handleDelete}
                />
              ))}

              {isLoadingReviews && (
                <>
                  <ReviewCardSkeleton />
                  <ReviewCardSkeleton />
                </>
              )}

              {hasMoreReviews && !isLoadingReviews && (
                <div className="text-center pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setReviewsPage((p) => p + 1)}
                  >
                    Load More Reviews
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Copyrights */}
        {album.copyrights.length > 0 && (
          <div className="text-xs text-muted-foreground text-center space-y-1">
            {album.copyrights.map((copyright, index) => (
              <p key={index}>{copyright}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AlbumPageSkeleton() {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <Skeleton className="h-10 w-24 mb-6" />

      <div className="flex flex-col md:flex-row gap-8 mb-10">
        <Skeleton className="w-64 h-64 rounded-xl mx-auto md:mx-0" />
        <div className="flex-1 space-y-4">
          <Skeleton className="h-10 w-3/4 mx-auto md:mx-0" />
          <Skeleton className="h-6 w-1/2 mx-auto md:mx-0" />
          <div className="flex gap-4 justify-center md:justify-start">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-32" />
          </div>
          <div className="flex gap-3 justify-center md:justify-start">
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
      </div>

      <Card className="mb-10">
        <CardContent className="pt-6 space-y-3">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>

      <Card className="mb-10">
        <CardContent className="pt-6 space-y-3">
          <Skeleton className="h-6 w-32" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-2">
              <Skeleton className="h-4 w-8" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-12" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
