'use client';

import { useState, useEffect, use, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Loader2, Pencil, Calendar, Camera, Headphones, Star, UsersRound } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ReviewCard, ReviewCardSkeleton } from '@/components/reviews/review-card';
import { InfiniteScroll } from '@/components/common/infinite-scroll';
import { NowPlayingCard } from '@/components/library/now-playing-card';
import { useAuth } from '@/hooks/use-auth';
import { useUserReviews } from '@/hooks/use-reviews';
import { useNowPlaying } from '@/hooks/use-library';
import { api } from '@/lib/api';
import type { UserProfile, FollowResponse, LikeResponse } from '@/types';

export default function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params);
  const { user: currentUser } = useAuth();
  const { reviews, isLoading: reviewsLoading, hasMore, fetchReviews, setReviews } = useUserReviews(username);
  const { nowPlaying } = useNowPlaying(username);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [reviewFilter, setReviewFilter] = useState<'all' | 'favorites'>('all');
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const isOwnProfile = currentUser?.username === username;

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        const data = await api.get<UserProfile>(`/users/profile/${username}`);
        setProfile(data);
        setIsFollowing(data.is_following || false);
      } catch {
        setProfile(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
    fetchReviews(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);

  const handleFollow = async () => {
    if (!profile || followLoading) return;

    setFollowLoading(true);
    const wasFollowing = isFollowing;

    // Optimistic update
    setIsFollowing(!wasFollowing);
    setProfile((prev) =>
      prev
        ? {
            ...prev,
            followers_count: wasFollowing
              ? prev.followers_count - 1
              : prev.followers_count + 1,
          }
        : null
    );

    try {
      const endpoint = wasFollowing
        ? `/users/profile/${username}/unfollow`
        : `/users/profile/${username}/follow`;
      const response = await api.post<FollowResponse>(endpoint);
      setProfile((prev) =>
        prev ? { ...prev, followers_count: response.followers_count } : null
      );
    } catch {
      // Revert on error
      setIsFollowing(wasFollowing);
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              followers_count: wasFollowing
                ? prev.followers_count + 1
                : prev.followers_count - 1,
            }
          : null
      );
      toast.error('Não foi possível atualizar o perfil');
    } finally {
      setFollowLoading(false);
    }
  };

  // Banner upload handler
  const handleBannerUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !profile) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Selecione um arquivo de imagem');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter menos de 5 MB');
      return;
    }

    // Create local preview URL for optimistic update
    const previewUrl = URL.createObjectURL(file);
    const previousBanner = profile.banner_image;

    // Optimistic update - show preview immediately
    setProfile((prev) => prev ? { ...prev, banner_image: previewUrl } : null);
    toast.success('Banner atualizado!');

    // Upload in background
    setIsUploadingBanner(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const updatedProfile = await api.postForm<UserProfile>('/users/profile/banner', formData);
      // Replace preview with actual URL from server
      URL.revokeObjectURL(previewUrl);
      setProfile(updatedProfile);
    } catch (err) {
      // Revert on error
      URL.revokeObjectURL(previewUrl);
      setProfile((prev) => prev ? { ...prev, banner_image: previousBanner } : null);
      toast.error(err instanceof Error ? err.message : 'Não foi possível enviar o banner');
    } finally {
      setIsUploadingBanner(false);
      if (bannerInputRef.current) {
        bannerInputRef.current.value = '';
      }
    }
  };

  // Handle like for reviews
  const handleLike = async (reviewUuid: string) => {
    if (!currentUser) {
      toast.error('Entre na sua conta para curtir resenhas');
      return;
    }

    const review = reviews.find((r) => r.uuid === reviewUuid);
    if (!review) return;

    const wasLiked = review.is_liked;

    // Optimistic update
    setReviews((prev) =>
      prev.map((r) =>
        r.uuid === reviewUuid
          ? {
              ...r,
              is_liked: !wasLiked,
              like_count: wasLiked ? r.like_count - 1 : r.like_count + 1,
            }
          : r
      )
    );

    try {
      const response = await api.post<LikeResponse>(`/reviews/${reviewUuid}/like`);
      setReviews((prev) =>
        prev.map((r) =>
          r.uuid === reviewUuid
            ? { ...r, is_liked: response.liked, like_count: response.like_count }
            : r
        )
      );
    } catch {
      // Revert on error
      setReviews((prev) =>
        prev.map((r) =>
          r.uuid === reviewUuid
            ? { ...r, is_liked: wasLiked, like_count: review.like_count }
            : r
        )
      );
    }
  };

  // Handle delete for reviews
  const handleDelete = async (reviewUuid: string) => {
    if (!confirm('Tem certeza de que deseja excluir esta resenha?')) return;

    // Save current state for potential rollback
    const previousReviews = [...reviews];
    const previousReviewCount = profile?.review_count ?? 0;

    // Optimistic delete - remove immediately
    setReviews((prev) => prev.filter((r) => r.uuid !== reviewUuid));
    setProfile((prev) =>
      prev ? { ...prev, review_count: prev.review_count - 1 } : null
    );
    toast.success('Resenha excluída');

    // API call in background
    try {
      await api.delete(`/reviews/${reviewUuid}`);
    } catch {
      // Revert on error
      setReviews(previousReviews);
      setProfile((prev) =>
        prev ? { ...prev, review_count: previousReviewCount } : null
      );
      toast.error('Não foi possível excluir a resenha. Restaurando...');
    }
  };

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  if (!profile) {
    return (
      <div className="app-usable-viewport bg-[#f4f0e8] dark:bg-background">
        <div className="h-28 bg-wine-800 sm:h-48 md:h-56" />
        <div className="container mx-auto max-w-3xl px-4 py-6 sm:py-12">
          <div className="rounded-[1.5rem] border border-dashed border-[#d8cfc4] bg-white p-6 text-center sm:p-10 dark:border-border dark:bg-card">
            <div className="mb-2 inline-block text-4xl text-muted-foreground/30 sm:mb-3 sm:text-5xl">?</div>
            <p className="font-medium text-muted-foreground">Este perfil não foi encontrado.</p>
          </div>
        </div>
      </div>
    );
  }

  const avgRating = typeof profile.avg_rating === 'number' ? profile.avg_rating.toFixed(1) : null;
  const recentReviews = Array.from(
    new Map(reviews.map((review) => [review.album.spotify_id, review])).values()
  ).slice(0, 4);

  const changeReviewFilter = (filter: 'all' | 'favorites') => {
    if (filter === reviewFilter) return;
    setReviewFilter(filter);
    fetchReviews(true, filter === 'favorites');
  };

  return (
    <div className="app-usable-viewport min-w-0 bg-[#f4f0e8] text-[#1b1919] dark:bg-background dark:text-foreground">
      <div className="mx-auto max-w-6xl px-0 pt-0 sm:px-5 sm:pt-5 lg:px-8">
        {/* O banner personalizado continua funcional; o fundo editorial aparece quando ele não existe. */}
        <div className="relative h-40 overflow-hidden bg-wine-800 sm:h-56 sm:rounded-[2rem] md:h-64">
          {profile.banner_image && (
            <Image
              src={profile.banner_image}
              alt={`Banner de ${profile.username}`}
              fill
              className="object-cover object-center"
              priority
            />
          )}
          {!profile.banner_image && (
            <div className="absolute inset-0 overflow-hidden bg-[linear-gradient(115deg,#4a1d27_0%,#722f37_48%,#a54651_100%)]">
              <div className="absolute -right-14 -top-28 h-80 w-80 rounded-full border-[54px] border-[#f2ad52]/80 opacity-90 sm:right-16" />
              <div className="absolute -bottom-28 right-20 h-64 w-64 rounded-full border-[2px] border-white/20 sm:right-72" />
              <div className="absolute -bottom-36 right-12 h-80 w-80 rounded-full border-[2px] border-white/10 sm:right-64" />
              <div className="absolute left-[12%] top-1/2 h-px w-[34%] -rotate-6 bg-white/25" />
              <div className="absolute left-[7%] top-[62%] h-px w-[28%] -rotate-6 bg-[#f2ad52]/60" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />

          {isOwnProfile && (
            <>
              <input
                ref={bannerInputRef}
                type="file"
                accept="image/*"
                onChange={handleBannerUpload}
                className="hidden"
              />
              <button
                onClick={() => bannerInputRef.current?.click()}
                disabled={isUploadingBanner}
                className="absolute right-4 top-4 flex h-11 items-center justify-center gap-2 rounded-full border border-white/20 bg-black/35 px-3.5 text-sm font-semibold text-white backdrop-blur-md transition-colors hover:bg-black/55 disabled:opacity-50 sm:right-5 sm:top-5"
                aria-label="Alterar banner do perfil"
              >
                {isUploadingBanner ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <><Camera className="h-4 w-4" /><span className="hidden sm:inline">Alterar capa</span></>
                )}
              </button>
            </>
          )}
        </div>

        <div className="relative mx-4 -mt-10 rounded-[1.65rem] border border-[#ded6cc] bg-white px-4 pb-5 shadow-[0_18px_55px_rgba(57,39,31,0.09)] sm:mx-7 sm:-mt-14 sm:px-6 sm:pb-6 dark:border-border dark:bg-card">
          <div className="flex items-end justify-between gap-3">
            <div className="h-24 w-24 shrink-0 -translate-y-7 overflow-hidden rounded-full border-[5px] border-white bg-muted shadow-[0_12px_30px_rgba(31,22,18,0.2)] sm:h-32 sm:w-32 sm:-translate-y-9 dark:border-card">
              <Image
                src={profile.profile_picture || '/images/default.jpg'}
                alt={profile.username}
                width={160}
                height={160}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="mb-3 min-w-0 sm:mb-5">
              {isOwnProfile ? (
                <Button asChild variant="outline" className="min-h-11 gap-2 rounded-full border-[#d5ccc1] bg-white px-4 hover:bg-[#f7f3ed] dark:border-border dark:bg-card">
                  <Link href="/account">
                    <Pencil className="h-4 w-4" />
                    Editar perfil
                  </Link>
                </Button>
              ) : currentUser ? (
                <Button
                  onClick={handleFollow}
                  disabled={followLoading}
                  variant={isFollowing ? "outline" : "default"}
                  className={`min-h-11 rounded-full px-5 font-bold ${isFollowing ? "border-[#d5ccc1] bg-white hover:bg-[#f7f3ed] dark:bg-card" : "bg-wine-700 text-white hover:bg-wine-800"}`}
                >
                  {followLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isFollowing ? 'Seguindo' : 'Seguir'}
                </Button>
              ) : (
                <Button asChild className="min-h-11 rounded-full bg-wine-700 px-5 font-bold text-white hover:bg-wine-800">
                  <Link href="/login">Seguir</Link>
                </Button>
              )}
            </div>
          </div>
          <div className="-mt-4 sm:-mt-6 sm:pl-1">
            <p className="mb-1 text-[10px] font-black uppercase tracking-[0.17em] text-wine-700 sm:text-[11px]">Perfil musical</p>
            <h1 className="break-words text-2xl font-black tracking-[-0.04em] sm:text-4xl">{profile.username}</h1>
            {profile.bio ? (
              <p className="mt-2 max-w-2xl whitespace-pre-wrap break-words text-sm leading-relaxed text-muted-foreground sm:text-[15px]">{profile.bio}</p>
            ) : isOwnProfile ? (
              <Link href="/account" className="mt-2 inline-block text-sm text-wine-700 hover:underline">Conte um pouco sobre o seu gosto musical.</Link>
            ) : null}
            <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground sm:text-sm">
              <Calendar className="h-3.5 w-3.5" />
              Por aqui {formatDistanceToNow(new Date(profile.created_at), { addSuffix: true, locale: ptBR })}
            </p>
            {nowPlaying?.is_playing && (
              <div className="mt-3 inline-flex max-w-full rounded-full bg-[#f4f0e8] px-3 py-2 dark:bg-muted/60">
                <NowPlayingCard nowPlaying={nowPlaying} compact />
              </div>
            )}
          </div>

          <div className={`mt-5 grid overflow-hidden rounded-[1.2rem] border border-[#e6dfd6] bg-[#f8f5ef] ${avgRating ? 'grid-cols-4' : 'grid-cols-3'} dark:border-border dark:bg-muted/30`}>
            <ProfileStat value={profile.review_count} label="Reviews" icon={<Headphones className="h-3.5 w-3.5" />} />
            {avgRating && <ProfileStat value={avgRating} label="Nota média" accent icon={<Star className="h-3.5 w-3.5 fill-current" />} />}
            <ProfileStat value={profile.followers_count} label="Seguidores" icon={<UsersRound className="h-3.5 w-3.5" />} />
            <ProfileStat value={profile.following_count} label="Seguindo" />
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-6xl min-w-0 pb-8 pl-8 pr-4 pt-8 sm:pb-12 sm:pl-16 sm:pr-12 sm:pt-10 lg:pl-[5.25rem] lg:pr-[3.75rem]">
        <section>
          <div className="mb-4 sm:mb-5">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.17em] text-wine-700 sm:text-[11px]">Diário musical</p>
              <h2 className="mt-1 text-2xl font-black tracking-[-0.035em] sm:text-3xl">Reviews</h2>
              <p className="mt-1 hidden text-sm text-muted-foreground sm:block">Notas, favoritos e tudo o que ficou depois do play.</p>
            </div>
          </div>

          <div className="mb-5 flex w-fit rounded-full border border-[#ddd4c9] bg-white p-1 shadow-sm dark:border-border dark:bg-card">
            <button onClick={() => changeReviewFilter('all')} className={`min-h-9 rounded-full px-4 text-sm font-semibold transition-colors ${reviewFilter === 'all' ? 'bg-wine-700 text-white' : 'text-muted-foreground hover:text-foreground'}`}>Todas</button>
            <button onClick={() => changeReviewFilter('favorites')} className={`min-h-9 rounded-full px-4 text-sm font-semibold transition-colors ${reviewFilter === 'favorites' ? 'bg-wine-700 text-white' : 'text-muted-foreground hover:text-foreground'}`}>Favoritas</button>
          </div>

          <div className="grid min-w-0 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
            <div className="min-w-0">
              {reviewsLoading && reviews.length === 0 ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <ReviewCardSkeleton key={i} />
                  ))}
                </div>
              ) : reviews.length === 0 ? (
                <div className="rounded-[1.65rem] border border-dashed border-[#d8cfc4] bg-white py-10 text-center sm:py-14 dark:border-border dark:bg-card">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-wine-50 text-wine-700 dark:bg-muted"><Headphones className="h-5 w-5" /></div>
                  <p className="font-semibold">{reviewFilter === 'favorites' ? 'Nenhuma review favorita ainda.' : 'Nenhuma review por aqui ainda.'}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{reviewFilter === 'favorites' ? 'Os álbuns marcados com coração aparecem aqui.' : 'Quando a música virar memória, ela aparece aqui.'}</p>
                </div>
              ) : (
                <InfiniteScroll
                  hasMore={hasMore}
                  isLoading={reviewsLoading}
                  onLoadMore={() => fetchReviews(false, reviewFilter === 'favorites')}
                >
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <ReviewCard
                        key={review.id}
                        review={review}
                        onLike={handleLike}
                        onDelete={isOwnProfile ? handleDelete : undefined}
                      />
                    ))}
                  </div>
                </InfiniteScroll>
              )}
            </div>

            {recentReviews.length > 0 && (
              <aside className="order-first min-w-0 lg:order-last lg:sticky lg:top-24">
                <div className="rounded-[1.5rem] border border-[#ded6cc] bg-white p-4 shadow-[0_14px_40px_rgba(57,39,31,0.06)] dark:border-border dark:bg-card">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.15em] text-wine-700">Na estante</p>
                      <h3 className="mt-0.5 font-black tracking-[-0.02em]">Álbuns recentes</h3>
                    </div>
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f4f0e8] text-wine-700 dark:bg-muted"><Headphones className="h-4 w-4" /></span>
                  </div>
                  <div className="flex gap-3 overflow-x-auto pb-1 lg:block lg:space-y-2 lg:overflow-visible lg:pb-0">
                    {recentReviews.map((review) => (
                      <Link key={review.album.spotify_id} href={`/album/${review.album.spotify_id}`} className="group flex w-36 shrink-0 items-center gap-3 rounded-[1rem] bg-[#f7f3ed] p-2 transition-colors hover:bg-wine-50 lg:w-full dark:bg-muted/40">
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-muted shadow-sm">
                          {review.album.cover_image ? <Image src={review.album.cover_image} alt={review.album.title} fill sizes="48px" className="object-cover transition-transform group-hover:scale-105" /> : <div className="flex h-full items-center justify-center"><Headphones className="h-4 w-4 text-muted-foreground" /></div>}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold">{review.album.title}</p>
                          <p className="truncate text-xs text-muted-foreground">{review.album.artist}</p>
                          <p className="mt-0.5 flex items-center gap-1 text-xs font-bold text-[#d98524]"><Star className="h-3 w-3 fill-current" />{review.rating.toFixed(1)}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </aside>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

function ProfileStat({ value, label, icon, accent = false }: { value: string | number; label: string; icon?: React.ReactNode; accent?: boolean }) {
  return (
    <div className="min-w-0 border-r border-[#e6dfd6] px-1 py-3 text-center last:border-r-0 sm:py-4 dark:border-border">
      <span className={`block text-lg font-black tracking-[-0.025em] sm:text-xl ${accent ? 'text-[#d98524]' : ''}`}>{value}</span>
      <span className="mt-0.5 flex items-center justify-center gap-1 truncate text-[10px] text-muted-foreground sm:text-xs">{icon}{label}</span>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="app-usable-viewport bg-[#f4f0e8] dark:bg-background">
      {/* Banner Skeleton */}
      <div className="mx-auto h-40 max-w-6xl animate-pulse bg-muted sm:mt-5 sm:h-56 sm:rounded-[2rem] md:h-64" />

      {/* Profile Content */}
      <div className="container mx-auto max-w-3xl px-4">
        {/* Profile Picture Skeleton */}
        <div className="relative -mt-10 flex items-end justify-between sm:-mt-14">
          <div className="h-24 w-24 rounded-full border-4 border-background bg-muted animate-pulse sm:h-32 sm:w-32 md:h-40 md:w-40" />
          <div className="mb-1 sm:mb-4">
            <div className="h-11 w-28 rounded-full bg-muted animate-pulse" />
          </div>
        </div>

        <div className="pt-3 sm:pt-4">
          {/* Name skeleton */}
          <div className="mb-2 h-7 w-40 rounded bg-muted animate-pulse sm:h-8 sm:w-48" />
          {/* Bio skeleton */}
          <div className="mb-2 h-4 w-2/3 rounded bg-muted animate-pulse sm:w-72" />
          {/* Date skeleton */}
          <div className="h-4 w-40 bg-muted rounded animate-pulse mb-4" />

          {/* Stats Skeleton */}
          <div className="grid grid-cols-4 gap-1 py-4 sm:py-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="text-center">
                <div className="mx-auto mb-1 h-5 w-10 rounded bg-muted animate-pulse sm:h-6 sm:w-12" />
                <div className="mx-auto h-3 w-12 rounded bg-muted animate-pulse sm:h-4 sm:w-16" />
              </div>
            ))}
          </div>

          {/* Reviews Skeleton */}
          <div className="border-t border-border py-4 sm:py-6">
            <div className="mb-3 h-6 w-24 rounded bg-muted animate-pulse sm:mb-6" />
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <ReviewCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
