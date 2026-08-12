'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
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
 * Post de review em layout flat ("estilo Twitter"): avatar em coluna à
 * esquerda, header inline, texto como protagonista e o álbum como anexo
 * compacto. Os pais empilham os posts com divide-y (sem card por item).
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
    <article className="flex min-w-0 gap-3 px-4 py-3 transition-colors md:hover:bg-muted/30">
      <Link href={`/profile/${review.username}`} className="shrink-0 self-start">
        <UserAvatar
          username={review.username}
          profilePicture={review.user_profile_picture}
          size="md"
        />
      </Link>

      <div className="min-w-0 flex-1">
        {/* Header inline: nome · tempo + menu do dono */}
        <div className="flex min-w-0 items-center gap-1.5">
          <Link
            href={`/profile/${review.username}`}
            className="truncate text-sm font-semibold hover:underline"
          >
            {review.username}
          </Link>
          <span className="text-sm text-muted-foreground">·</span>
          <span className="min-w-0 truncate text-sm text-muted-foreground">
            {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
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
                    Edit
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete?.(review.uuid)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Texto da review como protagonista */}
        {review.text && (
          <p className="mt-0.5 whitespace-pre-wrap text-[15px] leading-snug text-foreground/90">
            {review.text}
          </p>
        )}

        {/* Álbum como anexo compacto (link-card) */}
        <Link
          href={`/album/${review.album.spotify_id}`}
          className="mt-2 flex min-w-0 items-center gap-3 rounded-xl border border-border bg-muted/30 p-2 transition-colors active:bg-muted/60 md:hover:bg-muted/60"
        >
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
            {review.album.cover_image ? (
              <Image
                src={review.album.cover_image}
                alt={review.album.title}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
                <Music className="h-6 w-6 text-muted-foreground/50" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{review.album.title}</p>
            <p className="truncate text-xs text-muted-foreground">{review.album.artist}</p>
            <div className="mt-1 flex items-center gap-2">
              <StarRating rating={review.rating} size="sm" />
              {review.is_favorite && (
                <Heart aria-label="Favorite" className="h-3.5 w-3.5 fill-current text-primary" />
              )}
            </div>
          </div>
        </Link>

        {/* Ações compactas inline */}
        <div className="-ml-2 mt-1 flex items-center gap-1 text-muted-foreground sm:gap-4">
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
              <Link href={`/reviews/${review.uuid}`} aria-label={`${review.comment_count} comments`}>
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
    <div className="flex gap-3 px-4 py-3">
      <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
        <div className="flex items-center gap-3 rounded-xl border border-border p-2">
          <Skeleton className="h-14 w-14 shrink-0 rounded-lg" />
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
