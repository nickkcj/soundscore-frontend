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
      <div className="min-h-screen bg-background">
        <div className="h-48 md:h-64 bg-gradient-to-r from-pink-400 to-purple-500" />
        <div className="container mx-auto max-w-3xl px-4 py-12">
          <div className="text-center p-10 bg-card rounded-lg border border-dashed border-border">
            <div className="text-5xl text-muted-foreground/30 mb-3 inline-block">?</div>
            <p className="text-muted-foreground font-medium">User not found</p>
          </div>
        </div>
      </div>
    );
  }

  const avgRating = profile.avg_rating ? profile.avg_rating.toFixed(1) : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Banner Section */}
      <div className="relative">
        {/* Banner Image */}
        <div className="h-48 md:h-64 bg-gradient-to-r from-pink-400 to-purple-500 relative overflow-hidden">
          {profile.banner_image && (
            <Image
              src={profile.banner_image}
              alt="Profile banner"
              fill
              className="object-cover"
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
                className="absolute bottom-4 right-4 p-2.5 bg-black/50 text-white rounded-full
                           hover:bg-black/70 transition-colors disabled:opacity-50 cursor-pointer"
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
          <div className="relative -mt-16 md:-mt-20 flex justify-between items-end">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-background
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
            <div className="mb-4">
              {isOwnProfile ? (
                <Link href="/account">
                  <Button variant="outline" className="gap-2 rounded-full">
                    <Pencil className="w-4 h-4" />
                    Edit Profile
                  </Button>
                </Link>
              ) : currentUser ? (
                <Button
                  onClick={handleFollow}
                  disabled={followLoading}
                  variant={isFollowing ? "outline" : "default"}
                  className={`rounded-full ${isFollowing ? "" : "bg-pink-500 hover:bg-pink-600"}`}
                >
                  {followLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isFollowing ? 'Unfollow' : 'Follow'}
                </Button>
              ) : (
                <Link href="/login">
                  <Button className="rounded-full bg-pink-500 hover:bg-pink-600">Follow</Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Profile Info Section */}
      <main className="container mx-auto max-w-3xl px-4 pt-4 pb-8">
        {/* Username & Bio */}
        <div className="mb-4">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            {profile.username}
          </h1>
          {profile.bio && (
            <p className="text-muted-foreground mt-2 max-w-lg whitespace-pre-wrap">{profile.bio}</p>
          )}
          <p className="text-sm text-muted-foreground/70 mt-2 flex items-center gap-1">
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
        <div className="flex gap-6 pb-6 border-b border-border">
          <div className="text-center">
            <span className="block text-xl font-bold text-foreground">{profile.review_count}</span>
            <span className="text-sm text-muted-foreground">Reviews</span>
          </div>
          {avgRating && (
            <div className="text-center">
              <span className="block text-xl font-bold text-amber-500">{avgRating}</span>
              <span className="text-sm text-muted-foreground">Avg Rating</span>
            </div>
          )}
          <div className="text-center">
            <span className="block text-xl font-bold text-foreground">{profile.followers_count}</span>
            <span className="text-sm text-muted-foreground">Followers</span>
          </div>
          <div className="text-center">
            <span className="block text-xl font-bold text-foreground">{profile.following_count}</span>
            <span className="text-sm text-muted-foreground">Following</span>
          </div>
        </div>

        {/* Reviews Section */}
        <section className="py-6 border-t border-border">
          <h2 className="text-lg font-semibold mb-4">Reviews</h2>
          {reviewsLoading && reviews.length === 0 ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <ReviewCardSkeleton key={i} />
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-xl border border-dashed border-border">
              <div className="text-5xl text-muted-foreground/30 mb-3">🎧</div>
              <p className="text-muted-foreground">No reviews yet.</p>
            </div>
          ) : (
            <InfiniteScroll
              hasMore={hasMore}
              isLoading={reviewsLoading}
              onLoadMore={() => fetchReviews(false)}
            >
              <div className="space-y-4">
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
    <div className="min-h-screen bg-background">
      {/* Banner Skeleton */}
      <div className="h-48 md:h-64 bg-muted animate-pulse" />

      {/* Profile Content */}
      <div className="container mx-auto max-w-3xl px-4">
        {/* Profile Picture Skeleton */}
        <div className="relative -mt-16 md:-mt-20 flex justify-between items-end">
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-muted border-4 border-background animate-pulse" />
          <div className="mb-4">
            <div className="h-10 w-28 bg-muted rounded-full animate-pulse" />
          </div>
        </div>

        <div className="pt-4">
          {/* Name skeleton */}
          <div className="h-8 w-48 bg-muted rounded animate-pulse mb-2" />
          {/* Bio skeleton */}
          <div className="h-4 w-72 bg-muted rounded animate-pulse mb-2" />
          {/* Date skeleton */}
          <div className="h-4 w-40 bg-muted rounded animate-pulse mb-4" />

          {/* Stats Skeleton */}
          <div className="flex gap-6 py-6 border-b border-border">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="text-center">
                <div className="h-6 w-12 bg-muted rounded animate-pulse mx-auto mb-1" />
                <div className="h-4 w-16 bg-muted rounded animate-pulse" />
              </div>
            ))}
          </div>

          {/* Reviews Skeleton */}
          <div className="py-6">
            <div className="h-6 w-24 bg-muted rounded animate-pulse mb-6" />
            <div className="space-y-4">
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
