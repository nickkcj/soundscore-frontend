'use client';

import { use, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, Heart, Loader2, Music, Save, Star } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { StarRating } from '@/components/common/star-rating';
import { useRequireAuth } from '@/hooks/use-auth';
import { useReview } from '@/hooks/use-reviews';
import { cn } from '@/lib/utils';
import type { Review } from '@/types';

const MAX_LENGTH = 2000;

export default function EditReviewPage({ params }: { params: Promise<{ uuid: string }> }) {
  const { uuid } = use(params);
  const router = useRouter();
  const { user, isLoading: authLoading } = useRequireAuth();
  const { getReview, updateReview, isLoading } = useReview();
  const [review, setReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    let active = true;
    getReview(uuid).then((data) => {
      if (!active) return;
      if (data) {
        setReview(data);
        setRating(data.rating);
        setText(data.text || '');
        setIsFavorite(data.is_favorite);
      }
      setLoading(false);
    });
    return () => { active = false; };
  }, [authLoading, getReview, uuid]);

  useEffect(() => {
    if (review && user && review.user_id !== user.id) {
      toast.error('Você só pode editar suas próprias reviews');
      router.replace('/feed');
    }
  }, [review, router, user]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!review || rating === 0) {
      toast.error('Escolha uma nota para continuar');
      return;
    }
    const updatedReview = await updateReview(uuid, {
      rating,
      text: text.trim() || undefined,
      is_favorite: isFavorite,
    });
    if (!updatedReview) {
      toast.error('Não foi possível salvar as alterações');
      return;
    }
    toast.success('Review atualizada!');
    router.push(`/reviews/${uuid}`);
  };

  if (authLoading || loading) return <EditReviewSkeleton />;

  if (!review) {
    return <div className="app-usable-viewport bg-[#f4f0e8] px-4 py-16 text-center dark:bg-background"><div className="mx-auto max-w-lg rounded-[1.75rem] border border-[#ded6cc] bg-white p-8 dark:border-border dark:bg-card"><Music className="mx-auto h-8 w-8 text-wine-700" /><h1 className="mt-4 text-2xl font-black">Review não encontrada</h1><p className="mt-2 text-sm text-muted-foreground">Ela pode ter sido removida ou o link não está correto.</p><Button asChild className="mt-5 rounded-full bg-wine-700 font-black text-white"><Link href="/my-reviews">Voltar para Minhas Reviews</Link></Button></div></div>;
  }

  const changed = rating !== review.rating || text !== (review.text || '') || isFavorite !== review.is_favorite;

  return (
    <div className="app-usable-viewport bg-[#f4f0e8] text-[#1b1919] dark:bg-background dark:text-foreground">
      <main className="container mx-auto max-w-5xl px-4 pb-20 pt-4 md:px-8 md:pb-24 md:pt-7">
        <Link href="/my-reviews" className="mb-4 inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-sm font-bold text-foreground/65 transition-colors hover:bg-white/70 hover:text-wine-700 dark:hover:bg-muted"><ArrowLeft className="h-4 w-4" />Minhas Reviews</Link>

        <form onSubmit={handleSubmit} className="grid overflow-hidden rounded-[2rem] border border-[#d9d0c6] bg-white shadow-[0_20px_60px_rgba(50,38,30,0.08)] dark:border-border dark:bg-card md:grid-cols-[19rem_minmax(0,1fr)]">
          <aside className="relative min-h-[19rem] overflow-hidden bg-wine-800 p-6 text-white md:min-h-[42rem] md:p-8">
            <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-[#e6a04a]/20 blur-3xl" />
            <div className="relative mx-auto aspect-square max-w-[14rem] overflow-hidden rounded-[1.35rem] bg-white/10 shadow-2xl ring-1 ring-white/15">
              {review.album.cover_image ? <Image src={review.album.cover_image} alt={review.album.title} fill priority className="object-cover" /> : <div className="flex h-full items-center justify-center"><Music className="h-12 w-12 text-white/35" /></div>}
            </div>
            <div className="relative mt-5 text-center md:text-left">
              <p className="text-[10px] font-black uppercase tracking-[0.17em] text-[#f4bd74]">Você está revisitando</p>
              <h1 className="mt-2 text-2xl font-black tracking-[-0.04em]">{review.album.title}</h1>
              <p className="mt-1 text-sm text-white/60">{review.album.artist}</p>
              {review.album.release_date && <p className="mt-3 text-xs text-white/40">{new Date(review.album.release_date).getFullYear()}</p>}
            </div>
          </aside>

          <section className="p-5 sm:p-7 md:p-9">
            <p className="text-[10px] font-black uppercase tracking-[0.17em] text-wine-700">Editar review</p>
            <h2 className="mt-2 text-3xl font-black tracking-[-0.05em] sm:text-4xl">Mudou de ideia?</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">A música muda com a gente. Atualize sua nota ou registre uma nova impressão.</p>

            <div className="mt-7">
              <label className="text-sm font-black">Sua nota</label>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <div className="[&>div>button]:flex [&>div>button]:h-11 [&>div>button]:w-11 [&>div>button]:items-center [&>div>button]:justify-center"><StarRating rating={rating} size="lg" interactive onChange={setRating} /></div>
                <span className="flex h-10 min-w-14 items-center justify-center rounded-full bg-[#e6a04a]/16 px-3 text-sm font-black text-[#9f5f14]"><Star className="mr-1 h-3.5 w-3.5 fill-current" />{rating.toFixed(1)}</span>
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between gap-3"><label htmlFor="review-text" className="text-sm font-black">O que você achou?</label><span className="text-[11px] text-muted-foreground">{text.length}/{MAX_LENGTH}</span></div>
              <Textarea id="review-text" value={text} maxLength={MAX_LENGTH} onChange={(event) => setText(event.target.value)} placeholder="Conte o que ficou com você depois de ouvir..." className="mt-2 min-h-44 resize-none rounded-2xl border-[#d8d0c6] bg-[#faf8f4] p-4 leading-relaxed shadow-none focus-visible:border-wine-700/40 focus-visible:ring-wine-700/10 dark:border-border dark:bg-muted/25" />
            </div>

            <button type="button" onClick={() => setIsFavorite((current) => !current)} className={cn('mt-5 flex min-h-14 w-full items-center gap-3 rounded-2xl border p-3.5 text-left transition-colors', isFavorite ? 'border-wine-700/25 bg-wine-700/8' : 'border-[#ded6cc] bg-[#faf8f4] hover:border-wine-700/20 dark:border-border dark:bg-muted/25')}>
              <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', isFavorite ? 'bg-wine-700 text-white' : 'bg-[#eee8e0] text-muted-foreground dark:bg-muted')}><Heart className={cn('h-4 w-4', isFavorite && 'fill-current')} /></span>
              <span className="min-w-0 flex-1"><strong className="block text-sm">Álbum favorito</strong><span className="text-xs text-muted-foreground">Deixe esta escolha em destaque no seu perfil.</span></span>
              {isFavorite && <Check className="h-4 w-4 text-wine-700" />}
            </button>

            <div className="mt-7 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="ghost" onClick={() => router.back()} className="h-12 rounded-full px-5 font-bold">Cancelar</Button>
              <Button type="submit" disabled={isLoading || rating === 0 || !changed} className="h-12 rounded-full bg-wine-700 px-6 font-black text-white hover:bg-wine-800">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Salvar alterações
              </Button>
            </div>
          </section>
        </form>
      </main>
    </div>
  );
}

function EditReviewSkeleton() {
  return <div className="app-usable-viewport bg-[#f4f0e8] dark:bg-background"><main className="container mx-auto max-w-5xl px-4 pt-5 md:px-8"><Skeleton className="mb-4 h-11 w-36 rounded-full" /><div className="grid overflow-hidden rounded-[2rem] bg-white md:grid-cols-[19rem_minmax(0,1fr)]"><Skeleton className="min-h-80 rounded-none bg-wine-800/80 md:min-h-[42rem]" /><div className="space-y-5 p-7"><Skeleton className="h-9 w-2/3" /><Skeleton className="h-5 w-full" /><Skeleton className="h-12 w-64" /><Skeleton className="h-44 w-full rounded-2xl" /><Skeleton className="h-14 w-full rounded-2xl" /></div></div></main></div>;
}
