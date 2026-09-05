'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowDownUp,
  BookOpen,
  Heart,
  Music,
  Pencil,
  Plus,
  Search,
  Star,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { InfiniteScroll } from '@/components/common/infinite-scroll';
import { CreateReviewModal } from '@/components/reviews/create-review-modal';
import { useRequireAuth } from '@/hooks/use-auth';
import { useReview, useUserReviews } from '@/hooks/use-reviews';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Review } from '@/types';

type Filter = 'all' | 'favorites';
type Sort = 'recent' | 'rating';

export default function MyReviewsPage() {
  const { user, isLoading: authLoading } = useRequireAuth();
  const { reviews, isLoading, hasMore, total, fetchReviews } = useUserReviews(user?.username || '');
  const { deleteReview } = useReview();
  const [filter, setFilter] = useState<Filter>('all');
  const [sort, setSort] = useState<Sort>('recent');
  const [query, setQuery] = useState('');
  const [createReviewOpen, setCreateReviewOpen] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState<Review | null>(null);

  useEffect(() => {
    if (user?.username) fetchReviews(true);
  }, [user?.username, fetchReviews]);

  const favoriteCount = reviews.filter((review) => review.is_favorite).length;
  const averageRating = reviews.length
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : null;

  const visibleReviews = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('pt-BR');
    return reviews
      .filter((review) => filter === 'all' || review.is_favorite)
      .filter((review) => {
        if (!normalizedQuery) return true;
        return `${review.album.title} ${review.album.artist}`
          .toLocaleLowerCase('pt-BR')
          .includes(normalizedQuery);
      })
      .sort((a, b) =>
        sort === 'rating'
          ? b.rating - a.rating
          : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
  }, [filter, query, reviews, sort]);

  const handleDelete = async () => {
    if (!reviewToDelete) return;
    const review = reviewToDelete;
    setReviewToDelete(null);
    const success = await deleteReview(review.uuid);
    if (success) {
      toast.success('Review excluída');
      await fetchReviews(true);
      return;
    }
    toast.error('Não foi possível excluir a review');
  };

  if (authLoading || !user) return <MyReviewsSkeleton />;

  return (
    <div className="app-usable-viewport bg-[#f4f0e8] text-[#1b1919] dark:bg-background dark:text-foreground">
      <main className="container mx-auto max-w-6xl px-4 pb-20 pt-4 md:px-8 md:pb-24 md:pt-7">
        <section className="relative overflow-hidden rounded-[2rem] bg-wine-800 text-white shadow-[0_24px_65px_rgba(80,28,36,0.2)]">
          <div className="absolute -right-24 -top-32 h-80 w-80 rounded-full bg-[#e6a04a]/20 blur-3xl" />
          <div className="absolute -bottom-28 left-1/3 h-60 w-60 rounded-full bg-white/5 blur-3xl" />
          <div className="relative grid gap-6 p-6 sm:p-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-end lg:p-10">
            <div>
              <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#f4bd74]">
                <BookOpen className="h-3.5 w-3.5" /> Sua coleção de opiniões
              </p>
              <h1 className="mt-3 text-4xl font-black tracking-[-0.055em] sm:text-5xl">Seu diário musical.</h1>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/65 sm:text-base">
                Tudo o que você ouviu, sentiu e decidiu guardar sobre cada álbum.
              </p>
              <div className="mt-6 flex flex-wrap gap-2.5">
                <StatPill value={total || reviews.length} label="reviews" />
                <StatPill value={favoriteCount} label="favoritas" icon={Heart} />
                <StatPill value={averageRating?.toFixed(1) ?? '—'} label="média" icon={Star} />
              </div>
            </div>
            <Button
              onClick={() => setCreateReviewOpen(true)}
              className="h-12 rounded-full bg-[#e6a04a] px-6 font-black text-[#2b1917] shadow-lg hover:bg-[#f0af5d]"
            >
              <Plus className="mr-2 h-4 w-4" /> Escrever uma review
            </Button>
          </div>
        </section>

        <section className="mt-6">
          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-wine-700">Arquivo pessoal</p>
              <h2 className="mt-1 text-2xl font-black tracking-[-0.04em]">Todas as reviews</h2>
            </div>
            <div className="flex rounded-full border border-[#d8d0c6] bg-white p-1 shadow-sm dark:border-border dark:bg-card">
              <FilterButton active={filter === 'all'} onClick={() => setFilter('all')}>Todas</FilterButton>
              <FilterButton active={filter === 'favorites'} onClick={() => setFilter('favorites')}>Favoritas</FilterButton>
            </div>
          </div>

          <div className="mb-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
            <label className="flex h-12 items-center gap-3 rounded-full border border-[#d8d0c6] bg-white px-4 shadow-sm focus-within:border-wine-700/40 focus-within:ring-2 focus-within:ring-wine-700/10 dark:border-border dark:bg-card">
              <Search className="h-4 w-4 shrink-0 text-wine-700" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar por álbum ou artista"
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </label>
            <Button
              variant="outline"
              onClick={() => setSort((current) => current === 'recent' ? 'rating' : 'recent')}
              className="h-12 justify-center rounded-full border-[#d8d0c6] bg-white px-5 font-bold dark:border-border dark:bg-card"
            >
              <ArrowDownUp className="mr-2 h-4 w-4 text-wine-700" />
              {sort === 'recent' ? 'Mais recentes' : 'Maior nota'}
            </Button>
          </div>

          {isLoading && reviews.length === 0 ? (
            <div className="grid gap-4 md:grid-cols-2">{Array.from({ length: 4 }).map((_, index) => <ReviewItemSkeleton key={index} />)}</div>
          ) : visibleReviews.length === 0 ? (
            <EmptyState hasReviews={reviews.length > 0} onCreate={() => setCreateReviewOpen(true)} />
          ) : (
            <InfiniteScroll hasMore={hasMore} isLoading={isLoading} onLoadMore={() => fetchReviews(false)}>
              <div className="grid auto-rows-fr gap-4 md:grid-cols-2">
                {visibleReviews.map((review) => (
                  <ReviewItem key={review.id} review={review} onDelete={() => setReviewToDelete(review)} />
                ))}
              </div>
            </InfiniteScroll>
          )}
        </section>
      </main>

      <CreateReviewModal open={createReviewOpen} onOpenChange={setCreateReviewOpen} onSuccess={() => fetchReviews(true)} />

      <Dialog open={!!reviewToDelete} onOpenChange={(open) => !open && setReviewToDelete(null)}>
        <DialogContent className="max-w-[calc(100%-2rem)] rounded-[1.5rem] border-[#ded6cc] sm:max-w-md">
          <DialogHeader>
            <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-950/30">
              <Trash2 className="h-5 w-5" />
            </div>
            <DialogTitle className="text-left text-xl font-black tracking-[-0.03em]">Excluir esta review?</DialogTitle>
            <DialogDescription className="text-left leading-relaxed">
              Sua avaliação de <strong className="text-foreground">{reviewToDelete?.album.title}</strong> será removida permanentemente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-2">
            <Button variant="outline" onClick={() => setReviewToDelete(null)} className="rounded-full">Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete} className="rounded-full">Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatPill({ value, label, icon: Icon }: { value: string | number; label: string; icon?: typeof Heart }) {
  return <span className="flex items-center gap-2 rounded-full border border-white/12 bg-white/10 px-3.5 py-2 text-xs backdrop-blur-sm">{Icon && <Icon className="h-3.5 w-3.5 text-[#f4bd74]" />}<strong className="text-sm">{value}</strong><span className="text-white/60">{label}</span></span>;
}

function FilterButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" onClick={onClick} className={cn('min-h-10 rounded-full px-4 text-sm font-bold transition-colors', active ? 'bg-wine-700 text-white shadow-sm' : 'text-muted-foreground hover:text-foreground')}>{children}</button>;
}

function ReviewItem({ review, onDelete }: { review: Review; onDelete: () => void }) {
  return (
    <article className="group h-full overflow-hidden rounded-[1.5rem] border border-[#dcd4ca] bg-white shadow-[0_14px_40px_rgba(50,38,30,0.055)] transition-all hover:-translate-y-0.5 hover:border-wine-700/20 hover:shadow-[0_18px_48px_rgba(50,38,30,0.09)] dark:border-border dark:bg-card">
      <div className="grid h-full grid-cols-[7.5rem_minmax(0,1fr)] sm:grid-cols-[9rem_minmax(0,1fr)]">
        <Link href={`/reviews/${review.uuid}`} className="relative min-h-52 overflow-hidden bg-[#eee9e1] sm:min-h-56">
          {review.album.cover_image ? <Image src={review.album.cover_image} alt={review.album.title} fill sizes="144px" className="object-cover transition-transform duration-500 group-hover:scale-[1.025]" /> : <div className="flex h-full items-center justify-center"><Music className="h-8 w-8 text-muted-foreground/35" /></div>}
        </Link>
        <div className="flex min-w-0 flex-col p-4 sm:p-5">
          <div className="flex min-w-0 items-start gap-2">
            <div className="min-w-0 flex-1">
              <Link href={`/reviews/${review.uuid}`} className="block truncate text-lg font-black tracking-[-0.035em] hover:text-wine-700 sm:text-xl">{review.album.title}</Link>
              <Link href={`/album/${review.album.spotify_id}`} className="mt-0.5 block truncate text-sm text-muted-foreground hover:text-wine-700">{review.album.artist}</Link>
            </div>
            {review.is_favorite && <span title="Álbum favorito" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-wine-700/10 text-wine-700"><Heart className="h-3.5 w-3.5 fill-current" /></span>}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className="flex items-center gap-1 rounded-full bg-[#e6a04a]/16 px-2.5 py-1 text-sm font-black text-[#9f5f14]"><Star className="h-3.5 w-3.5 fill-current" />{review.rating.toFixed(1)}</span>
            <span className="text-[11px] text-muted-foreground">{formatDate(review.created_at)}</span>
          </div>
          {review.text ? <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-foreground/72">{review.text}</p> : <p className="mt-3 text-sm italic text-muted-foreground">Avaliação sem texto.</p>}
          <div className="mt-auto flex items-center gap-1 border-t border-[#eee8e0] pt-2 dark:border-border">
            <Button asChild variant="ghost" size="sm" className="h-10 w-10 rounded-full px-0 text-xs font-bold text-wine-700 sm:w-auto sm:px-3">
              <Link href={`/reviews/${review.uuid}/edit`} aria-label={`Editar review de ${review.album.title}`}><Pencil className="h-3.5 w-3.5 sm:mr-1.5" /><span className="hidden sm:inline">Editar</span></Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={onDelete} aria-label={`Excluir review de ${review.album.title}`} className="h-10 w-10 rounded-full px-0 text-xs font-bold text-muted-foreground hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/25 sm:w-auto sm:px-3">
              <Trash2 className="h-3.5 w-3.5 sm:mr-1.5" /><span className="hidden sm:inline">Excluir</span>
            </Button>
            <Button asChild variant="ghost" size="sm" className="ml-auto h-10 rounded-full px-3 text-xs font-black">
              <Link href={`/reviews/${review.uuid}`}>Ver mais</Link>
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}

function EmptyState({ hasReviews, onCreate }: { hasReviews: boolean; onCreate: () => void }) {
  return <div className="rounded-[1.75rem] border border-dashed border-[#cec3b7] bg-white/60 px-5 py-14 text-center dark:border-border dark:bg-card/60"><span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-wine-700/10 text-wine-700">{hasReviews ? <Search className="h-6 w-6" /> : <BookOpen className="h-6 w-6" />}</span><h3 className="mt-4 text-xl font-black">{hasReviews ? 'Nenhuma review encontrada' : 'Seu diário começa aqui'}</h3><p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">{hasReviews ? 'Tente outro termo ou altere os filtros.' : 'Avalie um álbum e guarde o que essa experiência significou para você.'}</p>{!hasReviews && <Button onClick={onCreate} className="mt-5 rounded-full bg-wine-700 font-black text-white hover:bg-wine-800"><Plus className="mr-2 h-4 w-4" />Escrever primeira review</Button>}</div>;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value));
}

function ReviewItemSkeleton() {
  return <div className="grid min-h-56 animate-pulse grid-cols-[9rem_minmax(0,1fr)] overflow-hidden rounded-[1.5rem] border border-[#dcd4ca] bg-white dark:border-border dark:bg-card"><div className="bg-muted" /><div className="space-y-3 p-5"><div className="h-6 w-2/3 rounded bg-muted" /><div className="h-4 w-1/2 rounded bg-muted" /><div className="h-7 w-16 rounded-full bg-muted" /><div className="h-3 w-full rounded bg-muted" /><div className="h-3 w-4/5 rounded bg-muted" /></div></div>;
}

function MyReviewsSkeleton() {
  return <div className="app-usable-viewport bg-[#f4f0e8] dark:bg-background"><main className="container mx-auto max-w-6xl px-4 pb-20 pt-4 md:px-8 md:pt-7"><div className="h-72 animate-pulse rounded-[2rem] bg-wine-800/80" /><div className="mt-6 h-12 animate-pulse rounded-full bg-muted" /><div className="mt-5 grid gap-4 md:grid-cols-2">{Array.from({ length: 4 }).map((_, index) => <ReviewItemSkeleton key={index} />)}</div></main></div>;
}
