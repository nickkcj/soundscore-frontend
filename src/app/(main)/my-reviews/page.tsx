'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Plus, Heart, Pencil, Trash2, Star, ClipboardList } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { StarRating } from '@/components/common/star-rating';
import { InfiniteScroll } from '@/components/common/infinite-scroll';
import { CreateReviewModal } from '@/components/reviews/create-review-modal';
import { useRequireAuth } from '@/hooks/use-auth';
import { useUserReviews, useReview } from '@/hooks/use-reviews';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Review } from '@/types';

export default function MyReviewsPage() {
  const { user, isLoading: authLoading } = useRequireAuth();
  const {
    reviews,
    isLoading,
    hasMore,
    total,
    fetchReviews,
  } = useUserReviews(user?.username || '');
  const { deleteReview } = useReview();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState<{ uuid: string; title: string } | null>(null);
  const [createReviewOpen, setCreateReviewOpen] = useState(false);
  const [viewReview, setViewReview] = useState<Review | null>(null);

  useEffect(() => {
    if (user?.username) {
      fetchReviews(true);
    }
  }, [user?.username, fetchReviews]);

  const favoriteAlbums = reviews.filter((r) => r.is_favorite);
  const averageRating = reviews.length > 0
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : 'N/A';

  const handleDelete = async () => {
    if (!reviewToDelete) return;

    const reviewUuid = reviewToDelete.uuid;

    // Close dialog immediately for responsiveness
    setDeleteDialogOpen(false);
    setReviewToDelete(null);
    toast.success('Review deleted');

    // API call in background, then refetch to sync
    const success = await deleteReview(reviewUuid);
    if (success) {
      fetchReviews(true);
    } else {
      toast.error('Failed to delete review');
      fetchReviews(true); // Refetch to restore accurate state
    }
  };

  const openDeleteDialog = (review: Review) => {
    setReviewToDelete({ uuid: review.uuid, title: review.album.title });
    setDeleteDialogOpen(true);
  };

  if (authLoading || !user) {
    return <MyReviewsSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/50">
      <main className="container mx-auto max-w-7xl px-4 py-6 md:py-20">
        {/* User Profile Section */}
        <section className="mb-8 md:mb-20">
          <div className="relative overflow-hidden rounded-2xl shadow-lg bg-wine-600 text-white">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-15">
              <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
                <defs>
                  <pattern id="music-pattern" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
                    <path d="M30 5 L25 30 L45 30 Z" fill="currentColor" opacity="0.3" />
                    <circle cx="15" cy="15" r="5" fill="currentColor" opacity="0.3" />
                    <circle cx="45" cy="45" r="8" fill="currentColor" opacity="0.3" />
                  </pattern>
                </defs>
                <rect x="0" y="0" width="100%" height="100%" fill="url(#music-pattern)" />
              </svg>
            </div>

            <div className="relative flex flex-wrap items-center gap-4 p-4 sm:p-6 md:flex-nowrap md:gap-8 md:p-10">
              {/* Profile Picture */}
              <div className="flex-shrink-0 relative">
                <div className="rounded-full overflow-hidden ring-4 ring-white/30 shadow-xl">
                  <Image
                    src={user.profile_picture || '/images/default.jpg'}
                    alt={user.username}
                    width={160}
                    height={160}
                    className="h-20 w-20 object-cover sm:h-24 sm:w-24 md:h-40 md:w-40"
                  />
                </div>
              </div>

              {/* User Info */}
              <div className="min-w-0 flex-1 text-left">
                <h1 className="mb-2 truncate text-2xl font-bold md:text-4xl">{user.username}</h1>
                <div className="flex flex-wrap justify-start gap-2 md:mb-6 md:mt-2 md:gap-4">
                  <div className="rounded-full bg-white/20 px-3 py-1.5 text-sm backdrop-blur-sm md:px-4 md:text-base">
                    <span className="font-medium">{total || 0}</span>
                    <span className="text-white/80 ml-1">Reviews</span>
                  </div>
                  <div className="flex items-center rounded-full bg-white/20 px-3 py-1.5 text-sm backdrop-blur-sm md:px-4 md:text-base">
                    <Star className="w-4 h-4 mr-1 text-yellow-300 fill-yellow-300" />
                    <span className="font-medium">{averageRating}</span>
                    <span className="text-white/80 ml-1">Avg</span>
                  </div>
                </div>
              </div>

              {/* Create New Review Button */}
              <div className="w-full md:ml-auto md:w-auto">
                <button
                  onClick={() => setCreateReviewOpen(true)}
                  className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-background px-5 py-2.5 font-medium text-wine-600 shadow-md transition active:scale-[0.98] md:w-auto md:rounded-full md:px-6 md:py-3 md:hover:bg-muted dark:text-wine-400"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Create New Review
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Favorite Albums Section */}
        <section className="mb-8 md:mb-20">
          <h2 className="mb-4 flex items-center border-b border-border pb-3 text-2xl font-bold text-foreground md:mb-6 md:text-3xl">
            <Heart className="mr-2 h-6 w-6 fill-wine-500 text-wine-500 md:h-8 md:w-8" />
            Favorite Albums
          </h2>
          {favoriteAlbums.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
              {favoriteAlbums.map((review) => (
                <button
                  type="button"
                  key={review.id}
                  aria-label={`View review of ${review.album.title}`}
                  className="group min-w-0 overflow-hidden rounded-xl border border-border bg-card text-left shadow-sm transition active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wine-500 md:hover:-translate-y-1 md:hover:shadow-xl"
                  onClick={() => setViewReview(review)}
                >
                  <div className="aspect-square overflow-hidden relative">
                    <div className="absolute inset-x-0 bottom-0 z-10 flex items-end bg-gradient-to-t from-black/80 to-transparent p-2 pt-8 opacity-100 transition-opacity md:p-3 md:opacity-0 md:group-hover:opacity-100">
                      <div className="flex items-center">
                        <StarRating rating={review.rating} size="sm" />
                        <span className="ml-1.5 text-xs font-medium text-white md:text-sm">{review.rating}/5</span>
                      </div>
                    </div>
                    <Image
                      src={review.album.cover_image || '/images/default_album.png'}
                      alt={review.album.title}
                      width={300}
                      height={300}
                      className="h-full w-full object-cover transition-transform duration-500 md:group-hover:scale-105"
                    />
                  </div>
                  <div className="min-w-0 p-2.5 md:p-4">
                    <h3 className="mb-0.5 truncate text-sm font-semibold text-foreground md:mb-1 md:text-lg">{review.album.title}</h3>
                    <p className="truncate text-xs text-muted-foreground md:text-sm">{review.album.artist}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card p-6 text-center md:p-8">
              <Heart className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30 md:mb-4 md:h-16 md:w-16" />
              <p className="text-muted-foreground italic">You haven&apos;t marked any albums as favorites yet.</p>
            </div>
          )}
        </section>

        {/* All Reviews Section */}
        <section>
          <h2 className="mb-4 flex items-center border-b border-border pb-3 text-2xl font-bold text-foreground md:mb-6 md:text-3xl">
            <ClipboardList className="mr-2 h-6 w-6 text-wine-500 md:h-8 md:w-8" />
            All Reviews
          </h2>
          {isLoading && reviews.length === 0 ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <ReviewItemSkeleton key={i} />
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <div className="rounded-xl border border-border bg-card px-4 py-10 text-center shadow-sm md:py-16">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-wine-50 md:mb-6 md:h-24 md:w-24 dark:bg-wine-950/30">
                <ClipboardList className="h-8 w-8 text-wine-400 md:h-12 md:w-12" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">No Reviews Yet</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Start sharing your thoughts on your favorite music by creating your first review.
              </p>
              <button
                onClick={() => setCreateReviewOpen(true)}
                className="inline-flex min-h-11 items-center rounded-full bg-wine-600 px-6 py-3 font-medium text-white shadow-md transition active:scale-[0.98] md:hover:bg-wine-700"
              >
                <Plus className="w-5 h-5 mr-2" />
                Write Your First Review
              </button>
            </div>
          ) : (
            <InfiniteScroll
              hasMore={hasMore}
              isLoading={isLoading}
              onLoadMore={() => fetchReviews(false)}
            >
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-6">
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    className="relative flex min-h-28 overflow-hidden rounded-xl border border-border bg-card shadow-sm transition md:min-h-[140px] md:hover:shadow-lg"
                  >
                    <button
                      type="button"
                      onClick={() => setViewReview(review)}
                      aria-label={`View review of ${review.album.title}`}
                      className="flex min-w-0 flex-1 text-left transition active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-wine-500"
                    >
                      {/* Album Cover */}
                      <div className="relative w-24 flex-shrink-0 sm:w-28 md:w-[140px]">
                        <Image
                          src={review.album.cover_image || '/images/default_album.png'}
                          alt={review.album.title}
                          width={300}
                          height={300}
                          className="h-full w-full object-cover"
                        />
                      </div>

                      {/* Review Content */}
                      <div className="flex min-w-0 flex-1 flex-col p-3 pr-12 md:p-4 md:pr-12">
                        <h3 className="truncate text-sm font-semibold text-foreground md:text-lg">{review.album.title}</h3>
                        <p className="mb-1 truncate text-xs text-muted-foreground md:mb-2 md:text-sm">{review.album.artist}</p>

                        {review.text && (
                          <p className="mb-1 line-clamp-2 text-xs italic text-muted-foreground md:mb-2 md:text-sm">&quot;{review.text}&quot;</p>
                        )}

                        <div className="mt-auto flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <StarRating rating={review.rating} size="sm" />
                            <span className="hidden text-sm text-muted-foreground sm:inline">{review.rating}/5</span>
                          </div>
                          <span className="text-xs text-muted-foreground/70">
                            {review.created_at?.slice(0, 10) || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </button>

                    {/* Action Buttons */}
                    <div className="absolute right-1 top-1 z-10 flex flex-col md:right-2 md:top-2 md:gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); openDeleteDialog(review); }}
                        aria-label={`Delete review of ${review.album.title}`}
                        className="flex h-11 w-11 items-center justify-center rounded-full text-wine-600 transition-colors active:bg-wine-100 md:h-9 md:w-9 md:bg-wine-50 md:hover:bg-wine-100 dark:text-wine-400 md:dark:bg-wine-950/30 md:dark:hover:bg-wine-950/50"
                        title="Delete Review"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <Link
                        href={`/reviews/${review.id}/edit`}
                        onClick={(e) => e.stopPropagation()}
                        title="Edit Review"
                        aria-label={`Edit review of ${review.album.title}`}
                        className="flex h-11 w-11 items-center justify-center rounded-full text-wine-600 transition-colors active:bg-wine-100 md:h-9 md:w-9 md:bg-wine-50 md:hover:bg-wine-100 dark:text-wine-400 md:dark:bg-wine-950/30 md:dark:hover:bg-wine-950/50"
                      >
                        <Pencil className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </InfiniteScroll>
          )}
        </section>
      </main>

      {/* Create Review Modal */}
      <CreateReviewModal
        open={createReviewOpen}
        onOpenChange={setCreateReviewOpen}
        onSuccess={() => fetchReviews(true)}
      />

      {/* View Review Modal */}
      <Dialog open={!!viewReview} onOpenChange={() => setViewReview(null)}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto p-4 sm:max-w-lg sm:p-6">
          {viewReview && (
            <div className="space-y-4">
              {/* Album Info */}
              <div className="flex min-w-0 gap-3 sm:gap-4">
                <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg sm:h-24 sm:w-24">
                  <Image
                    src={viewReview.album.cover_image || '/images/default_album.png'}
                    alt={viewReview.album.title}
                    width={200}
                    height={200}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <DialogTitle className="truncate text-lg font-bold leading-normal text-foreground sm:text-xl">{viewReview.album.title}</DialogTitle>
                  <p className="truncate text-sm text-muted-foreground sm:text-base">{viewReview.album.artist}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <StarRating rating={viewReview.rating} size="md" />
                    <span className="text-muted-foreground">{viewReview.rating}/5</span>
                  </div>
                </div>
              </div>

              {/* Review Text */}
              {viewReview.text ? (
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-foreground whitespace-pre-wrap">{viewReview.text}</p>
                </div>
              ) : (
                <p className="text-muted-foreground italic text-center py-4">No review text</p>
              )}

              {/* Footer */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-2">
                <span className="text-sm text-muted-foreground">
                  {viewReview.created_at?.slice(0, 10)}
                </span>
                <div className="flex gap-2">
                  <Link
                    href={`/reviews/${viewReview.id}/edit`}
                    className="inline-flex min-h-11 items-center gap-1 rounded-lg bg-wine-50 px-3 py-2 text-sm text-wine-600 transition-colors active:bg-wine-100 md:hover:bg-wine-100 dark:bg-wine-950/30 dark:text-wine-400 dark:active:bg-wine-950/50 md:dark:hover:bg-wine-950/50"
                  >
                    <Pencil className="w-4 h-4" />
                    Edit
                  </Link>
                  <button
                    onClick={() => { setViewReview(null); openDeleteDialog(viewReview); }}
                    className="inline-flex min-h-11 items-center gap-1 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 transition-colors active:bg-red-100 md:hover:bg-red-100 dark:bg-red-950/30 dark:text-red-400 dark:active:bg-red-950/50 md:dark:hover:bg-red-950/50"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] rounded-2xl p-5 sm:max-w-md sm:p-6">
          <DialogHeader>
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 sm:mb-4 sm:h-16 sm:w-16">
              <Trash2 className="h-7 w-7 text-red-500 sm:h-10 sm:w-10" />
            </div>
            <DialogTitle className="text-center text-xl font-bold text-foreground">Delete Review</DialogTitle>
            <DialogDescription className="text-center text-muted-foreground">
              Are you sure you want to delete your review of <span className="font-medium">{reviewToDelete?.title || 'this album'}</span>?
            </DialogDescription>
            <p className="text-muted-foreground text-sm mt-2 text-center">This action cannot be undone.</p>
          </DialogHeader>
          <DialogFooter className="flex flex-row justify-center gap-3 sm:justify-center sm:gap-4">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              className="rounded-xl flex-1 border-border"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="rounded-xl flex-1 bg-red-500 hover:bg-red-600"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ReviewItemSkeleton() {
  return (
    <div className="flex bg-card rounded-lg shadow-md border border-border overflow-hidden">
      <div className="w-1/3 max-w-[120px]">
        <div className="w-full aspect-square bg-muted animate-pulse" />
      </div>
      <div className="w-2/3 p-4 space-y-3">
        <div className="h-5 w-3/4 bg-muted rounded animate-pulse" />
        <div className="h-4 w-1/2 bg-muted rounded animate-pulse" />
        <div className="h-3 w-full bg-muted rounded animate-pulse" />
        <div className="h-3 w-2/3 bg-muted rounded animate-pulse" />
      </div>
    </div>
  );
}

function MyReviewsSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/50">
      <main className="container mx-auto max-w-7xl px-4 py-6 md:py-20">
        {/* Profile Header Skeleton */}
        <section className="mb-8 md:mb-20">
          <div className="rounded-2xl bg-wine-600 p-4 shadow-lg sm:p-6 md:p-10">
            <div className="flex items-center gap-4 md:gap-8">
              <div className="h-20 w-20 shrink-0 animate-pulse rounded-full bg-white/20 sm:h-24 sm:w-24 md:h-40 md:w-40" />
              <div className="min-w-0 space-y-3 text-left md:space-y-4">
                <div className="h-7 w-32 animate-pulse rounded bg-white/20 md:h-8 md:w-40" />
                <div className="flex gap-2 md:gap-4">
                  <div className="h-8 w-24 bg-white/20 rounded-full animate-pulse" />
                  <div className="h-8 w-24 bg-white/20 rounded-full animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Favorites Skeleton */}
        <section className="mb-8 md:mb-16">
          <div className="mb-4 h-8 w-48 animate-pulse rounded bg-muted md:mb-6 md:h-10" />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-card rounded-lg overflow-hidden shadow-md">
                <div className="aspect-square bg-muted animate-pulse" />
                <div className="space-y-2 p-2.5 md:p-4">
                  <div className="h-5 w-3/4 bg-muted rounded animate-pulse" />
                  <div className="h-4 w-1/2 bg-muted rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Reviews Skeleton */}
        <section>
          <div className="mb-4 h-8 w-36 animate-pulse rounded bg-muted md:mb-6 md:h-10" />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <ReviewItemSkeleton key={i} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
