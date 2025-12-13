'use client';

import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { ReviewListResponse, LikeResponse, Review } from '@/types';

/**
 * Hook for fetching feed with infinite scroll support
 * Uses React Query's useInfiniteQuery for pagination
 */
export function useFeedQuery(sortOrder: 'desc' | 'asc' = 'desc') {
  return useInfiniteQuery({
    queryKey: ['feed', sortOrder],
    queryFn: async ({ pageParam = 1 }) => {
      return api.get<ReviewListResponse>(
        `/feed?page=${pageParam}&per_page=10&sort=${sortOrder}`
      );
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.has_next ? allPages.length + 1 : undefined;
    },
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook for toggling like on a review
 * Includes optimistic updates
 */
export function useLikeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reviewUuid: string) =>
      api.post<LikeResponse>(`/reviews/${reviewUuid}/like`),

    onMutate: async (reviewUuid) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['feed'] });

      // Snapshot previous value
      const previousData = queryClient.getQueriesData({ queryKey: ['feed'] });

      // Optimistically update
      queryClient.setQueriesData(
        { queryKey: ['feed'] },
        (old: { pages: ReviewListResponse[]; pageParams: number[] } | undefined) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              reviews: page.reviews.map((review) =>
                review.uuid === reviewUuid
                  ? {
                      ...review,
                      is_liked: !review.is_liked,
                      like_count: review.is_liked
                        ? review.like_count - 1
                        : review.like_count + 1,
                    }
                  : review
              ),
            })),
          };
        }
      );

      return { previousData };
    },

    onError: (_err, _reviewUuid, context) => {
      // Rollback on error
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },

    onSettled: () => {
      // Refetch after mutation settles (optional, for consistency)
      // queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}

/**
 * Hook for deleting a review
 * Includes optimistic removal from feed
 */
export function useDeleteReviewMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reviewUuid: string) => api.delete(`/reviews/${reviewUuid}`),

    onMutate: async (reviewUuid) => {
      await queryClient.cancelQueries({ queryKey: ['feed'] });

      const previousData = queryClient.getQueriesData({ queryKey: ['feed'] });

      // Optimistically remove from feed
      queryClient.setQueriesData(
        { queryKey: ['feed'] },
        (old: { pages: ReviewListResponse[]; pageParams: number[] } | undefined) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              reviews: page.reviews.filter((review) => review.uuid !== reviewUuid),
            })),
          };
        }
      );

      return { previousData };
    },

    onError: (_err, _reviewUuid, context) => {
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
  });
}
