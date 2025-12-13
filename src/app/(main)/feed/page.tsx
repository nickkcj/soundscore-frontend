'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Music, TrendingUp, Users, Plus, UsersRound, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ReviewCard, ReviewCardSkeleton } from '@/components/reviews/review-card';
import { InfiniteScroll } from '@/components/common/infinite-scroll';
import { useRequireAuth } from '@/hooks/use-auth';
import { StarRating } from '@/components/common/star-rating';
import { useTrendingAlbums, useMyGroups, useSuggestedUsers } from '@/hooks/queries/use-sidebar-queries';
import { useFeedQuery, useLikeMutation, useDeleteReviewMutation } from '@/hooks/queries/use-feed-query';
import { Skeleton } from '@/components/ui/skeleton';
import type { TrendingAlbum } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function FeedPage() {
  const { isLoading: authLoading } = useRequireAuth();

  // State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // React Query hooks for sidebar data (cached & deduped)
  const { data: trendingData, isLoading: trendingAlbumsLoading } = useTrendingAlbums(3);
  const { data: groupsData, isLoading: myGroupsLoading } = useMyGroups();
  const { data: suggestedData, isLoading: suggestedUsersLoading } = useSuggestedUsers(5);

  // React Query infinite scroll for feed
  const {
    data: feedData,
    isLoading: feedLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    isRefetching,
    error: feedError,
  } = useFeedQuery(sortOrder);

  // Mutations
  const likeMutation = useLikeMutation();
  const deleteMutation = useDeleteReviewMutation();

  // Derived data
  const trendingAlbums = trendingData?.albums ?? [];
  const myGroups = groupsData?.groups ?? [];
  const suggestedUsers = suggestedData?.users ?? [];

  // Flatten paginated reviews into single array
  const reviews = useMemo(() => {
    return feedData?.pages.flatMap((page) => page.reviews) ?? [];
  }, [feedData]);

  // Handlers
  const handleSortChange = (newSort: 'desc' | 'asc') => {
    setSortOrder(newSort);
  };

  const toggleSort = () => {
    const newSort = sortOrder === 'desc' ? 'asc' : 'desc';
    handleSortChange(newSort);
  };

  const handleReload = () => {
    refetch();
  };

  const handleLike = (reviewUuid: string) => {
    likeMutation.mutate(reviewUuid);
  };

  const openDeleteDialog = (reviewUuid: string) => {
    setReviewToDelete(reviewUuid);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!reviewToDelete) return;

    const reviewUuid = reviewToDelete;
    setDeleteDialogOpen(false);
    setReviewToDelete(null);

    toast.success('Review deleted');
    deleteMutation.mutate(reviewUuid, {
      onError: () => {
        toast.error('Failed to delete review');
        refetch();
      },
    });
  };

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  if (authLoading) {
    return <FeedSkeleton />;
  }

  const isLoading = feedLoading;
  const isLoadingMore = isFetchingNextPage;
  const hasMore = hasNextPage ?? false;
  const error = feedError ? (feedError as Error).message : null;

  return (
    <div className="bg-background min-h-screen relative">

      <div className="container mx-auto px-4 py-10">
        <div className="flex flex-col lg:flex-row gap-10">
          {/* LEFT SIDEBAR: Groups */}
          <div className="lg:w-64 w-full flex-shrink-0">
            <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden sticky top-28">
              {/* Header */}
              <div className="px-5 py-4 border-b border-border">
                <h3 className="font-semibold text-foreground flex items-center">
                  <UsersRound className="h-4 w-4 text-pink-500 mr-2" />
                  My Groups
                </h3>
              </div>

              {/* Group List */}
              <div className="p-4">
                <div className="space-y-3">
                  {myGroupsLoading ? (
                    // Skeleton loading
                    Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-3 p-2.5">
                        <Skeleton className="w-10 h-10 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                      </div>
                    ))
                  ) : myGroups.length === 0 ? (
                    // Empty state
                    <div className="text-center py-4">
                      <UsersRound className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No groups yet</p>
                      <p className="text-xs text-muted-foreground/70 mt-1">Join or create a group!</p>
                    </div>
                  ) : (
                    // Group list
                    myGroups.slice(0, 5).map((group) => (
                      <Link
                        key={group.id}
                        href={`/groups/${group.uuid}`}
                        className="flex items-center gap-3 p-2.5 hover:bg-muted rounded-lg transition-colors"
                      >
                        <div className="w-14 h-9 rounded-md bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {group.cover_image ? (
                            <Image
                              src={group.cover_image}
                              alt={group.name}
                              width={200}
                              height={120}
                              className="w-full h-full object-cover"
                              quality={90}
                            />
                          ) : (
                            <span className="text-pink-600 font-bold text-xs">
                              {group.name.substring(0, 2).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm text-foreground truncate">{group.name}</p>
                          <span className="text-xs text-muted-foreground">{group.member_count} members</span>
                        </div>
                      </Link>
                    ))
                  )}
                </div>

                {/* Divider */}
                <div className="my-4 border-t border-border" />

                {/* Actions */}
                <div className="space-y-2">
                  <Link
                    href="/groups/create"
                    className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium bg-pink-100 dark:bg-pink-900/30 text-pink-600 rounded-xl hover:bg-pink-200 dark:hover:bg-pink-900/50 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Create Group
                  </Link>
                  <Link
                    href="/groups"
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-muted hover:bg-muted/80 transition-colors rounded-xl text-sm font-medium text-foreground"
                  >
                    Browse All Groups
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* MAIN CONTENT: Feed */}
          <div className="lg:flex-1 mt-3">
            <div className="flex items-center justify-between mb-10">
              <h1 className="text-2xl font-bold text-foreground flex items-center">
                <Music className="h-7 w-7 mr-2 text-pink-500" />
                Latest Reviews
              </h1>
              <div className="flex items-center gap-2">
                {/* Reload Button */}
                <button
                  onClick={handleReload}
                  disabled={isRefetching}
                  className="text-sm text-pink-600 dark:text-pink-300 font-medium flex items-center px-3 py-1.5 bg-pink-50 dark:bg-pink-950 rounded-full shadow-sm hover:bg-pink-100 dark:hover:bg-pink-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Reload feed"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
                </button>
                {/* Sort Toggle Button */}
                <button
                  onClick={toggleSort}
                  className="text-sm text-pink-600 dark:text-pink-300 font-medium flex items-center px-3 py-1.5 bg-pink-50 dark:bg-pink-950 rounded-full shadow-sm hover:bg-pink-100 dark:hover:bg-pink-900 transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    className={`w-4 h-4 mr-1 transition-transform ${sortOrder === 'asc' ? 'rotate-180' : ''}`}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5h14.25M3 9h9.75M3 13.5h9.75m4.5-4.5v12m0 0-3.75-3.75M17.25 21 21 17.25" />
                  </svg>
                  <span>{sortOrder === 'desc' ? 'Latest first' : 'Oldest first'}</span>
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-950 text-red-600 p-4 rounded-xl mb-8 shadow-sm border border-red-100 dark:border-red-900">
                {error}
                <Button variant="link" className="ml-2" onClick={() => refetch()}>
                  Try again
                </Button>
              </div>
            )}

            {isLoading && reviews.length === 0 ? (
              <div className="space-y-10">
                {Array.from({ length: 3 }).map((_, i) => (
                  <ReviewCardSkeleton key={i} />
                ))}
              </div>
            ) : reviews.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 bg-card rounded-xl shadow-sm border border-border">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-16 h-16 text-pink-200 dark:text-pink-800 mb-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
                </svg>
                <p className="text-muted-foreground font-medium">No recent reviews yet.</p>
                <p className="text-muted-foreground/70 text-sm mt-2">Follow users or write your own reviews to see them here!</p>
              </div>
            ) : (
              <InfiniteScroll
                hasMore={hasMore}
                isLoading={isLoadingMore}
                onLoadMore={handleLoadMore}
                loader={<ReviewCardSkeleton />}
              >
                <div className="space-y-10">
                  {reviews.map((review) => (
                    <ReviewCard
                      key={review.uuid}
                      review={review}
                      onLike={handleLike}
                      onDelete={openDeleteDialog}
                    />
                  ))}
                </div>
              </InfiniteScroll>
            )}

            {/* Load more button */}
            {hasMore && !isLoadingMore && reviews.length > 0 && (
              <div className="mt-12 text-center">
                <button
                  onClick={handleLoadMore}
                  className="px-6 py-2.5 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-full text-sm font-medium transition-all hover:shadow-md hover:from-pink-600 hover:to-pink-700 flex items-center mx-auto"
                >
                  <span>Load more</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {/* RIGHT SIDEBAR: Trending Albums & Suggested Users */}
          <div className="lg:w-72 w-full">
            <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden sticky top-28">
              {/* Trending Albums Section */}
              <div className="px-5 py-4 border-b border-border">
                <h3 className="font-semibold text-foreground mb-4 flex items-center">
                  <TrendingUp className="h-4 w-4 text-pink-500 mr-2" />
                  Trending Albums
                </h3>
                <div className="space-y-4">
                  {trendingAlbumsLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <TrendingAlbumSkeleton key={i} />
                    ))
                  ) : trendingAlbums.length === 0 ? (
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground text-center">No trending albums found</p>
                    </div>
                  ) : (
                    trendingAlbums.map((album) => (
                      <TrendingAlbumItem key={album.spotify_id} album={album} />
                    ))
                  )}
                </div>
              </div>

              {/* Suggested Users Section */}
              <div className="px-5 py-4">
                <h3 className="font-semibold text-foreground mb-4 flex items-center">
                  <Users className="h-4 w-4 text-pink-500 mr-2" />
                  Suggested Users
                </h3>
                <div className="space-y-3.5">
                  {suggestedUsersLoading ? (
                    // Skeleton loading
                    Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-3 p-2.5">
                        <Skeleton className="w-10 h-10 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-20" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                        <Skeleton className="h-6 w-14 rounded" />
                      </div>
                    ))
                  ) : suggestedUsers.length === 0 ? (
                    // Empty state
                    <div className="text-center py-4">
                      <Users className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No suggestions</p>
                    </div>
                  ) : (
                    suggestedUsers.map((user) => (
                      <Link
                        key={user.id}
                        href={`/profile/${user.username}`}
                        className="flex items-center gap-3 p-2.5 hover:bg-muted rounded-lg transition-colors"
                      >
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={user.profile_picture || undefined} />
                          <AvatarFallback>
                            {user.username.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm text-foreground truncate">{user.username}</p>
                          <p className="text-xs text-muted-foreground">
                            {user.followers_count || 0} followers
                          </p>
                        </div>
                        <span className="text-xs font-medium px-2 py-1 bg-pink-100 dark:bg-pink-900/30 text-pink-600 rounded hover:bg-pink-200 dark:hover:bg-pink-900/50 transition-colors">
                          Follow
                        </span>
                      </Link>
                    ))
                  )}
                </div>

                {/* See More Link */}
                {suggestedUsers.length > 0 && (
                  <div className="mt-5 text-center">
                    <Link href="/discover?type=users" className="text-xs text-pink-600 hover:underline">
                      See more suggestions
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
              <svg className="h-10 w-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <DialogTitle className="text-center">Delete Review</DialogTitle>
            <DialogDescription className="text-center">
              Are you sure you want to delete this review? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-center gap-4 sm:justify-center">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              className="rounded-xl flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="rounded-xl flex-1"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TrendingAlbumItem({ album }: { album: TrendingAlbum }) {
  return (
    <Link href={`/album/${album.spotify_id}`} className="flex items-center gap-3 hover:bg-muted p-2 rounded-lg transition-colors">
      <div className="w-14 h-14 rounded-md overflow-hidden shadow-sm">
        {album.cover_image ? (
          <Image
            src={album.cover_image}
            alt={album.title}
            width={56}
            height={56}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-pink-200 to-purple-200 dark:from-pink-800 dark:to-purple-800" />
        )}
      </div>
      <div>
        <h4 className="font-medium text-sm text-foreground line-clamp-1">{album.title}</h4>
        <p className="text-xs text-muted-foreground line-clamp-1">{album.artist}</p>
        <div className="flex items-center mt-1">
          {album.avg_rating ? (
            <StarRating rating={album.avg_rating} size="sm" />
          ) : null}
          <span className="text-xs text-muted-foreground ml-1">
            ({album.review_count} {album.review_count === 1 ? 'review' : 'reviews'})
          </span>
        </div>
      </div>
    </Link>
  );
}

function TrendingAlbumSkeleton() {
  return (
    <div className="flex items-center gap-3 p-2">
      <div className="w-14 h-14 rounded-md bg-muted animate-pulse" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-3/4 rounded bg-muted animate-pulse" />
        <div className="h-3 w-1/2 rounded bg-muted animate-pulse" />
        <div className="h-3 w-1/3 rounded bg-muted animate-pulse" />
      </div>
    </div>
  );
}

function FeedSkeleton() {
  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto px-4 py-10">
        <div className="flex flex-col lg:flex-row gap-10">
          {/* Left Sidebar Skeleton */}
          <div className="lg:w-64 w-full flex-shrink-0">
            <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
              <div className="px-5 py-4 border-b border-border">
                <div className="h-5 w-24 bg-muted rounded animate-pulse" />
              </div>
              <div className="p-4 space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-2">
                    <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                      <div className="h-3 w-16 bg-muted rounded animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content Skeleton */}
          <div className="lg:flex-1 space-y-10">
            <div className="flex items-center justify-between mb-6">
              <div className="h-8 w-40 rounded bg-muted animate-pulse" />
              <div className="h-8 w-28 rounded-full bg-muted animate-pulse" />
            </div>
            {Array.from({ length: 3 }).map((_, i) => (
              <ReviewCardSkeleton key={i} />
            ))}
          </div>

          {/* Right Sidebar Skeleton */}
          <div className="lg:w-72 w-full">
            <div className="bg-card rounded-xl shadow-sm border border-border p-5">
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <TrendingAlbumSkeleton key={i} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
