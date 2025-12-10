'use client';

import { useState, useEffect, use, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ReviewCard, ReviewCardSkeleton } from '@/components/reviews/review-card';
import { CommentThread } from '@/components/comments';
import { useRequireAuth } from '@/hooks/use-auth';
import { useReview } from '@/hooks/use-reviews';
import { Skeleton } from '@/components/ui/skeleton';
import type { Review } from '@/types';

export default function ReviewDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { isLoading: authLoading } = useRequireAuth();
  const { getReview } = useReview();

  const [review, setReview] = useState<Review | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReview = async () => {
      const data = await getReview(parseInt(id));
      setReview(data);
      setIsLoading(false);
    };

    if (!authLoading) {
      fetchReview();
    }
  }, [id, authLoading, getReview]);

  const handleLike = useCallback(async () => {
    if (!review) return;

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
        `/reviews/${review.id}/like`
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
    }
  }, [review]);

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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 py-8">
        <div className="container max-w-2xl mx-auto px-4">
          <Link
            href="/feed"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Feed
          </Link>
          <div className="text-center py-12">
            <p className="text-muted-foreground">Review not found</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 py-8">
      <div className="container max-w-2xl mx-auto px-4">
        {/* Back Navigation */}
        <Link
          href="/feed"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Feed
        </Link>

        {/* Review Card */}
        <ReviewCard
          review={review}
          onLike={handleLike}
          showComments={false}
          showCommentPreview={false}
        />

        {/* Comments Section */}
        <div className="mt-6 bg-white rounded-lg border p-4 md:p-6">
          <h2 className="text-lg font-semibold mb-4">
            Comments ({review.comment_count})
          </h2>
          <CommentThread
            reviewId={review.id}
            onCommentCountChange={handleCommentCountChange}
          />
        </div>
      </div>
    </div>
  );
}

function ReviewDetailSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 py-8">
      <div className="container max-w-2xl mx-auto px-4">
        <Skeleton className="h-5 w-28 mb-6" />
        <ReviewCardSkeleton />
        <div className="mt-6 bg-white rounded-lg border p-4 md:p-6">
          <Skeleton className="h-6 w-32 mb-4" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
