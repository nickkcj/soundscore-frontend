'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { UserAvatar } from '@/components/common/user-avatar';
import { useRequireAuth } from '@/hooks/use-auth';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { ConversationType, ConversationListResponse } from '@/types';

export default function MessagesPage() {
  const { isLoading: authLoading } = useRequireAuth();
  const [conversations, setConversations] = useState<ConversationType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchConversations = useCallback(async () => {
    try {
      const data = await api.get<ConversationListResponse>('/dm/conversations');
      setConversations(data.conversations);
    } catch {
      // Silent error
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      fetchConversations();
    }
  }, [authLoading, fetchConversations]);

  // Poll for new conversations every 30 seconds
  useEffect(() => {
    if (authLoading) return;
    const interval = setInterval(fetchConversations, 30000);
    return () => clearInterval(interval);
  }, [authLoading, fetchConversations]);

  const filteredConversations = search
    ? conversations.filter((c) =>
        c.other_user.username.toLowerCase().includes(search.toLowerCase())
      )
    : conversations;

  if (authLoading || isLoading) {
    return <MessagesPageSkeleton />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto border-x border-border min-h-screen">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border">
          <div className="flex items-center justify-between px-4 h-14">
            <h1 className="text-xl font-bold">Messages</h1>
          </div>
          {/* Search */}
          {conversations.length > 0 && (
            <div className="px-4 pb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          )}
        </div>

        {/* Conversations List */}
        {filteredConversations.length === 0 ? (
          <div className="text-center py-16">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">
              {search ? 'No conversations found' : 'No messages yet'}
            </p>
            {!search && (
              <p className="text-sm text-muted-foreground/70 mt-1">
                Share a review to start a conversation!
              </p>
            )}
          </div>
        ) : (
          <div>
            {filteredConversations.map((conversation) => (
              <ConversationItem
                key={conversation.id}
                conversation={conversation}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ConversationItem({ conversation }: { conversation: ConversationType }) {
  const { other_user, last_message, unread_count, updated_at } = conversation;

  return (
    <Link
      href={`/messages/${conversation.id}`}
      className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors border-b border-border"
    >
      <UserAvatar
        username={other_user.username}
        profilePicture={other_user.profile_picture}
        size="md"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className={cn('font-semibold text-[15px]', unread_count > 0 && 'text-foreground')}>
            {other_user.username}
          </span>
          <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
            {formatDistanceToNow(new Date(updated_at), { addSuffix: true })}
          </span>
        </div>
        <div className="flex items-center justify-between mt-0.5">
          <p
            className={cn(
              'text-sm truncate',
              unread_count > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'
            )}
          >
            {last_message?.content || 'No messages yet'}
          </p>
          {unread_count > 0 && (
            <span className="flex-shrink-0 ml-2 h-5 min-w-[20px] px-1.5 rounded-full bg-wine-600 text-white text-xs font-medium flex items-center justify-center">
              {unread_count}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

function MessagesPageSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto border-x border-border min-h-screen">
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border">
          <div className="flex items-center px-4 h-14">
            <Skeleton className="h-6 w-28" />
          </div>
        </div>
        <div>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-border">
              <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
