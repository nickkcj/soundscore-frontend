'use client';

import { useQuery } from '@tanstack/react-query';
import { api, homeApi } from '@/lib/api';
import type { GroupListResponse, PaginatedUsersResponse, TrendingAlbumsResponse } from '@/types';

/**
 * Hook for fetching trending albums
 * Cached for 5 minutes
 */
export function useTrendingAlbums(limit = 3) {
  return useQuery({
    queryKey: ['trending-albums', limit],
    queryFn: () => homeApi.getTrendingAlbums(limit),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook for fetching user's groups
 * Cached for 2 minutes
 */
export function useMyGroups() {
  return useQuery({
    queryKey: ['my-groups'],
    queryFn: () => api.get<GroupListResponse>('/groups/my-groups'),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook for fetching suggested users to follow
 * Cached for 5 minutes
 */
export function useSuggestedUsers(limit = 5) {
  return useQuery({
    queryKey: ['suggested-users', limit],
    queryFn: () => api.get<PaginatedUsersResponse>(`/users/suggested?limit=${limit}`),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
