'use client';

import { useState, useEffect, use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ArrowLeft,
  ExternalLink,
  Music,
  Star,
  Disc3,
  AlertCircle,
  UsersRound,
  BookOpenText,
  Heart,
  MessageCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { MarkdownContent } from '@/components/common/markdown-content';
import { StarRating } from '@/components/common/star-rating';
import { UserAvatar } from '@/components/common/user-avatar';
import { api } from '@/lib/api';
import type { ArtistDetail, Review, ReviewListResponse } from '@/types';

function formatReleaseYear(date: string | null): string {
  if (!date) return '';
  return date.split('-')[0];
}

interface PageProps {
  params: Promise<{ spotifyId: string }>;
}

export default function ArtistPage({ params }: PageProps) {
  const { spotifyId } = use(params);
  const router = useRouter();

  const [artist, setArtist] = useState<ArtistDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [recentReviews, setRecentReviews] = useState<Review[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchArtist = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await api.get<ArtistDetail>(`/artist/${spotifyId}/details`);
        setArtist(data);
      } catch (err) {
        setError('Não foi possível carregar os detalhes do artista');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchArtist();
  }, [spotifyId]);

  useEffect(() => {
    if (!artist) return;

    const albumsWithReviews = artist.albums.filter((album) => album.review_count > 0);
    if (albumsWithReviews.length === 0) {
      setRecentReviews([]);
      setIsLoadingReviews(false);
      return;
    }

    let cancelled = false;

    const fetchRecentReviews = async () => {
      setIsLoadingReviews(true);
      const collected: Review[] = [];

      // Limita a concorrência para artistas com discografias extensas.
      for (let index = 0; index < albumsWithReviews.length; index += 6) {
        const batch = albumsWithReviews.slice(index, index + 6);
        const results = await Promise.allSettled(
          batch.map((album) =>
            api.get<ReviewListResponse>(
              `/reviews/album/${album.spotify_id}?page=1&per_page=5`
            )
          )
        );

        results.forEach((result) => {
          if (result.status === 'fulfilled') collected.push(...result.value.reviews);
        });
      }

      if (!cancelled) {
        const uniqueReviews = Array.from(
          new Map(collected.map((review) => [review.uuid, review])).values()
        );
        uniqueReviews.sort(
          (first, second) =>
            new Date(second.created_at).getTime() - new Date(first.created_at).getTime()
        );
        setRecentReviews(uniqueReviews.slice(0, 5));
        setIsLoadingReviews(false);
      }
    };

    fetchRecentReviews();

    return () => {
      cancelled = true;
    };
  }, [artist]);

  if (isLoading) {
    return <ArtistPageSkeleton />;
  }

  if (error || !artist) {
    return (
      <div className="app-usable-viewport bg-[#f4f0e8] dark:bg-background">
      <div className="container mx-auto max-w-4xl px-4 py-4 md:py-8">
        <Button variant="ghost" onClick={() => router.back()} className="mb-3 h-11 px-2 md:mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <div className="text-center py-12 md:py-20">
          <AlertCircle className="h-12 w-12 md:h-16 md:w-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Artista não encontrado</h2>
          <p className="text-muted-foreground">{error || 'Não foi possível carregar os detalhes do artista'}</p>
        </div>
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

        <section className="relative mb-7 min-h-[21rem] overflow-hidden rounded-[1.9rem] bg-wine-900 text-white shadow-[0_22px_65px_rgba(69,30,37,0.18)] md:mb-9 md:min-h-[25rem]">
          <div className="absolute inset-0">
              {artist.image_url ? (
                <Image
                  src={artist.image_url}
                  alt={artist.name}
                  fill
                  sizes="(max-width: 1152px) 100vw, 1152px"
                  className="object-cover object-center"
                  priority
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-wine-700 to-wine-950">
                  <Music className="h-20 w-20 text-white/25" />
                </div>
              )}
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-black/10 md:bg-gradient-to-r md:from-black/90 md:via-black/55 md:to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7 md:max-w-3xl md:p-10">
            <p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#f2ad52] sm:text-[11px]">Artista</p>
            <h1 className="line-clamp-2 text-4xl font-black leading-[0.98] tracking-[-0.055em] sm:text-5xl md:text-7xl">{artist.name}</h1>
            {artist.genres.length > 0 && (
              <div className="mt-4 flex max-h-14 flex-wrap items-center gap-2 overflow-hidden md:max-h-none">
                {artist.genres.slice(0, 5).map((genre) => (
                  <span key={genre} className="rounded-full border border-white/15 bg-black/25 px-3 py-1 text-xs font-medium text-white/85 backdrop-blur-sm">{genre}</span>
                ))}
              </div>
            )}
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-white/70 sm:text-sm">
              <span className="flex items-center gap-1.5">
                <Disc3 className="h-4 w-4" />
                {artist.albums.length} {artist.albums.length === 1 ? 'álbum' : 'álbuns'}
              </span>
              {artist.followers > 0 && <span className="flex items-center gap-1.5"><UsersRound className="h-4 w-4" />{artist.followers.toLocaleString('pt-BR')} seguidores no Spotify</span>}
            </div>
          </div>
          {artist.spotify_url && <Button asChild className="absolute right-5 top-5 h-11 rounded-full border border-white/15 bg-black/35 px-4 text-white backdrop-blur-md hover:bg-black/55 sm:right-7 sm:top-7"><a href={artist.spotify_url} target="_blank" rel="noopener noreferrer"><ExternalLink className="mr-2 h-4 w-4" />Ouvir no Spotify</a></Button>}
        </section>

        {artist.summary && (
          <section className="mb-7 rounded-[1.75rem] border border-[#dcd4ca] bg-white p-5 dark:border-border dark:bg-card md:mb-9 md:p-8">
              <h2 className="mb-4 flex items-center gap-2 text-xl font-black tracking-[-0.025em]">
                <BookOpenText className="h-5 w-5 text-[#dc8749]" />
                Sobre {artist.name}
              </h2>
              <MarkdownContent content={artist.summary} />
          </section>
        )}

        {artist.albums.length > 0 && (
          <div className="mb-6 md:mb-10">
            <div className="mb-4 flex items-end justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-wine-700 sm:text-[11px]">Catálogo</p><h2 className="mt-1 flex items-center gap-2 text-2xl font-black tracking-[-0.035em] sm:text-3xl">Discografia</h2></div><span className="text-sm text-muted-foreground">{artist.albums.length} lançamentos</span></div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
              {artist.albums.map((album) => (
                <Link
                  key={album.spotify_id}
                  href={`/album/${album.spotify_id}`}
                  className="group min-w-0 overflow-hidden rounded-[1.35rem] border border-[#dcd4ca] bg-white p-2.5 shadow-[0_12px_35px_rgba(50,38,30,0.05)] transition-all hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(50,38,30,0.1)] dark:border-border dark:bg-card sm:p-3"
                >
                    <div className="relative aspect-square overflow-hidden rounded-[1rem] bg-muted">
                      {album.cover_image ? (
                        <Image
                          src={album.cover_image}
                          alt={album.title}
                          fill
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 260px"
                          className="object-cover transition-transform duration-500 group-hover:scale-[1.035]"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-muted">
                          <Disc3 className="h-12 w-12 text-muted-foreground/30" />
                        </div>
                      )}
                    </div>
                    <div className="px-1 pb-1 pt-3">
                      <p className="truncate text-sm font-black tracking-[-0.015em] sm:text-base">{album.title}</p>
                      <div className="mt-1 flex min-w-0 items-center gap-2 text-xs text-muted-foreground"><span>{formatReleaseYear(album.release_date)}</span><span>·</span>
                        {album.avg_rating ? (
                          <span className="flex items-center gap-1 font-bold text-[#d98524]">
                            <Star className="h-3 w-3 fill-current" />
                            {album.avg_rating.toFixed(1)}
                          </span>
                        ) : (
                          <span>Sem notas</span>
                        )}
                      </div>
                      {album.review_count > 0 && <p className="mt-1 truncate text-[11px] text-muted-foreground">{album.review_count} {album.review_count === 1 ? 'review' : 'reviews'}</p>}
                    </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {(isLoadingReviews || recentReviews.length > 0) && (
          <section className="mt-9 border-t border-[#d8cfc4] pt-8 md:mt-12 md:pt-10 dark:border-border">
            <div className="mb-5 flex items-end justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-wine-700 sm:text-[11px]">A comunidade ouviu</p>
                <h2 className="mt-1 text-2xl font-black tracking-[-0.035em] sm:text-3xl">Reviews recentes</h2>
              </div>
              <span className="hidden text-sm text-muted-foreground sm:block">De toda a discografia</span>
            </div>

            {isLoadingReviews ? (
              <div className="grid gap-3 md:grid-cols-2 md:gap-4 lg:grid-cols-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <ArtistReviewSkeleton key={index} />
                ))}
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 md:gap-4 lg:grid-cols-3">
                {recentReviews.map((review) => (
                  <ArtistReviewCard key={review.uuid} review={review} />
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

function ArtistReviewCard({ review }: { review: Review }) {
  return (
    <article className="group min-w-0 rounded-[1.5rem] border border-[#dcd4ca] bg-white p-4 shadow-[0_12px_35px_rgba(50,38,30,0.05)] transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_45px_rgba(50,38,30,0.09)] dark:border-border dark:bg-card sm:p-5">
      <div className="flex min-w-0 items-center gap-3">
        <UserAvatar
          username={review.username}
          profilePicture={review.user_profile_picture}
          size="sm"
        />
        <div className="min-w-0 flex-1">
          <Link href={`/profile/${review.username}`} className="block truncate text-sm font-bold hover:text-wine-700">
            {review.username}
          </Link>
          <p className="truncate text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(review.created_at), { addSuffix: true, locale: ptBR })}
          </p>
        </div>
        <StarRating rating={review.rating} size="sm" />
      </div>

      <Link href={`/reviews/${review.uuid}`} className="mt-4 grid min-w-0 grid-cols-[3.75rem_minmax(0,1fr)] gap-3">
        <div className="relative aspect-square overflow-hidden rounded-xl bg-[#eee9e1]">
          {review.album.cover_image ? (
            <Image
              src={review.album.cover_image}
              alt={review.album.title}
              fill
              sizes="60px"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Disc3 className="h-5 w-5 text-muted-foreground/40" />
            </div>
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-black tracking-[-0.015em]">{review.album.title}</p>
          {review.text ? (
            <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-foreground/70">{review.text}</p>
          ) : (
            <p className="mt-1 text-sm italic text-muted-foreground">Avaliou este álbum.</p>
          )}
        </div>
      </Link>

      <div className="mt-3 flex items-center gap-4 border-t border-[#eee8e0] pt-3 text-xs text-muted-foreground dark:border-border">
        <span className="flex items-center gap-1.5"><Heart className="h-3.5 w-3.5" />{review.like_count}</span>
        <Link href={`/reviews/${review.uuid}`} className="flex items-center gap-1.5 transition-colors hover:text-wine-700">
          <MessageCircle className="h-3.5 w-3.5" />{review.comment_count}
        </Link>
        <Link href={`/reviews/${review.uuid}`} className="ml-auto font-bold text-wine-700 hover:underline">Ver conversa</Link>
      </div>
    </article>
  );
}

function ArtistReviewSkeleton() {
  return (
    <div className="rounded-[1.5rem] border border-[#dcd4ca] bg-white p-4 dark:border-border dark:bg-card sm:p-5">
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-8 rounded-full" />
        <div className="flex-1 space-y-1.5"><Skeleton className="h-3.5 w-24" /><Skeleton className="h-3 w-16" /></div>
        <Skeleton className="h-3.5 w-20" />
      </div>
      <div className="mt-4 flex gap-3"><Skeleton className="h-[3.75rem] w-[3.75rem] rounded-xl" /><div className="flex-1 space-y-2"><Skeleton className="h-3.5 w-2/3" /><Skeleton className="h-3 w-full" /><Skeleton className="h-3 w-4/5" /></div></div>
    </div>
  );
}

function ArtistPageSkeleton() {
  return (
    <div className="container mx-auto max-w-6xl px-4 py-4 md:py-8">
      <Skeleton className="h-11 w-24 mb-3 md:mb-6" />
      <Skeleton className="mb-9 h-[21rem] w-full rounded-[1.9rem] md:h-[25rem]" />
      <div className="mb-9 rounded-[1.75rem] border p-6">
        <div className="space-y-3">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>

      <div>
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="overflow-hidden rounded-2xl border bg-card p-3">
              <Skeleton className="aspect-square w-full" />
              <div className="p-3 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
