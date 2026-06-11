'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useNotificationStore } from '@/stores/notification-store';
import { getSupabaseClient } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth-store';
import type { RealtimeChannel } from '@supabase/supabase-js';

export function useNotifications() {
  const {
    notifications,
    unreadCount,
    isLoading,
    hasMore,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
  } = useNotificationStore();

  // Initial fetch
  useEffect(() => {
    fetchNotifications(true);
    fetchUnreadCount();
  }, [fetchNotifications, fetchUnreadCount]);

  return {
    notifications,
    unreadCount,
    isLoading,
    hasMore,
    fetchMore: () => fetchNotifications(false),
    refresh: () => fetchNotifications(true),
    markAsRead,
    markAllAsRead,
  };
}

// Supabase Realtime hook for real-time notifications (replaces SSE)
export function useNotificationStream() {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const { fetchUnreadCount, fetchNotifications } = useNotificationStore();
  const user = useAuthStore((s) => s.user);

  // Fetch initial data on mount
  useEffect(() => {
    fetchUnreadCount();
    fetchNotifications(true);
  }, [fetchUnreadCount, fetchNotifications]);

  const subscribe = useCallback(async () => {
    if (!user?.id) return;

    // Tear down any existing channel before creating a new one
    if (channelRef.current) {
      channelRef.current.unsubscribe();
      channelRef.current = null;
    }

    let supabase;
    try {
      supabase = await getSupabaseClient();
    } catch {
      // If we cannot reach the Realtime token endpoint (network error, etc.)
      // just skip — the periodic fallback poll below will cover unread count.
      return;
    }

    const channel = supabase
      .channel(`notifications:user:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${user.id}`,
        },
        () => {
          // Payload is raw row — refetch instead of injecting partial data
          // so the store stays consistent with the REST shape (with joins, etc.)
          fetchUnreadCount();
          fetchNotifications(true);
        }
      )
      .subscribe();

    channelRef.current = channel;
  }, [user?.id, fetchUnreadCount, fetchNotifications]);

  const unsubscribe = useCallback(() => {
    if (channelRef.current) {
      channelRef.current.unsubscribe();
      channelRef.current = null;
    }
  }, []);

  useEffect(() => {
    subscribe();
    return () => unsubscribe();
  }, [subscribe, unsubscribe]);

  // Periodic refresh as fallback (covers the case where Realtime is unavailable)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 60_000);

    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  return { reconnect: subscribe };
}
