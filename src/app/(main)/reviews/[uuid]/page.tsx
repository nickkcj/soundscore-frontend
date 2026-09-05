'use client';

import { useState, useEffect, use, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowLeft, Heart, MessageCircle, MoreHorizontal, Pencil, Trash2, Music, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { CommentThread } from '@/components/comments';
import { ShareModal } from '@/components/reviews/share-modal';
import { useRequireAuth } from '@/hooks/use-auth';
import { useReview } from '@/hooks/use-reviews';
import { useAuthStore } from '@/stores/auth-store';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/common/user-avatar';
import { StarRating } from '@/components/common/star-rating';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { Review } from '@/types';

export default function ReviewDetailPage({ params }: { params: Promise<{ uuid: string }> }) {
  const { uuid } = use(params);
  const { isLoading: authLoading } = useRequireAuth();
  const { getReview, deleteReview } = useReview();
  const { user } = useAuthStore();
  const router = useRouter();

  const queryClient = useQueryClient();
  const [review, setReview] = useState<Review | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiking, setIsLiking] = useState(false);

  const isOwner = user?.id === review?.user_id;

  useEffect(() => {
    const fetchReview = async () => {
      const data = await getReview(uuid);
      setReview(data);
      setIsLoading(false);
    };

    if (!authLoading) {
      fetchReview();
    }
  }, [uuid, authLoading, getReview]);

  const handleLike = useCallback(async () => {
    if (!review || isLiking) return;

    setIsLiking(true);

    // Optimistic update
    const wasLiked = review.is_liked;
    setReview({
      ...review,
      is_liked: !wasLiked,
      like_count: wasLiked ? review.like_count - 1 : review.like_count + 1,
    });

    try {
      const { api } = await import('@/lib/api');
      const response = await api.post<{ liked: boolean; like_count: number }>(
        `/reviews/${review.uuid}/like`
      );
      setReview((prev) =>
        prev
          ? { ...prev, is_liked: response.liked, like_count: response.like_count }
          : prev
      );
    } catch {
      // Revert on error
      setReview((prev) =>
        prev
          ? { ...prev, is_liked: wasLiked, like_count: review.like_count }
          : prev
      );
    } finally {
      setIsLiking(false);
    }
  }, [review, isLiking]);

  const handleCommentCountChange = useCallback((delta: number) => {
    setReview((prev) =>
      prev ? { ...prev, comment_count: prev.comment_count + delta } : prev
    );

    // Update feed cache so count is correct when user navigates back
    queryClient.setQueriesData(
      { queryKey: ['feed'] },
      (old: { pages: { reviews: Review[] }[]; pageParams: number[] } | undefined) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            reviews: page.reviews.map((r) =>
              r.uuid === uuid
                ? { ...r, comment_count: r.comment_count + delta }
                : r
            ),
          })),
        };
      }
    );
  }, [queryClient, uuid]);

  const handleDelete = async () => {
    if (!review || !confirm('Tem certeza de que deseja excluir esta review?')) return;
    const deleted = await deleteReview(review.uuid);
    if (deleted) {
      toast.success('Review excluída');
      router.push('/feed');
    } else {
      toast.error('Não foi possível excluir a review');
    }
  };

  if (authLoading || isLoading) {
    return <ReviewDetailSkeleton />;
  }

  if (!review) {
    return (
      <div className="app-usable-viewport bg-[#f4f0e8] dark:bg-background">
        <div className="mx-auto max-w-3xl px-4 py-6 sm:py-10">
          <div className="mb-5 flex items-center gap-3">
              <Link
                href="/feed"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-[#d9d0c5] bg-white transition-colors hover:bg-[#f8f5ef] dark:border-border dark:bg-card"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <h1 className="text-xl font-black tracking-[-0.03em]">Review</h1>
          </div>
          <div className="rounded-[1.75rem] border border-dashed border-[#d9d0c5] bg-white py-14 text-center dark:border-border dark:bg-card">
            <p className="text-muted-foreground">Esta review não foi encontrada.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-usable-viewport bg-[#f4f0e8] text-[#1b1919] dark:bg-background dark:text-foreground">
      <div className="mx-auto max-w-3xl px-4 py-5 sm:py-7">
        <div className="mb-5 flex items-center gap-3">
          <Link href="/feed" aria-label="Voltar para o feed" className="flex h-11 w-11 items-center justify-center rounded-full border border-[#d9d0c5] bg-white shadow-sm transition-colors hover:bg-[#f8f5ef] dark:border-border dark:bg-card">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-wine-700">SoundScore</p>
            <h1 className="text-xl font-black tracking-[-0.03em]">Review</h1>
          </div>
        </div>

        <div className="overflow-hidden rounded-[1.75rem] border border-[#ded6cc] bg-white shadow-[0_18px_55px_rgba(57,39,31,0.07)] dark:border-border dark:bg-card">
          <article className="min-w-0 border-b border-[#ded6cc] dark:border-border">
            <div className="flex items-start justify-between border-b border-[#ebe4db] px-4 py-4 dark:border-border sm:px-6">
              <div className="flex gap-3">
              <UserAvatar
                username={review.username}
                profilePicture={review.user_profile_picture}
                size="md"
              />
              <div className="flex min-w-0 flex-col">
                <Link
                  href={`/profile/${review.username}`}
                  className="truncate font-bold leading-tight hover:text-wine-700"
                >
                  {review.username}
                </Link>
                <span className="text-sm text-muted-foreground">publicou {formatDistanceToNow(new Date(review.created_at), { addSuffix: true, locale: ptBR })}</span>
              </div>
            </div>
            {isOwner && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button aria-label="Ações da review" variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-wine-50 hover:text-wine-700">
                    <MoreHorizontal className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link href={`/reviews/${review.uuid}/edit`} className="cursor-pointer">
                      <Pencil className="mr-2 h-4 w-4" />
                      Editar review
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDelete} className="cursor-pointer text-destructive focus:text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir review
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            </div>

            <div className="p-4 sm:p-6">
              <Link href={`/album/${review.album.spotify_id}`} className="group grid min-w-0 grid-cols-[7rem_minmax(0,1fr)] items-center gap-4 rounded-[1.35rem] bg-[#f7f3ed] p-3 transition-colors hover:bg-wine-50 dark:bg-muted/35 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-5 sm:p-4">
              <div className="relative aspect-square overflow-hidden rounded-[1rem] bg-muted shadow-[0_14px_32px_rgba(42,31,24,0.2)]">
                {review.album.cover_image ? (
                  <Image
                    src={review.album.cover_image}
                    alt={review.album.title}
                    fill
                    sizes="(max-width: 640px) 112px, 160px"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.025]"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
                    <Music className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="mb-1 text-[10px] font-black uppercase tracking-[0.15em] text-wine-700">Álbum avaliado</p>
                <h2 className="truncate text-xl font-black tracking-[-0.035em] sm:text-3xl">{review.album.title}</h2>
                <p className="truncate text-sm text-muted-foreground sm:text-base">{review.album.artist}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <StarRating rating={review.rating} size="md" />
                  {review.is_favorite && (
                    <span className="inline-flex items-center text-xs font-bold text-wine-700">
                      <Heart className="h-3 w-3 mr-1 fill-current" />
                      Favorito
                    </span>
                  )}
                </div>
              </div>
              </Link>

              {review.text && <blockquote className="mt-5 border-l-2 border-wine-700/35 pl-4 text-[16px] leading-[1.75] text-foreground/90 sm:text-[17px]">{review.text}</blockquote>}
            </div>

            <div className="flex items-center gap-2 border-t border-[#ebe4db] px-3 py-2 dark:border-border sm:px-5">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-11 rounded-full gap-2 px-3 transition-colors",
                review.is_liked
                  ? "text-wine-500 hover:bg-wine-500/10"
                  : "hover:bg-wine-500/10 hover:text-wine-500"
              )}
              onClick={handleLike}
              disabled={isLiking}
            >
              <Heart className={cn("h-5 w-5", review.is_liked && "fill-current")} />
              <span>{review.like_count}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-11 gap-2 rounded-full px-3 hover:bg-wine-50 hover:text-wine-700"
              onClick={() => document.getElementById('comment-input')?.focus()}
            >
              <MessageCircle className="h-5 w-5" />
              <span>{review.comment_count}</span>
            </Button>
            <ShareModal reviewUuid={review.uuid}>
              <Button
                aria-label="Compartilhar review"
                variant="ghost"
                size="sm"
                className="h-11 gap-2 rounded-full px-3 hover:bg-wine-50 hover:text-wine-700"
              >
                <Share2 className="h-5 w-5" />
              </Button>
            </ShareModal>
            </div>
          </article>

          <section className="min-w-0 p-4 sm:p-6">
            <CommentThread reviewUuid={review.uuid} onCommentCountChange={handleCommentCountChange} />
          </section>
        </div>
      </div>
    </div>
  );
}

function ReviewDetailSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto border-x border-border min-h-screen">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border">
          <div className="flex items-center gap-6 px-4 h-14">
            <Skeleton className="h-9 w-9 rounded-full" />
            <Skeleton className="h-6 w-20" />
          </div>
        </div>

        <div className="px-4 pt-4">
          {/* User Info */}
          <div className="flex items-start gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>

          {/* Content */}
          <div className="mt-4 space-y-2">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-4/5" />
          </div>

          {/* Album Card */}
          <div className="mt-4 rounded-2xl border border-border overflow-hidden">
            <div className="flex">
              <Skeleton className="w-28 h-28 flex-shrink-0" />
              <div className="flex-1 p-3 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          </div>

          {/* Timestamp */}
          <div className="mt-4 pb-4 border-b border-border">
            <Skeleton className="h-4 w-32" />
          </div>

          {/* Stats */}
          <div className="flex gap-5 py-4 border-b border-border">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>

          {/* Actions */}
          <div className="flex justify-around py-3 border-b border-border">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-8 w-8 rounded-full" />
            ))}
          </div>
        </div>

        {/* Comments */}
        <div className="px-4 py-4 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
