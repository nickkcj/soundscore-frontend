'use client';

import { useState, useEffect, use, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ArrowLeft, Heart, MessageCircle, MoreHorizontal, Pencil, Trash2, Music, Bookmark, Share, BarChart3 } from 'lucide-react';
import { CommentThread } from '@/components/comments';
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
  const { getReview } = useReview();
  const { user } = useAuthStore();

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
  }, []);

  if (authLoading || isLoading) {
    return <ReviewDetailSkeleton />;
  }

  if (!review) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto border-x border-border min-h-screen">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border">
            <div className="flex items-center gap-6 px-4 h-14">
              <Link
                href="/feed"
                className="p-2 -ml-2 hover:bg-muted rounded-full transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <h1 className="text-xl font-bold">Review</h1>
            </div>
          </div>
          <div className="text-center py-12">
            <p className="text-muted-foreground">Review not found</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto border-x border-border min-h-screen">
        {/* Header - Twitter Style */}
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border">
          <div className="flex items-center gap-6 px-4 h-14">
            <Link
              href="/feed"
              className="p-2 -ml-2 hover:bg-muted rounded-full transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-xl font-bold">Review</h1>
          </div>
        </div>

        {/* Main Content */}
        <article className="px-4 pt-4">
          {/* User Info Row */}
          <div className="flex items-start justify-between">
            <div className="flex gap-3">
              <UserAvatar
                username={review.username}
                profilePicture={review.user_profile_picture}
                size="md"
              />
              <div className="flex flex-col">
                <Link
                  href={`/profile/${review.username}`}
                  className="font-bold hover:underline leading-tight"
                >
                  {review.username}
                </Link>
                <span className="text-muted-foreground text-sm">
                  @{review.username}
                </span>
              </div>
            </div>
            {isOwner && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-primary/10 hover:text-primary">
                    <MoreHorizontal className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link href={`/reviews/${review.uuid}/edit`} className="cursor-pointer">
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit review
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive focus:text-destructive cursor-pointer">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete review
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Review Text */}
          {review.text && (
            <div className="mt-4">
              <p className="text-[17px] leading-relaxed whitespace-pre-wrap">{review.text}</p>
            </div>
          )}

          {/* Album Card - Modern Style */}
          <Link
            href={`/albums/${review.album.spotify_id}`}
            className="mt-4 rounded-2xl border border-border overflow-hidden hover:bg-muted/50 transition-colors block cursor-pointer"
          >
            <div className="flex">
              {/* Album Cover */}
              <div className="relative w-28 h-28 flex-shrink-0 bg-muted">
                {review.album.cover_image ? (
                  <Image
                    src={review.album.cover_image}
                    alt={review.album.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
                    <Music className="h-10 w-10 text-muted-foreground/50" />
                  </div>
                )}
              </div>
              {/* Album Info */}
              <div className="flex-1 p-3 flex flex-col justify-center min-w-0">
                <h3 className="font-bold truncate text-[15px]">{review.album.title}</h3>
                <p className="text-sm text-muted-foreground truncate">{review.album.artist}</p>
                <div className="mt-2 flex items-center gap-3">
                  <StarRating rating={review.rating} size="sm" />
                  {review.is_favorite && (
                    <span className="inline-flex items-center text-xs text-primary font-medium">
                      <Heart className="h-3 w-3 mr-1 fill-current" />
                      Favorite
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Link>

          {/* Timestamp */}
          <div className="mt-4 pb-4 border-b border-border">
            <span className="text-muted-foreground text-[15px]">
              {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
            </span>
          </div>

          {/* Stats Row */}
          <div className="flex gap-5 py-4 border-b border-border">
            <button className="flex items-center gap-1 hover:underline">
              <span className="font-bold">{review.like_count}</span>
              <span className="text-muted-foreground">Likes</span>
            </button>
            <button className="flex items-center gap-1 hover:underline">
              <span className="font-bold">{review.comment_count}</span>
              <span className="text-muted-foreground">Comments</span>
            </button>
          </div>

          {/* Action Buttons - Twitter Style */}
          <div className="flex items-center justify-around py-2 border-b border-border">
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 h-10 rounded-full hover:bg-primary/10 hover:text-primary gap-2"
            >
              <MessageCircle className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 h-10 rounded-full hover:bg-green-500/10 hover:text-green-500 gap-2"
            >
              <BarChart3 className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "flex-1 h-10 rounded-full gap-2 transition-colors",
                review.is_liked
                  ? "text-pink-500 hover:bg-pink-500/10"
                  : "hover:bg-pink-500/10 hover:text-pink-500"
              )}
              onClick={handleLike}
              disabled={isLiking}
            >
              <Heart className={cn("h-5 w-5", review.is_liked && "fill-current")} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 h-10 rounded-full hover:bg-primary/10 hover:text-primary gap-2"
            >
              <Bookmark className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 h-10 rounded-full hover:bg-primary/10 hover:text-primary gap-2"
            >
              <Share className="h-5 w-5" />
            </Button>
          </div>
        </article>

        {/* Comments Section */}
        <div className="px-4 py-4">
          <CommentThread
            reviewUuid={review.uuid}
            onCommentCountChange={handleCommentCountChange}
          />
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
