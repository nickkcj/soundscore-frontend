'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, Heart, Music, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { StarRating } from '@/components/common/star-rating';
import { useRequireAuth } from '@/hooks/use-auth';
import { useReview } from '@/hooks/use-reviews';
import type { Review } from '@/types';
import Link from 'next/link';

export default function EditReviewPage({ params }: { params: Promise<{ uuid: string }> }) {
  const { uuid } = use(params);
  const router = useRouter();
  const { user, isLoading: authLoading } = useRequireAuth();
  const { getReview, updateReview, isLoading, error } = useReview();

  const [review, setReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    const fetchReview = async () => {
      const reviewData = await getReview(uuid);
      if (reviewData) {
        setReview(reviewData);
        setRating(reviewData.rating);
        setText(reviewData.text || '');
        setIsFavorite(reviewData.is_favorite);
      }
      setLoading(false);
    };

    if (!authLoading) {
      fetchReview();
    }
  }, [uuid, authLoading, getReview]);

  // Check ownership
  useEffect(() => {
    if (review && user && review.user_id !== user.id) {
      toast.error('You can only edit your own reviews');
      router.push('/feed');
    }
  }, [review, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0 || !review) {
      toast.error('Please select a rating');
      return;
    }

    // Save previous state for potential rollback
    const previousState = {
      rating: review.rating,
      text: review.text,
      is_favorite: review.is_favorite,
    };

    // Optimistic update - update local state immediately
    setReview((prev) =>
      prev
        ? {
            ...prev,
            rating,
            text: text.trim() || null,
            is_favorite: isFavorite,
            updated_at: new Date().toISOString(),
          }
        : null
    );

    // Show success and navigate immediately
    toast.success('Review updated!');
    router.push('/feed');

    // API call in background
    try {
      const updatedReview = await updateReview(uuid, {
        rating,
        text: text.trim() || undefined,
        is_favorite: isFavorite,
      });

      if (!updatedReview) {
        // API returned null - show error (user already navigated)
        toast.error('Failed to save changes. Please try again.');
      }
    } catch {
      // Revert state (though user may have navigated away)
      setReview((prev) =>
        prev
          ? {
              ...prev,
              rating: previousState.rating,
              text: previousState.text,
              is_favorite: previousState.is_favorite,
            }
          : null
      );
      toast.error('Failed to save changes. Please try again.');
    }
  };

  if (authLoading || loading) {
    return <EditReviewSkeleton />;
  }

  if (!review) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-card to-background py-12">
        <div className="container max-w-2xl mx-auto px-4">
          <Card className="shadow-md border-border">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Review not found</p>
              <Link href="/my-reviews">
                <Button className="mt-4 bg-pink-600 hover:bg-pink-700">Back to My Reviews</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background py-12">
      <div className="container max-w-2xl mx-auto px-4">
        <Link href="/my-reviews" className="inline-flex items-center gap-2 text-muted-foreground hover:text-pink-600 dark:hover:text-pink-400 transition-colors mb-6">
          <ArrowLeft className="h-4 w-4" />
          Back to My Reviews
        </Link>

        <Card className="shadow-md border-border">
        <CardHeader>
          <CardTitle>Edit Review</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Album Preview (not editable) */}
            <div className="flex gap-4 p-4 rounded-lg bg-muted/50">
              <div className="relative h-24 w-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
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
              <div>
                <h3 className="font-semibold">{review.album.title}</h3>
                <p className="text-sm text-muted-foreground">{review.album.artist}</p>
                {review.album.release_date && (
                  <p className="text-sm text-muted-foreground">
                    {new Date(review.album.release_date).getFullYear()}
                  </p>
                )}
              </div>
            </div>

            {/* Rating */}
            <div className="space-y-2">
              <Label>Rating</Label>
              <div className="flex items-center gap-2">
                <StarRating
                  rating={rating}
                  size="lg"
                  interactive
                  onChange={setRating}
                />
                <span className="text-sm text-muted-foreground">
                  {rating > 0 ? `${rating}/5` : 'Select a rating'}
                </span>
              </div>
            </div>

            {/* Review Text */}
            <div className="space-y-2">
              <Label htmlFor="text">Review (optional)</Label>
              <Textarea
                id="text"
                placeholder="Share your thoughts about this album..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={5}
              />
            </div>

            {/* Favorite */}
            <div className="flex items-center gap-2">
              <Checkbox
                id="favorite"
                checked={isFavorite}
                onCheckedChange={(checked) => setIsFavorite(checked === true)}
              />
              <Label htmlFor="favorite" className="flex items-center gap-2 cursor-pointer">
                <Heart className="h-4 w-4 text-primary" />
                Mark as favorite album
              </Label>
            </div>

            {/* Error */}
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            {/* Submit */}
            <div className="flex gap-4">
              <Button type="submit" disabled={isLoading || rating === 0}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}

function EditReviewSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background py-12">
      <div className="container max-w-2xl mx-auto px-4">
        <Skeleton className="h-6 w-32 mb-6" />
        <Card className="shadow-md border-border">
          <CardHeader>
            <Skeleton className="h-6 w-24" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex gap-4 p-4 rounded-lg bg-muted/50">
              <Skeleton className="h-24 w-24 rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-6 w-32" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-32 w-full" />
            </div>
            <div className="flex gap-4">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-24" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
