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
  const [reviewToDelete, setReviewToDelete] = useState<{ id: number; title: string } | null>(null);
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

    const success = await deleteReview(reviewToDelete.id);
    if (success) {
      toast.success('Review deleted');
      fetchReviews(true);
    } else {
      toast.error('Failed to delete review');
    }
    setDeleteDialogOpen(false);
    setReviewToDelete(null);
  };

  const openDeleteDialog = (review: Review) => {
    setReviewToDelete({ id: review.id, title: review.album.title });
    setDeleteDialogOpen(true);
  };

  if (authLoading || !user) {
    return <MyReviewsSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <main className="container mx-auto max-w-7xl px-4 py-12 md:py-20">
        {/* User Profile Section */}
        <section className="mb-16 md:mb-20">
          <div className="relative overflow-hidden rounded-2xl shadow-lg bg-gradient-to-br from-pink-500 to-purple-600 text-white">
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

            <div className="relative p-8 md:p-10 flex flex-col md:flex-row items-center gap-8">
              {/* Profile Picture */}
              <div className="flex-shrink-0 relative">
                <div className="rounded-full overflow-hidden ring-4 ring-white/30 shadow-xl">
                  <Image
                    src={user.profile_picture || '/images/default.jpg'}
                    alt={user.username}
                    width={160}
                    height={160}
                    className="w-32 h-32 md:w-40 md:h-40 object-cover"
                  />
                </div>
              </div>

              {/* User Info */}
              <div className="text-center md:text-left">
                <h1 className="text-3xl md:text-4xl font-bold mb-2">{user.username}</h1>
                <div className="flex flex-wrap justify-center md:justify-start gap-4 mb-6 mt-2">
                  <div className="bg-white/20 backdrop-blur-sm py-1.5 px-4 rounded-full">
                    <span className="font-medium">{total || 0}</span>
                    <span className="text-white/80 ml-1">Reviews</span>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm py-1.5 px-4 rounded-full flex items-center">
                    <Star className="w-4 h-4 mr-1 text-yellow-300 fill-yellow-300" />
                    <span className="font-medium">{averageRating}</span>
                    <span className="text-white/80 ml-1">Avg</span>
                  </div>
                </div>
              </div>

              {/* Create New Review Button */}
              <div className="md:ml-auto">
                <button
                  onClick={() => setCreateReviewOpen(true)}
                  className="inline-flex items-center px-6 py-3 bg-white text-pink-600 font-medium rounded-full hover:bg-pink-50 transition duration-300 shadow-md"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Create New Review
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Favorite Albums Section */}
        <section className="mb-16 md:mb-20">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 border-b border-gray-200 pb-3 flex items-center">
            <Heart className="w-8 h-8 mr-2 text-pink-500 fill-pink-500" />
            Favorite Albums
          </h2>
          {favoriteAlbums.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {favoriteAlbums.map((review) => (
                <div
                  key={review.id}
                  className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 transform hover:-translate-y-1 group"
                >
                  <div className="aspect-square overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-start p-3 z-10">
                      <div className="flex items-center">
                        <StarRating rating={review.rating} size="sm" />
                        <span className="ml-2 text-sm text-white font-medium">({review.rating}/5)</span>
                      </div>
                    </div>
                    <Image
                      src={review.album.cover_image || '/images/default_album.png'}
                      alt={review.album.title}
                      width={300}
                      height={300}
                      className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-800 truncate mb-1">{review.album.title}</h3>
                    <p className="text-sm text-gray-500 mb-2">{review.album.artist}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
              <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 italic">You haven&apos;t marked any albums as favorites yet.</p>
            </div>
          )}
        </section>

        {/* All Reviews Section */}
        <section>
          <h2 className="text-3xl font-bold text-gray-800 mb-6 border-b border-gray-200 pb-3 flex items-center">
            <ClipboardList className="w-8 h-8 mr-2 text-pink-500" />
            All Reviews
          </h2>
          {isLoading && reviews.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <ReviewItemSkeleton key={i} />
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="bg-pink-50 w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-6">
                <ClipboardList className="w-12 h-12 text-pink-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">No Reviews Yet</h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                Start sharing your thoughts on your favorite music by creating your first review.
              </p>
              <button
                onClick={() => setCreateReviewOpen(true)}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-medium rounded-full hover:from-pink-600 hover:to-purple-700 transition duration-300 shadow-md"
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    className="flex bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 overflow-hidden relative min-h-[140px] cursor-pointer"
                    onClick={() => setViewReview(review)}
                  >
                    {/* Album Cover */}
                    <div className="w-[140px] flex-shrink-0 relative">
                      <Image
                        src={review.album.cover_image || '/images/default_album.png'}
                        alt={review.album.title}
                        width={300}
                        height={300}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Review Content */}
                    <div className="flex-1 p-4 pr-12 flex flex-col">
                      <h3 className="text-lg font-semibold text-gray-800 truncate">{review.album.title}</h3>
                      <p className="text-sm text-gray-500 mb-2">{review.album.artist}</p>

                      {review.text && (
                        <p className="text-sm text-gray-600 italic line-clamp-2 mb-2">&quot;{review.text}&quot;</p>
                      )}

                      <div className="mt-auto flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <StarRating rating={review.rating} size="sm" />
                          <span className="text-sm text-gray-500">{review.rating}/5</span>
                        </div>
                        <span className="text-xs text-gray-400">
                          {review.created_at?.slice(0, 10) || 'N/A'}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="absolute top-2 right-2 flex flex-col gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); openDeleteDialog(review); }}
                        className="p-1.5 bg-pink-50 text-pink-600 rounded-full hover:bg-pink-100 transition-colors duration-200"
                        title="Delete Review"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <Link
                        href={`/reviews/${review.id}/edit`}
                        onClick={(e) => e.stopPropagation()}
                        title="Edit Review"
                        className="p-1.5 bg-pink-50 text-pink-600 rounded-full hover:bg-pink-100 transition-colors duration-200"
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
        <DialogContent className="sm:max-w-lg">
          {viewReview && (
            <div className="space-y-4">
              {/* Album Info */}
              <div className="flex gap-4">
                <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                  <Image
                    src={viewReview.album.cover_image || '/images/default_album.png'}
                    alt={viewReview.album.title}
                    width={200}
                    height={200}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold text-gray-800">{viewReview.album.title}</h2>
                  <p className="text-gray-600">{viewReview.album.artist}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <StarRating rating={viewReview.rating} size="md" />
                    <span className="text-gray-500">{viewReview.rating}/5</span>
                  </div>
                </div>
              </div>

              {/* Review Text */}
              {viewReview.text ? (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700 whitespace-pre-wrap">{viewReview.text}</p>
                </div>
              ) : (
                <p className="text-gray-400 italic text-center py-4">No review text</p>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <span className="text-sm text-gray-400">
                  {viewReview.created_at?.slice(0, 10)}
                </span>
                <div className="flex gap-2">
                  <Link
                    href={`/reviews/${viewReview.id}/edit`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-pink-50 text-pink-600 rounded-lg hover:bg-pink-100 transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                    Edit
                  </Link>
                  <button
                    onClick={() => { setViewReview(null); openDeleteDialog(viewReview); }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
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
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
              <Trash2 className="h-10 w-10 text-red-500" />
            </div>
            <DialogTitle className="text-center text-xl font-bold text-gray-800">Delete Review</DialogTitle>
            <DialogDescription className="text-center text-gray-600">
              Are you sure you want to delete your review of <span className="font-medium">{reviewToDelete?.title || 'this album'}</span>?
            </DialogDescription>
            <p className="text-gray-500 text-sm mt-2 text-center">This action cannot be undone.</p>
          </DialogHeader>
          <DialogFooter className="flex justify-center gap-4 sm:justify-center">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              className="rounded-xl flex-1 border-gray-300"
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
    <div className="flex bg-white rounded-lg shadow-md border border-gray-100 overflow-hidden">
      <div className="w-1/3 max-w-[120px]">
        <div className="w-full aspect-square bg-gray-200 animate-pulse" />
      </div>
      <div className="w-2/3 p-4 space-y-3">
        <div className="h-5 w-3/4 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse" />
        <div className="h-3 w-full bg-gray-200 rounded animate-pulse" />
        <div className="h-3 w-2/3 bg-gray-200 rounded animate-pulse" />
      </div>
    </div>
  );
}

function MyReviewsSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <main className="container mx-auto max-w-7xl px-4 py-12 md:py-20">
        {/* Profile Header Skeleton */}
        <section className="mb-16 md:mb-20">
          <div className="rounded-2xl shadow-lg bg-gradient-to-br from-pink-400 to-purple-500 p-8 md:p-10">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-white/20 animate-pulse" />
              <div className="space-y-4 text-center md:text-left">
                <div className="h-8 w-40 bg-white/20 rounded animate-pulse mx-auto md:mx-0" />
                <div className="flex gap-4 justify-center md:justify-start">
                  <div className="h-8 w-24 bg-white/20 rounded-full animate-pulse" />
                  <div className="h-8 w-24 bg-white/20 rounded-full animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Favorites Skeleton */}
        <section className="mb-16">
          <div className="h-10 w-48 bg-gray-200 rounded mb-6 animate-pulse" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-lg overflow-hidden shadow-md">
                <div className="aspect-square bg-gray-200 animate-pulse" />
                <div className="p-4 space-y-2">
                  <div className="h-5 w-3/4 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Reviews Skeleton */}
        <section>
          <div className="h-10 w-36 bg-gray-200 rounded mb-6 animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <ReviewItemSkeleton key={i} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
