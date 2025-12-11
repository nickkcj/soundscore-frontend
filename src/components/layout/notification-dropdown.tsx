'use client';

import Link from 'next/link';
import { Bell, Heart, MessageCircle, UserPlus, Check, Users } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useNotificationStore } from '@/stores/notification-store';
import { cn } from '@/lib/utils';
import { GroupInviteNotification } from '@/components/notifications/group-invite-notification';
import type { Notification } from '@/types';

const notificationIcons: Record<string, typeof Heart> = {
  like: Heart,
  comment: MessageCircle,
  reply: MessageCircle,
  follow: UserPlus,
  group_invite: Users,
};

function NotificationItem({
  notification,
  onRead,
}: {
  notification: Notification;
  onRead: (id: number) => void;
}) {
  const Icon = notificationIcons[notification.notification_type];

  const getLink = () => {
    if (notification.review_uuid) {
      return `/reviews/${notification.review_uuid}`;
    }
    return `/profile/${notification.actor_username}`;
  };

  return (
    <DropdownMenuItem asChild className="p-0">
      <Link
        href={getLink()}
        onClick={() => !notification.is_read && onRead(notification.id)}
        className={cn(
          'flex items-start gap-3 p-3 cursor-pointer',
          !notification.is_read && 'bg-primary/5'
        )}
      >
        <div className="relative">
          <Avatar className="h-10 w-10">
            <AvatarImage src={notification.actor_profile_picture || undefined} />
            <AvatarFallback>
              {notification.actor_username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div
            className={cn(
              'absolute -bottom-1 -right-1 rounded-full p-1',
              notification.notification_type === 'like' && 'bg-red-500',
              notification.notification_type === 'comment' && 'bg-blue-500',
              notification.notification_type === 'reply' && 'bg-blue-500',
              notification.notification_type === 'follow' && 'bg-green-500'
            )}
          >
            <Icon className="h-3 w-3 text-white" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm">
            <span className="font-medium">{notification.actor_username}</span>{' '}
            {notification.message}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
          </p>
        </div>
        {!notification.is_read && (
          <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-2" />
        )}
      </Link>
    </DropdownMenuItem>
  );
}

function NotificationSkeleton() {
  return (
    <div className="flex items-start gap-3 p-3">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/4" />
      </div>
    </div>
  );
}

export function NotificationDropdown() {
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
  } = useNotificationStore();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between p-3">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-1 text-xs text-muted-foreground hover:text-foreground"
              onClick={markAllAsRead}
            >
              <Check className="mr-1 h-3 w-3" />
              Mark all as read
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />
        <ScrollArea className="h-[400px]">
          {isLoading && notifications.length === 0 ? (
            <>
              <NotificationSkeleton />
              <NotificationSkeleton />
              <NotificationSkeleton />
            </>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Bell className="h-12 w-12 text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            notifications.map((notification) =>
              notification.notification_type === 'group_invite' ? (
                <GroupInviteNotification
                  key={notification.id}
                  notification={notification}
                  onAction={() => {
                    // Refresh notifications after action
                    useNotificationStore.getState().fetchNotifications(true);
                  }}
                />
              ) : (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onRead={markAsRead}
                />
              )
            )
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
