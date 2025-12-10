'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useNotificationStore } from '@/stores/notification-store';
import { getAccessToken } from '@/lib/api';
import type { Notification } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

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

// SSE hook for real-time notifications
export function useNotificationStream() {
  const eventSourceRef = useRef<EventSource | null>(null);
  const { addNotification, fetchUnreadCount, fetchNotifications } = useNotificationStore();

  // Fetch initial data when stream connects
  useEffect(() => {
    fetchUnreadCount();
    fetchNotifications(true);
  }, [fetchUnreadCount, fetchNotifications]);

  const connect = useCallback(() => {
    const token = getAccessToken();
    if (!token) return;

    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const url = `${API_BASE_URL}/feed/notifications/stream?token=${token}`;
    const eventSource = new EventSource(url);

    // Listen for named 'notification' event from SSE
    eventSource.addEventListener('notification', (event) => {
      try {
        const notification: Notification = JSON.parse(event.data);
        addNotification(notification);
      } catch {
        // Invalid data
      }
    });

    // Handle ping events (keepalive)
    eventSource.addEventListener('ping', () => {
      // Keepalive - no action needed
    });

    eventSource.onerror = () => {
      eventSource.close();
      // Retry after 5 seconds
      setTimeout(connect, 5000);
    };

    eventSourceRef.current = eventSource;
  }, [addNotification]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  // Periodic refresh as fallback
  useEffect(() => {
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 60000); // Every minute

    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  return { reconnect: connect };
}
