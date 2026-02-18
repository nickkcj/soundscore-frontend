'use client';

import { useState, useEffect, type ReactNode } from 'react';
import { Search, Send, Copy, Check, Loader2, Users, Link2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import type { UserListItem, Group, PaginatedUsersResponse, GroupListResponse } from '@/types';

interface ShareModalProps {
  reviewUuid: string;
  children: ReactNode;
}

export function ShareModal({ reviewUuid, children }: ShareModalProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [following, setFollowing] = useState<UserListItem[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sendingTo, setSendingTo] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);

  const user = useAuthStore((s) => s.user);
  const reviewUrl = `${window.location.origin}/reviews/${reviewUuid}`;

  // Fetch following and groups on open
  useEffect(() => {
    if (!open || !user) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [followingRes, groupsRes] = await Promise.all([
          api.get<PaginatedUsersResponse>(
            `/users/profile/${user.username}/following?per_page=50`
          ),
          api.get<GroupListResponse>('/groups/my-groups?per_page=50'),
        ]);
        setFollowing(followingRes.users || []);
        setGroups(groupsRes.groups || []);
      } catch {
        // Silent error
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [open, user]);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setSearch('');
      setSentTo(new Set());
      setCopied(false);
    }
  }, [open]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(reviewUrl);
      setCopied(true);
      toast.success('Link copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const handleShareToUser = async (username: string) => {
    const key = `user:${username}`;
    setSendingTo(key);
    try {
      await api.post(`/dm/share/review/${reviewUuid}`, {
        recipient_username: username,
      });
      toast.success(`Sent to ${username}`);
      setSentTo((prev) => new Set([...prev, key]));
    } catch {
      toast.error('Failed to send');
    } finally {
      setSendingTo(null);
    }
  };

  const handleShareToGroup = async (groupUuid: string, groupName: string) => {
    const key = `group:${groupUuid}`;
    setSendingTo(key);
    try {
      await api.post(`/dm/share/review/${reviewUuid}`, {
        group_uuid: groupUuid,
      });
      toast.success(`Sent to ${groupName}`);
      setSentTo((prev) => new Set([...prev, key]));
    } catch {
      toast.error('Failed to send');
    } finally {
      setSendingTo(null);
    }
  };

  // Filter by search
  const lowerSearch = search.toLowerCase();
  const filteredUsers = search
    ? following.filter((u) => u.username.toLowerCase().includes(lowerSearch))
    : following;
  const filteredGroups = search
    ? groups.filter((g) => g.name.toLowerCase().includes(lowerSearch))
    : groups;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-lg w-[calc(100vw-2rem)]">
        <DialogHeader>
          <DialogTitle>Share Review</DialogTitle>
        </DialogHeader>

        {/* Copy Link Section */}
        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border">
          <Link2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <span className="text-sm truncate flex-1 text-muted-foreground">
            {reviewUrl}
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCopyLink}
            className="flex-shrink-0"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users or groups..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Users & Groups List */}
        <ScrollArea className="h-[300px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : filteredUsers.length === 0 && filteredGroups.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              {search ? 'No results found' : 'Follow users to share with them'}
            </div>
          ) : (
            <div className="space-y-1">
              {/* Users */}
              {filteredUsers.length > 0 && (
                <>
                  {filteredGroups.length > 0 && (
                    <p className="text-xs text-muted-foreground font-medium px-2 pt-1 pb-1">
                      Users
                    </p>
                  )}
                  {filteredUsers.map((u) => {
                    const key = `user:${u.username}`;
                    return (
                      <div
                        key={u.id}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-muted"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar className="h-10 w-10 flex-shrink-0">
                            <AvatarImage src={u.profile_picture || undefined} />
                            <AvatarFallback>
                              {u.username.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <p className="font-medium text-sm truncate">{u.username}</p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleShareToUser(u.username)}
                          disabled={sendingTo === key || sentTo.has(key)}
                          variant={sentTo.has(key) ? 'secondary' : 'default'}
                          className="flex-shrink-0"
                        >
                          {sendingTo === key ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : sentTo.has(key) ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    );
                  })}
                </>
              )}

              {/* Groups */}
              {filteredGroups.length > 0 && (
                <>
                  {filteredUsers.length > 0 && (
                    <p className="text-xs text-muted-foreground font-medium px-2 pt-3 pb-1">
                      Groups
                    </p>
                  )}
                  {filteredGroups.map((g) => {
                    const key = `group:${g.uuid}`;
                    return (
                      <div
                        key={g.id}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-muted"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {g.cover_image ? (
                              <img
                                src={g.cover_image}
                                alt={g.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Users className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{g.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {g.member_count} members
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleShareToGroup(g.uuid, g.name)}
                          disabled={sendingTo === key || sentTo.has(key)}
                          variant={sentTo.has(key) ? 'secondary' : 'default'}
                          className="flex-shrink-0"
                        >
                          {sendingTo === key ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : sentTo.has(key) ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
