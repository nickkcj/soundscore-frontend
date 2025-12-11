'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Heart, MessageCircle, MoreHorizontal, Pencil, Trash2, Music } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
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
import { useAuthStore } from '@/stores/auth-store';
import { cn } from '@/lib/utils';
import type { Review } from '@/types';

// Componente de animação de coração flutuante
function FloatingHearts({ show }: { show: boolean }) {
  const [hearts, setHearts] = useState<number[]>([]);

  useEffect(() => {
    if (show) {
      // Cria 5 corações com IDs únicos
      const newHearts = Array.from({ length: 5 }, (_, i) => Date.now() + i);
      setHearts(newHearts);

      // Remove os corações após a animação terminar
      const timer = setTimeout(() => {
        setHearts([]);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [show]);

  if (hearts.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible">
      {hearts.map((id, index) => (
        <Heart
          key={id}
          className="absolute text-red-500 fill-red-500 animate-float-heart"
          style={{
            left: `${45 + (index - 2) * 5}%`,
            bottom: '0',
            animationDelay: `${index * 0.08}s`,
            width: `${12 + Math.random() * 8}px`,
            height: `${12 + Math.random() * 8}px`,
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
      setTimeout(() => setShowHearts(false), 100);
    }

    setIsLiking(true);
    await onLike(review.uuid);
    setIsLiking(false);
  };

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-start gap-4 space-y-0 pb-3">
        <UserAvatar
          username={review.username}
          profilePicture={review.user_profile_picture}
          size="md"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div>
              <Link
                href={`/profile/${review.username}`}
                className="font-semibold hover:underline"
              >
                {review.username}
              </Link>
              <p className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
              </p>
            </div>
            {isOwner && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
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
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        {/* Album Info */}
        <div className="flex gap-4 mb-4">
          <div className="relative h-24 w-24 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
            {review.album.cover_image ? (
              <Image
                src={review.album.cover_image}
                alt={review.album.title}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
                <Music className="h-8 w-8 text-muted-foreground/50" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold truncate">{review.album.title}</h3>
            <p className="text-sm text-muted-foreground truncate">{review.album.artist}</p>
            <div className="mt-2">
              <StarRating rating={review.rating} size="sm" />
            </div>
            {review.is_favorite && (
              <span className="inline-flex items-center mt-2 text-xs text-primary font-medium">
                <Heart className="h-3 w-3 mr-1 fill-current" />
                Favorite
              </span>
            )}
          </div>
        </div>

        {/* Review Text */}
        {review.text && (
          <p className="text-sm text-foreground/90 whitespace-pre-wrap">{review.text}</p>
        )}
      </CardContent>

      <CardFooter className="border-t pt-3 flex-col items-stretch gap-3">
        <div className="flex items-center gap-6">
          <div className="relative">
            <FloatingHearts key={animationKey} show={showHearts} />
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'gap-2 h-8 transition-transform active:scale-95',
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
            <Link href={`/reviews/${review.uuid}`}>
              <Button variant="ghost" size="sm" className="gap-2 h-8">
                <MessageCircle className="h-4 w-4" />
                <span>{review.comment_count}</span>
              </Button>
            </Link>
          )}
        </div>

        {/* Comment Preview */}
        {showCommentPreview && review.comment_count > 0 && (
          <div className="w-full">
            <CommentPreview reviewUuid={review.uuid} commentCount={review.comment_count} />
          </div>
        )}
      </CardFooter>
    </Card>
  );
}

export function ReviewCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-start gap-4 space-y-0 pb-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="flex gap-4 mb-4">
          <Skeleton className="h-24 w-24 rounded-lg flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
        </div>
      </CardContent>
      <CardFooter className="border-t pt-3">
        <div className="flex gap-4">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-16" />
        </div>
      </CardFooter>
    </Card>
  );
}
