'use client';

import { useState, useEffect, use, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Loader2, Pencil, Calendar, Camera } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ReviewCard, ReviewCardSkeleton } from '@/components/reviews/review-card';
import { InfiniteScroll } from '@/components/common/infinite-scroll';
import { NowPlayingCard } from '@/components/library/now-playing-card';
import { useAuth } from '@/hooks/use-auth';
import { useUserReviews } from '@/hooks/use-reviews';
import { useNowPlaying } from '@/hooks/use-library';
import { api } from '@/lib/api';
import type { UserProfile, FollowResponse, LikeResponse } from '@/types';

export default function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params);
  const { user: currentUser } = useAuth();
  const { reviews, isLoading: reviewsLoading, hasMore, fetchReviews, setReviews } = useUserReviews(username);
  const { nowPlaying } = useNowPlaying(username);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const isOwnProfile = currentUser?.username === username;

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        const data = await api.get<UserProfile>(`/users/profile/${username}`);
        setProfile(data);
        setIsFollowing(data.is_following || false);
      } catch {
        setProfile(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
    fetchReviews(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);

  const handleFollow = async () => {
    if (!profile || followLoading) return;

    setFollowLoading(true);
    const wasFollowing = isFollowing;

    // Optimistic update
    setIsFollowing(!wasFollowing);
    setProfile((prev) =>
      prev
        ? {
            ...prev,
            followers_count: wasFollowing
              ? prev.followers_count - 1
              : prev.followers_count + 1,
          }
        : null
    );

    try {
      const endpoint = wasFollowing
        ? `/users/profile/${username}/unfollow`
        : `/users/profile/${username}/follow`;
      const response = await api.post<FollowResponse>(endpoint);
      setProfile((prev) =>
        prev ? { ...prev, followers_count: response.followers_count } : null
      );
    } catch {
      // Revert on error
      setIsFollowing(wasFollowing);
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              followers_count: wasFollowing
                ? prev.followers_count + 1
                : prev.followers_count - 1,
            }
          : null
      );
      toast.error('Failed to update follow status');
    } finally {
      setFollowLoading(false);
    }
  };

  // Banner upload handler
  const handleBannerUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !profile) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    // Create local preview URL for optimistic update
    const previewUrl = URL.createObjectURL(file);
    const previousBanner = profile.banner_image;

    // Optimistic update - show preview immediately
    setProfile((prev) => prev ? { ...prev, banner_image: previewUrl } : null);
    toast.success('Banner updated!');

    // Upload in background
    setIsUploadingBanner(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const updatedProfile = await api.postForm<UserProfile>('/users/profile/banner', formData);
      // Replace preview with actual URL from server
      URL.revokeObjectURL(previewUrl);
      setProfile(updatedProfile);
    } catch (err) {
      // Revert on error
      URL.revokeObjectURL(previewUrl);
      setProfile((prev) => prev ? { ...prev, banner_image: previousBanner } : null);
      toast.error(err instanceof Error ? err.message : 'Failed to upload banner');
    } finally {
      setIsUploadingBanner(false);
      if (bannerInputRef.current) {
        bannerInputRef.current.value = '';
      }
    }
  };

  // Handle like for reviews
  const handleLike = async (reviewUuid: string) => {
    if (!currentUser) {
      toast.error('Please log in to like reviews');
      return;
    }

    const review = reviews.find((r) => r.uuid === reviewUuid);
    if (!review) return;

    const wasLiked = review.is_liked;

    // Optimistic update
    setReviews((prev) =>
      prev.map((r) =>
        r.uuid === reviewUuid
          ? {
              ...r,
              is_liked: !wasLiked,
              like_count: wasLiked ? r.like_count - 1 : r.like_count + 1,
            }
          : r
      )
    );

    try {
      const response = await api.post<LikeResponse>(`/reviews/${reviewUuid}/like`);
      setReviews((prev) =>
        prev.map((r) =>
          r.uuid === reviewUuid
            ? { ...r, is_liked: response.liked, like_count: response.like_count }
            : r
        )
      );
    } catch {
      // Revert on error
      setReviews((prev) =>
        prev.map((r) =>
          r.uuid === reviewUuid
            ? { ...r, is_liked: wasLiked, like_count: review.like_count }
            : r
        )
      );
    }
  };

  // Handle delete for reviews
  const handleDelete = async (reviewUuid: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return;

    // Save current state for potential rollback
    const previousReviews = [...reviews];
    const previousReviewCount = profile?.review_count ?? 0;

    // Optimistic delete - remove immediately
    setReviews((prev) => prev.filter((r) => r.uuid !== reviewUuid));
    setProfile((prev) =>
      prev ? { ...prev, review_count: prev.review_count - 1 } : null
    );
    toast.success('Review deleted');

    // API call in background
    try {
      await api.delete(`/reviews/${reviewUuid}`);
    } catch {
      // Revert on error
      setReviews(previousReviews);
      setProfile((prev) =>
        prev ? { ...prev, review_count: previousReviewCount } : null
      );
      toast.error('Failed to delete review. Restoring...');
    }
  };

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  if (!profile) {
    return (
      <div className="app-usable-viewport bg-background">
        <div className="h-28 bg-wine-600 sm:h-48 md:h-64" />
        <div className="container mx-auto max-w-3xl px-4 py-6 sm:py-12">
          <div className="rounded-lg border border-dashed border-border bg-card p-6 text-center sm:p-10">
            <div className="mb-2 inline-block text-4xl text-muted-foreground/30 sm:mb-3 sm:text-5xl">?</div>
            <p className="text-muted-foreground font-medium">User not found</p>
          </div>
        </div>
      </div>
    );
  }

  const avgRating = profile.avg_rating ? profile.avg_rating.toFixed(1) : null;

  return (
    <div className="app-usable-viewport min-w-0 bg-background">
      {/* Banner Section */}
      <div className="relative">
        {/* Banner Image */}
        <div className="relative h-28 overflow-hidden bg-wine-600 sm:h-48 md:h-64">
          {profile.banner_image && (
            <Image
              src={profile.banner_image}
              alt="Profile banner"
              fill
              className="object-cover object-center"
              priority
            />
          )}

          {/* Banner Upload Button (own profile only) */}
          {isOwnProfile && (
            <>
              <input
                ref={bannerInputRef}
                type="file"
                accept="image/*"
                onChange={handleBannerUpload}
                className="hidden"
              />
              <button
                onClick={() => bannerInputRef.current?.click()}
                disabled={isUploadingBanner}
                className="absolute bottom-3 right-4 flex h-11 w-11 items-center justify-center rounded-full bg-black/50 text-white
                           hover:bg-black/70 transition-colors disabled:opacity-50 cursor-pointer"
                aria-label="Change profile banner"
              >
                {isUploadingBanner ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Camera className="w-5 h-5" />
                )}
              </button>
            </>
          )}
        </div>

        {/* Profile Picture - Overlapping Banner */}
        <div className="container mx-auto max-w-3xl px-4">
          <div className="relative -mt-12 flex items-end justify-between gap-3 md:-mt-20">
            <div className="h-24 w-24 shrink-0 rounded-full border-4 border-background sm:h-32 sm:w-32 md:h-40 md:w-40
                          shadow-lg overflow-hidden bg-muted">
              <Image
                src={profile.profile_picture || '/images/default.jpg'}
                alt={profile.username}
                width={160}
                height={160}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Action Button - positioned to the right */}
            <div className="mb-1 min-w-0 sm:mb-4">
              {isOwnProfile ? (
                <Button asChild variant="outline" className="min-h-11 gap-2 rounded-full px-3 sm:px-4">
                  <Link href="/account">
                    <Pencil className="w-4 h-4" />
                    Edit Profile
                  </Link>
                </Button>
              ) : currentUser ? (
                <Button
                  onClick={handleFollow}
                  disabled={followLoading}
                  variant={isFollowing ? "outline" : "default"}
                  className={`min-h-11 rounded-full ${isFollowing ? "" : "bg-wine-500 hover:bg-wine-600"}`}
                >
                  {followLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isFollowing ? 'Unfollow' : 'Follow'}
                </Button>
              ) : (
                <Button asChild className="min-h-11 rounded-full bg-wine-500 hover:bg-wine-600">
                  <Link href="/login">Follow</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Profile Info Section */}
      <main className="container mx-auto max-w-3xl min-w-0 px-4 pb-6 pt-3 sm:pb-8 sm:pt-4">
        {/* Username & Bio */}
        <div className="mb-3 sm:mb-4">
          <h1 className="break-words text-xl font-bold text-foreground sm:text-2xl md:text-3xl">
            {profile.username}
          </h1>
          {profile.bio && (
            <p className="mt-1.5 max-w-lg whitespace-pre-wrap break-words text-sm text-muted-foreground sm:mt-2 sm:text-base">{profile.bio}</p>
          )}
          <p className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground/70 sm:mt-2 sm:text-sm">
            <Calendar className="h-4 w-4" />
            Joined {formatDistanceToNow(new Date(profile.created_at), { addSuffix: true })}
          </p>
          {nowPlaying?.is_playing && (
            <div className="mt-3">
              <NowPlayingCard nowPlaying={nowPlaying} compact />
            </div>
          )}
        </div>

        {/* Stats Row */}
        <div className={`grid gap-1 pb-4 sm:flex sm:gap-6 sm:pb-6 ${avgRating ? 'grid-cols-4' : 'grid-cols-3'}`}>
          <div className="min-w-0 text-center">
            <span className="block text-lg font-bold text-foreground sm:text-xl">{profile.review_count}</span>
            <span className="text-xs text-muted-foreground sm:text-sm">Reviews</span>
          </div>
          {avgRating && (
            <div className="min-w-0 text-center">
              <span className="block text-lg font-bold text-amber-500 sm:text-xl">{avgRating}</span>
              <span className="text-xs leading-tight text-muted-foreground sm:text-sm">Avg Rating</span>
            </div>
          )}
          <div className="min-w-0 text-center">
            <span className="block text-lg font-bold text-foreground sm:text-xl">{profile.followers_count}</span>
            <span className="text-xs text-muted-foreground sm:text-sm">Followers</span>
          </div>
          <div className="min-w-0 text-center">
            <span className="block text-lg font-bold text-foreground sm:text-xl">{profile.following_count}</span>
            <span className="text-xs text-muted-foreground sm:text-sm">Following</span>
          </div>
        </div>

        {/* Reviews Section */}
        <section className="border-t border-border py-4 sm:py-6">
          <h2 className="mb-3 text-lg font-semibold sm:mb-4">Reviews</h2>
          {reviewsLoading && reviews.length === 0 ? (
            <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden divide-y divide-border">
              {Array.from({ length: 3 }).map((_, i) => (
                <ReviewCardSkeleton key={i} />
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card py-8 text-center sm:py-12">
              <div className="mb-2 text-4xl text-muted-foreground/30 sm:mb-3 sm:text-5xl">🎧</div>
              <p className="text-muted-foreground">No reviews yet.</p>
            </div>
          ) : (
            <InfiniteScroll
              hasMore={hasMore}
              isLoading={reviewsLoading}
              onLoadMore={() => fetchReviews(false)}
            >
              <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden divide-y divide-border">
                {reviews.map((review) => (
                  <ReviewCard
                    key={review.id}
                    review={review}
                    onLike={handleLike}
                    onDelete={isOwnProfile ? handleDelete : undefined}
                  />
                ))}
              </div>
            </InfiniteScroll>
          )}
        </section>
      </main>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="app-usable-viewport bg-background">
      {/* Banner Skeleton */}
      <div className="h-28 bg-muted animate-pulse sm:h-48 md:h-64" />

      {/* Profile Content */}
      <div className="container mx-auto max-w-3xl px-4">
        {/* Profile Picture Skeleton */}
        <div className="relative -mt-12 flex items-end justify-between md:-mt-20">
          <div className="h-24 w-24 rounded-full border-4 border-background bg-muted animate-pulse sm:h-32 sm:w-32 md:h-40 md:w-40" />
          <div className="mb-1 sm:mb-4">
            <div className="h-11 w-28 rounded-full bg-muted animate-pulse" />
          </div>
        </div>

        <div className="pt-3 sm:pt-4">
          {/* Name skeleton */}
          <div className="mb-2 h-7 w-40 rounded bg-muted animate-pulse sm:h-8 sm:w-48" />
          {/* Bio skeleton */}
          <div className="mb-2 h-4 w-2/3 rounded bg-muted animate-pulse sm:w-72" />
          {/* Date skeleton */}
          <div className="h-4 w-40 bg-muted rounded animate-pulse mb-4" />

          {/* Stats Skeleton */}
          <div className="grid grid-cols-4 gap-1 py-4 sm:flex sm:gap-6 sm:py-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="text-center">
                <div className="mx-auto mb-1 h-5 w-10 rounded bg-muted animate-pulse sm:h-6 sm:w-12" />
                <div className="mx-auto h-3 w-12 rounded bg-muted animate-pulse sm:h-4 sm:w-16" />
              </div>
            ))}
          </div>

          {/* Reviews Skeleton */}
          <div className="border-t border-border py-4 sm:py-6">
            <div className="mb-3 h-6 w-24 rounded bg-muted animate-pulse sm:mb-6" />
            <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden divide-y divide-border">
              {Array.from({ length: 3 }).map((_, i) => (
                <ReviewCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
