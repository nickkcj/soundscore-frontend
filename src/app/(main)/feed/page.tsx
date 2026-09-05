'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowDownUp,
  Disc3,
  PenLine,
  Plus,
  RefreshCw,
  Search,
  TrendingUp,
  UserPlus,
  UsersRound,
} from 'lucide-react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { InfiniteScroll } from '@/components/common/infinite-scroll';
import { ReviewCard, ReviewCardSkeleton } from '@/components/reviews/review-card';
import { StarRating } from '@/components/common/star-rating';
import { Skeleton } from '@/components/ui/skeleton';
import { useRequireAuth } from '@/hooks/use-auth';
import { useFeedQuery, useLikeMutation, useDeleteReviewMutation } from '@/hooks/queries/use-feed-query';
import { useTrendingAlbums, useMyGroups, useSuggestedUsers } from '@/hooks/queries/use-sidebar-queries';
import type { TrendingAlbum } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function FeedPage() {
  const { user, isLoading: authLoading } = useRequireAuth();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const { data: trendingData, isLoading: trendingAlbumsLoading } = useTrendingAlbums(3);
  const { data: groupsData, isLoading: myGroupsLoading } = useMyGroups();
  const { data: suggestedData, isLoading: suggestedUsersLoading } = useSuggestedUsers(4);
  const {
    data: feedData,
    isLoading: feedLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    isRefetching,
    error: feedError,
  } = useFeedQuery(sortOrder);
  const likeMutation = useLikeMutation();
  const deleteMutation = useDeleteReviewMutation();

  const trendingAlbums = trendingData?.albums ?? [];
  const myGroups = groupsData?.groups ?? [];
  const suggestedUsers = suggestedData?.users ?? [];
  const reviews = useMemo(
    () => feedData?.pages.flatMap((page) => page.reviews) ?? [],
    [feedData]
  );

  const handleDelete = () => {
    if (!reviewToDelete) return;
    const reviewUuid = reviewToDelete;
    setDeleteDialogOpen(false);
    setReviewToDelete(null);
    toast.success('Resenha excluída');
    deleteMutation.mutate(reviewUuid, {
      onError: () => {
        toast.error('Não foi possível excluir a resenha');
        refetch();
      },
    });
  };

  if (authLoading) return <FeedSkeleton />;

  const hasMore = hasNextPage ?? false;

  return (
    <div className="app-usable-viewport min-w-0 bg-[#f4f0e8] text-[#1b1919] dark:bg-background dark:text-foreground">
      <div className="mx-auto w-full max-w-[1180px] px-4 pb-12 pt-6 sm:px-6 sm:pt-10 lg:px-8 lg:pb-20">
        <div className="mb-7 lg:mb-10">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-wine-700 dark:text-wine-300">
              <span className="h-2 w-2 rounded-full bg-[#e99a55]" />
              Sua comunidade
            </div>
            <h1 className="text-[2rem] font-black leading-none tracking-[-0.045em] sm:text-[2.5rem]">
              O que estão ouvindo
            </h1>
            <p className="mt-2 text-sm text-[#6f675f] sm:text-base dark:text-muted-foreground">
              Resenhas, descobertas e conversas de quem vive música.
            </p>
          </div>
        </div>

        <div className="grid min-w-0 items-start gap-7 lg:grid-cols-[minmax(0,1fr)_20rem] xl:gap-10">
          <main className="min-w-0">
            <Link href="/reviews/create" className="group mb-6 flex items-center gap-3 rounded-[1.35rem] border border-[#dcd4ca] bg-white p-3.5 shadow-[0_10px_35px_rgba(50,38,30,0.045)] transition-all hover:border-wine-700/25 hover:shadow-[0_14px_40px_rgba(50,38,30,0.08)] dark:border-border dark:bg-card sm:p-4">
              <Avatar className="h-11 w-11 shrink-0">
                <AvatarImage src={user?.profile_picture || undefined} />
                <AvatarFallback className="bg-wine-100 font-bold text-wine-700">{user?.username?.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="min-w-0 flex-1 truncate text-sm text-[#81786f] sm:text-base">Qual álbum está na sua cabeça hoje?</span>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-wine-700 text-white transition-transform group-hover:rotate-[-4deg] group-hover:scale-105"><PenLine className="h-4 w-4" /></span>
            </Link>

            <div className="mb-4 flex items-center justify-between px-1">
              <div><h2 className="text-lg font-black tracking-[-0.025em]">Últimas da comunidade</h2><p className="text-xs text-muted-foreground">Opiniões frescas de quem você acompanha</p></div>
              <div className="flex items-center gap-1">
                <button onClick={() => refetch()} disabled={isRefetching} aria-label="Atualizar feed" className="flex h-10 w-10 items-center justify-center rounded-full text-[#6f675f] transition-colors hover:bg-white hover:text-wine-700 disabled:opacity-50 dark:hover:bg-muted">
                  <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
                </button>
                <button onClick={() => setSortOrder((order) => order === 'desc' ? 'asc' : 'desc')} className="flex min-h-10 items-center gap-1.5 rounded-full border border-[#dcd4ca] bg-white/70 px-3 text-xs font-bold text-wine-700 transition-colors hover:bg-white dark:border-border dark:bg-muted dark:text-wine-300">
                  <ArrowDownUp className="h-3.5 w-3.5" />
                  {sortOrder === 'desc' ? 'Recentes' : 'Antigas'}
                </button>
              </div>
            </div>

            {feedError && (
              <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                Não foi possível atualizar o feed. <button onClick={() => refetch()} className="font-bold underline">Tentar novamente</button>
              </div>
            )}

            {feedLoading && reviews.length === 0 ? (
              <div className="space-y-4">{Array.from({ length: 3 }).map((_, index) => <ReviewCardSkeleton key={index} />)}</div>
            ) : reviews.length === 0 ? (
              <div className="rounded-[1.5rem] border border-[#ded7ce] bg-white px-6 py-14 text-center dark:border-border dark:bg-card">
                <Disc3 className="mx-auto h-14 w-14 text-wine-200" strokeWidth={1.3} />
                <h2 className="mt-4 text-xl font-black">O feed está afinando os instrumentos.</h2>
                <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">Siga pessoas ou publique sua primeira resenha para começar a conversa.</p>
              </div>
            ) : (
              <InfiniteScroll hasMore={hasMore} isLoading={isFetchingNextPage} onLoadMore={() => fetchNextPage()} loader={<ReviewCardSkeleton />}>
                <div className="space-y-4">{reviews.map((review) => <ReviewCard key={review.uuid} review={review} onLike={(uuid) => likeMutation.mutate(uuid)} onDelete={(uuid) => { setReviewToDelete(uuid); setDeleteDialogOpen(true); }} />)}</div>
              </InfiniteScroll>
            )}

            {hasMore && !isFetchingNextPage && reviews.length > 0 && (
              <button onClick={() => fetchNextPage()} className="mx-auto mt-6 flex min-h-11 items-center rounded-full border border-wine-700/25 bg-white px-6 text-sm font-bold text-wine-700 hover:bg-wine-50 dark:bg-card dark:text-wine-300">Mostrar mais</button>
            )}
          </main>

          <aside className="sticky top-24 hidden space-y-5 lg:block">
            <section className="rounded-[1.65rem] border border-[#ded7ce] bg-white/75 p-5 dark:border-border dark:bg-card">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-sm font-extrabold"><TrendingUp className="h-4 w-4 text-[#dc8749]" /> Em alta</h2>
                <span className="text-[10px] font-bold uppercase tracking-[0.13em] text-muted-foreground">Esta semana</span>
              </div>
              <div className="space-y-3">
                {trendingAlbumsLoading ? Array.from({ length: 3 }).map((_, index) => <TrendingAlbumSkeleton key={index} />) : trendingAlbums.length ? <><FeaturedTrendingAlbum album={trendingAlbums[0]} /><div className="space-y-2 pt-1">{trendingAlbums.slice(1).map((album, index) => <TrendingAlbumItem key={album.spotify_id} album={album} position={index + 2} />)}</div></> : <p className="py-4 text-center text-xs text-muted-foreground">Os álbuns em alta aparecerão aqui.</p>}
              </div>
              <button type="button" onClick={() => window.dispatchEvent(new Event('soundscore:open-search'))} className="mt-4 flex min-h-10 w-full items-center justify-center gap-1.5 rounded-full text-xs font-bold text-wine-700 hover:bg-wine-700/5"><Search className="h-3.5 w-3.5" />Buscar álbuns</button>
            </section>

            <section className="rounded-[1.65rem] border border-[#ded7ce] bg-white/75 p-5 dark:border-border dark:bg-card">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-extrabold"><UserPlus className="h-4 w-4 text-wine-700" /> Pessoas para conhecer</h2>
              <div className="space-y-1">
                {suggestedUsersLoading ? Array.from({ length: 3 }).map((_, index) => <div key={index} className="flex items-center gap-3 py-2"><Skeleton className="h-9 w-9 rounded-full" /><Skeleton className="h-4 flex-1" /></div>) : suggestedUsers.length ? suggestedUsers.map((suggestedUser) => (
                  <Link key={suggestedUser.id} href={`/profile/${suggestedUser.username}`} className="flex items-center gap-3 rounded-xl py-2">
                    <Avatar className="h-9 w-9"><AvatarImage src={suggestedUser.profile_picture || undefined} /><AvatarFallback className="bg-wine-100 font-bold text-wine-700">{suggestedUser.username.charAt(0).toUpperCase()}</AvatarFallback></Avatar>
                    <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{suggestedUser.username}</p><p className="text-[11px] text-muted-foreground">{suggestedUser.followers_count || 0} seguidores</p></div>
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-wine-50 text-wine-700"><Plus className="h-3.5 w-3.5" /></span>
                  </Link>
                )) : <p className="py-4 text-center text-xs text-muted-foreground">Novas sugestões aparecerão aqui.</p>}
              </div>
            </section>

            <section className="rounded-[1.65rem] border border-[#ded7ce] bg-white/55 p-5 dark:border-border dark:bg-card">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-sm font-extrabold"><UsersRound className="h-4 w-4 text-wine-700" /> Seus grupos</h2>
                <Link href="/groups" className="text-xs font-bold text-wine-700 hover:underline">Ver todos</Link>
              </div>
              <div className="space-y-1">
                {myGroupsLoading ? Array.from({ length: 2 }).map((_, index) => <Skeleton key={index} className="h-11 w-full rounded-xl" />) : myGroups.length ? myGroups.slice(0, 3).map((group) => (
                  <Link key={group.id} href={`/groups/${group.uuid}`} className="flex items-center gap-3 rounded-xl py-2">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-wine-100 text-[10px] font-black text-wine-700">{group.cover_image ? <Image src={group.cover_image} alt="" width={40} height={40} className="h-full w-full object-cover" /> : group.name.slice(0, 2).toUpperCase()}</div>
                    <div className="min-w-0"><p className="truncate text-sm font-bold">{group.name}</p><p className="text-[11px] text-muted-foreground">{group.member_count} membros</p></div>
                  </Link>
                )) : <p className="py-3 text-center text-xs text-muted-foreground">Seus grupos aparecerão aqui.</p>}
              </div>
            </section>
          </aside>
        </div>
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="rounded-3xl">
          <DialogHeader><DialogTitle>Excluir resenha?</DialogTitle><DialogDescription>Essa ação não pode ser desfeita.</DialogDescription></DialogHeader>
          <DialogFooter><Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button><Button variant="destructive" onClick={handleDelete}>Excluir</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TrendingAlbumItem({ album, position }: { album: TrendingAlbum; position: number }) {
  return (
    <Link href={`/album/${album.spotify_id}`} className="group flex items-center gap-3 rounded-xl py-1.5">
      <span className="w-3 text-xs font-black text-wine-700/45">{position}</span>
      <div className="relative h-13 w-13 shrink-0 overflow-hidden rounded-xl bg-muted shadow-sm">
        {album.cover_image ? <Image src={album.cover_image} alt={album.title} fill className="object-cover transition-transform group-hover:scale-105" /> : <Disc3 className="m-3 h-7 w-7 text-muted-foreground" />}
      </div>
      <div className="min-w-0 flex-1"><h3 className="truncate text-sm font-extrabold">{album.title}</h3><p className="truncate text-xs text-muted-foreground">{album.artist}</p>{album.avg_rating ? <div className="mt-1"><StarRating rating={album.avg_rating} size="sm" /></div> : null}</div>
    </Link>
  );
}

function FeaturedTrendingAlbum({ album }: { album: TrendingAlbum }) {
  return (
    <Link href={`/album/${album.spotify_id}`} className="group flex items-center gap-3 overflow-hidden rounded-[1.1rem] bg-[#eee8df] p-3 dark:bg-muted/50">
      <div className="relative h-[5.25rem] w-[5.25rem] shrink-0 overflow-hidden rounded-[0.8rem] bg-muted shadow-sm">
        {album.cover_image ? <Image src={album.cover_image} alt={album.title} fill className="object-cover transition-transform duration-500 group-hover:scale-[1.035]" /> : <Disc3 className="absolute inset-0 m-auto h-12 w-12 text-muted-foreground" />}
        <span className="absolute left-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-[#f0a36b] text-[10px] font-black text-[#1b1919] shadow-sm">1</span>
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-black tracking-[-0.02em]">{album.title}</h3>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{album.artist}</p>
        {album.avg_rating ? <div className="mt-1.5"><StarRating rating={album.avg_rating} size="sm" /></div> : null}
      </div>
    </Link>
  );
}

function TrendingAlbumSkeleton() {
  return <div className="flex items-center gap-3 py-1.5"><Skeleton className="h-3 w-3" /><Skeleton className="h-13 w-13 rounded-xl" /><div className="flex-1 space-y-2"><Skeleton className="h-3 w-full" /><Skeleton className="h-3 w-2/3" /></div></div>;
}

function FeedSkeleton() {
  return <div className="app-usable-viewport bg-[#f4f0e8] px-4 py-10 dark:bg-background"><div className="mx-auto max-w-2xl space-y-4"><Skeleton className="mb-8 h-10 w-72" />{Array.from({ length: 3 }).map((_, index) => <ReviewCardSkeleton key={index} />)}</div></div>;
}
