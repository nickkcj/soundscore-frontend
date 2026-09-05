'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Heart, MessageCircle, MoreHorizontal, Pencil, Trash2, Music, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserAvatar } from '@/components/common/user-avatar';
import { StarRating } from '@/components/common/star-rating';
import { CommentPreview } from '@/components/comments';
import { ShareModal } from '@/components/reviews/share-modal';
import { useAuthStore } from '@/stores/auth-store';
import { cn } from '@/lib/utils';
import type { Review } from '@/types';

// Componente de animação de coração flutuante
function FloatingHearts({ show }: { show: boolean }) {
  if (!show) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible">
      {Array.from({ length: 5 }, (_, index) => (
        <Heart
          key={index}
          className="absolute text-red-500 fill-red-500 animate-float-heart"
          style={{
            left: `${45 + (index - 2) * 5}%`,
            bottom: '0',
            animationDelay: `${index * 0.08}s`,
            width: `${12 + ((index * 3) % 8)}px`,
            height: `${12 + ((index * 3) % 8)}px`,
          }}
        />
      ))}
      <style jsx global>{`
        @keyframes float-heart {
          0% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          50% {
            opacity: 0.9;
            transform: translateY(-35px) scale(1.15);
          }
          100% {
            opacity: 0;
            transform: translateY(-70px) scale(0.9);
          }
        }
        .animate-float-heart {
          animation: float-heart 0.8s ease-out forwards;
        }
        @keyframes pulse-once {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.3);
          }
        }
        .animate-pulse-once {
          animation: pulse-once 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
}

interface ReviewCardProps {
  review: Review;
  onLike?: (reviewUuid: string) => void;
  onDelete?: (reviewUuid: string) => void;
  showComments?: boolean;
  showCommentPreview?: boolean;
}

/**
 * Card editorial de resenha. Mantém o texto e a pessoa em primeiro plano,
 * mas dá à capa do álbum presença suficiente para o feed parecer musical.
 */
export function ReviewCard({ review, onLike, onDelete, showComments = true, showCommentPreview = true }: ReviewCardProps) {
  const { user } = useAuthStore();
  const isOwner = user?.id === review.user_id;
  const [isLiking, setIsLiking] = useState(false);
  const [showHearts, setShowHearts] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);

  const handleLike = async () => {
    if (isLiking || !onLike) return;

    // Só mostra animação quando está dando like (não quando está tirando)
    if (!review.is_liked) {
      setAnimationKey(prev => prev + 1);
      setShowHearts(true);
      setTimeout(() => setShowHearts(false), 1000);
    }

    setIsLiking(true);
    await onLike(review.uuid);
    setIsLiking(false);
  };

  return (
    <article className="group/review min-w-0 overflow-hidden rounded-[1.65rem] border border-[#dcd4ca] bg-white shadow-[0_16px_50px_rgba(50,38,30,0.06)] transition-all duration-300 md:hover:-translate-y-0.5 md:hover:border-wine-700/20 md:hover:shadow-[0_20px_60px_rgba(50,38,30,0.1)] dark:border-border dark:bg-card">
      <div className="flex min-w-0 items-center gap-3 border-b border-[#eee8e0] px-4 py-3 md:px-4 dark:border-border">
        <Link href={`/profile/${review.username}`} className="shrink-0">
          <UserAvatar
            username={review.username}
            profilePicture={review.user_profile_picture}
            size="md"
            showLink={false}
          />
        </Link>
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          <Link
            href={`/profile/${review.username}`}
            className="truncate text-sm font-bold tracking-[-0.01em] hover:text-wine-700"
          >
            {review.username}
          </Link>
          <span className="text-sm text-muted-foreground">·</span>
          <span className="min-w-0 truncate text-sm text-muted-foreground">
            {formatDistanceToNow(new Date(review.created_at), { addSuffix: true, locale: ptBR })}
          </span>
          {isOwner && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button aria-label="Review actions" variant="ghost" size="icon" className="ml-auto h-11 w-11 shrink-0 text-muted-foreground sm:h-9 sm:w-9">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/reviews/${review.uuid}/edit`}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Editar
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete?.(review.uuid)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                    Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      <div className="p-4">
        {/* Capa e conteúdo formam uma única composição */}
        <div className="grid min-w-0 grid-cols-[5.5rem_minmax(0,1fr)] items-start gap-4 md:grid-cols-[7rem_minmax(0,1fr)] md:gap-4">
          <Link href={`/album/${review.album.spotify_id}`} className="relative aspect-square w-full overflow-hidden rounded-[1rem] bg-[#eee9e1] shadow-[0_12px_28px_rgba(42,31,24,0.18)]">
            {review.album.cover_image ? (
              <Image
                src={review.album.cover_image}
                alt={review.album.title}
                fill
                sizes="(max-width: 767px) 88px, 112px"
                className="object-cover transition-transform duration-500 group-hover/review:scale-[1.025]"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
                <Music className="h-6 w-6 text-muted-foreground/50" />
              </div>
            )}
          </Link>
          <div className="min-w-0 pt-0.5 md:pt-1">
            <Link href={`/album/${review.album.spotify_id}`} className="block">
              <p className="truncate text-lg font-black tracking-[-0.035em] md:text-xl">{review.album.title}</p>
              <p className="mt-0.5 truncate text-sm text-muted-foreground">{review.album.artist}</p>
              <div className="mt-2 flex items-center gap-2">
                <StarRating rating={review.rating} size="md" />
                {review.is_favorite && (
                  <Heart aria-label="Favorite" className="h-3.5 w-3.5 fill-current text-primary" />
                )}
              </div>
            </Link>
            {review.text && (
              <p className="mt-2.5 hidden whitespace-pre-wrap text-[15px] leading-relaxed text-foreground/85 md:block">
                {review.text}
              </p>
            )}
          </div>
        </div>

        {/* Texto da resenha */}
        {review.text && (
          <p className="mt-4 whitespace-pre-wrap text-[15px] leading-[1.7] text-foreground/85 md:hidden">
            {review.text}
          </p>
        )}

        {/* Ações compactas inline */}
        <div className="-ml-2 mt-3 flex items-center gap-1 border-t border-[#ebe5dd] pt-1.5 text-muted-foreground sm:gap-3 dark:border-border">
          <div className="relative">
            <FloatingHearts key={animationKey} show={showHearts} />
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'h-11 min-w-11 gap-1.5 px-2 text-xs transition-transform active:scale-95 sm:h-9',
                review.is_liked && 'text-red-500 hover:text-red-600'
              )}
              onClick={handleLike}
              disabled={isLiking}
            >
              <Heart
                className={cn(
                  'h-4 w-4 transition-transform',
                  review.is_liked && 'fill-current animate-pulse-once'
                )}
              />
              <span>{review.like_count}</span>
            </Button>
          </div>

          {showComments && (
            <Button asChild variant="ghost" size="sm" className="h-11 min-w-11 gap-1.5 px-2 text-xs sm:h-9">
              <Link href={`/reviews/${review.uuid}`} aria-label={`${review.comment_count} comentários`}>
                <MessageCircle className="h-4 w-4" />
                <span>{review.comment_count}</span>
              </Link>
            </Button>
          )}

          <ShareModal reviewUuid={review.uuid}>
            <Button aria-label="Share review" variant="ghost" size="sm" className="h-11 min-w-11 gap-1.5 px-2 text-xs sm:h-9">
              <Share2 className="h-4 w-4" />
            </Button>
          </ShareModal>
        </div>

        {/* Comment Preview */}
        {showCommentPreview && review.comment_count > 0 && (
          <div className="mt-1 w-full">
            <CommentPreview reviewUuid={review.uuid} commentCount={review.comment_count} />
          </div>
        )}
      </div>
    </article>
  );
}

export function ReviewCardSkeleton() {
  return (
    <div className="flex gap-3 rounded-[1.5rem] border border-[#ded7ce] bg-white p-4 md:p-5 dark:border-border dark:bg-card">
      <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
        <div className="flex items-center gap-3 rounded-[1.15rem] bg-[#f4f0e8] p-3 dark:bg-muted/40">
          <Skeleton className="h-24 w-24 shrink-0 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
        <div className="flex gap-4">
          <Skeleton className="h-6 w-12" />
          <Skeleton className="h-6 w-12" />
        </div>
      </div>
    </div>
  );
}
