'use client';

import { useState, useCallback } from 'react';
import { api } from '@/lib/api';
import type {
  Review,
  ReviewCreate,
  ReviewUpdate,
  ReviewListResponse,
  LikeResponse,
  Comment,
  CommentCreate,
  CommentListResponse,
  SpotifyAlbumResult,
  OptimisticReview,
} from '@/types';

// Feed hook with infinite scroll
export function useFeed() {
  const [reviews, setReviews] = useState<OptimisticReview[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [currentSort, setCurrentSort] = useState<'desc' | 'asc'>('desc');

  const fetchFeed = useCallback(async (reset = false, sortOrder: 'desc' | 'asc' = 'desc') => {
    const currentPage = reset ? 1 : page;
    if (reset) {
      setIsLoading(true);
      setCurrentSort(sortOrder);
    } else {
      setIsLoadingMore(true);
    }
    setError(null);

    const effectiveSort = reset ? sortOrder : currentSort;

    try {
      const response = await api.get<ReviewListResponse>(
        `/feed?page=${currentPage}&per_page=10&sort=${effectiveSort}`
      );

      setReviews((prev) =>
        reset ? response.reviews : [...prev, ...response.reviews]
      );
      setHasMore(response.has_next);
      setPage(currentPage + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load feed');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSort]);

  const toggleLike = useCallback(async (reviewUuid: string) => {
    // Find current state
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
      // Update with server response
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
  }, [reviews]);

  const updateReviewInFeed = useCallback((updatedReview: Review) => {
    setReviews((prev) =>
      prev.map((r) => (r.id === updatedReview.id ? updatedReview : r))
    );
  }, []);

  const removeReviewFromFeed = useCallback((reviewId: number) => {
    setReviews((prev) => prev.filter((r) => r.id !== reviewId));
  }, []);

  // Optimistic review creation methods
  const addOptimisticReview = useCallback((review: OptimisticReview) => {
    setReviews((prev) => [review, ...prev]);
  }, []);

  const replaceOptimisticReview = useCallback((optimisticId: string, realReview: Review) => {
    setReviews((prev) =>
      prev.map((r) => (r._optimisticId === optimisticId ? realReview : r))
    );
  }, []);

  const removeOptimisticReview = useCallback((optimisticId: string) => {
    setReviews((prev) => prev.filter((r) => r._optimisticId !== optimisticId));
  }, []);

  return {
    reviews,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    fetchFeed,
    toggleLike,
    updateReviewInFeed,
    removeReviewFromFeed,
    addOptimisticReview,
    replaceOptimisticReview,
    removeOptimisticReview,
  };
}

// User reviews hook
export function useUserReviews(username: string) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchReviews = useCallback(async (reset = false, favoritesOnly = false) => {
    const currentPage = reset ? 1 : page;
    setIsLoading(true);

    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        per_page: '20',
      });
      if (favoritesOnly) {
        params.append('favorites_only', 'true');
      }

      const response = await api.get<ReviewListResponse>(
        `/reviews/user/${username}?${params}`
      );

      setReviews((prev) =>
        reset ? response.reviews : [...prev, ...response.reviews]
      );
      setHasMore(response.has_next);
      setPage(currentPage + 1);
      setTotal(response.total);
    } catch {
      // Handle error
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);

  return {
    reviews,
    isLoading,
    hasMore,
    total,
    fetchReviews,
    setReviews,
  };
}

// Single review operations
export function useReview() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createReview = useCallback(async (data: ReviewCreate): Promise<Review | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const review = await api.post<Review>('/reviews', data);
      return review;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create review');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateReview = useCallback(async (
    reviewUuid: string,
    data: ReviewUpdate
  ): Promise<Review | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const review = await api.patch<Review>(`/reviews/${reviewUuid}`, data);
      return review;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update review');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteReview = useCallback(async (reviewUuid: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      await api.delete(`/reviews/${reviewUuid}`);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete review');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getReview = useCallback(async (reviewUuid: string): Promise<Review | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const review = await api.get<Review>(`/reviews/${reviewUuid}`);
      return review;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch review');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const toggleLike = useCallback(async (reviewUuid: string): Promise<LikeResponse | null> => {
    try {
      const response = await api.post<LikeResponse>(`/reviews/${reviewUuid}/like`);
      return response;
    } catch {
      return null;
    }
  }, []);

  return {
    isLoading,
    error,
    createReview,
    updateReview,
    deleteReview,
    getReview,
    toggleLike,
    clearError: () => setError(null),
  };
}

// Comments hook with optimistic updates
export function useComments(reviewUuid: string) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  const fetchComments = useCallback(async (reset = false) => {
    const currentPage = reset ? 1 : page;
    setIsLoading(true);

    try {
      const response = await api.get<CommentListResponse>(
        `/reviews/${reviewUuid}/comments?page=${currentPage}&per_page=20`
      );

      setComments((prev) =>
        reset ? response.comments : [...prev, ...response.comments]
      );
      setHasMore(response.has_next);
      setPage(currentPage + 1);
    } catch {
      // Handle error
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reviewUuid]);

  const addComment = useCallback(async (
    data: CommentCreate,
    optimisticData: Partial<Comment>
  ): Promise<Comment | null> => {
    const optimisticComment: Comment = {
      id: -1,
      text: data.text,
      created_at: new Date().toISOString(),
      user_id: optimisticData.user_id || 0,
      username: optimisticData.username || '',
      user_profile_picture: optimisticData.user_profile_picture || null,
      parent_id: data.parent_id || null,
      replies: [],
      like_count: 0,
      is_liked: false,
    };

    // Optimistic add
    if (data.parent_id) {
      // Add as reply
      setComments((prev) =>
        prev.map((c) =>
          c.id === data.parent_id
            ? { ...c, replies: [...c.replies, optimisticComment] }
            : c
        )
      );
    } else {
      setComments((prev) => [optimisticComment, ...prev]);
    }

    try {
      const comment = await api.post<Comment>(
        `/reviews/${reviewUuid}/comments`,
        data
      );

      // Replace optimistic with real
      if (data.parent_id) {
        setComments((prev) =>
          prev.map((c) =>
            c.id === data.parent_id
              ? {
                  ...c,
                  replies: c.replies.map((r) =>
                    r.id === -1 ? comment : r
                  ),
                }
              : c
          )
        );
      } else {
        setComments((prev) =>
          prev.map((c) => (c.id === -1 ? comment : c))
        );
      }

      return comment;
    } catch {
      // Remove optimistic on error
      if (data.parent_id) {
        setComments((prev) =>
          prev.map((c) =>
            c.id === data.parent_id
              ? { ...c, replies: c.replies.filter((r) => r.id !== -1) }
              : c
          )
        );
      } else {
        setComments((prev) => prev.filter((c) => c.id !== -1));
      }
      return null;
    }
  }, [reviewUuid]);

  const deleteComment = useCallback(async (commentId: number): Promise<boolean> => {
    const previousComments = [...comments];

    // Optimistic delete
    setComments((prev) =>
      prev
        .filter((c) => c.id !== commentId)
        .map((c) => ({
          ...c,
          replies: c.replies.filter((r) => r.id !== commentId),
        }))
    );

    try {
      await api.delete(`/reviews/${reviewUuid}/comments/${commentId}`);
      return true;
    } catch {
      // Revert on error
      setComments(previousComments);
      return false;
    }
  }, [reviewUuid, comments]);

  const toggleCommentLike = useCallback(async (commentId: number): Promise<void> => {
    // Helper to update like state in comments tree
    const updateCommentLike = (
      commentsList: Comment[],
      targetId: number,
      isLiked: boolean,
      likeCount: number
    ): Comment[] => {
      return commentsList.map((c) => {
        if (c.id === targetId) {
          return { ...c, is_liked: isLiked, like_count: likeCount };
        }
        if (c.replies.length > 0) {
          return { ...c, replies: updateCommentLike(c.replies, targetId, isLiked, likeCount) };
        }
        return c;
      });
    };

    // Find current comment state (search in nested replies too)
    const findComment = (commentsList: Comment[], targetId: number): Comment | null => {
      for (const c of commentsList) {
        if (c.id === targetId) return c;
        if (c.replies.length > 0) {
          const found = findComment(c.replies, targetId);
          if (found) return found;
        }
      }
      return null;
    };

    const comment = findComment(comments, commentId);
    if (!comment) return;

    const wasLiked = comment.is_liked;
    const prevLikeCount = comment.like_count;

    // Optimistic update
    setComments((prev) =>
      updateCommentLike(
        prev,
        commentId,
        !wasLiked,
        wasLiked ? prevLikeCount - 1 : prevLikeCount + 1
      )
    );

    try {
      const response = await api.post<LikeResponse>(`/reviews/${reviewUuid}/comments/${commentId}/like`);
      // Update with server response
      setComments((prev) =>
        updateCommentLike(prev, commentId, response.liked, response.like_count)
      );
    } catch {
      // Revert on error
      setComments((prev) =>
        updateCommentLike(prev, commentId, wasLiked ?? false, prevLikeCount)
      );
    }
  }, [reviewUuid, comments]);

  return {
    comments,
    isLoading,
    hasMore,
    fetchComments,
    addComment,
    deleteComment,
    toggleCommentLike,
  };
}

// Album search hook
export function useAlbumSearch() {
  const [results, setResults] = useState<SpotifyAlbumResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get<SpotifyAlbumResult[]>(
        `/reviews/search/albums?q=${encodeURIComponent(query)}`
      );
      setResults(response || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  return {
    results,
    isLoading,
    error,
    search,
    clearResults,
  };
}
