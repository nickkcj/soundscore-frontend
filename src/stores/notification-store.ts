import { create } from 'zustand';
import type { Notification } from '@/types';
import { api } from '@/lib/api';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  hasMore: boolean;
  page: number;

  // Actions
  fetchNotifications: (reset?: boolean) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  addNotification: (notification: Notification) => void;
  reset: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  hasMore: true,
  page: 1,

  fetchNotifications: async (reset = false) => {
    const { isLoading, hasMore, page } = get();
    if (isLoading || (!hasMore && !reset)) return;

    const currentPage = reset ? 1 : page;
    set({ isLoading: true });

    try {
      const response = await api.get<{
        notifications: Notification[];
        has_next: boolean;
        total: number;
      }>(`/feed/notifications?page=${currentPage}&per_page=20`);

      set((state) => ({
        notifications: reset
          ? response.notifications
          : [...state.notifications, ...response.notifications],
        hasMore: response.has_next,
        page: currentPage + 1,
        isLoading: false,
      }));
    } catch {
      set({ isLoading: false });
    }
  },

  fetchUnreadCount: async () => {
    try {
      const response = await api.get<{ unread_count: number }>('/feed/notifications/unread-count');
      set({ unreadCount: response.unread_count });
    } catch {
      // Silent fail
    }
  },

  markAsRead: async (id: number) => {
    // Optimistic update
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, is_read: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));

    try {
      await api.post(`/feed/notifications/${id}/read`);
    } catch {
      // Revert on error
      get().fetchNotifications(true);
      get().fetchUnreadCount();
    }
  },

  markAllAsRead: async () => {
    const previousNotifications = get().notifications;
    const previousCount = get().unreadCount;

    // Optimistic update
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, is_read: true })),
      unreadCount: 0,
    }));

    try {
      await api.post('/feed/notifications/read-all');
    } catch {
      // Revert on error
      set({
        notifications: previousNotifications,
        unreadCount: previousCount,
      });
    }
  },

  addNotification: (notification: Notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));
  },

  reset: () => {
    set({
      notifications: [],
      unreadCount: 0,
      isLoading: false,
      hasMore: true,
      page: 1,
    });
  },
}));
