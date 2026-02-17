'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X, Users, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { Notification, InviteActionResponse } from '@/types';

interface GroupInviteNotificationProps {
  notification: Notification;
  onAction: () => void;
}

export function GroupInviteNotification({
  notification,
  onAction,
}: GroupInviteNotificationProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const isExpired = notification.expires_at
    ? new Date(notification.expires_at) < new Date()
    : false;

  const handleAccept = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!notification.invite_uuid || isLoading) return;

    setIsLoading(true);
    try {
      const response = await api.post<InviteActionResponse>(
        `/groups/invites/${notification.invite_uuid}/accept`
      );
      toast.success(response.message || 'Joined group successfully!');
      onAction();
      if (response.group_uuid) {
        router.push(`/groups/${response.group_uuid}`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to accept invite');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDecline = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!notification.invite_uuid || isLoading) return;

    setIsLoading(true);
    try {
      await api.post<InviteActionResponse>(
        `/groups/invites/${notification.invite_uuid}/decline`
      );
      toast.success('Invite declined');
      onAction();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to decline invite');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={cn(
        'flex flex-col gap-3 p-3 border-b hover:bg-muted/50 transition-colors',
        !notification.is_read && 'bg-primary/5'
      )}
    >
      <div className="flex items-start gap-3">
        <div className="relative">
          <Avatar className="h-10 w-10">
            <AvatarImage src={notification.actor_profile_picture || undefined} />
            <AvatarFallback>
              {notification.actor_username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="absolute -bottom-1 -right-1 rounded-full p-1 bg-wine-700">
            <Users className="h-3 w-3 text-white" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm">
            <span className="font-medium">{notification.actor_username}</span>{' '}
            {notification.message}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(notification.created_at), {
                addSuffix: true,
              })}
            </p>
            {isExpired && (
              <span className="text-xs text-destructive flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Expired
              </span>
            )}
          </div>
        </div>
        {!notification.is_read && (
          <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-2" />
        )}
      </div>

      {!isExpired && (
        <div className="flex gap-2 pl-[52px] pr-4">
          <Button
            size="sm"
            onClick={handleAccept}
            disabled={isLoading}
          >
            <Check className="h-4 w-4 mr-1" />
            Accept
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleDecline}
            disabled={isLoading}
          >
            <X className="h-4 w-4 mr-1" />
            Ignore
          </Button>
        </div>
      )}
    </div>
  );
}
