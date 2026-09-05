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
  Star,
  Disc3,
  Calendar,
  AlertCircle,
  BookOpenText,
  ListMusic,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ReviewCard, ReviewCardSkeleton } from '@/components/reviews/review-card';
import { useReview } from '@/hooks/use-reviews';
import { api } from '@/lib/api';
import type { AlbumDetail, Review, ReviewListResponse } from '@/types';
import { MarkdownContent } from '@/components/common/markdown-content';

// Helper function to format duration from ms to mm:ss
function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Helper function to format release date
function formatReleaseDate(date: string | null): string {
  if (!date) return 'Data desconhecida';
  const parts = date.split('-');
  if (parts.length === 1) return parts[0]; // Just year
  if (parts.length === 2) return `${parts[1]}/${parts[0]}`; // Month/Year
  const [year, month, day] = parts.map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('pt-BR', {
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
        setError('Não foi possível carregar os detalhes do álbum');
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
    if (confirm('Tem certeza de que deseja excluir esta review?')) {
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
      <div className="container mx-auto max-w-4xl px-4 py-4 md:py-8">
        <Button variant="ghost" onClick={() => router.back()} className="mb-3 h-11 px-2 md:mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <div className="text-center py-12 md:py-20">
          <AlertCircle className="h-12 w-12 md:h-16 md:w-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Álbum não encontrado</h2>
          <p className="text-muted-foreground">{error || 'Não foi possível carregar os detalhes do álbum'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f0e8] text-[#1b1919] dark:bg-background dark:text-foreground">
      <div className="container mx-auto max-w-6xl px-4 pb-14 pt-4 md:pb-20 md:pt-7">
        {/* Back Button */}
        <Button variant="ghost" onClick={() => router.back()} className="mb-3 h-11 px-2 md:mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>

        {/* Album Header */}
        <section className="mb-7 grid grid-cols-[7.5rem_minmax(0,1fr)] gap-4 rounded-[1.75rem] border border-[#dcd4ca] bg-white p-4 shadow-[0_18px_55px_rgba(50,38,30,0.07)] dark:border-border dark:bg-card sm:grid-cols-[9rem_minmax(0,1fr)] md:mb-9 md:grid-cols-[15rem_minmax(0,1fr)] md:gap-8 md:p-7">
          {/* Album Cover */}
          <div className="flex-shrink-0">
            <div className="relative aspect-square w-full overflow-hidden rounded-[1.15rem] bg-[#eee9e1] shadow-[0_16px_35px_rgba(42,31,24,0.2)]">
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
                  <Music className="h-12 w-12 text-muted-foreground/50 md:h-24 md:w-24" />
                </div>
              )}
            </div>
          </div>

          {/* Album Info */}
          <div className="min-w-0 flex-1 text-left">
            <p className="mb-1.5 hidden text-[11px] font-black uppercase tracking-[0.16em] text-wine-700 sm:block">Álbum</p>
            <h1 className="mb-1 line-clamp-2 text-xl font-black leading-[1.05] tracking-[-0.045em] sm:text-3xl md:mb-2 md:text-5xl">{album.title}</h1>
            {album.artist_spotify_id ? (
              <Link
                href={`/artist/${album.artist_spotify_id}`}
                className="mb-2 block truncate text-sm font-medium text-muted-foreground transition-colors hover:text-wine-700 hover:underline sm:text-base md:mb-4 md:text-xl"
              >
                {album.artist}
              </Link>
            ) : (
              <p className="mb-2 truncate text-sm text-muted-foreground sm:text-base md:mb-4 md:text-xl">{album.artist}</p>
            )}

            {/* Meta Info */}
            <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground md:mb-4 md:text-sm">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatReleaseDate(album.release_date)}
              </span>
              <span className="flex items-center gap-1">
                <Disc3 className="h-4 w-4" />
                {album.total_tracks} faixas
              </span>
            </div>

            {/* Rating */}
            {album.avg_rating && (
              <div className="mb-2 flex items-center gap-1.5 text-muted-foreground md:mb-4 md:gap-2">
                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                <span className="font-semibold text-foreground">{album.avg_rating.toFixed(1)}</span>
                <span className="text-sm">
                  ({totalReviews} {totalReviews === 1 ? 'avaliação' : 'avaliações'})
                </span>
              </div>
            )}

          </div>
          {/* Action Buttons */}
          <div className="col-span-2 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap md:col-start-2 md:col-span-1 md:-mt-16 md:self-end">
            <Button asChild className="h-11 rounded-full bg-wine-700 px-3 text-white hover:bg-wine-800 sm:px-4">
              <a href={album.spotify_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-1.5 h-4 w-4 sm:mr-2" />
                <span className="sm:hidden">Spotify</span><span className="hidden sm:inline">Ouvir no Spotify</span>
              </a>
            </Button>
            <Button asChild variant="outline" className="h-11 rounded-full border-[#d5ccc1] px-3 hover:bg-[#f4f0e8] dark:border-border sm:px-4">
                <Link href={`/reviews/create?album=${spotifyId}`}>
                <Star className="mr-1.5 h-4 w-4 sm:mr-2" />
                <span className="sm:hidden">Avaliar</span><span className="hidden sm:inline">Avaliar álbum</span>
              </Link>
            </Button>
          </div>
        </section>

        {/* Summary */}
        {album.summary && (
          <Card className="mb-7 rounded-[1.75rem] border-[#dcd4ca] bg-white shadow-none dark:border-border dark:bg-card md:mb-9">
            <CardContent className="p-5 md:p-8">
              <h2 className="mb-4 flex items-center gap-2 text-xl font-black tracking-[-0.025em]">
                <BookOpenText className="h-5 w-5 text-[#dc8749]" />
                Sobre este álbum
              </h2>
              <MarkdownContent content={album.summary} />
            </CardContent>
          </Card>
        )}

        {/* Tracklist */}
        <Card className="mb-7 rounded-[1.75rem] border-[#dcd4ca] bg-white shadow-none dark:border-border dark:bg-card md:mb-9">
          <CardContent className="p-4 md:p-7">
            <h2 className="mb-4 flex items-center gap-2 text-xl font-black tracking-[-0.025em]">
              <ListMusic className="h-5 w-5 text-wine-700" />
              Faixas
            </h2>
            <div className="divide-y">
              {album.tracks.map((track) => (
                <div
                  key={track.track_number}
                  className="group -mx-2 flex min-w-0 items-center gap-2 rounded-lg px-2 py-2 transition-colors hover:bg-muted/50 sm:gap-4 sm:py-3"
                >
                  <span className="w-6 shrink-0 text-center text-xs text-muted-foreground sm:w-8 sm:text-sm">
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
                  <span className="shrink-0 text-xs text-muted-foreground sm:text-sm">
                    {formatDuration(track.duration_ms)}
                  </span>
                  <Button
                    asChild
                    size="icon"
                    variant="ghost"
                    className="h-11 w-11 shrink-0 text-wine-500 opacity-100 transition-opacity hover:text-wine-600 md:opacity-0 md:group-hover:opacity-100"
                  >
                    <a
                      href={track.spotify_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Ouvir ${track.name} no Spotify`}
                    >
                      <Play className="h-4 w-4 fill-current" />
                    </a>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Reviews Section */}
        <div className="mb-6 md:mb-10">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-black tracking-[-0.025em]">
            <Star className="h-5 w-5 fill-[#f0a36b] text-[#f0a36b]" />
            Avaliações da comunidade <span className="text-sm font-medium text-muted-foreground">({totalReviews})</span>
          </h2>

          {totalReviews === 0 ? (
            <Card>
              <CardContent className="py-8 text-center md:py-12">
                <Star className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3 md:h-12 md:w-12 md:mb-4" />
                <p className="text-muted-foreground mb-4">Ainda não há avaliações. Seja a primeira pessoa!</p>
                <Button asChild variant="outline">
                  <Link href={`/reviews/create?album=${spotifyId}`}>Avaliar álbum</Link>
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
                    Carregar mais avaliações
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
      <Skeleton className="h-11 w-24 mb-3 md:mb-6" />

      <div className="flex gap-4 md:gap-8 mb-6 md:mb-10">
        <Skeleton className="h-28 w-28 shrink-0 rounded-xl sm:h-36 sm:w-36 md:h-64 md:w-64" />
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
